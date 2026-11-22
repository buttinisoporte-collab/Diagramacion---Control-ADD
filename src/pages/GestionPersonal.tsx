import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  Tag,
  RefreshCw,
  FolderPlus,
  UserPlus,
  Filter
} from 'lucide-react';

type SectorKey =
  | 'TRÁFICO'
  | 'MANTENIMIENTO'
  | 'CAPITAL HUMANO'
  | 'ADMINISTRACIÓN Y FINANZAS'
  | 'COMPRAS Y DEPÓSITO';

interface SectorConfig {
  key: SectorKey;
  label: string;
  table: string;
  pk: string;
  defaultAreas: string[];
  defaultRol: string;
  hasLicencia?: boolean;
  hasFixedSectorCol?: boolean;
}

const SECTORES_CONFIG: SectorConfig[] = [
  {
    key: 'TRÁFICO',
    label: 'Tráfico',
    table: 'nomina_trafico',
    pk: 'id_conductor',
    defaultAreas: ['Inspección', 'Conducción', 'Auxiliar', 'Jefatura', 'Soporte Técnico'],
    defaultRol: 'Conductor',
    hasLicencia: true
  },
  {
    key: 'MANTENIMIENTO',
    label: 'Mantenimiento',
    table: 'nomina_mantenimiento',
    pk: 'id_mecanico',
    defaultAreas: ['Jefatura', 'Planificación', 'Mecánica', 'Carrocería', 'Electricidad', 'Gomería', 'Lavadero'],
    defaultRol: 'Mecanico'
  },
  {
    key: 'CAPITAL HUMANO',
    label: 'Capital Humano',
    table: 'nomina_capital_humano',
    pk: 'id_capital_humano',
    defaultAreas: ['Administración', 'Jefatura', 'Garita'],
    defaultRol: 'Administrativo'
  },
  {
    key: 'ADMINISTRACIÓN Y FINANZAS',
    label: 'Administración y Finanzas',
    table: 'nomina_administrativos',
    pk: 'id_administrativo',
    defaultAreas: ['Comercial', 'Jefatura', 'Atención', 'Tesorería', 'Contaduría'],
    defaultRol: 'Administrativo',
    hasFixedSectorCol: true
  },
  {
    key: 'COMPRAS Y DEPÓSITO',
    label: 'Compras y Depósito',
    table: 'nomina_compras_deposito',
    pk: 'id_compras_deposito',
    defaultAreas: ['Compras', 'Jefatura', 'Depósito'],
    defaultRol: 'Administrativo'
  }
];

const LOCAL_AREAS_KEY = 'app_sectores_areas';

export default function GestionPersonal() {
  const [activeSectorKey, setActiveSectorKey] = useState<SectorKey>('TRÁFICO');
  const [rows, setRows] = useState<any[]>([]);
  const [areasBySector, setAreasBySector] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('Todas');

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [createSystemUser, setCreateSystemUser] = useState(true);
  const [selectedRol, setSelectedRol] = useState('Conductor');
  const [saving, setSaving] = useState(false);

  // Quick New Area Modal / Inline
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [savingArea, setSavingArea] = useState(false);

  // Delete Confirmation
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeConfig = useMemo(
    () => SECTORES_CONFIG.find((s) => s.key === activeSectorKey) || SECTORES_CONFIG[0],
    [activeSectorKey]
  );

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    setSearchTerm('');
    setAreaFilter('Todas');
    loadSectorRows();
  }, [activeSectorKey]);

  const loadAreas = async () => {
    const baseMap: Record<string, string[]> = {};
    SECTORES_CONFIG.forEach((s) => {
      baseMap[s.key] = [...s.defaultAreas];
    });

    // LocalStorage merge
    try {
      const localRaw = localStorage.getItem(LOCAL_AREAS_KEY);
      if (localRaw) {
        const localParsed = JSON.parse(localRaw);
        Object.keys(localParsed).forEach((sec) => {
          if (!baseMap[sec]) baseMap[sec] = [];
          localParsed[sec].forEach((a: string) => {
            if (!baseMap[sec].includes(a)) baseMap[sec].push(a);
          });
        });
      }
    } catch {}

    // Supabase merge
    if (supabase) {
      try {
        const { data, error } = await supabase.from('sectores_areas').select('sector, nombre');
        if (!error && data) {
          data.forEach((item: any) => {
            if (!baseMap[item.sector]) baseMap[item.sector] = [];
            if (!baseMap[item.sector].includes(item.nombre)) {
              baseMap[item.sector].push(item.nombre);
            }
          });
        }
      } catch (e) {
        console.warn('No se pudo consultar sectores_areas:', e);
      }
    }

    setAreasBySector(baseMap);
  };

  const loadSectorRows = async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from(activeConfig.table)
          .select('*')
          .order('apellido_nombre', { ascending: true });

        if (!error && data) {
          setRows(data);
          setLoading(false);
          return;
        }
      }
      const local = localStorage.getItem(`ext_store_${activeConfig.table}`);
      if (local) {
        const parsed = JSON.parse(local);
        setRows(Array.isArray(parsed) ? parsed : Object.values(parsed));
      } else {
        setRows([]);
      }
    } catch (e) {
      console.error('Error cargando nómina:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const currentAreas = useMemo(() => {
    const list = areasBySector[activeConfig.key] || activeConfig.defaultAreas;
    // Include any area present on existing rows even if not in catalog yet
    const merged = [...list];
    rows.forEach((r) => {
      if (r.area && !merged.includes(r.area)) merged.push(r.area);
    });
    return merged;
  }, [areasBySector, activeConfig, rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (areaFilter !== 'Todas' && (r.area || '') !== areaFilter) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        String(r.legajo || '').toLowerCase().includes(q) ||
        String(r.apellido_nombre || '').toLowerCase().includes(q) ||
        String(r.dni || '').toLowerCase().includes(q) ||
        String(r.area || '').toLowerCase().includes(q) ||
        String(r.empresa || '').toLowerCase().includes(q)
      );
    });
  }, [rows, areaFilter, searchTerm]);

  const inferDefaultRole = (sector: SectorKey, area: string) => {
    if (sector === 'TRÁFICO') {
      return area === 'Conducción' ? 'Conductor' : 'Diagramador';
    }
    if (sector === 'MANTENIMIENTO') {
      return area === 'Planificación' || area === 'Jefatura' ? 'Planific-Mantenimiento' : 'Mecanico';
    }
    if (sector === 'CAPITAL HUMANO' && area === 'Garita') {
      return 'Garita';
    }
    return 'Administrativo';
  };

  const openModal = (record?: any) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        legajo: record.legajo || '',
        apellido_nombre: record.apellido_nombre || '',
        area: record.area || currentAreas[0] || '',
        empresa: record.empresa || 'Antonio Buttini',
        dni: record.dni || '',
        fecha_ingreso: record.fecha_ingreso || '',
        licencia_conducir: record.licencia_conducir || ''
      });
      setCreateSystemUser(false);
      setSelectedRol(inferDefaultRole(activeConfig.key, record.area || ''));
    } else {
      const initialArea = currentAreas[0] || '';
      setEditingRecord(null);
      setFormData({
        legajo: '',
        apellido_nombre: '',
        area: initialArea,
        empresa: 'Antonio Buttini',
        dni: '',
        fecha_ingreso: '',
        licencia_conducir: ''
      });
      setCreateSystemUser(true);
      setSelectedRol(inferDefaultRole(activeConfig.key, initialArea));
    }
    setIsModalOpen(true);
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newAreaName.trim();
    if (!trimmed) return;

    if (currentAreas.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      showToast('error', `El área "${trimmed}" ya existe en ${activeConfig.label}.`);
      return;
    }

    setSavingArea(true);
    try {
      if (supabase) {
        const { error } = await supabase
          .from('sectores_areas')
          .insert([{ sector: activeConfig.key, nombre: trimmed }]);
        if (error) console.warn('Aviso guardando área en Supabase:', error.message);
      }

      // Update local state and localStorage
      const updatedMap = {
        ...areasBySector,
        [activeConfig.key]: [...currentAreas, trimmed]
      };
      setAreasBySector(updatedMap);
      localStorage.setItem(LOCAL_AREAS_KEY, JSON.stringify(updatedMap));

      // If main modal is open, select the newly created area automatically
      if (isModalOpen) {
        setFormData((prev: any) => ({ ...prev, area: trimmed }));
      }

      setNewAreaName('');
      setIsAreaModalOpen(false);
      showToast('success', `Área "${trimmed}" agregada al sector ${activeConfig.label}.`);
    } catch (err: any) {
      showToast('error', 'No se pudo crear el área: ' + err.message);
    } finally {
      setSavingArea(false);
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.legajo?.trim() || !formData.apellido_nombre?.trim() || !formData.area?.trim()) {
      showToast('error', 'Legajo, Apellido y Nombre, y Área son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        legajo: formData.legajo.trim(),
        apellido_nombre: formData.apellido_nombre.trim(),
        area: formData.area.trim(),
        empresa: formData.empresa?.trim() || null,
        dni: formData.dni?.trim() || null,
        fecha_ingreso: formData.fecha_ingreso || null
      };

      if (activeConfig.hasLicencia) {
        payload.licencia_conducir = formData.licencia_conducir?.trim() || null;
      }

      if (activeConfig.hasFixedSectorCol) {
        payload.sector = activeConfig.key;
      }

      if (supabase) {
        if (editingRecord) {
          const pkVal = editingRecord[activeConfig.pk] || editingRecord.id;
          const { error } = await supabase
            .from(activeConfig.table)
            .update(payload)
            .eq(activeConfig.pk, pkVal);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from(activeConfig.table)
            .insert([payload]);
          if (error) throw error;
        }

        // Optional: Sync or create user in 'usuarios'
        if (createSystemUser) {
          const defaultUser = payload.dni || payload.legajo;
          if (defaultUser) {
            await supabase.from('usuarios').upsert(
              [
                {
                  usuario: defaultUser,
                  contrasena: defaultUser || '123456',
                  nombre_apellido: payload.apellido_nombre,
                  dni: payload.dni,
                  rol: selectedRol,
                  estado: 'Activo'
                }
              ],
              { onConflict: 'usuario', ignoreDuplicates: true }
            );
          }
        }
      }

      showToast(
        'success',
        editingRecord
          ? 'Datos del colaborador actualizados correctamente.'
          : 'Colaborador registrado correctamente.'
      );
      setIsModalOpen(false);
      loadSectorRows();
    } catch (err: any) {
      console.error('Error guardando personal:', err);
      showToast('error', 'Error al guardar: ' + (err.message || 'Verifique legajo o DNI duplicado.'));
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (supabase) {
        const pkVal = deleteTarget[activeConfig.pk] || deleteTarget.id;
        const { error } = await supabase
          .from(activeConfig.table)
          .delete()
          .eq(activeConfig.pk, pkVal);
        if (error) throw error;
      }
      showToast('success', 'Registro eliminado correctamente.');
      setDeleteTarget(null);
      loadSectorRows();
    } catch (err: any) {
      showToast(
        'error',
        'No se pudo eliminar (puede tener controles o registros históricos asociados): ' + err.message
      );
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden">
      <Header
        title="Gestión de Personal y Áreas"
        subtitle="Administración integral de nómina por sector, áreas operativas y fechas de ingreso"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={loadSectorRows}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Actualizar listado"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setNewAreaName('');
              setIsAreaModalOpen(true);
            }}
            className="px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Área</span>
          </button>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cargar Personal</span>
          </button>
        </div>
      </Header>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[110] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sector Tabs */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2 hidden md:inline">
            Sectores:
          </span>
          {SECTORES_CONFIG.map((sec) => (
            <button
              key={sec.key}
              onClick={() => setActiveSectorKey(sec.key)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeSectorKey === sec.key
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Areas Overview Chips */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1 mr-1">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  Áreas de {activeConfig.label}:
                </span>
                <button
                  onClick={() => setAreaFilter('Todas')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                    areaFilter === 'Todas'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas ({rows.length})
                </button>
                {currentAreas.map((area) => {
                  const count = rows.filter((r) => r.area === area).length;
                  return (
                    <button
                      key={area}
                      onClick={() => setAreaFilter(area)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                        areaFilter === area
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100'
                      }`}
                    >
                      {area} ({count})
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  setNewAreaName('');
                  setIsAreaModalOpen(true);
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar nueva área</span>
              </button>
            </div>

            {/* Table Container */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              {/* Search Bar */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Nómina de {activeConfig.label}</span>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                      {filteredRows.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tabla asociada: <span className="font-mono font-semibold">{activeConfig.table}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar por legajo, nombre, DNI o área..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-12 text-center text-xs text-slate-400 font-bold animate-pulse">
                    Cargando personal de {activeConfig.label}...
                  </div>
                ) : filteredRows.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">No hay personal registrado</p>
                    <p className="text-xs mt-1">
                      Utilice el botón "Cargar Personal" para dar de alta colaboradores en {activeConfig.label}.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Legajo</th>
                        <th className="px-4 py-3">Apellido y Nombre</th>
                        <th className="px-4 py-3">Área</th>
                        <th className="px-4 py-3">DNI</th>
                        <th className="px-4 py-3">Empresa</th>
                        <th className="px-4 py-3">Fecha Ingreso</th>
                        {activeConfig.hasLicencia && <th className="px-4 py-3">Licencia</th>}
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRows.map((row, idx) => (
                        <tr
                          key={row[activeConfig.pk] || `${row.legajo}-${idx}`}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono font-bold text-slate-700">{row.legajo}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{row.apellido_nombre}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {row.area || 'Sin asignar'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600">{row.dni || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{row.empresa || '-'}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">
                            {row.fecha_ingreso
                              ? new Date(row.fecha_ingreso + 'T12:00:00').toLocaleDateString('es-AR')
                              : <span className="text-amber-600 font-semibold">Pendiente</span>}
                          </td>
                          {activeConfig.hasLicencia && (
                            <td className="px-4 py-3 text-slate-600">{row.licencia_conducir || '-'}</td>
                          )}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openModal(row)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(row)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Alta / Edición de Personal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {editingRecord ? `Editar Personal - ${activeConfig.label}` : `Cargar Personal - ${activeConfig.label}`}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Sector: <span className="font-bold text-slate-700">{activeConfig.key}</span>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Legajo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.legajo || ''}
                    onChange={(e) => setFormData({ ...formData, legajo: e.target.value })}
                    placeholder="Ej. 1045"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    value={formData.dni || ''}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    placeholder="Sin puntos"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Apellido y Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.apellido_nombre || ''}
                    onChange={(e) => setFormData({ ...formData, apellido_nombre: e.target.value })}
                    placeholder="Ej. Pérez, Juan Carlos"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Área (Apertura del sector {activeConfig.label}) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      required
                      value={formData.area || ''}
                      onChange={(e) => {
                        const newArea = e.target.value;
                        setFormData({ ...formData, area: newArea });
                        if (!editingRecord) {
                          setSelectedRol(inferDefaultRole(activeConfig.key, newArea));
                        }
                      }}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">Seleccione un área...</option>
                      {currentAreas.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setNewAreaName('');
                        setIsAreaModalOpen(true);
                      }}
                      className="px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      title="Crear nueva área para este sector"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nueva Área</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Empresa</label>
                  <input
                    type="text"
                    value={formData.empresa || ''}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    placeholder="Ej. Antonio Buttini"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Ingreso (para cálculo LCT de Vacaciones)
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_ingreso || ''}
                    onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {activeConfig.hasLicencia && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Licencia de Conducir
                    </label>
                    <input
                      type="text"
                      value={formData.licencia_conducir || ''}
                      onChange={(e) => setFormData({ ...formData, licencia_conducir: e.target.value })}
                      placeholder="N° o categoría de licencia"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {!editingRecord && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createSystemUser}
                      onChange={(e) => setCreateSystemUser(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Crear usuario de acceso al sistema automáticamente (Usuario y Clave = DNI o Legajo)</span>
                  </label>

                  {createSystemUser && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Rol de Acceso Asignado
                      </label>
                      <select
                        value={selectedRol}
                        onChange={(e) => setSelectedRol(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Conductor">Conductor</option>
                        <option value="Mecanico">Mecanico</option>
                        <option value="Garita">Garita</option>
                        <option value="Diagramador">Diagramador</option>
                        <option value="Planific-Mantenimiento">Planific-Mantenimiento</option>
                        <option value="Administrativo">Administrativo</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Guardando...' : 'Guardar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Área */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-600" />
                <span>Nueva Área en {activeConfig.label}</span>
              </h3>
              <button
                onClick={() => setIsAreaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArea} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Nueva Área <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder="Ej. Pañol, Seguridad e Higiene, Auditoría..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAreaModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingArea || !newAreaName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {savingArea ? 'Creando...' : 'Crear Área'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 z-[80] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">¿Eliminar colaborador?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Se eliminará a <strong>{deleteTarget.apellido_nombre}</strong> (Legajo {deleteTarget.legajo}) de{' '}
                <strong>{activeConfig.label}</strong>.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Confirmar y Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
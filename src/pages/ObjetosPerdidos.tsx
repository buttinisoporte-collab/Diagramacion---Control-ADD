import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { 
  ObjetoPerdido, 
  DespachoObjetosPerdidos, 
  EstadoObjetoPerdido 
} from '../types/objetosPerdidos';
import { 
  fetchObjetosPerdidos, 
  fetchDespachos,
  getFirmaInfo
} from '../lib/objetosPerdidosService';
import RegistroHallazgoModal from '../components/objetosPerdidos/RegistroHallazgoModal';
import DespachoModal from '../components/objetosPerdidos/DespachoModal';
import RecepcionOficinaView from '../components/objetosPerdidos/RecepcionOficinaView';
import AccionesAdminModal, { TipoAccionAdmin } from '../components/objetosPerdidos/AccionesAdminModal';
import TrazabilidadModal from '../components/objetosPerdidos/TrazabilidadModal';
import QrCodeDisplayModal from '../components/QrCodeDisplayModal';
import { 
  Package, 
  PackagePlus, 
  Send, 
  Inbox, 
  Search, 
  History, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  Building2, 
  UserCheck, 
  HeartHandshake, 
  Trash2, 
  MapPin, 
  Filter, 
  RefreshCw, 
  CheckSquare, 
  Square,
  Sparkles,
  FileText
} from 'lucide-react';

export default function ObjetosPerdidos() {
  const { user } = useAuth();

  // Active Tab: 'garita' | 'despachos' | 'recepcion' | 'busqueda' | 'administracion'
  const [activeTab, setActiveTab] = useState<'garita' | 'despachos' | 'recepcion' | 'busqueda' | 'administracion'>('garita');

  const [objetos, setObjetos] = useState<ObjetoPerdido[]>([]);
  const [despachos, setDespachos] = useState<DespachoObjetosPerdidos[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [filterSector, setFilterSector] = useState<string>('todos');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');

  // Modals state
  const [isRegistroModalOpen, setIsRegistroModalOpen] = useState(false);
  const [isDespachoModalOpen, setIsDespachoModalOpen] = useState(false);
  const [selectedTrazabilidadObj, setSelectedTrazabilidadObj] = useState<ObjetoPerdido | null>(null);

  // QR Modal state
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    value: string;
    details?: { label: string; value: string }[];
  }>({
    isOpen: false,
    title: '',
    value: ''
  });

  // Admin Actions Modal
  const [adminActionModal, setAdminActionModal] = useState<{
    isOpen: boolean;
    tipo: TipoAccionAdmin;
    objetos: ObjetoPerdido[];
  }>({
    isOpen: false,
    tipo: 'entrega_titular',
    objetos: []
  });

  // Multi-selection for bulk donation in administration tab
  const [selectedAdminObjIds, setSelectedAdminObjIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [objs, desp] = await Promise.all([
        fetchObjetosPerdidos(),
        fetchDespachos()
      ]);
      setObjetos(objs);
      setDespachos(desp);
    } catch (e) {
      console.warn('Error cargando objetos perdidos:', e);
    } finally {
      setLoading(false);
    }
  };

  // Objetos en Garita (Estado: 'Encontrado')
  const objetosEnGarita = objetos.filter(o => o.estado === 'Encontrado');

  // Objetos en Administración (Estado: 'EN ADMINISTRACION')
  const objetosEnAdmin = objetos.filter(o => o.estado === 'EN ADMINISTRACION');

  // Filtered list for search & general table
  const filteredObjetos = objetos.filter(o => {
    const matchSearch = searchTerm === '' || 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.numero_planilla.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.personal_hallazgo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.unidad_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.ubicacion_actual && o.ubicacion_actual.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchEstado = filterEstado === 'todos' || o.estado === filterEstado;
    const matchSector = filterSector === 'todos' || o.sector_hallazgo === filterSector;
    const matchDesde = !filterFechaDesde || o.fecha_hallazgo >= filterFechaDesde;
    const matchHasta = !filterFechaHasta || o.fecha_hallazgo <= filterFechaHasta;

    return matchSearch && matchEstado && matchSector && matchDesde && matchHasta;
  });

  const handleShowQrObjeto = (obj: ObjetoPerdido) => {
    setQrModalData({
      isOpen: true,
      title: `Objeto Perdido: ${obj.id}`,
      subtitle: 'El conductor debe escanear este QR desde "Registrar Firma" para validar el hallazgo',
      value: obj.id,
      details: [
        { label: 'Planilla N°', value: obj.numero_planilla },
        { label: 'Fecha Hallazgo', value: obj.fecha_hallazgo },
        { label: 'Personal', value: obj.personal_hallazgo },
        { label: 'Unidad / Sector', value: `${obj.unidad_interno} (${obj.sector_hallazgo})` },
        { label: 'Descripción', value: obj.descripcion }
      ]
    });
  };

  const handleShowQrDespacho = (desp: DespachoObjetosPerdidos) => {
    setQrModalData({
      isOpen: true,
      title: `Despacho a Oficina: ${desp.id}`,
      subtitle: 'El transportador debe escanear este QR para revisar los ítems e iniciar el traslado',
      value: desp.id,
      details: [
        { label: 'Precinto N°', value: desp.numero_precinto },
        { label: 'Fecha Envío', value: desp.fecha_envio },
        { label: 'Operador Despacha', value: desp.operador_despacha_nombre },
        { label: 'Total Objetos', value: String(desp.items.length) }
      ]
    });
  };

  const handleToggleSelectAdmin = (id: string) => {
    if (selectedAdminObjIds.includes(id)) {
      setSelectedAdminObjIds(selectedAdminObjIds.filter(i => i !== id));
    } else {
      setSelectedAdminObjIds([...selectedAdminObjIds, id]);
    }
  };

  const handleToggleSelectAllAdmin = () => {
    if (selectedAdminObjIds.length === objetosEnAdmin.length) {
      setSelectedAdminObjIds([]);
    } else {
      setSelectedAdminObjIds(objetosEnAdmin.map(o => o.id));
    }
  };

  const handleOpenAdminAction = (tipo: TipoAccionAdmin, objList: ObjetoPerdido[]) => {
    setAdminActionModal({
      isOpen: true,
      tipo,
      objetos: objList
    });
  };

  return (
    <>
      <Header
        title="Objetos Perdidos"
        subtitle="Registro de hallazgos en garita, trazabilidad QR, despachos seguros y control de custodia en administración"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {user && (
            <button
              onClick={() => setIsRegistroModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Nuevo Hallazgo (Garita)</span>
            </button>
          )}
        </div>
      </Header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('garita')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'garita'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Hallazgos en Garita</span>
            {objetosEnGarita.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                {objetosEnGarita.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('despachos')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'despachos'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Despachos a Oficina</span>
            {despachos.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                {despachos.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('recepcion')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'recepcion'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Recepción en Oficina</span>
          </button>

          <button
            onClick={() => setActiveTab('administracion')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'administracion'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Gestión en Custodia / Bajas</span>
            {objetosEnAdmin.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                {objetosEnAdmin.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('busqueda')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'busqueda'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Búsqueda y Trazabilidad</span>
          </button>
        </div>

        {/* TAB 1: HALLAZGOS EN GARITA */}
        {activeTab === 'garita' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Objetos Encontrados en Garita</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Los registros aquí acumulados permanecerán hasta que el operador de garita realice el despacho a oficinas con número de precinto.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={objetosEnGarita.length === 0}
                  onClick={() => setIsDespachoModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Despacho a Oficina ({objetosEnGarita.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRegistroModalOpen(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>Nuevo Registro</span>
                </button>
              </div>
            </div>

            {/* Table of Garita Items */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">ID / Planilla</th>
                      <th className="px-4 py-3">Fecha Hallazgo</th>
                      <th className="px-4 py-3">Personal</th>
                      <th className="px-4 py-3">Unidad / Sector</th>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3 text-center">Firma Conductor</th>
                      <th className="px-4 py-3 text-center">QR / Trazabilidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {objetosEnGarita.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                          <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          No hay objetos pendientes en garita. Utilice el botón "Nuevo Registro" para cargar un hallazgo.
                        </td>
                      </tr>
                    ) : (
                      objetosEnGarita.map((obj, idx) => (
                        <tr key={obj.id ? `${obj.id}-${idx}` : `obj-garita-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-blue-600 block">{obj.id}</span>
                            <span className="text-[10px] text-slate-400">Planilla: {obj.numero_planilla}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-semibold">{obj.fecha_hallazgo}</td>
                          <td className="px-4 py-3 text-slate-700">
                            <span className="font-bold block">{obj.personal_hallazgo}</span>
                            <span className="text-[10px] text-slate-400">Registró: {obj.operador_garita_nombre}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-800 block">{obj.unidad_interno}</span>
                            <span className="text-[10px] text-slate-500">Sector: {obj.sector_hallazgo}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-800 max-w-xs">{obj.descripcion}</td>
                          <td className="px-4 py-3 text-center">
                            {obj.conductor_firmo ? (() => {
                              const firma = getFirmaInfo(obj);
                              return (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shadow-2xs">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>Firmado</span>
                                  </span>
                                  <div className="text-[10px] text-slate-700 text-center leading-tight max-w-[170px]">
                                    <span className="font-bold text-slate-800 block truncate" title={firma.firmante}>
                                      {firma.firmante}
                                    </span>
                                    {firma.fechaHora && (
                                      <span className="text-slate-500 font-mono text-[9.5px] block mt-0.5">
                                        {firma.fechaHora}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })() : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pendiente</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleShowQrObjeto(obj)}
                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                title="Ver código QR para firma"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedTrazabilidadObj(obj)}
                                className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                title="Ver trazabilidad"
                              >
                                <History className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DESPACHOS A OFICINA */}
        {activeTab === 'despachos' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Historial de Despachos a Administración</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Despachos precintados enviados desde garita con registro de transportador y recepción en oficinas.
                </p>
              </div>

              <button
                type="button"
                disabled={objetosEnGarita.length === 0}
                onClick={() => setIsDespachoModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Nuevo Despacho ({objetosEnGarita.length} pendientes)</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">ID Despacho</th>
                      <th className="px-4 py-3">Fecha Envío</th>
                      <th className="px-4 py-3">N° Precinto</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Despachante</th>
                      <th className="px-4 py-3">Transportador</th>
                      <th className="px-4 py-3">Artículos</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {despachos.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                          <Send className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          No se han registrado despachos todavía.
                        </td>
                      </tr>
                    ) : (
                      despachos.map((d, idx) => (
                        <tr key={d.id ? `${d.id}-${idx}` : `despacho-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-blue-600">{d.id}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{d.fecha_envio}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{d.numero_precinto}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              d.estado === 'Entregado' ? 'bg-emerald-100 text-emerald-800' :
                              d.estado === 'En Tránsito' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {d.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{d.operador_despacha_nombre}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {d.transportador_nombre || <span className="text-slate-400 italic">Pendiente</span>}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700">{d.items.length} ítems</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleShowQrDespacho(d)}
                              className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                              title="Ver código QR del despacho"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RECEPCIÓN EN OFICINA */}
        {activeTab === 'recepcion' && (
          <RecepcionOficinaView
            despachos={despachos}
            currentUser={user || { id: 'admin', nombre_apellido: 'Personal de Administración', rol: 'Administrador' } as any}
            onRecepcionCompletada={loadData}
          />
        )}

        {/* TAB 4: GESTIÓN EN ADMINISTRACIÓN / BAJAS */}
        {activeTab === 'administracion' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Custodia en Administración ({objetosEnAdmin.length})</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Artículos recepcionados en oficinas. Permite entrega a titular, reubicación de depósito, baja masiva por donación o destrucción.
                </p>
              </div>

              {/* Bulk donation button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={selectedAdminObjIds.length === 0}
                  onClick={() => {
                    const selectedObjs = objetosEnAdmin.filter(o => selectedAdminObjIds.includes(o.id));
                    handleOpenAdminAction('baja_donacion', selectedObjs);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Baja Masiva por Donación ({selectedAdminObjIds.length})</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-3 py-3 w-10 text-center">
                        <button
                          type="button"
                          onClick={handleToggleSelectAllAdmin}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Seleccionar todos"
                        >
                          {selectedAdminObjIds.length > 0 && selectedAdminObjIds.length === objetosEnAdmin.length ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3">ID / Planilla</th>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3">Ubicación Actual</th>
                      <th className="px-4 py-3">Fecha Hallazgo</th>
                      <th className="px-4 py-3 text-center">Acciones de Custodia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {objetosEnAdmin.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                          <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          No hay objetos en custodia en administración actualmente.
                        </td>
                      </tr>
                    ) : (
                      objetosEnAdmin.map((obj, idx) => {
                        const isSelected = selectedAdminObjIds.includes(obj.id);
                        return (
                          <tr key={obj.id ? `${obj.id}-${idx}` : `obj-admin-${idx}`} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}>
                            <td className="px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectAdmin(obj.id)}
                                className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-blue-600 block">{obj.id}</span>
                              <span className="text-[10px] text-slate-400">Planilla: {obj.numero_planilla}</span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{obj.descripcion}</td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-blue-700 flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {obj.ubicacion_actual || 'Sin especificar'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{obj.fecha_hallazgo}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdminAction('entrega_titular', [obj])}
                                  className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  title="Entrega a Titular"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Entregar</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenAdminAction('cambio_deposito', [obj])}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  title="Reubicar en depósito"
                                >
                                  <MapPin className="w-3 h-3" />
                                  <span>Reubicar</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenAdminAction('destruccion', [obj])}
                                  className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  title="Baja por Destrucción"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Destruir</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedTrazabilidadObj(obj)}
                                  className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 cursor-pointer"
                                  title="Trazabilidad"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BÚSQUEDA Y TRAZABILIDAD */}
        {activeTab === 'busqueda' && (
          <div className="space-y-4">
            {/* Search Filters Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por ID, planilla, descripción, persona, interno o ubicación..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <select
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="todos">Todos los Estados</option>
                    <option value="Encontrado">Encontrado (En Garita)</option>
                    <option value="Enviado">Enviado (En Tránsito)</option>
                    <option value="EN ADMINISTRACION">EN ADMINISTRACION</option>
                    <option value="Entregado a Titular">Entregado a Titular</option>
                    <option value="BAJA - DONACION">BAJA - DONACION</option>
                    <option value="DESTRUIDO">DESTRUIDO</option>
                  </select>
                </div>

                <div>
                  <select
                    value={filterSector}
                    onChange={(e) => setFilterSector(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="todos">Todos los Sectores</option>
                    <option value="Unidad / Colectivo">Unidad / Colectivo</option>
                    <option value="Taller">Taller</option>
                    <option value="Estacionamiento">Estacionamiento</option>
                    <option value="Lavadero">Lavadero</option>
                    <option value="Bomba Combustible">Bomba Combustible</option>
                    <option value="Chapería">Chapería</option>
                    <option value="Gomería">Gomería</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-semibold">Fechas:</span>
                  <input
                    type="date"
                    value={filterFechaDesde}
                    onChange={(e) => setFilterFechaDesde(e.target.value)}
                    className="px-2 py-1 text-xs border border-slate-200 rounded bg-slate-50"
                  />
                  <span className="text-slate-400">hasta</span>
                  <input
                    type="date"
                    value={filterFechaHasta}
                    onChange={(e) => setFilterFechaHasta(e.target.value)}
                    className="px-2 py-1 text-xs border border-slate-200 rounded bg-slate-50"
                  />
                  {(searchTerm || filterEstado !== 'todos' || filterSector !== 'todos' || filterFechaDesde || filterFechaHasta) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterEstado('todos');
                        setFilterSector('todos');
                        setFilterFechaDesde('');
                        setFilterFechaHasta('');
                      }}
                      className="text-xs text-blue-600 font-bold hover:underline cursor-pointer ml-2"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>

                <span className="text-slate-400">
                  {filteredObjetos.length} objetos encontrados
                </span>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">ID / Planilla</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3">Sector / Unidad</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Ubicación / Destino</th>
                      <th className="px-4 py-3 text-center">Trazabilidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredObjetos.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                          <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          No se encontraron objetos que coincidan con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredObjetos.map((obj, idx) => (
                        <tr key={obj.id ? `${obj.id}-${idx}` : `obj-filt-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-blue-600 block">{obj.id}</span>
                            <span className="text-[10px] text-slate-400">Planilla: {obj.numero_planilla}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-semibold">{obj.fecha_hallazgo}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800 max-w-xs">{obj.descripcion}</td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-700 block">{obj.unidad_interno}</span>
                            <span className="text-[10px] text-slate-500">{obj.sector_hallazgo}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                obj.estado === 'Encontrado' ? 'bg-blue-100 text-blue-800' :
                                obj.estado === 'Enviado' ? 'bg-amber-100 text-amber-800' :
                                obj.estado === 'EN ADMINISTRACION' ? 'bg-purple-100 text-purple-800' :
                                obj.estado === 'Entregado a Titular' ? 'bg-emerald-100 text-emerald-800' :
                                obj.estado === 'BAJA - DONACION' ? 'bg-teal-100 text-teal-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {obj.estado}
                              </span>
                              {obj.conductor_firmo ? (() => {
                                const firma = getFirmaInfo(obj);
                                return (
                                  <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded leading-tight" title={`Firmado por ${firma.firmante} el ${firma.fechaHora}`}>
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                    <span>Firmado: {firma.firmante} {firma.fechaHora ? `(${firma.fechaHora})` : ''}</span>
                                  </span>
                                );
                              })() : (
                                <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                  <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                  <span>Sin firma</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {obj.ubicacion_actual || <span className="text-slate-400 italic">N/A</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedTrazabilidadObj(obj)}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <History className="w-3.5 h-3.5" />
                              <span>Ver Historial</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* 1. Modal Registro de Hallazgo */}
      <RegistroHallazgoModal
        isOpen={isRegistroModalOpen}
        onClose={() => setIsRegistroModalOpen(false)}
        currentUser={user || { id: 'garita-1', nombre_apellido: 'Operador Garita', rol: 'Garita' } as any}
        onCreated={(nuevo) => {
          loadData();
          handleShowQrObjeto(nuevo);
        }}
      />

      {/* 2. Modal Preparar Despacho */}
      <DespachoModal
        isOpen={isDespachoModalOpen}
        onClose={() => setIsDespachoModalOpen(false)}
        currentUser={user || { id: 'garita-1', nombre_apellido: 'Operador Garita', rol: 'Garita' } as any}
        objetosPendientes={objetosEnGarita}
        onDespachoCreado={(despacho) => {
          loadData();
          handleShowQrDespacho(despacho);
        }}
      />

      {/* 3. Modal Acciones de Custodia (Entrega / Cambio depósito / Donación / Destrucción) */}
      <AccionesAdminModal
        isOpen={adminActionModal.isOpen}
        onClose={() => setAdminActionModal({ isOpen: false, tipo: 'entrega_titular', objetos: [] })}
        tipoAccion={adminActionModal.tipo}
        objetos={adminActionModal.objetos}
        currentUser={user || { id: 'admin-1', nombre_apellido: 'Administrador', rol: 'Administrador' } as any}
        onSuccess={() => {
          setSelectedAdminObjIds([]);
          loadData();
        }}
      />

      {/* 4. Modal Trazabilidad */}
      <TrazabilidadModal
        isOpen={Boolean(selectedTrazabilidadObj)}
        onClose={() => setSelectedTrazabilidadObj(null)}
        objeto={selectedTrazabilidadObj}
      />

      {/* 5. Modal QR Code Display */}
      <QrCodeDisplayModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData(prev => ({ ...prev, isOpen: false }))}
        title={qrModalData.title}
        subtitle={qrModalData.subtitle}
        dataValue={qrModalData.value}
        details={qrModalData.details}
      />
    </>
  );
}

import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Search, 
  MapPin, 
  Clock, 
  Building, 
  ArrowRightLeft, 
  Copy, 
  X, 
  Info, 
  Database,
  Check,
  AlertTriangle
} from 'lucide-react';

interface Tramo {
  origen: string;
  destino: string;
  tiempo1: number; // en minutos
  tiempo2: number; // en minutos
  tiempo3: number; // en minutos
  tiempo4?: number; // en minutos
  tiempo5?: number; // en minutos
}

interface ServicioRegular {
  id: string;
  empresa: string;
  nombre: string;
  codigo: string;
  sentido: 'Ida' | 'Vuelta';
  grupo: string;
  tramos: Tramo[];
  temporada?: string | null;
  linea?: string;
  created_at?: string;
}

const formatMinutos = (mins: number): string => {
  if (mins > 59) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    const hoursStr = hours === 1 ? '1 h' : `${hours} hs`;
    if (remainingMins === 0) return hoursStr;
    return `${hoursStr} y ${remainingMins} min`;
  }
  return `${mins} min`;
};

export default function Servicios() {
  const [servicios, setServicios] = useState<ServicioRegular[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isUsingLocal, setIsUsingLocal] = useState<boolean>(false);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);

  // Filter and search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [seasonFilter, setSeasonFilter] = useState<string>('Todas');
  const [grupoFilter, setGrupoFilter] = useState<string>('Todos');
  const [lineaFilter, setLineaFilter] = useState<string>('Todas');
  const [searchAvailableStage, setSearchAvailableStage] = useState<string>('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string>('');
  
  const [empresa, setEmpresa] = useState<string>('Antonio Buttini');
  const [nombre, setNombre] = useState<string>('');
  const [codigo, setCodigo] = useState<string>('');
  const [linea, setLinea] = useState<string>('');
  const [sentido, setSentido] = useState<'Ida' | 'Vuelta'>('Ida');
  const [grupo, setGrupo] = useState<string>('540');
  const [selectedGrupo, setSelectedGrupo] = useState<string>('');
  const [temporada, setTemporada] = useState<string>('');
  const [habilitarVariante2, setHabilitarVariante2] = useState<boolean>(false);
  const [habilitarVariante3, setHabilitarVariante3] = useState<boolean>(false);
  const [habilitarVariante4, setHabilitarVariante4] = useState<boolean>(false);
  const [habilitarVariante5, setHabilitarVariante5] = useState<boolean>(false);

  // Groups and stages lists
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [allEtapas, setAllEtapas] = useState<any[]>([]);
  const [temporadasList, setTemporadasList] = useState<any[]>([]);
  
  // Custom ordered stages for the active form
  const [activeEtapas, setActiveEtapas] = useState<any[]>([]);
  // Map of transition index to travel times
  const [activeTramos, setActiveTramos] = useState<Tramo[]>([]);

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load master data (etapas, seasons and groups) on mount
  useEffect(() => {
    fetchEtapas();
    fetchTemporadas();
    fetchServicios();
  }, []);

  // Fetch unique groups and all stages
  const fetchEtapas = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('etapas_servicios')
        .select('*');

      if (error) throw error;

      if (data) {
        const groups = Array.from(new Set(data.map((item: any) => item.grupo).filter(Boolean))) as string[];
        setAllEtapas(data);
        setAvailableGroups(groups.sort());
      }
    } catch (err: any) {
      console.warn('Error fetching stages from Supabase:', err.message);
      // Fallback local mock stages if DB is empty / no stages created
      const localEtapas = [
        { id: '1', grupo: 'Grupo 100', punto: 'Terminal San Rafael', latitud: -34.61, longitud: -68.33 },
        { id: '2', grupo: 'Grupo 100', punto: 'Libertador 150', latitud: -34.62, longitud: -68.32 },
        { id: '3', grupo: 'Grupo 100', punto: 'Hosp. Español', latitud: -34.63, longitud: -68.31 },
        { id: '4', grupo: 'Grupo 100', punto: 'Los Sauces y Balloffet', latitud: -34.64, longitud: -68.30 },
        { id: '5', grupo: 'Grupo 200', punto: 'Terminal Mendoza', latitud: -32.89, longitud: -68.84 },
        { id: '6', geometry: null, grupo: 'Grupo 200', punto: 'Control San Rafael', latitud: -34.61, longitud: -68.33 },
      ];
      setAllEtapas(localEtapas);
      const groups = Array.from(new Set(localEtapas.map((item: any) => item.grupo))) as string[];
      setAvailableGroups(groups.sort());
    }
  };

  // Fetch all Seasons (Temporadas)
  const fetchTemporadas = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('temporadas')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      if (data) {
        setTemporadasList(data);
      }
    } catch (err: any) {
      console.warn('Error fetching seasons from Supabase:', err.message);
      setTemporadasList([
        { id_temporada: '1', nombre: 'VERANO 2026' },
        { id_temporada: '2', nombre: 'INVIERNO 2026' },
        { id_temporada: '3', nombre: 'ALTA TEMPORADA' },
        { id_temporada: '4', nombre: 'BAJA TEMPORADA' }
      ]);
    }
  };

  // Fetch services
  const fetchServicios = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      const { data, error } = await supabase
        .from('servicios_regulares')
        .select('*')
        .order('codigo', { ascending: true });

      if (error) throw error;

      if (data) {
        setServicios(data);
        setIsUsingLocal(false);
      }
    } catch (err: any) {
      console.warn('Using Local Storage fallback for servicios_regulares:', err.message);
      setIsUsingLocal(true);
      const localData = localStorage.getItem('app_servicios_regulares');
      if (localData) {
        setServicios(JSON.parse(localData));
      } else {
        // Initial mock service based on user's spreadsheet example
        const initialMock: ServicioRegular[] = [
          {
            id: 'mock-1',
            empresa: 'Antonio Buttini',
            nombre: 'San Rafael - Zanjon Civil',
            codigo: '541 A',
            sentido: 'Ida',
            grupo: 'Grupo 100',
            tramos: [
              { origen: 'Terminal San Rafael', destino: 'Libertador 150', tiempo1: 5, tiempo2: 10, tiempo3: 5 },
              { origen: 'Libertador 150', destino: 'Hosp. Español', tiempo1: 5, tiempo2: 4, tiempo3: 5 },
              { origen: 'Hosp. Español', destino: 'Los Sauces y Balloffet', tiempo1: 30, tiempo2: 36, tiempo3: 25 },
            ]
          }
        ];
        setServicios(initialMock);
        localStorage.setItem('app_servicios_regulares', JSON.stringify(initialMock));
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset search when selected stage group filter changes
  useEffect(() => {
    setSearchAvailableStage('');
  }, [selectedGrupo]);

  // Reconstruct/update tramos structure preserving existing times where possible
  const updateEtapasAndTramos = (newEtapas: any[]) => {
    setActiveEtapas(newEtapas);

    const newTramos: Tramo[] = [];
    for (let i = 0; i < newEtapas.length - 1; i++) {
      const orig = newEtapas[i].punto;
      const dest = newEtapas[i + 1].punto;

      // Try to find matching existing travel times
      const existing = activeTramos.find(t => t.origen === orig && t.destino === dest);
      
      newTramos.push({
        origen: orig,
        destino: dest,
        tiempo1: existing ? existing.tiempo1 : 5,
        tiempo2: existing ? existing.tiempo2 : 5,
        tiempo3: existing ? existing.tiempo3 : 5,
        tiempo4: existing && 'tiempo4' in existing ? (existing.tiempo4 ?? 5) : 5,
        tiempo5: existing && 'tiempo5' in existing ? (existing.tiempo5 ?? 5) : 5,
      });
    }
    setActiveTramos(newTramos);
  };

  const handleAddEtapa = (etapa: any) => {
    const newEtapas = [...activeEtapas, etapa];
    updateEtapasAndTramos(newEtapas);
  };

  const handleRemoveEtapa = (index: number) => {
    const newEtapas = activeEtapas.filter((_, idx) => idx !== index);
    updateEtapasAndTramos(newEtapas);
  };

  const handleReorderEtapas = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === activeEtapas.length - 1) return;

    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    const newEtapas = [...activeEtapas];
    
    // Swap
    const temp = newEtapas[index];
    newEtapas[index] = newEtapas[nextIndex];
    newEtapas[nextIndex] = temp;

    updateEtapasAndTramos(newEtapas);
  };

  // Handle single travel time input change
  const handleTimeChange = (index: number, configNum: 1 | 2 | 3 | 4 | 5, value: string) => {
    const mins = parseInt(value) || 0;
    const updated = [...activeTramos];
    if (configNum === 1) updated[index].tiempo1 = mins;
    if (configNum === 2) updated[index].tiempo2 = mins;
    if (configNum === 3) updated[index].tiempo3 = mins;
    if (configNum === 4) updated[index].tiempo4 = mins;
    if (configNum === 5) updated[index].tiempo5 = mins;
    setActiveTramos(updated);
  };

  // Calculate totals (total duration is equal to the cumulative passing time at the last stage)
  const totals = useMemo(() => {
    if (activeTramos.length === 0) {
      return { tiempo1: 0, tiempo2: 0, tiempo3: 0, tiempo4: 0, tiempo5: 0 };
    }
    const last = activeTramos[activeTramos.length - 1];
    return {
      tiempo1: last.tiempo1 || 0,
      tiempo2: last.tiempo2 || 0,
      tiempo3: last.tiempo3 || 0,
      tiempo4: last.tiempo4 || 0,
      tiempo5: last.tiempo5 || 0
    };
  }, [activeTramos]);

  // Filtered available stages list based on optional stage group filter
  const availableGroupEtapas = useMemo(() => {
    let groupEtapas = allEtapas;
    if (selectedGrupo) {
      groupEtapas = allEtapas.filter(e => e.grupo === selectedGrupo);
    }
    const q = searchAvailableStage.toLowerCase().trim();
    if (!q) return groupEtapas;
    return groupEtapas.filter(e => e.punto.toLowerCase().includes(q));
  }, [allEtapas, selectedGrupo, searchAvailableStage]);

  // Extracted unique groups from existing services for filtering
  const uniqueGrupos = useMemo(() => {
    const gruposSet = new Set<string>();
    servicios.forEach(s => {
      if (s.grupo) gruposSet.add(s.grupo);
    });
    return Array.from(gruposSet).sort();
  }, [servicios]);

  // Extracted unique lines from existing services for filtering
  const uniqueLineas = useMemo(() => {
    const lineasSet = new Set<string>();
    servicios.forEach(s => {
      if (s.linea) lineasSet.add(s.linea);
    });
    return Array.from(lineasSet).sort();
  }, [servicios]);

  // Filtered services list
  const filteredServicios = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    let result = servicios;

    if (seasonFilter !== 'Todas') {
      result = result.filter(s => s.temporada === seasonFilter);
    }

    if (grupoFilter !== 'Todos') {
      result = result.filter(s => s.grupo === grupoFilter);
    }

    if (lineaFilter !== 'Todas') {
      result = result.filter(s => s.linea === lineaFilter);
    }

    if (!q) return result;
    return result.filter(s => 
      s.codigo.toLowerCase().includes(q) ||
      s.nombre.toLowerCase().includes(q) ||
      s.empresa.toLowerCase().includes(q) ||
      s.grupo.toLowerCase().includes(q) ||
      (s.linea && s.linea.toLowerCase().includes(q)) ||
      (s.temporada && s.temporada.toLowerCase().includes(q))
    );
  }, [searchTerm, servicios, seasonFilter, grupoFilter, lineaFilter]);

  // Open modal for creation
  const handleNew = () => {
    setIsEditing(false);
    setCurrentId('');
    setEmpresa('Antonio Buttini');
    setNombre('');
    setCodigo('');
    setLinea('');
    setSentido('Ida');
    setGrupo('540');
    setSelectedGrupo(availableGroups[0] || '');
    setTemporada('');
    setHabilitarVariante2(false);
    setHabilitarVariante3(false);
    setHabilitarVariante4(false);
    setHabilitarVariante5(false);
    setActiveEtapas([]);
    setActiveTramos([]);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (srv: ServicioRegular) => {
    setIsEditing(true);
    setCurrentId(srv.id);
    setEmpresa(srv.empresa);
    setNombre(srv.nombre);
    setCodigo(srv.codigo);
    setLinea(srv.linea || '');
    setSentido(srv.sentido);
    setGrupo(srv.grupo || '540');
    setTemporada(srv.temporada || '');
    
    // Find matching stage group for selectedGrupo from the first stage in tramos
    const firstPunto = srv.tramos[0]?.origen;
    const matchingEtapa = allEtapas.find(e => e.punto === firstPunto);
    const matchedStageGroup = matchingEtapa ? matchingEtapa.grupo : (availableGroups[0] || '');
    setSelectedGrupo(matchedStageGroup);

    const hasV2 = srv.tramos ? srv.tramos.some(t => t.tiempo2 > 0) : false;
    const hasV3 = srv.tramos ? srv.tramos.some(t => (t.tiempo3 || 0) > 0) : false;
    const hasV4 = srv.tramos ? srv.tramos.some(t => (t.tiempo4 || 0) > 0) : false;
    const hasV5 = srv.tramos ? srv.tramos.some(t => (t.tiempo5 || 0) > 0) : false;
    setHabilitarVariante2(hasV2);
    setHabilitarVariante3(hasV3);
    setHabilitarVariante4(hasV4);
    setHabilitarVariante5(hasV5);

    // Initialize active stages and tramos immediately
    if (srv.tramos && srv.tramos.length > 0) {
      const orderedNames: string[] = [];
      srv.tramos.forEach((tr, idx) => {
        if (idx === 0) orderedNames.push(tr.origen);
        orderedNames.push(tr.destino);
      });
      const mapped = orderedNames.map((name, nameIdx) => {
        const found = allEtapas.find(e => e.punto === name);
        return found || { id: `virtual-${nameIdx}`, grupo: matchedStageGroup, punto: name, latitud: 0, longitud: 0 };
      });
      setActiveEtapas(mapped);
      setActiveTramos(srv.tramos);
    } else {
      setActiveEtapas([]);
      setActiveTramos([]);
    }

    setIsModalOpen(true);
  };

  // Save Service
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !codigo.trim() || !grupo.trim() || !linea.trim()) {
      alert('Por favor complete Empresa, Nombre del Servicio, Código, Grupo y Línea.');
      return;
    }

    if (activeEtapas.length < 2) {
      alert('El recorrido debe tener al menos 2 puntos registrados.');
      return;
    }

    const finalTramos = activeTramos.map(t => ({
      ...t,
      tiempo2: habilitarVariante2 ? (t.tiempo2 || 0) : 0,
      tiempo3: habilitarVariante3 ? (t.tiempo3 || 0) : 0,
      tiempo4: habilitarVariante4 ? (t.tiempo4 || 0) : 0,
      tiempo5: habilitarVariante5 ? (t.tiempo5 || 0) : 0,
    }));

    const payload: Omit<ServicioRegular, 'id'> & { id?: string } = {
      empresa,
      nombre: nombre.trim(),
      codigo: codigo.trim().toUpperCase(),
      sentido,
      grupo: grupo.trim(),
      tramos: finalTramos,
      temporada: temporada || null,
      linea: linea.trim(),
    };

    try {
      if (isUsingLocal) {
        // Local state & storage logic
        let nextList = [...servicios];
        if (isEditing) {
          nextList = nextList.map(s => s.id === currentId ? { ...s, ...payload } : s);
        } else {
          nextList.push({
            id: 'local-' + Date.now(),
            ...payload
          } as ServicioRegular);
        }
        setServicios(nextList);
        localStorage.setItem('app_servicios_regulares', JSON.stringify(nextList));
        setIsModalOpen(false);
      } else {
        // Supabase database logic
        if (isEditing) {
          const { error } = await supabase
            .from('servicios_regulares')
            .update(payload)
            .eq('id', currentId);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('servicios_regulares')
            .insert([payload]);

          if (error) throw error;
        }
        fetchServicios();
        setIsModalOpen(false);
      }
    } catch (err: any) {
      alert('Error al guardar en base de datos: ' + err.message + '\n\nGuardando copia en almacenamiento local alternativo para continuar.');
      // Graceful switch to local
      setIsUsingLocal(true);
      let nextList = [...servicios];
      if (isEditing) {
        nextList = nextList.map(s => s.id === currentId ? { ...s, ...payload } : s);
      } else {
        nextList.push({
          id: 'local-' + Date.now(),
          ...payload
        } as ServicioRegular);
      }
      setServicios(nextList);
      localStorage.setItem('app_servicios_regulares', JSON.stringify(nextList));
      setIsModalOpen(false);
    }
  };

  // Trigger copy/duplicate service
  const handleDuplicate = (srv: ServicioRegular) => {
    const duplicated: ServicioRegular = {
      ...srv,
      id: 'local-' + Date.now(),
      codigo: srv.codigo + '-COPIA',
      nombre: srv.nombre + ' (Copia)',
    };
    
    // Save
    if (isUsingLocal) {
      const nextList = [...servicios, duplicated];
      setServicios(nextList);
      localStorage.setItem('app_servicios_regulares', JSON.stringify(nextList));
    } else {
      // Save directly to Supabase
      const { id, created_at, ...cleanPayload } = duplicated as any;
      supabase
        .from('servicios_regulares')
        .insert([cleanPayload])
        .then(({ error }) => {
          if (error) {
            console.error('Error duplicating in Supabase:', error);
            // fallback
            const nextList = [...servicios, duplicated];
            setServicios(nextList);
            localStorage.setItem('app_servicios_regulares', JSON.stringify(nextList));
          } else {
            fetchServicios();
          }
        });
    }
  };

  // Trigger custom delete modal
  const handleDeleteRequest = (id: string) => {
    setDeleteConfirmId(id);
  };

  // Perform delete execution
  const executeDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      if (isUsingLocal) {
        const nextList = servicios.filter(s => s.id !== deleteConfirmId);
        setServicios(nextList);
        localStorage.setItem('app_servicios_regulares', JSON.stringify(nextList));
      } else {
        const { error } = await supabase
          .from('servicios_regulares')
          .delete()
          .eq('id', deleteConfirmId);

        if (error) throw error;
        fetchServicios();
      }
    } catch (err: any) {
      console.error('Error deleting from DB, applying local fallback:', err);
      const nextList = servicios.filter(s => s.id !== deleteConfirmId);
      setServicios(nextList);
      localStorage.setItem('app_servicios_regulares', JSON.stringify(nextList));
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // SQL query string for table creation
  const sqlScript = `CREATE TABLE IF NOT EXISTS servicios_regulares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa VARCHAR(100) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    sentido VARCHAR(20) NOT NULL CHECK (sentido IN ('Ida', 'Vuelta')),
    grupo VARCHAR(100) NOT NULL,
    tramos JSONB NOT NULL,
    temporada VARCHAR(100),
    linea VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

  return (
    <>
      <Header title="Servicios Regulares" subtitle="Tránsito & Tiempos de Marcha" />
      
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-4">
        
        {/* Connection Notice / Resiliency Banner */}
        {isUsingLocal && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg flex-shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-800 uppercase tracking-wide">Base de Datos Local Activada</h4>
                <p className="text-[11px] text-amber-700 font-medium leading-relaxed mt-0.5">
                  La tabla <strong className="font-bold">servicios_regulares</strong> no está creada en Supabase. Los datos se guardan de forma segura en tu navegador localmente. Puedes crear la tabla en tu panel de Supabase SQL Editor para habilitar persistencia en la nube.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowSqlModal(true)}
              className="flex-shrink-0 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[10px] uppercase rounded-lg border border-amber-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              Ver Script SQL
            </button>
          </div>
        )}

        {/* Action controls / filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative col-span-1 md:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por código, nombre, grupo, línea..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
              />
            </div>
            
            <div>
              <select
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-bold"
              >
                <option value="Todas">Todas las temporadas</option>
                {temporadasList.map(t => (
                  <option key={t.id_temporada || t.nombre} value={t.nombre}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={handleNew}
                className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nuevo Servicio
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Grupo:</span>
                <select
                  value={grupoFilter}
                  onChange={(e) => setGrupoFilter(e.target.value)}
                  className="bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-bold min-w-[120px]"
                >
                  <option value="Todos">Todos</option>
                  {uniqueGrupos.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Línea:</span>
                <select
                  value={lineaFilter}
                  onChange={(e) => setLineaFilter(e.target.value)}
                  className="bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-bold min-w-[120px]"
                >
                  <option value="Todas">Todas</option>
                  {uniqueLineas.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-medium">
              Mostrando {filteredServicios.length} de {servicios.length} servicios
            </div>
          </div>
        </div>

        {/* Master services list view */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 font-bold text-xs">Cargando servicios regulares...</div>
        ) : filteredServicios.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-xl p-12 text-center text-slate-400 font-medium text-xs shadow-3xs">
            No se encontraron servicios creados. Haz clic en "Nuevo Servicio" para crear el primero.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredServicios.map(srv => {
              // Calculate last stage's passing time (cumulative duration)
              const lastTramo = srv.tramos[srv.tramos.length - 1];
              const sum1 = lastTramo ? lastTramo.tiempo1 : 0;
              const sum2 = lastTramo ? lastTramo.tiempo2 : 0;
              const sum3 = lastTramo ? lastTramo.tiempo3 : 0;
              const sum4 = lastTramo && 'tiempo4' in lastTramo ? (lastTramo.tiempo4 ?? 0) : 0;
              const sum5 = lastTramo && 'tiempo5' in lastTramo ? (lastTramo.tiempo5 ?? 0) : 0;

              return (
                <div key={srv.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-3xs hover:border-blue-200 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-black rounded border border-slate-200 uppercase tracking-wide">
                        {srv.codigo}
                      </span>
                      <h3 className="text-sm font-black text-slate-800">{srv.nombre}</h3>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                        srv.sentido === 'Ida' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        {srv.sentido}
                      </span>
                      {srv.temporada && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/50 text-[9px] font-bold rounded-full uppercase">
                          {srv.temporada}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px] font-medium">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {srv.empresa}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Grupo: {srv.grupo} {srv.linea ? `| Línea: ${srv.linea}` : ''} ({srv.tramos.length + 1} etapas)
                      </span>
                    </div>
                  </div>

                  {/* Config times summaries */}
                  <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                    <div className={`text-center px-3 ${sum2 > 0 || sum3 > 0 || sum4 > 0 || sum5 > 0 ? 'border-r border-slate-200' : ''}`}>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Tiempo Principal</p>
                      <p className="text-xs font-black text-blue-600">{formatMinutos(sum1)}</p>
                    </div>
                    {sum2 > 0 && (
                      <div className={`text-center px-3 ${sum3 > 0 || sum4 > 0 || sum5 > 0 ? 'border-r border-slate-200' : ''}`}>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Variante 2</p>
                        <p className="text-xs font-black text-slate-600">{sum2} min</p>
                      </div>
                    )}
                    {sum3 > 0 && (
                      <div className={`text-center px-3 ${sum4 > 0 || sum5 > 0 ? 'border-r border-slate-200' : ''}`}>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Variante 3</p>
                        <p className="text-xs font-black text-slate-600">{sum3} min</p>
                      </div>
                    )}
                    {sum4 > 0 && (
                      <div className={`text-center px-3 ${sum5 > 0 ? 'border-r border-slate-200' : ''}`}>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Variante 4</p>
                        <p className="text-xs font-black text-slate-600">{sum4} min</p>
                      </div>
                    )}
                    {sum5 > 0 && (
                      <div className="text-center px-3">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Variante 5</p>
                        <p className="text-xs font-black text-slate-600">{sum5} min</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => handleDuplicate(srv)}
                      className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                      title="Duplicar Servicio"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(srv)}
                      className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                      title="Editar Servicio"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(srv.id)}
                      className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar Servicio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Creation & Editing Form */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl flex flex-col max-h-[96vh] animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    {isEditing ? 'Editar Servicio de Línea' : 'Nuevo Servicio de Línea'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">Ingrese la cabecera del servicio y configure los tiempos de paso acumulados por cada etapa.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/50 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 overflow-y-auto space-y-5">
                <form id="servicio-form" onSubmit={handleSave} className="space-y-5">
                  
                  {/* Part 1: Metadata Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Empresa <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={empresa}
                        onChange={(e) => setEmpresa(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                      >
                        <option value="Antonio Buttini">Antonio Buttini</option>
                        <option value="Italo Buttini">Italo Buttini</option>
                        <option value="Iselin">Iselin</option>
                        <option value="La Unica">La Unica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Nombre del Servicio <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. San Rafael - Zanjon Civil"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Código de Servicio <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. 541 A"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Sentido <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSentido('Ida')}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            sentido === 'Ida'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Ida
                        </button>
                        <button
                          type="button"
                          onClick={() => setSentido('Vuelta')}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            sentido === 'Vuelta'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Vuelta
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Grupo <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={grupo}
                        onChange={(e) => setGrupo(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-bold"
                      >
                        <option value="540">540</option>
                        <option value="570">570</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Grupo al que pertenece el servicio (540 ó 570).
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Línea <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Línea 541"
                        value={linea}
                        onChange={(e) => setLinea(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-bold"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Identificación o número de la línea.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Temporada <span className="text-slate-400">(Opcional)</span>
                      </label>
                      <select
                        value={temporada}
                        onChange={(e) => setTemporada(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-bold"
                      >
                        <option value="">-- Sin Temporada --</option>
                        {temporadasList.map(t => (
                          <option key={t.id_temporada || t.nombre} value={t.nombre}>
                            {t.nombre}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Asocie este servicio a una temporada si corresponde.
                      </p>
                    </div>
                  </div>

                  {/* Part 2: Interactive Stages List & Travel Times Matrix */}
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    {allEtapas.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl text-center text-slate-500 font-medium text-xs">
                         No hay etapas de servicios configuradas en el sistema.
                         Por favor cree etapas bajo "Etapas de Servicios" en la pestaña de Configuración.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                          
                          {/* Column 1: Available Stages */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col h-[580px]">
                            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <Database className="w-3.5 h-3.5 text-slate-400" />
                              1. Etapas Disponibles
                            </h4>
                            <p className="text-[9px] text-slate-500 leading-tight mb-2.5">
                              Haga clic en el botón <span className="font-bold text-blue-600">+</span> para agregar la etapa al recorrido.
                            </p>

                            <div className="mb-2 flex-shrink-0">
                              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                                Filtrar por Grupo de Recorrido
                              </label>
                              <select
                                value={selectedGrupo}
                                onChange={(e) => setSelectedGrupo(e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-bold"
                              >
                                <option value="">-- Todos los Grupos --</option>
                                {availableGroups.map(g => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                            </div>

                            <div className="relative mb-2 flex-shrink-0">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                              <input
                                type="text"
                                placeholder="Filtrar etapa..."
                                value={searchAvailableStage}
                                onChange={(e) => setSearchAvailableStage(e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg pl-7 pr-3 py-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                              />
                            </div>

                            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                              {availableGroupEtapas.length === 0 ? (
                                <p className="text-[10px] text-slate-400 text-center py-4">No se encontraron etapas</p>
                              ) : (
                                availableGroupEtapas.map((etapa, idx) => (
                                  <div key={etapa.id || idx} className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between shadow-4xs">
                                    <span className="text-[11px] font-bold text-slate-700 truncate mr-2" title={etapa.punto}>
                                      {etapa.punto}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleAddEtapa(etapa)}
                                      className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors cursor-pointer flex items-center justify-center flex-shrink-0"
                                      title="Agregar a la ruta"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Column 2: Selected Stages (Route Order) */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col h-[580px]">
                            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              2. Recorrido ({activeEtapas.length})
                            </h4>
                            <p className="text-[9px] text-slate-500 leading-tight mb-2.5">
                              Ordene las etapas con las flechas o elimínelas con el tacho.
                            </p>

                            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                              {activeEtapas.length === 0 ? (
                                <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center h-full flex flex-col items-center justify-center text-slate-400">
                                  <MapPin className="w-8 h-8 mb-2 opacity-40 text-slate-300" />
                                  <p className="text-[10px] font-bold leading-normal">
                                    Ruta vacía.<br />Agregue etapas desde la columna de disponibles.
                                  </p>
                                </div>
                              ) : (
                                activeEtapas.map((etapa, idx) => (
                                  <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between shadow-4xs">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-black text-slate-500 flex-shrink-0">
                                        {idx + 1}
                                      </span>
                                      <span className="text-[11px] font-bold text-slate-800 truncate" title={etapa.punto}>
                                        {etapa.punto}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                      <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={() => handleReorderEtapas(idx, 'up')}
                                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                        title="Subir"
                                      >
                                        <ChevronUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={idx === activeEtapas.length - 1}
                                        onClick={() => handleReorderEtapas(idx, 'down')}
                                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                        title="Bajar"
                                      >
                                        <ChevronDown className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveEtapa(idx)}
                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer ml-0.5"
                                        title="Eliminar etapa"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Column 3-4: Travel Times Between Sections (Cumulative Passing Times) */}
                          <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col h-[580px]">
                            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              3. Tiempos de Paso por Etapa (Acumulado)
                            </h4>
                            <p className="text-[9px] text-slate-500 leading-tight mb-2">
                              Ingrese el tiempo en <strong>minutos acumulados desde la salida</strong>.
                            </p>
                            
                            {/* Short tutorial tip */}
                            <div className="mb-2.5 p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-[9px] text-blue-700 leading-normal flex gap-1.5 items-start">
                              <span className="font-bold">💡 Consejo:</span>
                              <p>
                                Ingrese a los "cuantos" minutos pasa por el lugar. Ej: si sale en Etapa 1 (0 min) y llega a Etapa 2 a los 8 min, escriba 8. Si llega a Etapa 3 a los 15 min totales, escriba 15, y así sucesivamente.
                              </p>
                            </div>

                            {/* Option to enable variant 2, 3, 4 and 5 */}
                            <div className="mb-2.5 p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">Variantes:</span>
                              <div className="flex flex-wrap gap-x-4 gap-y-2">
                                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={habilitarVariante2}
                                    onChange={(e) => setHabilitarVariante2(e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <span>Habilitar Variante 2</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={habilitarVariante3}
                                    onChange={(e) => setHabilitarVariante3(e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <span>Habilitar Variante 3</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={habilitarVariante4}
                                    onChange={(e) => setHabilitarVariante4(e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <span>Habilitar Variante 4</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={habilitarVariante5}
                                    onChange={(e) => setHabilitarVariante5(e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <span>Habilitar Variante 5</span>
                                </label>
                              </div>
                            </div>

                            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                              {activeEtapas.length === 0 ? (
                                <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center h-full flex flex-col items-center justify-center text-slate-400">
                                  <Clock className="w-8 h-8 mb-2 opacity-40 text-slate-300" />
                                  <p className="text-[10px] font-bold leading-normal">
                                    No hay tramos configurados.<br />Agregue al menos 2 etapas en el recorrido.
                                  </p>
                                </div>
                              ) : (
                                <>
                                  {/* Read-only Starting Point Card */}
                                  <div className="bg-slate-100/80 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
                                    <div className="min-w-0">
                                      <span className="text-[8px] font-black text-slate-500 uppercase">PUNTO DE SALIDA (ETAPA 1)</span>
                                      <p className="text-[11px] font-black text-slate-800 truncate" title={activeEtapas[0].punto}>
                                        {activeEtapas[0].punto}
                                      </p>
                                    </div>
                                    <span className="px-2 py-1 bg-white border border-slate-200 text-[10px] font-black text-slate-600 rounded-lg">
                                      0 min (Salida)
                                    </span>
                                  </div>

                                  {activeTramos.map((tramo, idx) => {
                                    const numCols = 1 + (habilitarVariante2 ? 1 : 0) + (habilitarVariante3 ? 1 : 0) + (habilitarVariante4 ? 1 : 0) + (habilitarVariante5 ? 1 : 0);
                                    return (
                                      <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-4xs">
                                        <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-slate-100">
                                          <span className="text-[8px] font-black text-blue-600 uppercase flex-shrink-0">Etapa {idx + 2}</span>
                                          <p className="text-[10px] font-black text-slate-800 flex items-center gap-1 min-w-0">
                                            <span className="truncate text-slate-400" title={tramo.origen}>{tramo.origen}</span>
                                            <span className="text-slate-400 flex-shrink-0">➔</span>
                                            <span className="truncate text-blue-600" title={tramo.destino}>{tramo.destino}</span>
                                          </p>
                                        </div>

                                        <div className={`grid gap-1.5 ${
                                          numCols === 1 ? 'grid-cols-1' : numCols === 2 ? 'grid-cols-2' : numCols === 3 ? 'grid-cols-3' : numCols === 4 ? 'grid-cols-4' : 'grid-cols-5'
                                        }`}>
                                          <div className="space-y-0.5">
                                            <label className="block text-[8px] font-bold text-slate-400 uppercase">Principal (min paso)</label>
                                            <input
                                              type="number"
                                              min="0"
                                              required
                                              value={tramo.tiempo1 || ''}
                                              onChange={(e) => handleTimeChange(idx, 1, e.target.value)}
                                              className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-1 py-1 text-[11px] text-center font-bold text-blue-600 focus:outline-none"
                                              placeholder="Paso"
                                            />
                                          </div>
                                          {habilitarVariante2 && (
                                            <div className="space-y-0.5">
                                              <label className="block text-[8px] font-bold text-slate-400 uppercase">Variante 2 (min paso)</label>
                                              <input
                                                type="number"
                                                min="0"
                                                required={habilitarVariante2}
                                                value={tramo.tiempo2 || ''}
                                                onChange={(e) => handleTimeChange(idx, 2, e.target.value)}
                                                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-1 py-1 text-[11px] text-center font-bold text-slate-600 focus:outline-none"
                                                placeholder="Paso"
                                              />
                                            </div>
                                          )}
                                          {habilitarVariante3 && (
                                            <div className="space-y-0.5">
                                              <label className="block text-[8px] font-bold text-slate-400 uppercase">Variante 3 (min paso)</label>
                                              <input
                                                type="number"
                                                min="0"
                                                required={habilitarVariante3}
                                                value={tramo.tiempo3 || ''}
                                                onChange={(e) => handleTimeChange(idx, 3, e.target.value)}
                                                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-1 py-1 text-[11px] text-center font-bold text-slate-600 focus:outline-none"
                                                placeholder="Paso"
                                              />
                                            </div>
                                          )}
                                          {habilitarVariante4 && (
                                            <div className="space-y-0.5">
                                              <label className="block text-[8px] font-bold text-slate-400 uppercase">Variante 4 (min paso)</label>
                                              <input
                                                type="number"
                                                min="0"
                                                required={habilitarVariante4}
                                                value={tramo.tiempo4 || ''}
                                                onChange={(e) => handleTimeChange(idx, 4, e.target.value)}
                                                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-1 py-1 text-[11px] text-center font-bold text-slate-600 focus:outline-none"
                                                placeholder="Paso"
                                              />
                                            </div>
                                          )}
                                          {habilitarVariante5 && (
                                            <div className="space-y-0.5">
                                              <label className="block text-[8px] font-bold text-slate-400 uppercase">Variante 5 (min paso)</label>
                                              <input
                                                type="number"
                                                min="0"
                                                required={habilitarVariante5}
                                                value={tramo.tiempo5 || ''}
                                                onChange={(e) => handleTimeChange(idx, 5, e.target.value)}
                                                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-1 py-1 text-[11px] text-center font-bold text-slate-600 focus:outline-none"
                                                placeholder="Paso"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </>
                              )}
                            </div>

                            {/* Aggregates Totals Bottom Bar */}
                            {activeEtapas.length > 0 && (
                              <div className={`mt-2.5 p-2 bg-slate-100 border border-slate-200 rounded-lg grid gap-1.5 text-center flex-shrink-0 ${
                                (1 + (habilitarVariante2 ? 1 : 0) + (habilitarVariante3 ? 1 : 0) + (habilitarVariante4 ? 1 : 0) + (habilitarVariante5 ? 1 : 0)) === 1 
                                  ? 'grid-cols-1' 
                                  : (1 + (habilitarVariante2 ? 1 : 0) + (habilitarVariante3 ? 1 : 0) + (habilitarVariante4 ? 1 : 0) + (habilitarVariante5 ? 1 : 0)) === 2 
                                    ? 'grid-cols-2' 
                                    : (1 + (habilitarVariante2 ? 1 : 0) + (habilitarVariante3 ? 1 : 0) + (habilitarVariante4 ? 1 : 0) + (habilitarVariante5 ? 1 : 0)) === 3
                                      ? 'grid-cols-3'
                                      : (1 + (habilitarVariante2 ? 1 : 0) + (habilitarVariante3 ? 1 : 0) + (habilitarVariante4 ? 1 : 0) + (habilitarVariante5 ? 1 : 0)) === 4
                                        ? 'grid-cols-4'
                                        : 'grid-cols-5'
                              }`}>
                                <div>
                                  <p className="text-[8px] font-bold text-slate-500 uppercase">Duración Principal</p>
                                  <p className="text-[12px] font-black text-blue-600">{formatMinutos(totals.tiempo1)}</p>
                                </div>
                                {habilitarVariante2 && (
                                  <div>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase">Duración Variante 2</p>
                                    <p className="text-[12px] font-black text-slate-700">{totals.tiempo2} min</p>
                                  </div>
                                )}
                                {habilitarVariante3 && (
                                  <div>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase">Duración Variante 3</p>
                                    <p className="text-[12px] font-black text-slate-700">{totals.tiempo3} min</p>
                                  </div>
                                )}
                                {habilitarVariante4 && (
                                  <div>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase">Duración Variante 4</p>
                                    <p className="text-[12px] font-black text-slate-700">{totals.tiempo4} min</p>
                                  </div>
                                )}
                                {habilitarVariante5 && (
                                  <div>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase">Duración Variante 5</p>
                                    <p className="text-[12px] font-black text-slate-700">{totals.tiempo5} min</p>
                                  </div>
                                )}
                              </div>
                            )}

                          </div>

                        </div>
                      )}

                  </div>

                </form>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3 rounded-b-xl">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  form="servicio-form"
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {loading ? 'Guardando...' : 'Guardar Servicio'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Custom Delete Confirmation */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-100">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">¿Confirmar eliminación?</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Esta acción eliminará de forma permanente el servicio de línea seleccionado. Esta operación no se puede deshacer.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={executeDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    Confirmar y Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: View SQL Script for Supabase Table */}
        {showSqlModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-100">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    Script de Creación SQL para Supabase
                  </h3>
                </div>
                <button 
                  onClick={() => setShowSqlModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                <p className="text-xs text-slate-600 leading-normal">
                  Ejecuta el siguiente script en tu panel de <strong className="font-bold">SQL Editor</strong> en Supabase para crear la tabla <strong className="font-bold">servicios_regulares</strong> y habilitar la persistencia de datos en la nube.
                </p>
                <div className="bg-slate-950 text-emerald-400 p-4 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre select-all leading-relaxed">
                  {sqlScript}
                </div>
                <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-lg flex gap-2.5">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-800 leading-normal font-medium">
                    Una vez que ejecutes el comando SQL, la aplicación detectará automáticamente la tabla en la base de datos Supabase y migrará los datos de almacenamiento local a la nube en tu próximo guardado.
                  </p>
                </div>
              </div>
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end rounded-b-xl">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(sqlScript);
                    alert('Script copiado al portapapeles.');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Script
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

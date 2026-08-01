import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { 
  Search, 
  Filter, 
  MapPin, 
  User, 
  Clock, 
  Wrench, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  FileText, 
  Activity, 
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface Auxilio {
  id?: string;
  fecha: string;
  unidad: string;
  servicio: string;
  grupo: string;
  turno: string;
  linea: string;
  conductor: string;
  lugar: string;
  punto_gps: string;
  kilometros: number;
  created_at?: string;
  // Dynamic fields
  tipo?: string;
  estado?: string;
  gravedad?: string;
}

interface AuxilioCRM {
  id_auxilio: string; // matches Auxilio ID or unique key
  unidad_reemplazo?: string;
  hora_salida?: string;
  personal_mecanico?: string;
  hora_llegada?: string;
  tiempo_auxilio?: string;
  incidencia_servicio?: 'SI' | 'NO';
  demora_servicio?: string; // Hs:Min
  observado_wara?: 'SI' | 'NO';
  ota?: string;
  clasificacion_causa?: string;
  sistema?: string;
  subsistema?: string;
  detalle_causa?: string;
  analisis_causa?: string;
  updated_at?: string;
}

const DEFAULT_AUXILIOS: Auxilio[] = [
  {
    id: 'mock-1',
    fecha: '2026-07-15',
    unidad: 'L570-070',
    linea: '579B - Mendoza - San Rafael',
    conductor: '026 - ANGULO, CRISTIAN OMAR',
    lugar: 'Terminal Mendoza',
    punto_gps: '-32.8901, -68.8340',
    servicio: 'Mendoza Expreso 10:00',
    grupo: 'Grupo 500',
    turno: 'Turno Mañana 1',
    kilometros: 230,
    tipo: 'INC',
    gravedad: 'Leve | Caída de pasajero a bordo o retraso por falla de compresor'
  },
  {
    id: 'mock-2',
    fecha: '2026-07-17',
    unidad: 'L570-073',
    linea: '579A - Mendoza - Alvear',
    conductor: '336 - MOYANO, LUCAS ALBERTO',
    lugar: 'Terminal San Rafael',
    punto_gps: '-34.6180, -68.3300',
    servicio: 'Alvear Expreso 13:15',
    grupo: 'Grupo 500',
    turno: 'Turno Tarde 3',
    kilometros: 310,
    tipo: 'SIN',
    gravedad: 'Grave | Rotura de manguera de alta presión con derrame'
  },
  {
    id: 'mock-3',
    fecha: '2026-07-20',
    unidad: 'L540-026',
    linea: '540 - Mendoza',
    conductor: '210 - GIMENEZ, MAURO GUSTAVO',
    lugar: 'Ruta 40 Km 80',
    punto_gps: '-33.5200, -68.9100',
    servicio: 'San Carlos Interurbano',
    grupo: 'Grupo 540',
    turno: 'Turno Corto 2',
    kilometros: 80,
    tipo: 'SIN',
    gravedad: 'Moderado | Alternador inoperativo sin carga de batería'
  },
  {
    id: 'mock-4',
    fecha: '2026-07-28',
    unidad: 'L540-013',
    linea: '540 - San Juan',
    conductor: '634 - HEREDIA, ROBERTO DANIEL',
    lugar: 'Ruta 143 Km 22',
    punto_gps: '-34.4500, -68.4200',
    servicio: 'Expreso San Juan 16:30',
    grupo: 'Grupo 540',
    turno: 'Turno Largo 5',
    kilometros: 22,
    tipo: 'INC',
    gravedad: 'Leve | Pinchadura de neumático trasero derecho'
  },
  {
    id: 'mock-5',
    fecha: '2026-07-28',
    unidad: 'L540-002',
    linea: '540 - Lavalle',
    conductor: '129 - BEURET, LIBER',
    lugar: 'Terminal Lavalle',
    punto_gps: '-32.7210, -68.5900',
    servicio: 'Lavalle Común 20:10',
    grupo: 'Grupo 540',
    turno: 'Turno Tarde 1',
    kilometros: 35,
    tipo: 'INC',
    gravedad: 'Leve | Falla en aire acondicionado evaporador bloqueado'
  }
];

export default function SeguimientoCRM() {
  const { user } = useAuth();
  
  // Lists
  const [auxilios, setAuxilios] = useState<Auxilio[]>([]);
  const [crmMap, setCrmMap] = useState<Record<string, AuxilioCRM>>({});
  const [flotaList, setFlotaList] = useState<any[]>([]);
  const [mecanicosList, setMecanicosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAuxilio, setSelectedAuxilio] = useState<Auxilio | null>(null);



  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('Todos');

  // CRM Form States
  const [unidadReemplazo, setUnidadReemplazo] = useState('');
  const [horaSalida, setHoraSalida] = useState('');
  const [personalMecanico, setPersonalMecanico] = useState('');
  const [horaLlegada, setHoraLlegada] = useState('');
  const [tiempoAuxilio, setTiempoAuxilio] = useState('00:00');
  const [incidenciaServicio, setIncidenciaServicio] = useState<'SI' | 'NO'>('NO');
  const [demoraServicio, setDemoraServicio] = useState('00:00');
  const [observadoWara, setObservadoWara] = useState<'SI' | 'NO'>('NO');
  const [ota, setOta] = useState('');
  const [clasificacionCausa, setClasificacionCausa] = useState('');
  const [sistema, setSistema] = useState('');
  const [subsistema, setSubsistema] = useState('');
  const [detalleCausa, setDetalleCausa] = useState('');
  const [analisisCausa, setAnalisisCausa] = useState('');

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load Initial Data
  useEffect(() => {
    loadMasterData();
    loadAuxiliosData();
  }, []);

  const loadMasterData = async () => {
    try {
      // 1. Load active fleet
      let loadedFlota = [];
      if (supabase) {
        const { data } = await supabase.from('flota_activa').select('*').order('id_unidad');
        if (data && data.length > 0) loadedFlota = data;
      }
      if (loadedFlota.length === 0) {
        const local = localStorage.getItem('ext_store_flota_activa');
        if (local) loadedFlota = JSON.parse(local);
      }
      setFlotaList(loadedFlota);

      // 2. Load mechanics
      let loadedMecanicos = [];
      if (supabase) {
        const { data } = await supabase.from('nomina_mecanicos').select('id_mecanico, apellido_nombre').order('apellido_nombre');
        if (data && data.length > 0) loadedMecanicos = data;
      }
      if (loadedMecanicos.length === 0) {
        const local = localStorage.getItem('ext_store_nomina_mecanicos');
        if (local) loadedMecanicos = JSON.parse(local);
      }
      setMecanicosList(loadedMecanicos);
    } catch (e) {
      console.error('Error loading master data:', e);
    }
  };

  const loadAuxiliosData = async () => {
    setLoading(true);
    try {
      let data: Auxilio[] = [];
      if (supabase) {
        const { data: res, error } = await supabase
          .from('auxilios')
          .select('*')
          .order('fecha', { ascending: false });
        if (!error && res) {
          data = res;
        }
      }

      // Sync with localStorage or populate defaults
      if (data.length === 0) {
        const local = localStorage.getItem('app_auxilios');
        if (local) {
          data = JSON.parse(local);
        } else {
          // If no data anywhere, seed our beautiful mock data
          data = DEFAULT_AUXILIOS;
          localStorage.setItem('app_auxilios', JSON.stringify(DEFAULT_AUXILIOS));
        }
      }

      setAuxilios(data);

      // Load CRM followup mappings
      const savedCrm = localStorage.getItem('app_auxilios_crm');
      if (savedCrm) {
        setCrmMap(JSON.parse(savedCrm));
      }
    } catch (e) {
      console.error('Error fetching auxilios CRM data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Get unique identifier key for an Auxilio
  const getAuxilioKey = (aux: Auxilio) => {
    return aux.id || `${aux.fecha}_${aux.unidad}_${aux.conductor.replace(/[^a-zA-Z0-9]/g, '')}`;
  };

  // Whenever a record is clicked, populate fields
  const handleSelectAuxilio = (aux: Auxilio) => {
    setSelectedAuxilio(aux);
    const key = getAuxilioKey(aux);
    const crmData = crmMap[key];

    if (crmData) {
      setUnidadReemplazo(crmData.unidad_reemplazo || '');
      setHoraSalida(crmData.hora_salida || '');
      setPersonalMecanico(crmData.personal_mecanico || '');
      setHoraLlegada(crmData.hora_llegada || '');
      setTiempoAuxilio(crmData.tiempo_auxilio || '00:00');
      setIncidenciaServicio(crmData.incidencia_servicio || 'NO');
      setDemoraServicio(crmData.demora_servicio || '00:00');
      setObservadoWara(crmData.observado_wara || 'NO');
      setOta(crmData.ota || '');
      setClasificacionCausa(crmData.clasificacion_causa || '');
      setSistema(crmData.sistema || '');
      setSubsistema(crmData.subsistema || '');
      setDetalleCausa(crmData.detalle_causa || '');
      setAnalisisCausa(crmData.analisis_causa || '');
    } else {
      // Clear fields
      setUnidadReemplazo('');
      setHoraSalida('');
      setPersonalMecanico('');
      setHoraLlegada('');
      setTiempoAuxilio('00:00');
      setIncidenciaServicio('NO');
      setDemoraServicio('00:00');
      setObservadoWara('NO');
      setOta('');
      setClasificacionCausa('');
      setSistema('');
      setSubsistema('');
      setDetalleCausa('');
      setAnalisisCausa('');
    }
  };

  // Calculate dynamic duration (Tiempo)
  useEffect(() => {
    if (horaSalida && horaLlegada) {
      const [hSal, mSal] = horaSalida.split(':').map(Number);
      const [hLleg, mLleg] = horaLlegada.split(':').map(Number);

      let diffMinutes = (hLleg * 60 + mLleg) - (hSal * 60 + mSal);
      if (diffMinutes < 0) {
        // Crossed midnight
        diffMinutes += 24 * 60;
      }

      const hrs = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      const formatted = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      setTiempoAuxilio(formatted);
    } else {
      setTiempoAuxilio('00:00');
    }
  }, [horaSalida, horaLlegada]);

  // Save CRM fields to state and localStorage
  const handleSaveCRM = () => {
    if (!selectedAuxilio) return;

    const key = getAuxilioKey(selectedAuxilio);
    const newCRMRecord: AuxilioCRM = {
      id_auxilio: key,
      unidad_reemplazo: unidadReemplazo,
      hora_salida: horaSalida,
      personal_mecanico: personalMecanico,
      hora_llegada: horaLlegada,
      tiempo_auxilio: tiempoAuxilio,
      incidencia_servicio: incidenciaServicio,
      demora_servicio: demoraServicio,
      observado_wara: observadoWara,
      ota,
      clasificacion_causa: clasificacionCausa,
      sistema,
      subsistema,
      detalle_causa: detalleCausa,
      analisis_causa: analisisCausa,
      updated_at: new Date().toISOString()
    };

    const updatedMap = {
      ...crmMap,
      [key]: newCRMRecord
    };

    setCrmMap(updatedMap);
    localStorage.setItem('app_auxilios_crm', JSON.stringify(updatedMap));

    // Show beautiful success toast
    setToast({
      type: 'success',
      text: `Seguimiento CRM guardado correctamente para la unidad ${selectedAuxilio.unidad}.`
    });

    // Auto dismiss toast
    setTimeout(() => setToast(null), 4000);
  };

  // Helper lists for dynamic selector
  const SISTEMAS = [
    'Motor',
    'Transmisión',
    'Suspensión y Dirección',
    'Frenos',
    'Sistema Eléctrico',
    'Neumáticos / Ruedas',
    'Climatización (A/A)',
    'Carrocería e Interior',
    'Combustible / Admisión',
    'Otros'
  ];

  const SUBSISTEMAS: Record<string, string[]> = {
    'Motor': ['Inyectores', 'Turboalimentador', 'Alternador / Arranque', 'Correas de distribución', 'Bomba de agua', 'Radiador / Mangueras', 'Fuga de aceite'],
    'Transmisión': ['Embrague', 'Caja de cambios', 'Diferencial', 'Cardan', 'Fuga de grasa / fluído'],
    'Suspensión y Dirección': ['Amortiguadores', 'Pulmones de suspensión', 'Caja de dirección', 'Filtro secador', 'Bujes / Bieletas'],
    'Frenos': ['Cintas / Pastillas', 'Cámara de freno (Caliper)', 'Compresor de aire', 'Fuga de aire neumático', 'Válvula de freno'],
    'Sistema Eléctrico': ['Baterías sulfatadas', 'Arranque defectuoso', 'Luces de carretera', 'Sensores de tablero', 'Fusinera / Relés'],
    'Neumáticos / Ruedas': ['Pinchadura', 'Reventón en ruta', 'Válvula defectuosa', 'Desgaste severo', 'Espárrago cortado'],
    'Climatización (A/A)': ['Compresor A/A', 'Carga de gas refrigerante', 'Evaporador congelado', 'Sopladores de cabina'],
    'Carrocería e Interior': ['Puerta pantográfica', 'Ventanas / Cristales', 'Asientos / Tapizado', 'Módulos de baño', 'Espejos retrovisores'],
    'Combustible / Admisión': ['Bomba inyectora', 'Filtro de gasoil tapado', 'Tanque de combustible', 'Fuga de gasoil']
  };

  const CLASIFICACIONES = [
    'Falla de Componente Mecánico',
    'Falla Electrónica / Eléctrica',
    'Error de Operación / Conducción',
    'Mantenimiento Preventivo Vencido',
    'Falla por Desgaste Natural',
    'Factores Climáticos o Externos',
    'Accidente de Tránsito / Siniestro',
    'Sin Falla Constatada (Descarte)'
  ];

  // Filters application
  const filteredAuxilios = auxilios.filter(aux => {
    // 1. Search Query
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      aux.conductor.toLowerCase().includes(query) ||
      aux.unidad.toLowerCase().includes(query) ||
      (aux.linea && aux.linea.toLowerCase().includes(query)) ||
      (aux.lugar && aux.lugar.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    // 2. Year Filter
    const auxYear = new Date(aux.fecha).getFullYear().toString();
    if (selectedYear !== 'Todos' && auxYear !== selectedYear) return false;

    // 3. Month Filter
    const auxMonth = String(new Date(aux.fecha).getMonth() + 1).padStart(2, '0');
    if (selectedMonth !== 'Todos' && auxMonth !== selectedMonth) return false;

    // 4. Category Filter (INC / SIN / AUX)
    const typeLabel = aux.tipo || 'AUX';
    if (selectedCategory !== 'Todos') {
      if (selectedCategory === 'Siniestros e Incidentes' && typeLabel === 'AUX') return false;
      if (selectedCategory === 'Auxilios Mecánicos' && typeLabel !== 'AUX') return false;
    }

    return true;
  });

  return (
    <div className="flex-1 bg-[#0b1329] min-h-screen flex flex-col font-sans overflow-hidden">
      <Header 
        title="CRM Seguimiento de Auxilios" 
        subtitle="Gestión, investigación y registro complementario de auxilios mecánicos e incidentes de flota"
      />

      {/* Main split grid layout */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden relative">
        
        {/* Toast Notification */}
        {toast && (
          <div className="absolute top-4 right-4 z-50 animate-in fade-in slide-in-from-top duration-300">
            <div className={`p-4 rounded-xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100' 
                : 'bg-red-950/90 border-red-500/50 text-red-100'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
              <p className="text-xs font-bold">{toast.text}</p>
            </div>
          </div>
        )}

        {/* LEFT COLUMN: Event list */}
        <div className="xl:col-span-5 flex flex-col bg-[#0b1329] border-r border-[#1e2a4a] h-full overflow-hidden">
          
          {/* Header Panel */}
          <div className="p-4 bg-[#0f1b35] border-b border-[#1e2a4a] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Activity className="w-5 h-5" />
                <h2 className="text-sm font-black uppercase tracking-wider">Seguimiento de Eventos</h2>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                {filteredAuxilios.length} Registros
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por conductor, línea, int..."
                className="w-full bg-[#16223f] border border-[#233560] text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg pl-9 pr-3 py-2 text-xs"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#16223f] border border-[#233560] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-md px-2 py-1.5 text-[10px]"
                >
                  <option value="Todos">Todos los Eventos</option>
                  <option value="Siniestros e Incidentes">Siniestros e Inc.</option>
                  <option value="Auxilios Mecánicos">Auxilios Mec.</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Año</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-[#16223f] border border-[#233560] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-md px-2 py-1.5 text-[10px]"
                >
                  <option value="Todos">Todos</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Mes</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-[#16223f] border border-[#233560] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-md px-2 py-1.5 text-[10px]"
                >
                  <option value="Todos">Mes</option>
                  <option value="01">Enero</option>
                  <option value="02">Febrero</option>
                  <option value="03">Marzo</option>
                  <option value="04">Abril</option>
                  <option value="05">Mayo</option>
                  <option value="06">Junio</option>
                  <option value="07">Julio</option>
                  <option value="08">Agosto</option>
                  <option value="09">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>
              </div>
            </div>
          </div>

          {/* List/Table content */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#1e2a4a]">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Cargando eventos...</div>
            ) : filteredAuxilios.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No se encontraron auxilios cargados para los filtros seleccionados.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0c162b] text-slate-400 uppercase text-[9px] font-extrabold border-b border-[#1e2a4a]">
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-2">Tipo</th>
                    <th className="py-2.5 px-2">Línea/Int.</th>
                    <th className="py-2.5 px-2">Conductor</th>
                    <th className="py-2.5 px-3 text-center">CRM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18233f]">
                  {filteredAuxilios.map((aux) => {
                    const key = getAuxilioKey(aux);
                    const isSelected = selectedAuxilio && getAuxilioKey(selectedAuxilio) === key;
                    const hasCrm = crmMap[key] !== undefined;

                    // Parse fecha
                    const dateFormatted = aux.fecha.split('-').reverse().join('/');
                    const typeLabel = aux.tipo || 'AUX';

                    return (
                      <tr 
                        key={key}
                        onClick={() => handleSelectAuxilio(aux)}
                        className={`text-[11px] cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-950/40 border-l-2 border-emerald-500' : 'hover:bg-[#121c37]'
                        }`}
                      >
                        <td className="py-3 px-3 font-medium text-slate-300">{dateFormatted}</td>
                        <td className="py-3 px-2">
                          <span className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] ${
                            typeLabel === 'SIN' 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                              : typeLabel === 'INC'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {typeLabel}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-mono text-slate-100 font-bold">
                          {aux.unidad}
                        </td>
                        <td className="py-3 px-2 text-slate-300">
                          {aux.conductor}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`${hasCrm ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-400 hover:text-slate-300'} underline font-bold text-[10px] cursor-pointer`}>
                            {hasCrm ? 'Ver' : 'Cargar'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Details & CRM Form */}
        <div className="xl:col-span-7 flex flex-col bg-[#0a0f1d] h-full overflow-y-auto">
          
          {!selectedAuxilio ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#11182c] border border-[#1e2a4a] flex items-center justify-center text-slate-500">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">Seguimiento CRM de Auxilio</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Seleccione un registro del panel izquierdo haciendo clic en "Ver" para visualizar el relevamiento inicial de alta y completar el seguimiento de investigación mecánica.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-900/40">
                <Briefcase className="w-4 h-4" />
                <span>Manejo de tiempos, causas, repuestos y responsables de flota.</span>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              
              <div className="space-y-6">
                
                {/* MAIN TITLE BLOCK */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-emerald-400 tracking-wide uppercase">
                      Información Complementaria
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <span className={`px-2 py-0.5 rounded font-black uppercase text-[10px] ${
                        selectedAuxilio.tipo === 'SIN' 
                          ? 'bg-red-500 text-white' 
                          : selectedAuxilio.tipo === 'INC'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-500 text-slate-950'
                      }`}>
                        {selectedAuxilio.tipo === 'SIN' ? 'SINIESTRO' : selectedAuxilio.tipo === 'INC' ? 'INCIDENTE' : 'AUXILIO MECÁNICO'}
                      </span>
                      <span>Fecha de Reporte: <strong>{selectedAuxilio.fecha.split('-').reverse().join('/')}</strong></span>
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedAuxilio.punto_gps || '-34.62,-68.27'}`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="inline-flex items-center gap-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all self-start md:self-center shadow-md hover:shadow-lg"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Ver en Google Maps</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>

                {/* READ-ONLY INITIAL TICKET RELEVAMIENTO */}
                <div className="bg-[#0e1830] border border-[#1e2e56] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1e2e56] pb-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      Relevamiento Inicial con el Formulario
                    </h3>
                    <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-[#1e2e56]">
                      Solo Lectura
                    </span>
                  </div>

                  {/* Meta fields layout */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Conductor</span>
                      <p className="font-extrabold text-slate-100">{selectedAuxilio.conductor}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Legajo / DNI</span>
                      <p className="font-mono text-slate-200">
                        {selectedAuxilio.conductor ? selectedAuxilio.conductor.split(' - ')[0] : 'N/D'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Unidad / Línea</span>
                      <p className="font-bold text-emerald-400">
                        Int: {selectedAuxilio.unidad} <span className="text-slate-400">|</span> L: {selectedAuxilio.linea || 'N/D'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Ubicación</span>
                      <p className="text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                        {selectedAuxilio.lugar || 'Ubicación no especificada'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Servicio</span>
                      <p className="text-slate-200">{selectedAuxilio.servicio || 'S/D'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Grupo / Turno</span>
                      <p className="text-slate-300 font-mono text-[11px]">{selectedAuxilio.grupo} / {selectedAuxilio.turno}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">GPS Coordenadas</span>
                      <p className="text-slate-300 font-mono text-[11px]">{selectedAuxilio.punto_gps || 'S/D'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Kilómetros</span>
                      <p className="text-slate-200 font-bold">{selectedAuxilio.kilometros || 0} Km</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Gravedad / Tipo</span>
                      <p className="text-red-400 font-bold">{selectedAuxilio.gravedad || 'Reporte de Auxilio de Ruta General'}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 rounded-lg p-3 border border-[#1e2e56]/50">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Resumen del Hecho</span>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      "Se reporta desperfecto técnico para la unidad <strong className="text-emerald-400">{selectedAuxilio.unidad}</strong> conducida por <strong className="text-slate-100">{selectedAuxilio.conductor}</strong>. Evento registrado el día {selectedAuxilio.fecha.split('-').reverse().join('/')} en el punto {selectedAuxilio.lugar}. Requiere relevamiento de asistencia complementaria por CRM."
                    </p>
                  </div>
                </div>

                {/* EDITABLE CRM INVESTIGATION PANEL */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#1e2e56] pb-2">
                    <Wrench className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">
                      Carga y Completado de Datos CRM
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* 1. Unidad de Reemplazo */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        Unidad de Reemplazo
                        <span className="text-emerald-500 font-black">*</span>
                      </label>
                      <select
                        value={unidadReemplazo}
                        onChange={(e) => setUnidadReemplazo(e.target.value)}
                        className="w-full bg-[#16223f] border border-[#233560] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs"
                      >
                        <option value="">-- Sin Unidad de Reemplazo --</option>
                        {flotaList.map((f: any) => (
                          <option key={f.id_unidad || f.unidad} value={f.unidad}>
                            {f.unidad}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Hora Salida */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        Hora Salida Mecánico
                      </label>
                      <input
                        type="time"
                        value={horaSalida}
                        onChange={(e) => setHoraSalida(e.target.value)}
                        className="w-full bg-[#16223f] border border-[#233560] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs font-mono"
                      />
                    </div>

                    {/* 3. Personal (Mecanicos) */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        Personal (Mecánicos a Cargo)
                      </label>
                      <select
                        value={personalMecanico}
                        onChange={(e) => setPersonalMecanico(e.target.value)}
                        className="w-full bg-[#16223f] border border-[#233560] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs"
                      >
                        <option value="">-- Seleccionar Mecánico --</option>
                        {mecanicosList.map((m: any) => (
                          <option key={m.id_mecanico} value={m.apellido_nombre}>
                            {m.apellido_nombre}
                          </option>
                        ))}
                        <option value="Mecánico Externo / Tercerizado">Mecánico Externo / Tercerizado</option>
                        <option value="Taller Central San Rafael">Taller Central San Rafael</option>
                        <option value="Taller Base Mendoza">Taller Base Mendoza</option>
                      </select>
                    </div>

                    {/* 4. Hora Llegada */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        Hora Llegada Auxilio
                      </label>
                      <input
                        type="time"
                        value={horaLlegada}
                        onChange={(e) => setHoraLlegada(e.target.value)}
                        className="w-full bg-[#16223f] border border-[#233560] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs font-mono"
                      />
                    </div>

                    {/* 5. Tiempo (Calc) */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        Tiempo de Resolución (Hora llegada - Hora Salida)
                      </label>
                      <div className="w-full bg-[#0c1325] border border-[#1e2e56] text-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold flex items-center justify-between">
                        <span>{tiempoAuxilio} Hs/Min</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-semibold">
                          Cálculo Automático
                        </span>
                      </div>
                    </div>

                    {/* 6. Incidencia en el Servicio */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        Incidencia en el Servicio (¿Afectó el servicio?)
                      </label>
                      <div className="flex gap-4 pt-1">
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="incidencia"
                            checked={incidenciaServicio === 'SI'}
                            onChange={() => setIncidenciaServicio('SI')}
                            className="accent-emerald-500"
                          />
                          <span>SÍ</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="incidencia"
                            checked={incidenciaServicio === 'NO'}
                            onChange={() => setIncidenciaServicio('NO')}
                            className="accent-emerald-500"
                          />
                          <span>NO</span>
                        </label>
                      </div>
                    </div>

                    {/* 7. Demora del Servicio */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        Demora del Servicio (Hs:Min)
                      </label>
                      <input
                        type="text"
                        value={demoraServicio}
                        onChange={(e) => setDemoraServicio(e.target.value)}
                        placeholder="00:00"
                        className="w-full bg-[#16223f] border border-[#233560] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs font-mono"
                      />
                    </div>

                    {/* 8. Observado Wara */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        Observado Wara (¿Registrado en Wara?)
                      </label>
                      <div className="flex gap-4 pt-1">
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="wara"
                            checked={observadoWara === 'SI'}
                            onChange={() => setObservadoWara('SI')}
                            className="accent-emerald-500"
                          />
                          <span>SÍ</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="wara"
                            checked={observadoWara === 'NO'}
                            onChange={() => setObservadoWara('NO')}
                            className="accent-emerald-500"
                          />
                          <span>NO</span>
                        </label>
                      </div>
                    </div>

                    {/* 9. OTA */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        OTA (Orden de Trabajo Asociada)
                      </label>
                      <input
                        type="text"
                        value={ota}
                        onChange={(e) => setOta(e.target.value)}
                        placeholder="Ej: OTA-2026-9938"
                        className="w-full bg-[#16223f] border border-[#233560] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs font-mono"
                      />
                    </div>

                    {/* 10. Clasificación Causa */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        Clasificación Causa
                      </label>
                      <select
                        value={clasificacionCausa}
                        onChange={(e) => setClasificacionCausa(e.target.value)}
                        className="w-full bg-[#16223f] border border-[#233560] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs"
                      >
                        <option value="">-- Seleccione Clasificación --</option>
                        {CLASIFICACIONES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* 11. Sistema */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        Sistema Afectado
                      </label>
                      <select
                        value={sistema}
                        onChange={(e) => {
                          setSistema(e.target.value);
                          setSubsistema(''); // Clear subsistema
                        }}
                        className="w-full bg-[#16223f] border border-[#233560] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs"
                      >
                        <option value="">-- Seleccione Sistema --</option>
                        {SISTEMAS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* 12. Subsistema */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        Subsistema Afectado
                      </label>
                      <select
                        value={subsistema}
                        onChange={(e) => setSubsistema(e.target.value)}
                        disabled={!sistema || !SUBSISTEMAS[sistema]}
                        className="w-full bg-[#16223f] border border-[#233560] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Seleccione Subsistema --</option>
                        {sistema && SUBSISTEMAS[sistema]?.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 13. Detalle de la Causa */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">
                      Detalle Técnico de la Causa Constatada
                    </label>
                    <input
                      type="text"
                      value={detalleCausa}
                      onChange={(e) => setDetalleCausa(e.target.value)}
                      placeholder="Ej: Manguera rota a la salida de compresor de aire por roce mecánico continuo contra el chasis."
                      className="w-full bg-[#16223f] border border-[#233560] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  {/* 14. Análisis de la Causa (Rich text area) */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">
                      Análisis Completo de la Causa e Investigación (Explayar Detalles)
                    </label>
                    <textarea
                      value={analisisCausa}
                      onChange={(e) => setAnalisisCausa(e.target.value)}
                      rows={4}
                      placeholder="Escriba aquí la descripción extendida del análisis del evento, repuestos colocados, comentarios sobre el desempeño y soluciones definitivas propuestas para mitigar fallas recurrentes..."
                      className="w-full bg-[#16223f] border border-[#233560] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg p-3 text-xs leading-relaxed"
                    />
                  </div>

                  {/* ACTIONS ROW */}
                  <div className="flex items-center justify-end pt-2 border-t border-[#1e2e56]">
                    <button
                      onClick={handleSaveCRM}
                      className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-black uppercase text-xs px-5 py-3 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4 text-slate-950" />
                      <span>Guardar Seguimiento CRM</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

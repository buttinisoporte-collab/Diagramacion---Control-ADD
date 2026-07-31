import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { 
  MapPin, 
  Plus, 
  Calendar, 
  Truck, 
  User, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Compass,
  ChevronRight,
  ListFilter
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Default Icon issue in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Company Base Coordinates
const BASE_LAT = -34.626617;
const BASE_LNG = -68.276614;

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
}

// Great-Circle distance formula (Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return parseFloat(d.toFixed(2));
}

export default function Auxilios() {
  const { user } = useAuth();
  const isConductor = user?.rol === 'Conductor';

  // State lists
  const [auxilios, setAuxilios] = useState<Auxilio[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Master lists
  const [turnosList, setTurnosList] = useState<any[]>([]);
  const [flotaList, setFlotaList] = useState<any[]>([]);
  const [conductoresList, setConductoresList] = useState<any[]>([]);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [unidad, setUnidad] = useState('');
  const [servicio, setServicio] = useState('');
  const [grupo, setGrupo] = useState('');
  const [turno, setTurno] = useState('');
  const [linea, setLinea] = useState('');
  const [conductor, setConductor] = useState('');
  const [lugar, setLugar] = useState('');
  const [puntoGps, setPuntoGps] = useState('');
  const [kilometros, setKilometros] = useState('');

  // Filtering State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));

  // Notification State
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Map elements
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // 1. Initial Data Loading
  useEffect(() => {
    loadMasterData();
    loadAuxilios();
  }, []);

  // Reload auxilios when year/month filters change
  useEffect(() => {
    loadAuxilios();
  }, [selectedYear, selectedMonth]);

  // Sync leaflet markers with auxilios list
  useEffect(() => {
    if (isConductor) return; // Conductors don't see the map
    initMap();
    updateMapMarkers();
  }, [auxilios]);

  // Master Data Loader
  const loadMasterData = async () => {
    try {
      // 1. Turnos
      let loadedTurnos = [];
      if (supabase) {
        const { data } = await supabase.from('turnos').select('*');
        if (data && data.length > 0) loadedTurnos = data;
      }
      if (loadedTurnos.length === 0) {
        const local = localStorage.getItem('ext_store_turnos');
        if (local) loadedTurnos = JSON.parse(local);
      }
      setTurnosList(loadedTurnos);

      // 2. Flota
      let loadedFlota = [];
      if (supabase) {
        const { data } = await supabase.from('flota_activa').select('*');
        if (data && data.length > 0) loadedFlota = data;
      }
      if (loadedFlota.length === 0) {
        const local = localStorage.getItem('ext_store_flota_activa');
        if (local) loadedFlota = JSON.parse(local);
      }
      setFlotaList(loadedFlota);

      // 3. Conductores
      let loadedCond = [];
      if (supabase) {
        const { data } = await supabase.from('nomina_conductores').select('*');
        if (data && data.length > 0) loadedCond = data;
      }
      if (loadedCond.length === 0) {
        const local = localStorage.getItem('ext_store_nomina_conductores');
        if (local) loadedCond = JSON.parse(local);
      }
      setConductoresList(loadedCond);

    } catch (e) {
      console.error('Error loading master data for Auxilios:', e);
    }
  };

  // Auxilios Loader
  const loadAuxilios = async () => {
    setLoading(true);
    try {
      let data: Auxilio[] = [];
      if (supabase) {
        // Query from Supabase
        const { data: res, error } = await supabase
          .from('auxilios')
          .select('*')
          .order('fecha', { ascending: false });
        if (!error && res) {
          data = res;
        }
      }

      // If no supabase data, load from localStorage
      if (data.length === 0) {
        const local = localStorage.getItem('app_auxilios');
        if (local) {
          data = JSON.parse(local);
        }
      } else {
        // Keep localStorage in sync
        localStorage.setItem('app_auxilios', JSON.stringify(data));
      }

      setAuxilios(data);
    } catch (e) {
      console.error('Error loading auxilios:', e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Autocomplete Engine
  // For CONDUCTOR: Autocomplete based on chosen fecha and their own name
  useEffect(() => {
    if (isConductor && user) {
      setConductor(user.nombre_apellido);
      autocompleteConductorDiagramation(fecha, user.nombre_apellido);
    }
  }, [fecha, isConductor, user]);

  const autocompleteConductorDiagramation = async (dateStr: string, condName: string) => {
    try {
      let matchedDiag: any = null;

      // 1. Try Supabase
      if (supabase) {
        const { data } = await supabase
          .from('diagramaciones')
          .select('*')
          .eq('fecha', dateStr)
          .or(`conductor_principal.ilike.%${condName}%,conductor_secundario.ilike.%${condName}%`)
          .maybeSingle();
        if (data) matchedDiag = data;
      }

      // 2. Try LocalStorage Fallback
      if (!matchedDiag) {
        const localKey = `diagramacion_${dateStr}`;
        const local = localStorage.getItem(localKey);
        if (local) {
          const assignments = JSON.parse(local);
          const found = Object.values(assignments).find((a: any) => 
            a.conductor_principal?.toLowerCase().includes(condName.toLowerCase()) ||
            a.conductor_secundario?.toLowerCase().includes(condName.toLowerCase())
          );
          if (found) matchedDiag = found;
        }
      }

      if (matchedDiag) {
        setUnidad(matchedDiag.unidad || '');
        setTurno(matchedDiag.cod_turno || '');

        // Now resolve Servicio (salida), Grupo, Línea (frecuencia) from turnos master
        const code = matchedDiag.cod_turno;
        const matchingTurno = turnosList.find(t => t.cod_turno === code);
        if (matchingTurno) {
          setServicio(matchingTurno.salida || '');
          setGrupo(matchingTurno.grupo || '');
          setLinea(matchingTurno.frecuencia || 'Línea de Servicio');
        } else {
          setServicio('');
          setGrupo('');
          setLinea('');
        }
      } else {
        // Reset autocompleted fields if no diagramation exists for that date
        setUnidad('');
        setTurno('');
        setServicio('');
        setGrupo('');
        setLinea('');
      }
    } catch (e) {
      console.error('Error autocompleting conductor diagramation:', e);
    }
  };

  // For ADMIN: Selecting Unidad on selected Fecha autocompletes diagramation
  const handleAdminUnidadChange = async (unitVal: string) => {
    setUnidad(unitVal);
    if (!unitVal) return;

    try {
      let matchedDiag: any = null;

      // 1. Try Supabase
      if (supabase) {
        const { data } = await supabase
          .from('diagramaciones')
          .select('*')
          .eq('fecha', fecha)
          .eq('unidad', unitVal)
          .maybeSingle();
        if (data) matchedDiag = data;
      }

      // 2. Try LocalStorage Fallback
      if (!matchedDiag) {
        const localKey = `diagramacion_${fecha}`;
        const local = localStorage.getItem(localKey);
        if (local) {
          const assignments = JSON.parse(local);
          const found = Object.values(assignments).find((a: any) => a.unidad === unitVal);
          if (found) matchedDiag = found;
        }
      }

      if (matchedDiag) {
        setConductor(matchedDiag.conductor_principal || '');
        setTurno(matchedDiag.cod_turno || '');

        const matchingTurno = turnosList.find(t => t.cod_turno === matchedDiag.cod_turno);
        if (matchingTurno) {
          setServicio(matchingTurno.salida || '');
          setGrupo(matchingTurno.grupo || '');
          setLinea(matchingTurno.frecuencia || 'Línea de Servicio');
        } else {
          setServicio('');
          setGrupo('');
          setLinea('');
        }
      } else {
        setConductor('');
        setTurno('');
        setServicio('');
        setGrupo('');
        setLinea('');
      }
    } catch (e) {
      console.error('Error autocompleting admin diagramation:', e);
    }
  };

  // GPS Change handler (manually typed coordinates)
  const handleGpsInputChange = (val: string) => {
    setPuntoGps(val);
    const coords = parseGPS(val);
    if (coords) {
      const dist = calculateDistance(BASE_LAT, BASE_LNG, coords.lat, coords.lng);
      setKilometros(dist.toString());
    } else {
      setKilometros('');
    }
  };

  const parseGPS = (gpsStr: string) => {
    if (!gpsStr) return null;
    const parts = gpsStr.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
    return null;
  };

  // Geolocation API (for conductor mobile or general GPS click)
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con este navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const gpsStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setPuntoGps(gpsStr);

        const dist = calculateDistance(BASE_LAT, BASE_LNG, lat, lng);
        setKilometros(dist.toString());
      },
      (err) => {
        alert('No se pudo obtener su ubicación GPS real. Detalle: ' + err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  // Save Auxilio Handler
  const handleSaveAuxilio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !unidad || !lugar || !puntoGps) {
      showStatus('error', 'Por favor complete todos los campos obligatorios (*).');
      return;
    }

    const kmsNum = parseFloat(kilometros) || 0;

    const payload: Auxilio = {
      fecha,
      unidad,
      servicio: servicio || '-',
      grupo: grupo || '-',
      turno: turno || '-',
      linea: linea || '-',
      conductor: conductor || '-',
      lugar,
      punto_gps: puntoGps,
      kilometros: kmsNum
    };

    setSaving(true);
    try {
      let success = false;
      if (supabase) {
        const { data, error } = await supabase.from('auxilios').insert([payload]).select();
        if (!error && data) {
          success = true;
        } else {
          console.warn('Supabase insert failed, fallback to local storage:', error?.message);
        }
      }

      // Always save to LocalStorage to ensure persistence in preview
      const local = localStorage.getItem('app_auxilios');
      const list = local ? JSON.parse(local) : [];
      list.unshift({ ...payload, id: `local_${Date.now()}` });
      localStorage.setItem('app_auxilios', JSON.stringify(list));
      
      if (!success) {
        // If supabase failed but local storage saved, update local list in state
        setAuxilios(list);
      } else {
        await loadAuxilios();
      }

      showStatus('success', 'Registro de Auxilio guardado exitosamente.');
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      showStatus('error', 'Ocurrió un error al guardar el auxilio.');
    } finally {
      setSaving(false);
    }
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const resetForm = () => {
    setFecha(new Date().toISOString().split('T')[0]);
    setUnidad('');
    setServicio('');
    setGrupo('');
    setTurno('');
    setLinea('');
    setConductor(isConductor && user ? user.nombre_apellido : '');
    setLugar('');
    setPuntoGps('');
    setKilometros('');
  };

  // 3. Leaflet Map Engine
  const initMap = () => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; // Map already exists

    // Mount Map centering around the Base location
    const map = L.map(mapContainerRef.current).setView([BASE_LAT, BASE_LNG], 13);
    
    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Place a unique visual marker on the base
    const baseIcon = L.divIcon({
      html: `<div class="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-md">B</div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker([BASE_LAT, BASE_LNG], { icon: baseIcon })
      .addTo(map)
      .bindPopup('<b>Base Central de Colectivos</b><br/>Ubicación de referencia: -34.626617, -68.276614');

    // Add map click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const confirmAdd = window.confirm(`¿Desea agregar este punto como auxilio?\nCoordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      if (confirmAdd) {
        // Reset form for clean insert
        resetForm();
        setPuntoGps(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        
        const dist = calculateDistance(BASE_LAT, BASE_LNG, lat, lng);
        setKilometros(dist.toString());

        // Open input popup window
        setIsModalOpen(true);
      }
    });

    mapRef.current = map;
  };

  // Keep markers up-to-date based on filtered list
  const updateMapMarkers = () => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous markers
    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};

    // Filter current auxilios to match selected year & month
    const filtered = getFilteredAuxilios();

    filtered.forEach(item => {
      const coords = parseGPS(item.punto_gps);
      if (!coords) return;

      const marker = L.marker([coords.lat, coords.lng])
        .addTo(map)
        .bindPopup(`
          <div class="text-xs p-1">
            <h4 class="font-black text-slate-800 mb-1 border-b pb-1">Auxilio: Unidad ${item.unidad}</h4>
            <p><b>Fecha:</b> ${formatLocalDate(item.fecha)}</p>
            <p><b>Conductor:</b> ${item.conductor}</p>
            <p><b>Lugar:</b> ${item.lugar}</p>
            <p><b>Distancia Base:</b> ${item.kilometros} KM</p>
          </div>
        `);
      
      if (item.id) {
        markersRef.current[item.id] = marker;
      }
    });
  };

  // Zoom into marker when clicking a record in the list
  const handleZoomToRecord = (item: Auxilio) => {
    const coords = parseGPS(item.punto_gps);
    const map = mapRef.current;
    if (!coords || !map) return;

    map.setView([coords.lat, coords.lng], 16);
    
    // Open marker popup if it exists
    if (item.id && markersRef.current[item.id]) {
      markersRef.current[item.id].openPopup();
    }
  };

  // Filtering list locally by year/month
  const getFilteredAuxilios = () => {
    return auxilios.filter(a => {
      if (!a.fecha) return false;
      const parts = a.fecha.split('-');
      if (parts.length < 2) return false;
      return parts[0] === selectedYear && parts[1] === selectedMonth;
    });
  };

  const formatLocalDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Render Conductor Form View (Optimized for Mobile, No Map)
  if (isConductor) {
    return (
      <div className="flex-1 bg-slate-50 min-h-screen">
        <Header 
          title="Registro de Auxilios" 
          subtitle="Carga rápida de auxilios mecánicos en viaje" 
        />
        
        <div className="max-w-md mx-auto p-4 md:py-8">
          <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-5 md:p-6">
            <div className="flex items-center space-x-3 mb-6 border-b pb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Cargar Auxilio</h2>
                <p className="text-xs text-slate-500">Los datos se autocompletarán con su diagramación de hoy</p>
              </div>
            </div>

            {statusMsg && (
              <div className={`p-4 rounded-lg mb-6 flex items-start space-x-2 text-sm ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveAuxilio} className="space-y-4">
              {/* Fecha */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Fecha de Hoy *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="date"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>
              </div>

              {/* Conductor Detectado (Locked) */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Conductor</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    disabled
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                    value={conductor}
                  />
                </div>
              </div>

              {/* Autocompleted Fields container */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-3 space-y-3">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Datos Diagramados (Autocompletados)</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400">Unidad</label>
                    <p className="text-sm font-semibold text-slate-700">{unidad || 'No asignada'}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400">Turno</label>
                    <p className="text-sm font-semibold text-slate-700">{turno || 'No asignado'}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400">Grupo</label>
                    <p className="text-sm font-semibold text-slate-700">{grupo || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400">Línea</label>
                    <p className="text-sm font-semibold text-slate-700 truncate">{linea || '-'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400">Servicio</label>
                  <p className="text-xs font-semibold text-slate-700 truncate">{servicio || '-'}</p>
                </div>
              </div>

              {/* Lugar (Editable) */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Lugar Exacto / Referencia *</label>
                <textarea 
                  required
                  placeholder="Ej. Ruta 143 Km 220, frente a estación de servicio"
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                />
              </div>

              {/* Punto GPS */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Punto GPS *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      required
                      placeholder="Latitud, Longitud"
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={puntoGps}
                      onChange={(e) => handleGpsInputChange(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    className="px-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center justify-center transition-colors"
                    title="Obtener coordenadas actuales"
                  >
                    <Compass className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Kilometros */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Distancia a Base (KM)</label>
                <input 
                  type="text"
                  readOnly
                  placeholder="Se calcula automáticamente"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 font-mono font-semibold cursor-not-allowed"
                  value={kilometros ? `${kilometros} KM` : ''}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
              >
                {saving ? (
                  <>Cargando...</>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    <span>Registrar Auxilio</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Render Admin Dashboard (Full view with Map and Historical list next to it)
  return (
    <div className="flex-1 bg-slate-50 min-h-screen flex flex-col">
      <Header 
        title="Registro Histórico de Auxilios" 
        subtitle="Mapeo geográfico de contingencias y auxilio mecánico" 
      />

      {statusMsg && (
        <div className="mx-8 mt-4">
          <div className={`p-4 rounded-lg flex items-start space-x-2 text-sm ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
            {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 p-4 lg:p-8 grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Historical List */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col min-h-[500px]">
          
          {/* List Header */}
          <div className="p-4 border-b border-slate-100 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Historial de Registros
              </h3>
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 shadow-sm transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo Manual
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Año</label>
                <div className="relative">
                  <Filter className="absolute left-2.5 top-2 w-3 h-3 text-slate-400" />
                  <select
                    className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {['2026', '2025', '2024'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mes</label>
                <div className="relative">
                  <ListFilter className="absolute left-2.5 top-2 w-3 h-3 text-slate-400" />
                  <select
                    className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {[
                      { v: '01', l: 'Enero' },
                      { v: '02', l: 'Febrero' },
                      { v: '03', l: 'Marzo' },
                      { v: '04', l: 'Abril' },
                      { v: '05', l: 'Mayo' },
                      { v: '06', l: 'Junio' },
                      { v: '07', l: 'Julio' },
                      { v: '08', l: 'Agosto' },
                      { v: '09', l: 'Septiembre' },
                      { v: '10', l: 'Octubre' },
                      { v: '11', l: 'Noviembre' },
                      { v: '12', l: 'Diciembre' }
                    ].map(m => (
                      <option key={m.v} value={m.v}>{m.l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto max-h-[550px] p-2 divide-y divide-slate-50">
            {getFilteredAuxilios().length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No se encontraron auxilios</p>
                <p className="text-[10px] text-slate-400">para {selectedMonth}/{selectedYear}</p>
              </div>
            ) : (
              getFilteredAuxilios().map(item => (
                <div 
                  key={item.id} 
                  onClick={() => handleZoomToRecord(item)}
                  className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group flex items-start justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                        Unidad {item.unidad}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">
                        {formatLocalDate(item.fecha)}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 mt-2 truncate">
                      {item.lugar}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 truncate">
                      <b>Cond:</b> {item.conductor} | <b>Turno:</b> {item.turno}
                    </p>
                    <p className="text-[10px] text-blue-600 font-semibold mt-1">
                      Distancia a base: {item.kilometros} KM
                    </p>
                  </div>
                  
                  <div className="self-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Leaflet Map */}
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
          {/* Map Header Instructions banner */}
          <div className="absolute top-3 left-14 z-[999] bg-white/95 backdrop-blur border border-slate-200 shadow-lg px-4 py-2 rounded-lg pointer-events-none max-w-sm hidden md:block">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              ¿Cómo cargar un Auxilio?
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Haga clic sobre el mapa en el lugar de la contingencia para abrir el formulario autocompletado de carga.
            </p>
          </div>

          <div 
            ref={mapContainerRef} 
            className="w-full flex-1 min-h-[600px] z-10"
          />
        </div>
      </div>

      {/* ADMIN Popup Form Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1050] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-800 text-base">Registrar Auxilio Mecánico</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                Cerrar
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveAuxilio} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Fecha */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Fecha *</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>

                {/* Unidad select */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Unidad *</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={unidad}
                    onChange={(e) => handleAdminUnidadChange(e.target.value)}
                  >
                    <option value="">-- Seleccionar --</option>
                    {flotaList.map(f => (
                      <option key={f.id_unidad || f.unidad} value={f.unidad}>{f.unidad}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Autocomplete Info section */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3 space-y-2">
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Detalles Autocompletados de la Diagramación</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">Conductor</span>
                    <span className="text-slate-700 font-bold">{conductor || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Turno</span>
                    <span className="text-slate-700 font-bold">{turno || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Servicio</span>
                    <span className="text-slate-700 font-bold truncate block" title={servicio}>{servicio || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Grupo / Línea</span>
                    <span className="text-slate-700 font-bold truncate block">{grupo ? `${grupo} / ` : ''}{linea || '-'}</span>
                  </div>
                </div>
                <p className="text-[9px] text-blue-500 italic">Los datos se completan automáticamente según la fecha y unidad seleccionada.</p>
              </div>

              {/* Manual inputs if diagramation doesn't match or for overrides */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Sobrescribir / Completar Campos Editables</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Servicio</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none"
                      value={servicio}
                      onChange={(e) => setServicio(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Turno</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none"
                      value={turno}
                      onChange={(e) => setTurno(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Grupo</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none"
                      value={grupo}
                      onChange={(e) => setGrupo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Línea</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none"
                      value={linea}
                      onChange={(e) => setLinea(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Conductor</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none"
                    value={conductor}
                    onChange={(e) => setConductor(e.target.value)}
                  />
                </div>
              </div>

              {/* Lugar (Write-in) */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Lugar Exacto / Observación *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej. Entrada a Malargüe Km 10"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Punto GPS */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Punto GPS *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Lat, Lng"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={puntoGps}
                    onChange={(e) => handleGpsInputChange(e.target.value)}
                  />
                </div>

                {/* Kilometros */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Distancia Base (KM)</label>
                  <input 
                    type="text"
                    readOnly
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-600 cursor-not-allowed"
                    value={kilometros ? `${kilometros} KM` : ''}
                  />
                </div>
              </div>

              {/* Save buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 shadow-md transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Auxilio'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

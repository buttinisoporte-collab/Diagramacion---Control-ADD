import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, Clock, Bus, CheckCircle, Search, Info } from 'lucide-react';
import { normalizeName } from '../lib/utils';

interface TurnoInfo {
  id: string;
  fecha: string;
  tipo: 'Diagramacion' | 'Turistico';
  cod_turno: string;
  destino: string;
  unidad: string;
  conductor_principal: string;
  conductor_secundario?: string;
  hora_salida: string;
  hora_presentacion: string;
  isConfirmed: boolean;
  confirmacionLog?: string;
  observaciones: string;
}

export default function ComunicadorTurnos() {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState<TurnoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const fechas = Array.from({ length: 4 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const [activeDateTab, setActiveDateTab] = useState(fechas[0]);

  const loadTurnos = async () => {
    if (!supabase) return;
    setLoading(true);
    
    try {
      const [diagRes, stRes, turnosRes] = await Promise.all([
        supabase.from('diagramaciones').select('*').in('fecha', fechas),
        supabase.from('servicios_turisticos').select('*').in('fecha', fechas),
        supabase.from('turnos').select('cod_turno, turno, hora_presentacion, hora_salida_base')
      ]);

      const diagData = diagRes.data || [];
      const stData = stRes.data || [];
      const turnosRef = turnosRes.data || [];

      const turnosMap = new Map(turnosRef.map(t => [t.cod_turno, t]));

      let allTurnos: TurnoInfo[] = [];

      diagData.forEach(d => {
        allTurnos.push({
          id: `D_${d.id}`,
          fecha: d.fecha,
          tipo: 'Diagramacion',
          cod_turno: d.cod_turno,
          destino: turnosMap.get(d.cod_turno)?.turno || d.cod_turno,
          unidad: d.unidad || 'A Designar',
          conductor_principal: d.conductor_principal || 'A Designar',
          conductor_secundario: d.conductor_secundario,
          hora_salida: turnosMap.get(d.cod_turno)?.hora_salida_base || d.hora_inicio || '-', 
          hora_presentacion: turnosMap.get(d.cod_turno)?.hora_presentacion || d.hora_inicio || '-',
          isConfirmed: !!d.hora_presentacion_real || (d.observaciones || '').includes('[CONFIRMADO:'),
          confirmacionLog: (d.observaciones || '').match(/\[CONFIRMADO:(.*?)\]/)?.[1] || undefined,
          observaciones: d.observaciones || ''
        });
      });

      stData.forEach(s => {
        allTurnos.push({
          id: `S_${s.id}`,
          fecha: s.fecha,
          tipo: 'Turistico',
          cod_turno: 'TURISMO',
          destino: s.destino || '-',
          unidad: s.unidad || 'A Designar',
          conductor_principal: s.conductor || 'A Designar',
          hora_salida: s.hora_salida || '-',
          hora_presentacion: s.hora_salida || '-', 
          isConfirmed: !!s.hora_presentacion_real || (s.observaciones || '').includes('[CONFIRMADO:'),
          confirmacionLog: (s.observaciones || '').match(/\[CONFIRMADO:(.*?)\]/)?.[1] || undefined,
          observaciones: s.observaciones || ''
        });
      });

      if (user?.rol === 'Conductor') {
        const userNormalized = normalizeName(user.nombre_apellido || '');
        allTurnos = allTurnos.filter(t => {
          const pNorm = normalizeName(t.conductor_principal);
          const sNorm = t.conductor_secundario ? normalizeName(t.conductor_secundario) : '';
          return pNorm === userNormalized || sNorm === userNormalized;
        });
      }

      allTurnos.sort((a, b) => a.hora_presentacion.localeCompare(b.hora_presentacion));

      setTurnos(allTurnos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTurnos();
  }, [user]);

  const handleConfirmar = async (turno: TurnoInfo) => {
    if (!window.confirm('Con esta confirmación se da por notificado del turno informado. ¿Desea continuar?')) {
      return;
    }
    if (!supabase) return;

    const currentObs = turno.observaciones.replace(/\[CONFIRMADO:.*?\]/g, '').trim();
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-AR') + ' ' + now.toLocaleTimeString('es-AR').substring(0, 5);
    const logStr = `[CONFIRMADO: ${user?.nombre_apellido || 'Desconocido'} - ${dateStr}]`;
    
    const newObs = (currentObs + ' ' + logStr).trim();

    try {
      if (turno.tipo === 'Diagramacion') {
        const dId = turno.id.replace('D_', '');
        await supabase.from('diagramaciones').update({ observaciones: newObs }).eq('id', dId);
      } else {
        const sId = turno.id.replace('S_', '');
        await supabase.from('servicios_turisticos').update({ observaciones: newObs }).eq('id', sId);
      }

      setTurnos(prev => prev.map(t => t.id === turno.id ? { 
        ...t, 
        isConfirmed: true, 
        confirmacionLog: `${user?.nombre_apellido || 'Desconocido'} - ${dateStr}`,
        observaciones: newObs
      } : t));

      alert('Confirmación registrada con éxito.');
    } catch (e) {
      console.error(e);
      alert('Error al confirmar.');
    }
  };

  const getWeekDayName = (dateStr: string) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const d = new Date(dateStr + 'T12:00:00');
    return days[d.getDay()];
  };

  const formatDateLabel = (dateStr: string, idx: number) => {
    if (idx === 0) return 'Hoy';
    if (idx === 1) return 'Mañana';
    return getWeekDayName(dateStr);
  };

  const filteredTurnos = turnos.filter(t => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      t.destino.toLowerCase().includes(search) ||
      t.conductor_principal.toLowerCase().includes(search) ||
      (t.conductor_secundario && t.conductor_secundario.toLowerCase().includes(search)) ||
      t.unidad.toLowerCase().includes(search) ||
      t.cod_turno.toLowerCase().includes(search)
    );
  });

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Header title="Comunicador de Turnos" />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Tablero de Comunicación</h2>
              <p className="text-sm text-slate-500">Visualice los turnos diagramados desde hoy a tres días.</p>
            </div>
            
            {user?.rol !== 'Conductor' && (
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar conductor, unidad o destino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <span className="text-slate-500 animate-pulse font-medium">Cargando turnos...</span>
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4 xl:space-y-0">
              {/* Mobile Date Selector */}
              <div className="xl:hidden flex overflow-x-auto space-x-2 pb-2 scrollbar-hide">
                {fechas.map((f, i) => (
                  <button
                    key={f}
                    onClick={() => setActiveDateTab(f)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-colors ${
                      activeDateTab === f
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {formatDateLabel(f, i)} ({f.split('-')[2]}/{f.split('-')[1]})
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6 h-full items-start">
                {fechas.map((fecha, idx) => {
                  const isVisibleOnMobile = activeDateTab === fecha;
                  const dayTurnos = filteredTurnos.filter(t => t.fecha === fecha);
                  const [y, m, d] = fecha.split('-');
                  
                  return (
                    <div key={fecha} className={`flex-col h-auto max-h-[80vh] xl:max-h-[85vh] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${isVisibleOnMobile ? 'flex' : 'hidden xl:flex'}`}>
                      {/* Col Header - Sticky */}
                      <div className={`sticky top-0 z-10 px-4 py-3 border-b border-slate-200 flex items-center justify-between ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        <div>
                          <h3 className="font-bold text-lg uppercase tracking-wide">{formatDateLabel(fecha, idx)}</h3>
                          <p className={`text-xs ${idx === 0 ? 'text-blue-200' : 'text-slate-500'} font-medium`}>{d}/{m}/{y}</p>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${idx === 0 ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                          {dayTurnos.length}
                        </div>
                      </div>

                      {/* Col Body */}
                      <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50/50">
                        {dayTurnos.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Info className="w-8 h-8 text-slate-300 mb-2" />
                            <span className="text-sm text-slate-400 font-medium">Sin turnos asignados</span>
                          </div>
                        ) : (
                          dayTurnos.map(turno => (
                            <div key={turno.id} className={`bg-white border ${turno.isConfirmed ? 'border-emerald-200 ring-1 ring-emerald-500/20' : 'border-slate-200'} rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden`}>
                              <div className={`flex items-center justify-between px-3 py-2 border-b ${turno.isConfirmed ? 'border-emerald-100 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded uppercase flex items-center gap-1.5">
                                    {turno.tipo === 'Turistico' ? 'Turismo' : turno.cod_turno}
                                    
                                  </span>
                                </div>
                                {turno.isConfirmed && (
                                  <div className="flex items-center gap-1 text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full" title={turno.confirmacionLog}>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase">Confirmado</span>
                                  </div>
                                )}
                              </div>
                              
                                                            <div className="p-3 space-y-3">
                                <div>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Destino / Servicio</p>
                                  <p className="text-sm font-bold text-slate-800 leading-tight">{turno.destino}</p>
                                </div>
                                
                                <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100 flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide">Presentación</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <Clock className="w-4 h-4 text-blue-600" />
                                      <p className="text-base font-black text-blue-800">{turno.hora_presentacion?.substring(0, 5) || '-'} hs</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Salida Base</p>
                                    <p className="text-sm font-bold text-slate-700">{turno.hora_salida?.substring(0, 5) || '-'} hs</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-1">

                                  <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Conductor</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <User className="w-3.5 h-3.5 text-slate-400" />
                                      <p className="text-sm font-medium text-slate-700">{turno.conductor_principal}</p>
                                    </div>
                                    {turno.conductor_secundario && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                        <p className="text-xs font-medium text-slate-500">{turno.conductor_secundario} <span className="text-[10px] bg-slate-100 px-1 rounded">2do</span></p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Unidad</p>
                                    <div className="flex items-center justify-end gap-1 mt-0.5">
                                      <Bus className="w-3.5 h-3.5 text-slate-400" />
                                      <p className="text-sm font-bold text-indigo-700">{turno.unidad}</p>
                                    </div>
                                  </div>
                                </div>

                                {!turno.isConfirmed && (
                                  <div className="pt-2 border-t border-slate-100">
                                    <button
                                      onClick={() => handleConfirmar(turno)}
                                      className="w-full py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Confirmar Notificación
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

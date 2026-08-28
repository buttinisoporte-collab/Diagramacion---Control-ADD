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
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'unconfirmed'>('all');
  
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
        supabase.from('turnos').select('cod_turno, turno, hora_presentacion, hora_salida_base, hora_inicio')
      ]);

      const diagData = diagRes.data || [];
      const stData = stRes.data || [];
      const turnosRef: any[] = turnosRes.data || [];

      const turnosMap = new Map<string, any>(turnosRef.map((t: any) => [(t.cod_turno || '').trim().toLowerCase(), t]));

      let allTurnos: TurnoInfo[] = [];

      diagData.forEach(d => {
        allTurnos.push({
          id: `D_${d.id}`,
          fecha: d.fecha,
          tipo: 'Diagramacion',
          cod_turno: d.cod_turno,
          destino: turnosMap.get((d.cod_turno || '').trim().toLowerCase())?.turno || d.cod_turno,
          unidad: d.unidad || 'A Designar',
          conductor_principal: d.conductor_principal || 'A Designar',
          conductor_secundario: d.conductor_secundario,
          hora_salida: turnosMap.get((d.cod_turno || '').trim().toLowerCase())?.hora_salida_base || turnosMap.get((d.cod_turno || '').trim().toLowerCase())?.hora_inicio || '-', 
          hora_presentacion: turnosMap.get((d.cod_turno || '').trim().toLowerCase())?.hora_presentacion || turnosMap.get((d.cod_turno || '').trim().toLowerCase())?.hora_inicio || '-',
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
    let matchesSearch = true;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      matchesSearch = (
        t.destino.toLowerCase().includes(search) ||
        t.conductor_principal.toLowerCase().includes(search) ||
        (t.conductor_secundario && t.conductor_secundario.toLowerCase().includes(search)) ||
        t.unidad.toLowerCase().includes(search) ||
        t.cod_turno.toLowerCase().includes(search)
      );
    }
    
    let matchesStatus = true;
    if (filterStatus === 'confirmed') matchesStatus = t.isConfirmed;
    if (filterStatus === 'unconfirmed') matchesStatus = !t.isConfirmed;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Header title="Comunicador de Turnos" />
      <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6">
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col space-y-4">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Tablero de Comunicación</h2>
              <p className="text-sm text-slate-500">Visualice los turnos diagramados y notifique asistencia.</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="confirmed">Confirmados</option>
                <option value="unconfirmed">Pendientes</option>
              </select>

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
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {fechas.map((f, i) => (
              <button
                key={f}
                onClick={() => setActiveDateTab(f)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  activeDateTab === f
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {formatDateLabel(f, i)} ({f.split('-')[2]}/{f.split('-')[1]})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12 shrink-0">
              <span className="text-slate-500 animate-pulse font-medium">Cargando turnos...</span>
            </div>
          ) : (
            (() => {
              const dayTurnosRaw = turnos.filter(t => t.fecha === activeDateTab);
              const total = dayTurnosRaw.length;
              const confirmados = dayTurnosRaw.filter(t => t.isConfirmed).length;
              const pendientes = total - confirmados;

              const dayTurnos = filteredTurnos.filter(t => t.fecha === activeDateTab);

              return (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="grid grid-cols-3 gap-4 mb-4 shrink-0">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Total Diario</span>
                      <span className="text-2xl font-black text-slate-800">{total}</span>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 shadow-sm flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-emerald-600">Confirmados</span>
                      <span className="text-2xl font-black text-emerald-700">{confirmados}</span>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 shadow-sm flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-orange-600">Pendientes</span>
                      <span className="text-2xl font-black text-orange-700">{pendientes}</span>
                    </div>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:flex flex-col flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-0">
                    <div className="overflow-auto flex-1">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Turno / Servicio</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Conductor</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Unidad</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">Presentación</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">Salida</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">Estado</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dayTurnos.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-sm font-medium text-slate-400">
                                Sin turnos que coincidan con la búsqueda.
                              </td>
                            </tr>
                          ) : (
                            dayTurnos.map(turno => (
                              <tr key={turno.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">{turno.tipo === 'Turistico' ? 'Turismo' : turno.cod_turno}</span>
                                    {turno.destino && turno.destino !== turno.cod_turno && (
                                      <span className="text-[10px] text-slate-500 font-medium leading-tight">{turno.destino}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-700">
                                  <div className="flex flex-col">
                                    <span>{turno.conductor_principal}</span>
                                    {turno.conductor_secundario && (
                                      <span className="text-xs text-slate-500">{turno.conductor_secundario} (2do)</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-indigo-700">{turno.unidad}</td>
                                <td className="px-4 py-3 text-center text-sm font-black text-blue-700 bg-blue-50/30">
                                  {turno.hora_presentacion?.substring(0, 5) || '-'}
                                </td>
                                <td className="px-4 py-3 text-center text-sm font-bold text-slate-600">
                                  {turno.hora_salida?.substring(0, 5) || '-'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {turno.isConfirmed ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full" title={turno.confirmacionLog}>
                                      <CheckCircle className="w-3 h-3" /> Confirmado
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                                      Pendiente
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {!turno.isConfirmed && (
                                    <button
                                      onClick={() => handleConfirmar(turno)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded text-xs font-bold uppercase transition-colors"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      Notificar
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden flex-1 overflow-y-auto space-y-3 pb-6">
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
            })()
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  AlertTriangle, 
  Clock, 
  Calendar,
  Sun,
  Snowflake,
  ShieldAlert,
  X,
  Save
} from 'lucide-react';

interface Solicitud {
  id: string;
  legajo: string;
  apellido_nombre: string;
  sector: string;
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_dias: number;
  estado: string;
  es_verano: boolean;
  es_invierno: boolean;
  requiere_excepcion: boolean;
  logs_aprobacion: any[];
  created_at: string;
}

interface CupoConfig {
  sector: string;
  cupo_maximo: number;
}

export default function AprobacionVacaciones() {
  const { user } = useAuth();
  
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cupos, setCupos] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [sectorFiltro, setSectorFiltro] = useState<string>('Todos');
  const [sectoresDisponibles, setSectoresDisponibles] = useState<string[]>([]);
  
  // Estado para Modal de Modificación de Fechas
  const [modalModificar, setModalModificar] = useState<{isOpen: boolean, sol: Solicitud | null}>({ isOpen: false, sol: null });
  const [nuevaInicio, setNuevaInicio] = useState('');
  const [nuevaFin, setNuevaFin] = useState('');

  const [mensaje, setMensaje] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    if (!user || !supabase) return;
    setLoading(true);

    try {
      // 1. Obtener el sector del usuario logueado para filtrar (si no es Admin/RRHH)
      let miSector = '';
      if (user.rol !== 'Administrador' && user.rol !== 'Administrativo') {
        const { data: colabData } = await supabase
          .from('vw_personal_completo')
          .select('sector')
          .or(`dni.eq.${user.dni},apellido_nombre.eq."${user.nombre_apellido}"`)
          .limit(1)
          .maybeSingle();
        
        if (colabData) {
          miSector = colabData.sector;
          setSectorFiltro(miSector);
        }
      }

      // 2. Cargar configuración de cupos
      const { data: configData } = await supabase.from('vacaciones_configuracion').select('*');
      const cuposMap: Record<string, number> = {};
      const sectores: string[] = [];
      if (configData) {
        configData.forEach((c: CupoConfig) => {
          cuposMap[c.sector] = c.cupo_maximo;
          sectores.push(c.sector);
        });
      }
      setCupos(cuposMap);
      setSectoresDisponibles(sectores);

      // 3. Cargar solicitudes
      let query = supabase.from('vacaciones_solicitudes').select('*').order('created_at', { ascending: false });
      
      // Si no es admin y tiene un sector, forzamos el filtro a su sector
      if (miSector) {
        query = query.eq('sector', miSector);
      }

      const { data: solData, error } = await query;
      if (error) throw error;
      
      setSolicitudes(solData || []);
    } catch (err) {
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const calcularAusenciasSimultaneas = (sector: string, inicio: string, fin: string, currentId: string) => {
    const start = new Date(inicio).getTime();
    const end = new Date(fin).getTime();
    
    // Filtrar solicitudes APROBADAS que se superpongan
    const superpuestas = solicitudes.filter(s => 
      s.sector === sector && 
      s.id !== currentId &&
      ['Aprobado_Sector', 'Aprobado_Empleado', 'Impreso', 'Archivado', 'Liquidado'].includes(s.estado) &&
      (new Date(s.fecha_inicio).getTime() <= end && new Date(s.fecha_fin).getTime() >= start)
    );

    return superpuestas.length;
  };

  const procesarAccion = async (sol: Solicitud, accion: 'Aprobado_Sector' | 'Rechazado', justificacion: string = '') => {
    try {
      const logs = sol.logs_aprobacion || [];
      const nuevoLog = {
        fecha: new Date().toISOString(),
        usuario: user?.nombre_apellido,
        accion: accion === 'Aprobado_Sector' ? 'Aprobación Jefatura' : 'Rechazo',
        detalle: justificacion || 'Sin observaciones'
      };

      if (supabase) {
        const { error } = await supabase
          .from('vacaciones_solicitudes')
          .update({ 
            estado: accion,
            logs_aprobacion: [...logs, nuevoLog],
            updated_at: new Date().toISOString()
          })
          .eq('id', sol.id);

        if (error) throw error;
      }
      
      setMensaje({ type: 'success', text: `Solicitud ${accion === 'Aprobado_Sector' ? 'Aprobada' : 'Rechazada'} correctamente.` });
      cargarDatos();
    } catch (error) {
      console.error(error);
      setMensaje({ type: 'error', text: 'Error al procesar la solicitud.' });
    }
  };

  const handleAprobar = (sol: Solicitud) => {
    // 1. Validar Cupos
    const simultaneos = calcularAusenciasSimultaneas(sol.sector, sol.fecha_inicio, sol.fecha_fin, sol.id);
    const cupoMaximo = cupos[sol.sector] || 1;

    if (simultaneos >= cupoMaximo) {
      const confirmar = window.confirm(
        `¡ATENCIÓN! Ya hay ${simultaneos} persona(s) de ${sol.sector} de vacaciones en esas fechas.\nEl cupo máximo es ${cupoMaximo}.\n\n¿Desea aprobarla de todos modos generando una excepción de cobertura?`
      );
      if (!confirmar) return;
    }

    // 2. Validar Excepción de 7 días
    let justificacion = '';
    if (sol.requiere_excepcion) {
      const just = window.prompt("Esta solicitud es menor a 7 días. Requiere que justifique la aprobación excepcional:");
      if (just === null) return; // Canceló
      if (just.trim() === '') {
        alert("Debe ingresar una justificación para la excepción.");
        return;
      }
      justificacion = `Excepción < 7 días autorizada: ${just}`;
    }

    procesarAccion(sol, 'Aprobado_Sector', justificacion);
  };

  const handleRechazar = (sol: Solicitud) => {
    const just = window.prompt("Indique el motivo del rechazo:");
    if (just === null) return;
    procesarAccion(sol, 'Rechazado', just);
  };

  const handleGuardarModificacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalModificar.sol) return;

    const sol = modalModificar.sol;
    
    // Recalcular días y detectar verano/invierno para las nuevas fechas
    const start = new Date(nuevaInicio);
    const end = new Date(nuevaFin);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) {
      alert("La fecha de fin debe ser posterior a la de inicio.");
      return;
    }
    const nuevosDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const startM = start.getMonth() + 1;
    const endM = end.getMonth() + 1;
    const esVerano = [12, 1, 2].includes(startM) || [12, 1, 2].includes(endM);
    const esInvierno = startM === 7 || endM === 7;
    const requiereExcepcion = nuevosDias < 7;

    try {
      const logs = sol.logs_aprobacion || [];
      const nuevoLog = {
        fecha: new Date().toISOString(),
        usuario: user?.nombre_apellido,
        accion: 'Modificación Fechas',
        detalle: `Jefatura propone nuevas fechas: ${new Date(nuevaInicio).toLocaleDateString('es-AR')} al ${new Date(nuevaFin).toLocaleDateString('es-AR')} (${nuevosDias} días). Pendiente de aceptación por colaborador.`
      };

      if (supabase) {
        const { error } = await supabase
          .from('vacaciones_solicitudes')
          .update({ 
            fecha_inicio: nuevaInicio,
            fecha_fin: nuevaFin,
            cantidad_dias: nuevosDias,
            es_verano: esVerano,
            es_invierno: esInvierno,
            requiere_excepcion: requiereExcepcion,
            estado: 'Modificado',
            logs_aprobacion: [...logs, nuevoLog],
            updated_at: new Date().toISOString()
          })
          .eq('id', sol.id);

        if (error) throw error;
      }
      
      setMensaje({ type: 'success', text: `Fechas modificadas. El empleado deberá aceptarlas en su panel.` });
      setModalModificar({ isOpen: false, sol: null });
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert('Error al modificar las fechas.');
    }
  };

  const solicitudesFiltradas = solicitudes.filter(s => sectorFiltro === 'Todos' || s.sector === sectorFiltro);

  return (
    <div className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden">
      <Header 
        title="Aprobación de Jefaturas" 
        subtitle="Gestión de Vacaciones del Equipo"
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Alertas Globales */}
          {mensaje && (
            <div className={`p-4 rounded-xl shadow-sm font-bold flex items-center gap-2 ${
              mensaje.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {mensaje.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              {mensaje.text}
            </div>
          )}

          {/* Panel Superior y Filtros */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Solicitudes del Equipo</h2>
                <p className="text-xs text-slate-500">Gestione aprobaciones y superposiciones</p>
              </div>
            </div>

            {(user?.rol === 'Administrador' || user?.rol === 'Administrativo') && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Filtrar Sector:</span>
                <select
                  value={sectorFiltro}
                  onChange={(e) => setSectorFiltro(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-1.5 font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="Todos">Todos los Sectores</option>
                  {sectoresDisponibles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Tabla de Solicitudes */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Cargando solicitudes...</div>
              ) : solicitudesFiltradas.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold">No hay solicitudes pendientes en su sector.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Colaborador</th>
                      <th className="px-4 py-3">Período Solicitado</th>
                      <th className="px-4 py-3 text-center">Días</th>
                      <th className="px-4 py-3">Alertas y Tipo</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {solicitudesFiltradas.map(sol => {
                      
                      // Calculamos superposición dinámica para UI (para mostrar advertencia antes de que apruebe)
                      const superpuestos = calcularAusenciasSimultaneas(sol.sector, sol.fecha_inicio, sol.fecha_fin, sol.id);
                      const maxCupo = cupos[sol.sector] || 1;
                      const alertaCupo = superpuestos >= maxCupo;

                      const isPending = sol.estado === 'Solicitado' || sol.estado === 'Modificado';

                      return (
                        <tr key={sol.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-800 block">{sol.apellido_nombre}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">Leg: {sol.legajo} | {sol.sector}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700">
                            {new Date(sol.fecha_inicio).toLocaleDateString('es-AR')} al {new Date(sol.fecha_fin).toLocaleDateString('es-AR')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-black text-sm ${sol.requiere_excepcion ? 'text-red-600' : 'text-slate-800'}`}>
                              {sol.cantidad_dias}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1 items-start">
                              {sol.es_verano && (
                                <span className="text-orange-600 flex items-center gap-1 font-bold text-[10px] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100"><Sun className="w-3 h-3"/> Verano</span>
                              )}
                              {sol.es_invierno && (
                                <span className="text-cyan-600 flex items-center gap-1 font-bold text-[10px] bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100"><Snowflake className="w-3 h-3"/> Invierno</span>
                              )}
                              {sol.requiere_excepcion && (
                                <span className="text-red-600 flex items-center gap-1 font-bold text-[10px] bg-red-50 px-1.5 py-0.5 rounded border border-red-100" title="Menos de 7 días. Requiere justificación."><ShieldAlert className="w-3 h-3"/> Excepción &lt; 7d</span>
                              )}
                              {alertaCupo && isPending && (
                                <span className="text-amber-700 flex items-center gap-1 font-bold text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title={`Cupo del sector excedido. Ya hay ${superpuestos} aprobados.`}><AlertTriangle className="w-3 h-3"/> Alerta Cupo ({superpuestos}/{maxCupo})</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sol.estado === 'Solicitado' ? 'bg-amber-100 text-amber-800' :
                              sol.estado === 'Modificado' ? 'bg-purple-100 text-purple-800' :
                              sol.estado === 'Aprobado_Sector' || sol.estado === 'Aprobado_Empleado' ? 'bg-blue-100 text-blue-800' :
                              sol.estado === 'Impreso' || sol.estado === 'Archivado' || sol.estado === 'Liquidado' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {sol.estado.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {sol.estado === 'Solicitado' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleAprobar(sol)}
                                  className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors"
                                  title="Aprobar"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setNuevaInicio(sol.fecha_inicio);
                                    setNuevaFin(sol.fecha_fin);
                                    setModalModificar({ isOpen: true, sol });
                                  }}
                                  className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors"
                                  title="Proponer otras fechas"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRechazar(sol)}
                                  className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors"
                                  title="Rechazar"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 flex items-center justify-center gap-1 text-[10px]">
                                <Clock className="w-3 h-3" /> Resuelto
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Proponer Nuevas Fechas */}
      {modalModificar.isOpen && modalModificar.sol && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" /> Proponer Nuevas Fechas
              </h3>
              <button 
                onClick={() => setModalModificar({ isOpen: false, sol: null })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleGuardarModificacion} className="p-5 space-y-4">
              <div className="bg-blue-50 border border-blue-100 text-blue-800 p-3 rounded-lg text-xs leading-relaxed">
                Vas a proponer nuevas fechas para <strong>{modalModificar.sol.apellido_nombre}</strong>. 
                El estado pasará a "Modificado" y el colaborador deberá aceptarlas desde su panel.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Fecha de Inicio</label>
                <input 
                  type="date" 
                  required
                  value={nuevaInicio}
                  onChange={(e) => setNuevaInicio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Fecha de Fin</label>
                <input 
                  type="date" 
                  required
                  value={nuevaFin}
                  min={nuevaInicio}
                  onChange={(e) => setNuevaFin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 mt-4">
                <button 
                  type="button"
                  onClick={() => setModalModificar({ isOpen: false, sol: null })}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" /> Enviar Propuesta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
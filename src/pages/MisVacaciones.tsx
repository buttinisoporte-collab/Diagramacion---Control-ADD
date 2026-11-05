import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar as CalendarIcon, 
  Sun, 
  Snowflake, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Info,
  CalendarCheck,
  Send,
  UserCheck,
  Edit3,
  Trash2,
  X
} from 'lucide-react';

interface ColaboradorInfo {
  id: string;
  legajo: string;
  apellido_nombre: string;
  dni: string;
  sector: string;
  tipo: string;
  fecha_ingreso: string | null;
}

interface Solicitud {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_dias: number;
  estado: string;
  es_verano: boolean;
  es_invierno: boolean;
  requiere_excepcion: boolean;
  logs_aprobacion?: any[];
  created_at: string;
}

export default function MisVacaciones() {
  const { user } = useAuth();
  
  const [colaborador, setColaborador] = useState<ColaboradorInfo | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [mensaje, setMensaje] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

  // Estados para Edición
  const [modalEditar, setModalEditar] = useState<{isOpen: boolean, sol: Solicitud | null}>({isOpen: false, sol: null});
  const [editInicio, setEditInicio] = useState('');
  const [editFin, setEditFin] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (supabase) {
        const { data: colabData, error: colabError } = await supabase
          .from('vw_personal_completo')
          .select('*')
          .eq('apellido_nombre', user.nombre_apellido)
          .limit(1)
          .maybeSingle();

        let datosFinales = colabData;

        if (colabError || !colabData) {
          console.warn("No se encontró en Supabase, usando fallback de prueba");
          datosFinales = {
            id: 'test-1',
            legajo: '1001',
            apellido_nombre: user.nombre_apellido,
            dni: '32145678',
            sector: user.rol === 'Conductor' ? 'TRÁFICO' : (user.rol === 'Mecanico' ? 'MANTENIMIENTO' : 'ADMINISTRACIÓN Y FINANZAS'),
            tipo: user.rol,
            fecha_ingreso: '2015-03-01' 
          };
        }

        if (datosFinales) {
          setColaborador(datosFinales);
          
          const { data: solData } = await supabase
            .from('vacaciones_solicitudes')
            .select('*')
            .eq('legajo', datosFinales.legajo)
            .order('created_at', { ascending: false });
            
          if (solData) setSolicitudes(solData);
        }
      }
    } catch (err) {
      console.error("Error al cargar datos de vacaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  const calcularDiasLCT = (fechaIngreso: string | null): number => {
    if (!fechaIngreso) return 0;
    const ingreso = new Date(fechaIngreso);
    const currentYear = new Date().getFullYear();
    const dec31 = new Date(currentYear, 11, 31);
    const diffTime = dec31.getTime() - ingreso.getTime();
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);

    if (diffYears < 0.5) return 14; 
    if (diffYears < 5) return 14;
    if (diffYears < 10) return 21;
    if (diffYears < 20) return 28;
    return 35;
  };

  const calcularDiasRango = (inicio: string, fin: string): number => {
    if (!inicio || !fin) return 0;
    const start = new Date(inicio);
    const end = new Date(fin);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const analizarFechas = (inicio: string, fin: string) => {
    const dias = calcularDiasRango(inicio, fin);
    if (!inicio || !fin) return { dias: 0, esVerano: false, esInvierno: false, reqExcepcion: false };
    
    const startM = new Date(inicio).getMonth() + 1;
    const endM = new Date(fin).getMonth() + 1;
    const esVerano = [12, 1, 2].includes(startM) || [12, 1, 2].includes(endM);
    const esInvierno = startM === 7 || endM === 7;
    const reqExcepcion = dias > 0 && dias < 7;

    return { dias, esVerano, esInvierno, reqExcepcion };
  };

  const diasConsumidos = solicitudes
    .filter(s => s.estado !== 'Rechazado' && s.estado !== 'Cancelado')
    .reduce((acc, curr) => acc + curr.cantidad_dias, 0);

  const diasTotales = calcularDiasLCT(colaborador?.fecha_ingreso || null);
  const saldoDias = diasTotales - diasConsumidos;
  
  const datosNuevaSol = analizarFechas(fechaInicio, fechaFin);

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    if (!colaborador) return;
    if (!colaborador.fecha_ingreso) {
      setMensaje({ type: 'error', text: 'Error: Su fecha de ingreso no está cargada. Contacte a Capital Humano.' });
      return;
    }
    if (datosNuevaSol.dias <= 0) {
      setMensaje({ type: 'error', text: 'Fechas inválidas. La fecha de fin debe ser posterior o igual a la de inicio.' });
      return;
    }
    if (datosNuevaSol.dias > saldoDias) {
      setMensaje({ type: 'error', text: `No puede solicitar ${datosNuevaSol.dias} días. Su saldo es de ${saldoDias} días.` });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        legajo: colaborador.legajo,
        apellido_nombre: colaborador.apellido_nombre,
        sector: colaborador.sector,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        cantidad_dias: datosNuevaSol.dias,
        estado: 'Solicitado',
        es_verano: datosNuevaSol.esVerano,
        es_invierno: datosNuevaSol.esInvierno,
        requiere_excepcion: datosNuevaSol.reqExcepcion,
      };

      if (supabase) {
        const { error } = await supabase.from('vacaciones_solicitudes').insert([payload]);
        if (error) throw error;
      }

      setMensaje({ type: 'success', text: 'Solicitud enviada correctamente a su Responsable de Sector.' });
      setFechaInicio('');
      setFechaFin('');
      cargarDatos();
    } catch (err: any) {
      console.error(err);
      setMensaje({ type: 'error', text: 'Hubo un error al enviar la solicitud.' });
    } finally {
      setIsSaving(false);
    }
  };

  const aceptarModificacion = async (idSolicitud: string) => {
    if (!confirm('¿Confirma que está de acuerdo con las nuevas fechas propuestas por su Responsable?')) return;
    
    try {
      if (supabase) {
        const { error } = await supabase
          .from('vacaciones_solicitudes')
          .update({ estado: 'Aprobado_Empleado', updated_at: new Date().toISOString() })
          .eq('id', idSolicitud);
          
        if (error) throw error;
      }
      setMensaje({ type: 'success', text: 'Fechas aceptadas. Capital Humano procederá a emitir el formulario.' });
      cargarDatos();
    } catch (err: any) {
      console.error(err);
      setMensaje({ type: 'error', text: 'Error al confirmar.' });
    }
  };

  const handleCancelarSolicitud = async (sol: Solicitud) => {
    if (!confirm('¿Está seguro que desea cancelar esta solicitud? Los días solicitados volverán a su saldo disponible.')) return;
    
    try {
      if (supabase) {
        const { error } = await supabase
          .from('vacaciones_solicitudes')
          .update({ estado: 'Cancelado', updated_at: new Date().toISOString() })
          .eq('id', sol.id);
        if (error) throw error;
      }
      setMensaje({ type: 'success', text: 'Solicitud cancelada. Sus días fueron reintegrados.' });
      cargarDatos();
    } catch (err) {
      console.error(err);
      alert('Error al cancelar la solicitud.');
    }
  };

  const abrirEdicion = (sol: Solicitud) => {
    setEditInicio(sol.fecha_inicio);
    setEditFin(sol.fecha_fin);
    setModalEditar({ isOpen: true, sol });
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditar.sol) return;

    const nuevaData = analizarFechas(editInicio, editFin);
    
    // Al editar, el saldo virtual disponible es el saldo actual + los días que estaba ocupando la solicitud vieja
    const saldoVirtualDisponible = saldoDias + modalEditar.sol.cantidad_dias;

    if (nuevaData.dias <= 0) {
      alert('Las fechas ingresadas no son válidas.');
      return;
    }
    if (nuevaData.dias > saldoVirtualDisponible) {
      alert(`No tiene saldo suficiente. Intenta solicitar ${nuevaData.dias} días, pero su máximo disponible (incluyendo los de esta misma solicitud) es de ${saldoVirtualDisponible} días.`);
      return;
    }

    try {
      const logs = modalEditar.sol.logs_aprobacion || [];
      const nuevoLog = {
        fecha: new Date().toISOString(),
        usuario: user?.nombre_apellido,
        accion: 'Edición del Colaborador',
        detalle: `El colaborador modificó/propuso las fechas a: ${new Date(editInicio).toLocaleDateString('es-AR')} al ${new Date(editFin).toLocaleDateString('es-AR')}. Pasa a revisión de Jefatura.`
      };

      if (supabase) {
        const { error } = await supabase
          .from('vacaciones_solicitudes')
          .update({
            fecha_inicio: editInicio,
            fecha_fin: editFin,
            cantidad_dias: nuevaData.dias,
            es_verano: nuevaData.esVerano,
            es_invierno: nuevaData.esInvierno,
            requiere_excepcion: nuevaData.reqExcepcion,
            estado: 'Solicitado', // Vuelve al estado inicial para que el jefe lo revise
            logs_aprobacion: [...logs, nuevoLog],
            updated_at: new Date().toISOString()
          })
          .eq('id', modalEditar.sol.id);
          
        if (error) throw error;
      }

      setMensaje({ type: 'success', text: 'Solicitud modificada con éxito. Queda pendiente de revisión por la Jefatura.' });
      setModalEditar({ isOpen: false, sol: null });
      cargarDatos();
    } catch (err) {
      console.error(err);
      alert('Error al guardar los cambios.');
    }
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden">
      <Header title="Mis Vacaciones" subtitle="Planificación, saldos y solicitudes" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {loading ? (
            <div className="text-center py-12 text-slate-500 animate-pulse font-bold">
              Cargando información del padrón...
            </div>
          ) : !colaborador ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center shadow-sm">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-500" />
              <h3 className="text-lg font-black mb-1">Perfil No Encontrado</h3>
              <p className="text-sm">
                Su usuario no está vinculado correctamente al padrón de empleados (Nóminas). 
                Por favor, verifique que su DNI o Nombre coincidan con los registros de Capital Humano.
              </p>
            </div>
          ) : (
            <>
              {/* Tarjetas de Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Antigüedad</span>
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-bold text-slate-800">
                      {colaborador.fecha_ingreso ? new Date(colaborador.fecha_ingreso).toLocaleDateString('es-AR') : 'No cargada'}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Días por Ley</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-slate-800">{diasTotales}</span>
                    <span className="text-xs text-slate-500 font-bold">días</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Consumidos</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-amber-600">{diasConsumidos}</span>
                    <span className="text-xs text-slate-500 font-bold">días</span>
                  </div>
                </div>

                <div className={`border rounded-xl p-5 shadow-sm ${saldoDias > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${saldoDias > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>Saldo Disponible</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black ${saldoDias > 0 ? 'text-emerald-700' : 'text-slate-700'}`}>{saldoDias}</span>
                    <span className={`text-xs font-bold ${saldoDias > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>días</span>
                  </div>
                </div>
              </div>

              {!colaborador.fecha_ingreso && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm font-medium flex items-start gap-3">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>
                    Su fecha de ingreso no está registrada en el sistema. No se pueden calcular sus días de vacaciones automáticos. Por favor, solicite a Capital Humano que actualice su legajo.
                  </p>
                </div>
              )}

              {/* Solicitud y Mensajes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-blue-600 px-5 py-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" /> Nueva Solicitud
                    </h3>
                  </div>
                  
                  <form onSubmit={handleSolicitar} className="p-5 space-y-4">
                    {mensaje && (
                      <div className={`p-3 rounded-lg text-xs font-bold ${mensaje.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {mensaje.text}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Inicio</label>
                      <input 
                        type="date" 
                        required
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Finalización</label>
                      <input 
                        type="date" 
                        required
                        value={fechaFin}
                        min={fechaInicio}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                      />
                    </div>

                    {datosNuevaSol.dias > 0 && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-slate-600">Días a solicitar:</span>
                          <span className={`text-sm font-black ${datosNuevaSol.dias > saldoDias ? 'text-red-600' : 'text-blue-600'}`}>{datosNuevaSol.dias}</span>
                        </div>
                        
                        {datosNuevaSol.reqExcepcion && (
                          <div className="text-[10px] text-amber-700 flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span>Período menor a 7 días. Requiere autorización de su responsable.</span>
                          </div>
                        )}
                        
                        {datosNuevaSol.esVerano && (
                          <div className="text-[10px] text-orange-700 flex items-center gap-1 font-bold">
                            <Sun className="w-3 h-3" /> Período de Verano
                          </div>
                        )}
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={isSaving || datosNuevaSol.dias <= 0 || datosNuevaSol.dias > saldoDias || !colaborador.fecha_ingreso}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {isSaving ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                  </form>
                </div>

                {/* Historial de Solicitudes */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                      <h3 className="font-bold text-slate-800">Mi Historial de Solicitudes</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Seguimiento y edición de sus solicitudes de licencia</p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    {solicitudes.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm font-semibold">No tienes solicitudes registradas.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-3">Período</th>
                            <th className="px-4 py-3 text-center">Días</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3 text-center min-w-[120px]">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {solicitudes.map(sol => {
                            const editable = sol.estado === 'Solicitado' || sol.estado === 'Modificado';
                            return (
                            <tr key={sol.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-semibold text-slate-700">
                                {new Date(sol.fecha_inicio).toLocaleDateString('es-AR')} al {new Date(sol.fecha_fin).toLocaleDateString('es-AR')}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-slate-800">
                                {sol.cantidad_dias}
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
                                {sol.estado === 'Modificado' ? (
                                  <div className="flex flex-col gap-1.5 items-center justify-center">
                                    <button
                                      onClick={() => aceptarModificacion(sol.id)}
                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] transition-colors shadow-sm flex items-center justify-center gap-1 w-full max-w-[120px]"
                                    >
                                      <UserCheck className="w-3 h-3" /> Aceptar Propuesta
                                    </button>
                                    <div className="flex gap-1 w-full max-w-[120px]">
                                      <button onClick={() => abrirEdicion(sol)} className="flex-1 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded font-bold text-[10px] flex items-center justify-center" title="Proponer otra fecha">
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button onClick={() => handleCancelarSolicitud(sol)} className="flex-1 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded font-bold text-[10px] flex items-center justify-center" title="Cancelar Solicitud">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ) : editable ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => abrirEdicion(sol)}
                                      className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                      title="Modificar Fechas"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleCancelarSolicitud(sol)}
                                      className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                                      title="Eliminar / Cancelar"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : sol.estado === 'Impreso' ? (
                                  <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Firmar en RRHH
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
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
            </>
          )}
        </div>
      </div>

      {/* Modal Editar Fechas */}
      {modalEditar.isOpen && modalEditar.sol && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" /> Modificar Solicitud
              </h3>
              <button 
                onClick={() => setModalEditar({ isOpen: false, sol: null })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleGuardarEdicion} className="p-5 space-y-4">
              <div className="bg-blue-50 border border-blue-100 text-blue-800 p-3 rounded-lg text-xs leading-relaxed">
                Si edita estas fechas, la solicitud volverá al estado "Solicitado" para que su Jefe de Sector la revise nuevamente.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Fecha de Inicio</label>
                <input 
                  type="date" 
                  required
                  value={editInicio}
                  onChange={(e) => setEditInicio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Fecha de Fin</label>
                <input 
                  type="date" 
                  required
                  value={editFin}
                  min={editInicio}
                  onChange={(e) => setEditFin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 mt-4">
                <button 
                  type="button"
                  onClick={() => setModalEditar({ isOpen: false, sol: null })}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
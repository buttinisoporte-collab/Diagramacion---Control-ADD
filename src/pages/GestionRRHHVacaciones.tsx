import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { 
  Printer, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  Sun, 
  History,
  FileText,
  Archive,
  RefreshCw
} from 'lucide-react';

export default function GestionRRHHVacaciones() {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imprimirData, setImprimirData] = useState<any>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    if (!supabase) return;

    try {
      // Cargamos todas las solicitudes para poder cruzar los históricos (alternancia)
      const { data, error } = await supabase
        .from('vacaciones_solicitudes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSolicitudes(data || []);
    } catch (err) {
      console.error("Error al cargar solicitudes para RRHH", err);
    } finally {
      setLoading(false);
    }
  };

  const verificarAlternancia = (sol: any) => {
    if (!sol.es_verano) return false;
    
    const anioActual = new Date(sol.fecha_inicio).getFullYear();
    // Buscar si tuvo vacaciones de verano en el año inmediatamente anterior
    const tuvoVeranoAnterior = solicitudes.some(s => 
      s.legajo === sol.legajo && 
      s.id !== sol.id &&
      s.es_verano === true && 
      (s.estado === 'Impreso' || s.estado === 'Archivado' || s.estado === 'Liquidado') &&
      new Date(s.fecha_inicio).getFullYear() === anioActual - 1
    );

    return tuvoVeranoAnterior;
  };

  const handleImprimir = async (sol: any) => {
    setImprimirData(sol);
    
    setTimeout(() => {
      window.print();
    }, 500);

    // Si aún no estaba impreso, lo pasamos a ese estado
    if (sol.estado === 'Aprobado_Sector' || sol.estado === 'Aprobado_Empleado') {
      try {
        if (supabase) {
          await supabase.from('vacaciones_solicitudes').update({ estado: 'Impreso' }).eq('id', sol.id);
        }
        cargarDatos();
      } catch (e) {
        console.error("Error actualizando estado a Impreso", e);
      }
    }
  };

  const handleArchivar = async (sol: any) => {
    // Simulamos la subida de un archivo físico pidiendo un código de legajo o confirmación
    const confirmacion = window.confirm(`¿Confirma que ha recibido la planilla de vacaciones firmada de puño y letra por ${sol.apellido_nombre} y su responsable de sector?`);
    
    if (!confirmacion) return;

    try {
      if (supabase) {
        await supabase
          .from('vacaciones_solicitudes')
          .update({ 
            estado: 'Archivado', 
            archivo_adjunto_url: 'fisico_archivado_legajo',
            updated_at: new Date().toISOString()
          })
          .eq('id', sol.id);
      }
      alert('Trámite archivado correctamente.');
      cargarDatos();
    } catch (e) {
      console.error("Error archivando", e);
      alert('Hubo un error al archivar el trámite.');
    }
  };

  // RRHH solo gestiona las que ya pasaron la aprobación de jefatura/empleado
  const solicitudesRRHH = solicitudes.filter(s => 
    ['Aprobado_Sector', 'Aprobado_Empleado', 'Impreso', 'Archivado'].includes(s.estado)
  );

  return (
    <div className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden relative">
      <Header title="Capital Humano" subtitle="Gestión de Formularios y Archivo de Vacaciones" />

      {/* VISTA PRINCIPAL (Oculta al imprimir) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 print:hidden">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Emisión de Formularios Oficiales
              </h2>
              <p className="text-xs text-slate-500 mt-1">Imprima las planillas aprobadas para la firma de puño y letra y archívelas en el legajo.</p>
            </div>
            <button onClick={cargarDatos} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Cargando datos...</div>
              ) : solicitudesRRHH.length === 0 ? (
                <div className="p-12 text-center text-slate-400">No hay solicitudes pendientes de gestión en Capital Humano.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Colaborador</th>
                      <th className="px-4 py-3">Período Aprobado</th>
                      <th className="px-4 py-3 text-center">Días</th>
                      <th className="px-4 py-3">Control Alternancia</th>
                      <th className="px-4 py-3">Estado Trámite</th>
                      <th className="px-4 py-3 text-center">Acciones RRHH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {solicitudesRRHH.map(sol => {
                      const alertaAlternancia = verificarAlternancia(sol);

                      return (
                        <tr key={sol.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-800 block">{sol.apellido_nombre}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">Leg: {sol.legajo} | {sol.sector}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700">
                            {new Date(sol.fecha_inicio).toLocaleDateString('es-AR')} al {new Date(sol.fecha_fin).toLocaleDateString('es-AR')}
                          </td>
                          <td className="px-4 py-3 text-center font-black text-slate-800">
                            {sol.cantidad_dias}
                          </td>
                          <td className="px-4 py-3">
                            {alertaAlternancia ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200" title="Tuvo vacaciones de verano el año pasado. Regla de alternancia incumplida.">
                                <AlertTriangle className="w-3 h-3" /> Verano Consecutivo
                              </span>
                            ) : sol.es_verano ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Alternancia OK
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">No aplica (Fuera de Temp.)</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sol.estado === 'Impreso' ? 'bg-amber-100 text-amber-800' :
                              sol.estado === 'Archivado' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {sol.estado.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleImprimir(sol)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                                title="Imprimir Planilla Oficial"
                              >
                                <Printer className="w-3.5 h-3.5" /> Planilla
                              </button>
                              
                              <button
                                onClick={() => handleArchivar(sol)}
                                disabled={sol.estado === 'Archivado'}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors ${
                                  sol.estado === 'Archivado' 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200'
                                }`}
                                title="Confirmar recepción física firmada"
                              >
                                <Archive className="w-3.5 h-3.5" /> Archivar
                              </button>
                            </div>
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

      {/* ZONA DE IMPRESIÓN (Visible solo al imprimir, estilo formal para legajo) */}
      <div className="hidden print:block absolute inset-0 bg-white p-8 z-[9999] text-black w-[210mm] h-[297mm]">
        {imprimirData && (
          <div className="border-2 border-black p-8 h-full relative">
            <div className="flex items-start justify-between border-b-2 border-black pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-black italic tracking-tighter">A. Buttini</h1>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Empresa e Hijos S.R.L.</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold uppercase">Planilla Anual de Vacaciones</h2>
                <p className="text-sm font-medium mt-1">Cód: I-xxxxx Rev.0</p>
              </div>
            </div>

            <p className="text-sm mb-6 text-justify">
              En cumplimiento con la legislación laboral vigente y el instructivo organizacional de vacaciones, se extiende el presente documento para formalizar el período de descanso anual remunerado.
            </p>

            <div className="border border-black p-4 mb-6 space-y-4">
              <h3 className="font-bold border-b border-black pb-2 uppercase text-sm">1. Datos del Colaborador</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-bold">Nombre y Apellido:</span> {imprimirData.apellido_nombre}</div>
                <div><span className="font-bold">Legajo N°:</span> {imprimirData.legajo}</div>
                <div><span className="font-bold">Sector:</span> {imprimirData.sector}</div>
                <div><span className="font-bold">Fecha de Emisión:</span> {new Date().toLocaleDateString('es-AR')}</div>
              </div>
            </div>

            <div className="border border-black p-4 mb-8 space-y-4">
              <h3 className="font-bold border-b border-black pb-2 uppercase text-sm">2. Detalle del Período Asignado</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-bold">Fecha de Inicio:</span> {new Date(imprimirData.fecha_inicio).toLocaleDateString('es-AR')}</div>
                <div><span className="font-bold">Fecha de Finalización:</span> {new Date(imprimirData.fecha_fin).toLocaleDateString('es-AR')}</div>
                <div><span className="font-bold">Días Otorgados:</span> {imprimirData.cantidad_dias} días corridos</div>
                <div><span className="font-bold">ID Transacción Sistema:</span> {imprimirData.id.split('-')[0]}</div>
              </div>
            </div>

            <div className="text-sm text-justify mb-20">
              <p>
                Por la presente declaro mi conformidad expresa con las fechas de vacaciones arriba detalladas, las cuales han sido coordinadas con la Jefatura de Sector garantizando la continuidad operativa y respetando los lineamientos de alternancia y fraccionamiento definidos por la empresa.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-12 mt-12">
              <div className="text-center border-t border-black pt-2">
                <p className="font-bold text-sm">Firma del Colaborador</p>
                <p className="text-xs mt-1">Aclaración y DNI</p>
              </div>
              <div className="text-center border-t border-black pt-2">
                <p className="font-bold text-sm">Firma Responsable de Sector</p>
                <p className="text-xs mt-1">Aprobación Operativa</p>
              </div>
            </div>

            <div className="absolute bottom-8 left-8 right-8 text-center border-t border-gray-400 pt-4">
              <p className="text-xs text-gray-600">Este documento debe ser archivado de manera física en el legajo del personal por el departamento de Capital Humano tras recolectar las firmas correspondientes.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
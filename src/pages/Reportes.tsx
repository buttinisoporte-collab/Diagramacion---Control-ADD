import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Reportes() {
  const { hasAccess } = useAuth();
  const [activeReport, setActiveReport] = useState<string>(() => {
    if (hasAccess('Reportes - Mecanica')) return 'mecanica';
    if (hasAccess('Reportes - Presentacion')) return 'presentacion';
    if (hasAccess('Reportes - Operaciones')) return 'operaciones';
    if (hasAccess('Reportes - Generales')) return 'generales';
    return '';
  });
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [controles, setControles] = useState<any[]>([]);
  const [mecanicoDia, setMecanicoDia] = useState<string>('Sin asignar');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchReporte() {
      if (!supabase) return;
      setIsLoading(true);

      // Fetch mecanico del dia
      const { data: mecRes } = await supabase
        .from('diagramacion_mecanicos')
        .select('nomina_mecanicos ( apellido_nombre )')
        .eq('fecha', fecha)
        .maybeSingle();
      
      setMecanicoDia(mecRes?.nomina_mecanicos?.apellido_nombre || 'Sin asignar');

      // Fetch controles of that date
      const { data: ctrlRes } = await supabase
        .from('control_mecanico')
        .select(`
          id_control_mecanico,
          hora,
          flota_activa ( unidad ),
          turnos ( cod_turno ),
          flu_agua, flu_aceite, flu_combustible, flu_hidraulico, flu_frenos,
          observaciones
        `)
        .eq('fecha', fecha)
        .order('hora', { ascending: true });

      setControles(ctrlRes || []);
      setIsLoading(false);
    }
    fetchReporte();
  }, [fecha]);

  return (
    <>
      <Header title="Reportes" subtitle="Planilla Diaria de Mantenimiento" />
      <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-2">
              {hasAccess('Reportes - Mecanica') && (
                <button 
                  onClick={() => setActiveReport('mecanica')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeReport === 'mecanica' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Mecánica
                </button>
              )}
              {hasAccess('Reportes - Presentacion') && (
                <button 
                  onClick={() => setActiveReport('presentacion')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeReport === 'presentacion' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Presentación
                </button>
              )}
              {hasAccess('Reportes - Operaciones') && (
                <button 
                  onClick={() => setActiveReport('operaciones')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeReport === 'operaciones' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Operaciones
                </button>
              )}
              {hasAccess('Reportes - Generales') && (
                <button 
                  onClick={() => setActiveReport('generales')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeReport === 'generales' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Generales
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Seleccionar Fecha</label>
              <input 
                type="date" 
                value={fecha} 
                onChange={e => setFecha(e.target.value)}
                className="border border-slate-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
            {!activeReport && (
              <div className="text-center text-slate-500 py-8">
                Seleccione un reporte para visualizar.
              </div>
            )}
            {activeReport === 'mecanica' && (
              <>
            <div className="text-center border-b border-slate-200 pb-6 mb-6">
              <h2 className="text-2xl font-black text-slate-900 uppercase">PLANILLA DE TRABAJO DIARIO</h2>
              <p className="text-slate-500 font-medium">TALLER - MANTENIMIENTO PREVENTIVO</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="block text-[10px] uppercase font-bold text-slate-400">FECHA:</span>
                <span className="font-bold text-slate-800">{fecha.split('-').reverse().join('/')}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="block text-[10px] uppercase font-bold text-slate-400">MECÁNICO ASIGNADO:</span>
                <span className="font-bold text-slate-800">{mecanicoDia}</span>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-800 mb-3 bg-slate-100 p-2 rounded">DETALLE DE LO REALIZADO</h3>
              <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
                <li>Se controlaron los niveles de agua, aceite, combustible, hidráulico y frenos de las unidades listadas.</li>
                <li>Se rellenaron fluidos en caso de niveles bajos.</li>
                <li>Se verificó visualmente el estado general del motor.</li>
                <li>Reporte de novedades a jefatura de taller según corresponda.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 bg-slate-100 p-2 rounded">UNIDADES CONTROLADAS (Antes de 07:00 AM)</h3>
              {isLoading ? (
                <p className="text-sm text-slate-500 py-4 text-center">Cargando unidades...</p>
              ) : controles.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No hay unidades controladas registradas para esta fecha.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-4 py-3">Unidad</th>
                        <th className="px-4 py-3">Turno</th>
                        <th className="px-4 py-3">Hora Control</th>
                        <th className="px-4 py-3 text-center">Agua</th>
                        <th className="px-4 py-3 text-center">Aceite</th>
                        <th className="px-4 py-3 text-center">Comb.</th>
                        <th className="px-4 py-3 text-center">Hidráu.</th>
                        <th className="px-4 py-3 text-center">Frenos</th>
                        <th className="px-4 py-3">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {controles.map(c => (
                        <tr key={c.id_control_mecanico} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-slate-800">{c.flota_activa?.unidad}</td>
                          <td className="px-4 py-3">{c.turnos?.cod_turno}</td>
                          <td className="px-4 py-3">{c.hora}</td>
                          <td className="px-4 py-3 text-center font-mono">{c.flu_agua}</td>
                          <td className="px-4 py-3 text-center font-mono">{c.flu_aceite}</td>
                          <td className="px-4 py-3 text-center font-mono">{c.flu_combustible}</td>
                          <td className="px-4 py-3 text-center font-mono">{c.flu_hidraulico}</td>
                          <td className="px-4 py-3 text-center font-mono">{c.flu_frenos}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{c.observaciones}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            </>
            )}
            {activeReport !== 'mecanica' && activeReport !== '' && (
              <div className="text-center text-slate-500 py-8">
                El reporte de {activeReport} está en desarrollo y se conectará a la base de datos próximamente.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

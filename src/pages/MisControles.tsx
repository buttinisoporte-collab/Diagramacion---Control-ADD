import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';

export default function MisControles() {
  const [controles, setControles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadControles() {
      if (!supabase) return;
      const { data } = await supabase
        .from('control_mecanico')
        .select(`
          id_control_mecanico,
          fecha,
          hora,
          nomina_mecanicos ( apellido_nombre ),
          flota_activa ( unidad ),
          turnos ( cod_turno ),
          flu_agua, flu_aceite, flu_combustible, flu_hidraulico, flu_frenos,
          observaciones
        `)
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false })
        .limit(100);

      if (data) {
        setControles(data);
      }
      setIsLoading(false);
    }
    loadControles();
  }, []);

  return (
    <>
      <Header title="Mis Controles" subtitle="Historial de fluidos" />
      <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <p className="text-center text-slate-500">Cargando...</p>
          ) : controles.length === 0 ? (
            <p className="text-center text-slate-500">No hay controles registrados.</p>
          ) : (
            <div className="space-y-4">
              {controles.map(c => (
                <div key={c.id_control_mecanico} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 md:p-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase">{c.fecha} {c.hora}</span>
                      <h3 className="text-lg font-bold text-slate-800">Unidad {c.flota_activa?.unidad}</h3>
                      <p className="text-sm text-slate-600">Turno: <span className="font-semibold">{c.turnos?.cod_turno}</span></p>
                    </div>
                    <div className="mt-2 md:mt-0 bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm font-bold inline-flex items-center self-start">
                      <span className="mr-2">🔧</span>
                      {c.nomina_mecanicos?.apellido_nombre || 'Mecánico'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2 mb-4 bg-slate-50 p-3 rounded">
                    <div className="text-center"><div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Agua</div><div className="font-bold text-slate-700">{c.flu_agua}</div></div>
                    <div className="text-center"><div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Aceite</div><div className="font-bold text-slate-700">{c.flu_aceite}</div></div>
                    <div className="text-center"><div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Comb.</div><div className="font-bold text-slate-700">{c.flu_combustible}</div></div>
                    <div className="text-center"><div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Hidráu.</div><div className="font-bold text-slate-700">{c.flu_hidraulico}</div></div>
                    <div className="text-center"><div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Frenos</div><div className="font-bold text-slate-700">{c.flu_frenos}</div></div>
                  </div>
                  
                  {c.observaciones && (
                    <div className="text-sm text-slate-700 bg-amber-50 border border-amber-100 p-3 rounded">
                      <span className="font-bold mr-1">Observaciones:</span> {c.observaciones}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

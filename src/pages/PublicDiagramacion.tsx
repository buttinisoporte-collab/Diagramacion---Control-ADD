import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, User, Clock, Bus, Info } from 'lucide-react';


export default function PublicDiagramacion() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
  
  const [fecha, setFecha] = useState(dateParam);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSearchParams({ fecha });
    loadData();
  }, [fecha]);

  const loadData = async () => {
    if (!supabase) return;
    setLoading(true);
    
    try {
      const [diagRes, stRes, turnosRes] = await Promise.all([
        supabase.from('diagramaciones').select('*').eq('fecha', fecha),
        supabase.from('servicios_turisticos').select('*').eq('fecha', fecha),
        supabase.from('turnos').select('cod_turno, turno, hora_presentacion, hora_salida_base, hora_inicio')
      ]);

      const diagData = diagRes.data || [];
      const stData = stRes.data || [];
      const turnosRef = turnosRes.data || [];
      const turnosMap = new Map(turnosRef.map(t => [(t.cod_turno || '').trim().toLowerCase(), t]));

      let allTurnos: any[] = [];

      diagData.forEach(d => {
        const tInfo = turnosMap.get((d.cod_turno || '').trim().toLowerCase());
        allTurnos.push({
          id: `D_${d.id}`,
          tipo: 'Diagramacion',
          cod_turno: d.cod_turno,
          destino: tInfo?.turno || d.cod_turno,
          unidad: d.unidad || '-',
          conductor: d.conductor_principal || '-',
          hora_salida: tInfo?.hora_salida_base || tInfo?.hora_inicio || '-'
        });
      });

      stData.forEach(s => {
        allTurnos.push({
          id: `S_${s.id}`,
          tipo: 'Turistico',
          cod_turno: 'TURISMO',
          destino: s.destino || '-',
          unidad: s.unidad || '-',
          conductor: s.conductor || '-',
          hora_salida: s.hora_salida || '-'
        });
      });

      // Sort by hora_salida
      allTurnos.sort((a, b) => a.hora_salida.localeCompare(b.hora_salida));
      
      setTurnos(allTurnos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevDay = () => {
    const d = new Date(fecha + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setFecha(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(fecha + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setFecha(d.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Diagramación Diaria</h1>
          <p className="text-blue-200 text-sm font-medium">Información Pública Operativa</p>
        </div>
        
        <div className="flex items-center gap-2 bg-blue-700/50 p-1 rounded-lg self-start sm:self-auto">
          <button onClick={handlePrevDay} className="px-3 py-1.5 text-blue-100 hover:text-white hover:bg-blue-600 rounded font-bold transition-colors">
            &laquo; Ant
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 font-bold">
            <Calendar className="w-4 h-4 text-blue-300" />
            <span>{fecha.split('-')[2]}/{fecha.split('-')[1]}/{fecha.split('-')[0]}</span>
          </div>
          <button onClick={handleNextDay} className="px-3 py-1.5 text-blue-100 hover:text-white hover:bg-blue-600 rounded font-bold transition-colors">
            Sig &raquo;
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 flex-1 max-w-5xl mx-auto w-full flex flex-col">
        <div className="mb-4 shrink-0">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <span className="text-slate-600 font-bold uppercase text-xs tracking-wide">Total Servicios</span>
            <span className="text-xl font-black text-blue-600">{turnos.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 shrink-0">
            <span className="text-slate-500 animate-pulse font-medium">Cargando diagrama...</span>
          </div>
        ) : turnos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
            <Info className="w-10 h-10 text-slate-300 mb-3" />
            <span className="text-lg text-slate-500 font-bold">Sin servicios para este día</span>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col pb-10">
            {/* Desktop Table View (Airport Board Style) */}
            <div className="hidden md:flex flex-1 flex-col bg-[#110c42] rounded-xl shadow-2xl border-[8px] border-[#313540] overflow-hidden min-h-0">
              <div className="overflow-auto flex-1">
                <table className="w-full min-w-[1000px] text-left border-collapse">
                  <thead className="bg-[#110c42] text-indigo-300 sticky top-0 z-10 font-mono text-sm border-b-4 border-[#313540]">
                    <tr>
                      <th className="px-6 py-3 font-semibold uppercase tracking-widest whitespace-nowrap">Hora</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-widest whitespace-nowrap">Servicio</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-widest whitespace-nowrap">Destino</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-widest whitespace-nowrap text-center">Unidad</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-widest whitespace-nowrap text-right">Conductor / Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-white font-sans text-xl">
                    {turnos.map((turno, index) => (
                      <tr 
                        key={turno.id} 
                        className={`
                          ${index % 2 === 0 ? 'bg-[#250d9c]' : 'bg-[#3418ba]'} 
                          hover:bg-indigo-600 transition-colors
                        `}
                      >
                        {/* Time */}
                        <td className="px-6 py-4 font-mono text-3xl font-bold tracking-wider text-white whitespace-nowrap">
                          {turno.hora_salida?.substring(0, 5)}
                        </td>
                        {/* Servicio */}
                        <td className="px-4 py-4 font-semibold text-2xl tracking-wide whitespace-nowrap text-indigo-100">
                          {turno.tipo === 'Turistico' ? 'TURISMO' : turno.cod_turno}
                        </td>
                        {/* Destino */}
                        <td className="px-4 py-4 font-bold text-3xl tracking-wide whitespace-nowrap">
                          {turno.destino}
                        </td>
                        {/* Unidad - Circular badge style */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center bg-[#fb923c] text-white font-black text-2xl rounded-full h-12 min-w-[48px] px-3 shadow-md">
                            {turno.unidad !== '-' && turno.unidad ? turno.unidad : '—'}
                          </div>
                        </td>
                        {/* Conductor */}
                        <td className="px-6 py-4 font-medium text-2xl text-indigo-100 text-right whitespace-nowrap italic tracking-wide">
                          {turno.conductor !== '-' && turno.conductor ? turno.conductor : 'A ASIGNAR'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden grid grid-cols-1 gap-4 overflow-y-auto">
              {turnos.map(turno => (
                <div key={turno.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-100 p-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                      {turno.tipo === 'Turistico' ? 'Turismo' : turno.cod_turno}
                    </span>
                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded font-black text-sm">
                      <Clock className="w-4 h-4" />
                      {turno.hora_salida?.substring(0, 5)}
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Destino / Servicio</p>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{turno.destino}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Unidad</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Bus className="w-4 h-4 text-indigo-400" />
                          <p className="text-sm font-black text-indigo-700">{turno.unidad}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Conductor</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <User className="w-4 h-4 text-slate-400" />
                          <p className="text-xs font-bold text-slate-700 leading-tight">{turno.conductor}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

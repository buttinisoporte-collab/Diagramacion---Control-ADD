import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import { Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ControlGarita() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [turnosBase, setTurnosBase] = useState<any[]>([]);
  const [mecanicosMap, setMecanicosMap] = useState<Record<string, boolean>>({});
  const [checklistsMap, setChecklistsMap] = useState<Record<string, boolean>>({});
  const [presentacionMap, setPresentacionMap] = useState<Record<string, any>>({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!supabase) return;
      setIsLoading(true);

      // 1. Fetch Diagramaciones for date with joined turnos, unidades, conductores
      const { data: diagRes } = await supabase.from('diagramaciones').select('*').eq('fecha', fecha);
      
      const { data: turnosRes } = await supabase.from('turnos').select('*').ilike('salida', '%BASE%');
      const { data: conductRes } = await supabase.from('nomina_conductores').select('apellido_nombre, legajo');
      
      const legajoMap: Record<string, string> = {};
      if (conductRes) {
        conductRes.forEach(c => {
          legajoMap[c.apellido_nombre] = c.legajo;
        });
      }
      
      if (!turnosRes || !diagRes) { setIsLoading(false); return; }

      const turnosFiltrados = diagRes.filter(d => turnosRes.some(t => t.cod_turno === d.cod_turno));
      
      const { data: flotaRes } = await supabase.from('flota_activa').select('id_unidad, unidad');
      const flotaMap: Record<string, string> = {};
      if (flotaRes) {
        flotaRes.forEach(f => {
          if (f.unidad) flotaMap[f.unidad] = f.id_unidad;
        });
      }

      const enrichedTurnos = turnosFiltrados.map(d => {
        const t = turnosRes.find(x => x.cod_turno === d.cod_turno);
        return {
          ...d,
          turno_id: t?.id_turno,
          unidad_id: d.unidad ? flotaMap[d.unidad] : undefined,
          hora_presentacion: t?.hora_presentacion,
          hora_salida_base: t?.hora_salida_base,
          hora_inicio: t?.hora_inicio,
          hora_fin: t?.hora_fin,
          hora_llegada_base: t?.hora_llegada_base,
          turno_label: t?.turno,
          legajo: d.conductor_principal ? legajoMap[d.conductor_principal] : ''
        };
      });
      // sort by hora presentacion
      enrichedTurnos.sort((a, b) => (a.hora_presentacion || '').localeCompare(b.hora_presentacion || ''));
      setTurnosBase(enrichedTurnos);

      // 2. Fetch Control Mecanico
      const { data: mecRes } = await supabase.from('control_mecanico').select('id_unidad, id_turno').eq('fecha', fecha);
      const mMap: Record<string, boolean> = {};
      if (mecRes) {
        mecRes.forEach(m => mMap[`${m.id_unidad}_${m.id_turno}`] = true);
      }

      // 3. Fetch Controles (Checklist)
      const { data: chkRes } = await supabase.from('controles').select('id_unidad, id_turno, flu_agua').eq('fecha', fecha);
      const cMap: Record<string, boolean> = {};
      if (chkRes) {
        chkRes.forEach(c => {
          cMap[`${c.id_unidad}_${c.id_turno}`] = true;
        });
      }
      setMecanicosMap(mMap);
      setChecklistsMap(cMap);
      // 4. Fetch presentacion from diagramaciones
      const localP = localStorage.getItem(`presentacion_${fecha}`);
      if (localP) setPresentacionMap(JSON.parse(localP));
      else setPresentacionMap({});

      setIsLoading(false);
    }
    loadData();
  }, [fecha]);

  const filteredTurnos = useMemo(() => {
    return turnosBase.filter(t => {
      const search = searchTerm.toLowerCase();
      return (t.cod_turno?.toLowerCase().includes(search)) || 
             (t.conductor_principal?.toLowerCase().includes(search));
    });
  }, [turnosBase, searchTerm]);

  const handleMarcarPresente = (cod_turno: string) => {
    const horaStr = new Date().toTimeString().substring(0, 5);
    setPresentacionMap(prev => {
      const next = { ...prev, [cod_turno]: horaStr };
      localStorage.setItem(`presentacion_${fecha}`, JSON.stringify(next));
      return next;
    });
  };

  const handleNovedad = async (t: any) => {
    const prevNov = t.observaciones || '';
    const nov = prompt('Ingrese novedad para el turno ' + t.cod_turno + ':', prevNov);
    if (nov !== null) {
      // Save to diagramaciones
      const { error } = await supabase.from('diagramaciones').update({ observaciones: nov }).eq('fecha', fecha).eq('cod_turno', t.cod_turno);
      if (!error) {
         setTurnosBase(prev => prev.map(x => x.cod_turno === t.cod_turno ? { ...x, observaciones: nov } : x));
      }
    }
  };

  return (
    <>
      <Header title="Control Garita" subtitle="Consolidación de Salidas">
        <button
          onClick={() => window.print()}
          className="print:hidden flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Imprimir Planilla</span>
        </button>
      </Header>
      <div className="flex-1 p-6 overflow-y-auto bg-slate-50 print:hidden">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Fecha</label>
                <input 
                  type="date" 
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="border border-slate-300 rounded px-3 py-2 focus:border-blue-500 text-sm font-bold" 
                />
              </div>
            </div>
            
            <div className="relative w-full md:w-96">
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar turno o conductor..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 text-sm"
              />
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">H. Presentación</th>
                  <th className="px-4 py-3">H. Salida Base</th>
                  <th className="px-4 py-3">Turno</th>
                  <th className="px-4 py-3">Unidad</th>
                  <th className="px-4 py-3">Conductor Principal</th>
                  <th className="px-4 py-3 text-center">Mecánico</th>
                  <th className="px-4 py-3 text-center">Checklist</th>
                  <th className="px-4 py-3 text-center">Presentación</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTurnos.map(t => {
                  // We need to resolve id_unidad and id_turno for maps, but diagramaciones only has string fields right now.
                  // For UI prototype, we can assume the maps just check if they exist.
                  const mechOk = t.unidad_id && t.turno_id ? mecanicosMap[`${t.unidad_id}_${t.turno_id}`] : false;
                  const chkOk = t.unidad_id && t.turno_id ? checklistsMap[`${t.unidad_id}_${t.turno_id}`] : false;
                  const pres = presentacionMap[t.cod_turno];

                  return (
                    <tr key={t.cod_turno} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        {t.hora_presentacion || '-'}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        {t.hora_salida_base || '-'}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{t.cod_turno}</td>
                      <td className="px-4 py-3 font-bold text-[#5c6bc0]">{t.unidad}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{t.conductor_principal}</td>
                      
                      {/* Semáforo Mecánico */}
                      <td className="px-4 py-3 text-center">
                        {mechOk ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> Mecánico OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase">
                            <span className="w-2 h-2 rounded-full bg-slate-400 mr-1.5"></span> Pendiente
                          </span>
                        )}
                      </td>

                      {/* Semáforo Checklist */}
                      <td className="px-4 py-3 text-center">
                        {chkOk ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> Checklist OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase">
                            <span className="w-2 h-2 rounded-full bg-slate-400 mr-1.5"></span> Pendiente
                          </span>
                        )}
                      </td>

                      {/* Semáforo Presentación */}
                      <td className="px-4 py-3 text-center">
                        {pres ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> {pres} hs
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleMarcarPresente(t.cod_turno)}
                            className="px-3 py-1 bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold uppercase hover:bg-rose-200 transition-colors"
                          >
                            AUSENTE - MARCAR
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => handleNovedad(t)}
                          className={`px-2 py-1 ${t.observaciones ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'} text-white rounded text-xs font-bold`}
                        >
                          {t.observaciones ? 'Ver Novedad' : 'Novedad'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredTurnos.length === 0 && !isLoading && (
              <div className="p-8 text-center text-slate-500">
                No hay turnos con salida desde base para esta fecha.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Area */}
      <div className="hidden print:block absolute inset-0 bg-white p-4">
        <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-2">
          <div className="w-32 text-left leading-tight"><h2 className="text-2xl font-black text-blue-800 tracking-tighter italic">A.Buttini</h2><p className="text-[7px] font-bold text-red-600">EMPRESA E HIJOS S.R.L.</p></div>
          <h1 className="text-xl font-bold uppercase tracking-wider">Registro de Presentación Diaria de Conductores</h1>
          <div className="w-32 text-right text-xs">
            <p className="font-bold">AÑO {fecha.substring(0,4)}</p>
            <p className="font-bold">REVISIÓN 1</p>
          </div>
        </div>
        <div className="flex justify-between mb-4 text-sm font-bold uppercase">
          <div>DIA HÁBIL / SÁBADO / DOMINGO</div>
          <div>FECHA: {fecha.split('-').reverse().join('/')}</div>
        </div>
        <table className="w-full text-[10px] border-collapse border border-black text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-black p-1 w-24">CHOFER</th>
              <th className="border border-black p-1 w-12">LEGAJO</th>
              <th className="border border-black p-1 w-16">HORARIO DE PRESENTACION</th>
              <th className="border border-black p-1 w-20">PRESENTACION REAL</th>
              <th className="border border-black p-1 w-16">HORARIO SALIDA BASE</th>
              <th className="border border-black p-1 w-16">HORA SALIDA TERMINAL</th>
              <th className="border border-black p-1 w-12">COCHE</th>
              <th className="border border-black p-1">SERVICIO / TURNO</th>
              <th className="border border-black p-1 w-16">FIRMA CHOFER</th>
              <th className="border border-black p-1 w-16">HORARIO FIN DE SERVICIO</th>
              <th className="border border-black p-1 w-16">HORARIO REGRESO A BASE APROX.</th>
              <th className="border border-black p-1 w-20">HORARIO REGRESO A BASE REAL</th>
              <th className="border border-black p-1 w-16">FIRMA GARITA</th>
            </tr>
          </thead>
          <tbody>
            {filteredTurnos.map(t => (
              <tr key={t.cod_turno} className="h-8">
                <td className="border border-black p-1 font-bold whitespace-nowrap overflow-hidden text-ellipsis text-left">{t.conductor_principal}</td>
                <td className="border border-black p-1 font-bold">{t.legajo}</td>
                <td className="border border-black p-1">{t.hora_presentacion}</td>
                <td className="border border-black p-1">{presentacionMap[t.cod_turno] || ''}</td>
                <td className="border border-black p-1">{t.hora_salida_base}</td>
                <td className="border border-black p-1">{t.hora_inicio}</td>
                <td className="border border-black p-1 font-bold">{t.unidad}</td>
                <td className="border border-black p-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{t.cod_turno} {t.turno_label}</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1">{t.hora_fin}</td>
                <td className="border border-black p-1">{t.hora_llegada_base}</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

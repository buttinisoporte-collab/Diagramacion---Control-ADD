import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import { Printer, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ControlGarita() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [turnosBase, setTurnosBase] = useState<any[]>([]);
  const [mecanicosMap, setMecanicosMap] = useState<Record<string, boolean>>({});
  const [checklistsMap, setChecklistsMap] = useState<Record<string, boolean>>({});
  const [anyMecanicoChecked, setAnyMecanicoChecked] = useState<Record<string, boolean>>({});
  const [anyChecklistChecked, setAnyChecklistChecked] = useState<Record<string, boolean>>({});
  const [presentacionMap, setPresentacionMap] = useState<Record<string, any>>({});
  const [salidaMap, setSalidaMap] = useState<Record<string, any>>({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      // Initialize defaults
      let diagRes: any[] = [];
      let turnosRes: any[] = [];
      let conductRes: any[] = [];
      let flotaRes: any[] = [];
      let loadedTuristicos: any[] = [];

      // 1. Fetch Diagramaciones & Nomad tables if supabase exists
      if (supabase) {
        try {
          const { data: dRes } = await supabase.from('diagramaciones').select('*').eq('fecha', fecha);
          if (dRes) diagRes = dRes;

          const { data: tRes } = await supabase.from('turnos').select('*').ilike('salida', '%BASE%');
          if (tRes) turnosRes = tRes;

          const { data: cRes } = await supabase.from('nomina_conductores').select('apellido_nombre, legajo');
          if (cRes) conductRes = cRes;

          const { data: fRes } = await supabase.from('flota_activa').select('id_unidad, unidad');
          if (fRes) flotaRes = fRes;

          const { data: stRes } = await supabase.from('servicios_turisticos').select('*').eq('fecha', fecha);
          if (stRes) loadedTuristicos = stRes;
        } catch (e) {
          console.error('Error fetching data from Supabase:', e);
        }
      }

      // Merge with localStorage for local/fallback support
      const localST = localStorage.getItem('app_servicios_turisticos');
      const allLocalST: any[] = localST ? JSON.parse(localST) : [];
      const dayLocalST = allLocalST.filter((s: any) => s.fecha === fecha);

      const mergedSTMap = new Map<string, any>();
      loadedTuristicos.forEach(s => mergedSTMap.set(s.id, s));
      dayLocalST.forEach(s => {
        if (!mergedSTMap.has(s.id)) {
          mergedSTMap.set(s.id, s);
        }
      });
      const finalTuristicos = Array.from(mergedSTMap.values());

      const legajoMap: Record<string, string> = {};
      conductRes.forEach(c => {
        legajoMap[c.apellido_nombre] = c.legajo;
      });
      
      const flotaMap: Record<string, string> = {};
      flotaRes.forEach(f => {
        if (f.unidad) flotaMap[f.unidad] = f.id_unidad;
      });

      const turnosFiltrados = diagRes.filter(d => turnosRes.some(t => t.cod_turno === d.cod_turno));

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
          legajo: d.conductor_principal ? legajoMap[d.conductor_principal] : '',
          isTuristico: false
        };
      });

      const enrichedTuristicos = finalTuristicos.map(s => {
        // Calculate presentation time as 30 minutes before departure
        let hPresentacion = '';
        if (s.hora_salida) {
          const parts = s.hora_salida.split(':');
          if (parts.length >= 2) {
            let hh = parseInt(parts[0], 10);
            let mm = parseInt(parts[1], 10);
            mm -= 30;
            if (mm < 0) {
              mm += 60;
              hh -= 1;
              if (hh < 0) {
                hh += 24;
              }
            }
            hPresentacion = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
          }
        }

        const formatTimeShort = (timeStr: string) => {
          if (!timeStr) return '';
          const parts = timeStr.split(':');
          return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr;
        };

        const hSalida = formatTimeShort(s.hora_salida);
        const hRegreso = formatTimeShort(s.hora_regreso);

        return {
          id: s.id,
          fecha: s.fecha,
          cod_turno: 'TURÍSTICO',
          unidad: s.unidad,
          unidad_id: s.unidad ? flotaMap[s.unidad] : undefined,
          conductor_principal: s.conductor,
          legajo: s.conductor ? legajoMap[s.conductor] : '',
          hora_presentacion: hPresentacion,
          hora_salida_base: hSalida,
          hora_inicio: hSalida,
          hora_fin: hRegreso,
          hora_llegada_base: hRegreso,
          turno_label: s.destino, // Using destino as description
          observaciones: s.observaciones || '',
          isTuristico: true
        };
      });

      const combined = [...enrichedTurnos, ...enrichedTuristicos];
      combined.sort((a, b) => (a.hora_presentacion || '').localeCompare(b.hora_presentacion || ''));
      setTurnosBase(combined);

      // 2. Fetch Control Mecanico
      let mecRes: any[] = [];
      if (supabase) {
        try {
          const { data } = await supabase.from('control_mecanico').select('id_unidad, id_turno').eq('fecha', fecha);
          if (data) mecRes = data;
        } catch (e) {
          console.error(e);
        }
      }
      const mMap: Record<string, boolean> = {};
      const anyMec: Record<string, boolean> = {};
      mecRes.forEach(m => {
        mMap[`${m.id_unidad}_${m.id_turno}`] = true;
        if (m.id_unidad) anyMec[m.id_unidad] = true;
      });

      // 3. Fetch Controles (Checklist)
      let chkRes: any[] = [];
      if (supabase) {
        try {
          const { data } = await supabase.from('controles').select('id_unidad, id_turno, flu_agua').eq('fecha', fecha);
          if (data) chkRes = data;
        } catch (e) {
          console.error(e);
        }
      }
      const cMap: Record<string, boolean> = {};
      const anyChk: Record<string, boolean> = {};
      chkRes.forEach(c => {
        cMap[`${c.id_unidad}_${c.id_turno}`] = true;
        if (c.id_unidad) anyChk[c.id_unidad] = true;
      });

      setMecanicosMap(mMap);
      setChecklistsMap(cMap);
      setAnyMecanicoChecked(anyMec);
      setAnyChecklistChecked(anyChk);

      // 4. Fetch presentacion & salida from diagramaciones, servicios_turisticos and localStorage
      const pMap: Record<string, any> = {};
      const sMap: Record<string, any> = {};

      // Populate from loaded diagramaciones rows
      enrichedTurnos.forEach((d: any) => {
        const presVal = d.hora_presentacion_real || d.presentacion_real;
        if (presVal) {
          pMap[d.cod_turno] = presVal;
        }
        if (d.hora_salida_real) {
          sMap[d.cod_turno] = d.hora_salida_real;
        }
      });

      // Populate from loaded turisticos rows
      enrichedTuristicos.forEach((s: any) => {
        const presVal = s.hora_presentacion_real || s.presentacion_real;
        if (presVal) {
          pMap[`ST_${s.id}`] = presVal;
        }
        if (s.hora_salida_real) {
          sMap[`ST_${s.id}`] = s.hora_salida_real;
        }
      });

      // Merge local diagramacion data
      const localDiag = localStorage.getItem(`diagramacion_${fecha}`);
      if (localDiag) {
        try {
          const parsed = JSON.parse(localDiag);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              const val = item.hora_presentacion_real || item.presentacion_real;
              if (val && item.cod_turno) {
                pMap[item.cod_turno] = val;
              }
              if (item.hora_salida_real && item.cod_turno) {
                sMap[item.cod_turno] = item.hora_salida_real;
              }
            });
          }
        } catch (e) {}
      }

      // Merge explicit presentacion_{fecha} local map
      const localP = localStorage.getItem(`presentacion_${fecha}`);
      if (localP) {
        try {
          const parsed = JSON.parse(localP);
          Object.assign(pMap, parsed);
        } catch (e) {}
      }
      
      const localS = localStorage.getItem(`salida_${fecha}`);
      if (localS) {
        try {
          const parsed = JSON.parse(localS);
          Object.assign(sMap, parsed);
        } catch (e) {}
      }

      setPresentacionMap(pMap);
      setSalidaMap(sMap);

      setIsLoading(false);
    }
    loadData();
  }, [fecha]);

  const filteredTurnos = useMemo(() => {
    return turnosBase.filter(t => {
      const search = searchTerm.toLowerCase();
      return (t.cod_turno?.toLowerCase().includes(search)) || 
             (t.conductor_principal?.toLowerCase().includes(search)) ||
             (t.turno_label?.toLowerCase().includes(search));
    });
  }, [turnosBase, searchTerm]);

  const handleMarcarPresente = async (t: any) => {
    const presKey = t.isTuristico ? `ST_${t.id}` : t.cod_turno;
    const horaStr = new Date().toTimeString().substring(0, 5);

    // Update state and local storage immediately
    setPresentacionMap(prev => {
      const next = { ...prev, [presKey]: horaStr };
      localStorage.setItem(`presentacion_${fecha}`, JSON.stringify(next));
      return next;
    });

    // Update Supabase if available
    if (supabase) {
      try {
        if (t.isTuristico) {
          const { error } = await supabase
            .from('servicios_turisticos')
            .update({ 
              hora_presentacion_real: horaStr,
              presentacion_real: horaStr 
            })
            .eq('id', t.id);
          if (error) console.warn('Error updating turistico presentacion in Supabase:', error.message);
        } else {
          const { error } = await supabase
            .from('diagramaciones')
            .update({ 
              hora_presentacion_real: horaStr,
              presentacion_real: horaStr 
            })
            .eq('fecha', fecha)
            .eq('cod_turno', t.cod_turno);

          if (error) {
            console.warn('Error updating diagramaciones presentacion in Supabase, attempting upsert:', error.message);
            await supabase
              .from('diagramaciones')
              .upsert({
                fecha,
                cod_turno: t.cod_turno,
                unidad: t.unidad || null,
                conductor_principal: t.conductor_principal || null,
                hora_presentacion_real: horaStr,
                presentacion_real: horaStr,
                updated_at: new Date().toISOString()
              }, { onConflict: 'fecha,cod_turno' });
          }
        }
      } catch (err) {
        console.error('Failed to persist presentation time to Supabase:', err);
      }
    }

    // Update local storage fallback structures
    if (t.isTuristico) {
      const local = localStorage.getItem('app_servicios_turisticos');
      if (local) {
        try {
          const list = JSON.parse(local);
          const updated = list.map((item: any) => item.id === t.id ? { ...item, hora_presentacion_real: horaStr, presentacion_real: horaStr } : item);
          localStorage.setItem('app_servicios_turisticos', JSON.stringify(updated));
        } catch (e) {}
      }
    } else {
      const localKey = `diagramacion_${fecha}`;
      const localData = localStorage.getItem(localKey);
      let list: any[] = localData ? JSON.parse(localData) : [];
      const idx = list.findIndex((item: any) => item.cod_turno === t.cod_turno);
      if (idx >= 0) {
        list[idx] = { ...list[idx], hora_presentacion_real: horaStr, presentacion_real: horaStr };
      } else {
        list.push({ cod_turno: t.cod_turno, hora_presentacion_real: horaStr, presentacion_real: horaStr });
      }
      localStorage.setItem(localKey, JSON.stringify(list));
    }
  };

  const handleDesmarcarPresente = async (t: any) => {
    const presKey = t.isTuristico ? `ST_${t.id}` : t.cod_turno;

    setPresentacionMap(prev => {
      const next = { ...prev };
      delete next[presKey];
      localStorage.setItem(`presentacion_${fecha}`, JSON.stringify(next));
      return next;
    });

    if (supabase) {
      try {
        if (t.isTuristico) {
          await supabase
            .from('servicios_turisticos')
            .update({ hora_presentacion_real: null, presentacion_real: null })
            .eq('id', t.id);
        } else {
          await supabase
            .from('diagramaciones')
            .update({ hora_presentacion_real: null, presentacion_real: null })
            .eq('fecha', fecha)
            .eq('cod_turno', t.cod_turno);
        }
      } catch (err) {
        console.error('Failed to clear presentation time in Supabase:', err);
      }
    }

    if (t.isTuristico) {
      const local = localStorage.getItem('app_servicios_turisticos');
      if (local) {
        try {
          const list = JSON.parse(local);
          const updated = list.map((item: any) => item.id === t.id ? { ...item, hora_presentacion_real: null, presentacion_real: null } : item);
          localStorage.setItem('app_servicios_turisticos', JSON.stringify(updated));
        } catch (e) {}
      }
    } else {
      const localKey = `diagramacion_${fecha}`;
      const localData = localStorage.getItem(localKey);
      if (localData) {
        try {
          let list: any[] = JSON.parse(localData);
          list = list.map((item: any) => item.cod_turno === t.cod_turno ? { ...item, hora_presentacion_real: null, presentacion_real: null } : item);
          localStorage.setItem(localKey, JSON.stringify(list));
        } catch (e) {}
      }
    }
  };

  const handleMarcarSalida = async (t: any) => {
    const salKey = t.isTuristico ? `ST_${t.id}` : t.cod_turno;
    const horaStr = new Date().toTimeString().substring(0, 5);

    // Update state and local storage immediately
    setSalidaMap(prev => {
      const next = { ...prev, [salKey]: horaStr };
      localStorage.setItem(`salida_${fecha}`, JSON.stringify(next));
      return next;
    });

    // Update Supabase if available
    if (supabase) {
      try {
        if (t.isTuristico) {
          const { error } = await supabase
            .from('servicios_turisticos')
            .update({ 
              hora_salida_real: horaStr 
            })
            .eq('id', t.id);
          if (error) console.warn('Error updating turistico salida in Supabase:', error.message);
        } else {
          const { error } = await supabase
            .from('diagramaciones')
            .update({ 
              hora_salida_real: horaStr 
            })
            .eq('fecha', fecha)
            .eq('cod_turno', t.cod_turno);

          if (error) {
            console.warn('Error updating diagramaciones salida in Supabase, attempting upsert:', error.message);
            await supabase
              .from('diagramaciones')
              .upsert({
                fecha,
                cod_turno: t.cod_turno,
                unidad: t.unidad || null,
                conductor_principal: t.conductor_principal || null,
                hora_salida_real: horaStr,
                updated_at: new Date().toISOString()
              }, { onConflict: 'fecha,cod_turno' });
          }
        }
      } catch (err) {
        console.error('Failed to persist salida time to Supabase:', err);
      }
    }

    // Update local storage fallback structures
    if (t.isTuristico) {
      const local = localStorage.getItem('app_servicios_turisticos');
      if (local) {
        try {
          const list = JSON.parse(local);
          const updated = list.map((item: any) => item.id === t.id ? { ...item, hora_salida_real: horaStr } : item);
          localStorage.setItem('app_servicios_turisticos', JSON.stringify(updated));
        } catch (e) {}
      }
    } else {
      const localKey = `diagramacion_${fecha}`;
      const localData = localStorage.getItem(localKey);
      let list: any[] = localData ? JSON.parse(localData) : [];
      const idx = list.findIndex((item: any) => item.cod_turno === t.cod_turno);
      if (idx >= 0) {
        list[idx] = { ...list[idx], hora_salida_real: horaStr };
      } else {
        list.push({ cod_turno: t.cod_turno, hora_salida_real: horaStr });
      }
      localStorage.setItem(localKey, JSON.stringify(list));
    }
  };

  const handleDesmarcarSalida = async (t: any) => {
    const salKey = t.isTuristico ? `ST_${t.id}` : t.cod_turno;

    setSalidaMap(prev => {
      const next = { ...prev };
      delete next[salKey];
      localStorage.setItem(`salida_${fecha}`, JSON.stringify(next));
      return next;
    });

    if (supabase) {
      try {
        if (t.isTuristico) {
          await supabase
            .from('servicios_turisticos')
            .update({ hora_salida_real: null })
            .eq('id', t.id);
        } else {
          await supabase
            .from('diagramaciones')
            .update({ hora_salida_real: null })
            .eq('fecha', fecha)
            .eq('cod_turno', t.cod_turno);
        }
      } catch (err) {
        console.error('Failed to clear salida time in Supabase:', err);
      }
    }

    if (t.isTuristico) {
      const local = localStorage.getItem('app_servicios_turisticos');
      if (local) {
        try {
          const list = JSON.parse(local);
          const updated = list.map((item: any) => item.id === t.id ? { ...item, hora_salida_real: null } : item);
          localStorage.setItem('app_servicios_turisticos', JSON.stringify(updated));
        } catch (e) {}
      }
    } else {
      const localKey = `diagramacion_${fecha}`;
      const localData = localStorage.getItem(localKey);
      if (localData) {
        try {
          let list: any[] = JSON.parse(localData);
          list = list.map((item: any) => item.cod_turno === t.cod_turno ? { ...item, hora_salida_real: null } : item);
          localStorage.setItem(localKey, JSON.stringify(list));
        } catch (e) {}
      }
    }
  };

  const handleNovedad = async (t: any) => {
    const prevNov = t.observaciones || '';
    const label = t.isTuristico ? `Servicio Turístico a ${t.turno_label}` : `turno ${t.cod_turno}`;
    const nov = prompt('Ingrese novedad para el ' + label + ':', prevNov);
    if (nov !== null) {
      if (t.isTuristico) {
        if (supabase) {
          const { error } = await supabase.from('servicios_turisticos').update({ observaciones: nov }).eq('id', t.id);
          if (error) console.warn('Supabase update failed, fallback to local storage:', error.message);
        }
        // Fallback or update local storage
        const local = localStorage.getItem('app_servicios_turisticos');
        if (local) {
          const list = JSON.parse(local);
          const updated = list.map((item: any) => item.id === t.id ? { ...item, observaciones: nov } : item);
          localStorage.setItem('app_servicios_turisticos', JSON.stringify(updated));
        }
        setTurnosBase(prev => prev.map(x => x.id === t.id ? { ...x, observaciones: nov } : x));
      } else {
        if (supabase) {
          const { error } = await supabase.from('diagramaciones').update({ observaciones: nov }).eq('fecha', fecha).eq('cod_turno', t.cod_turno);
          if (error) {
            console.warn('Error updating diagramaciones in Supabase, attempting upsert:', error.message);
            await supabase.from('diagramaciones').upsert({
              fecha,
              cod_turno: t.cod_turno,
              unidad: t.unidad || null,
              conductor_principal: t.conductor_principal || null,
              observaciones: nov,
              updated_at: new Date().toISOString()
            }, { onConflict: 'fecha,cod_turno' });
          }
        }
        
        // Update local storage fallback structure
        const localKey = `diagramacion_${fecha}`;
        const localData = localStorage.getItem(localKey);
        let list: any[] = localData ? JSON.parse(localData) : [];
        const idx = list.findIndex((item: any) => item.cod_turno === t.cod_turno);
        if (idx >= 0) {
          list[idx] = { ...list[idx], observaciones: nov };
        } else {
          list.push({ cod_turno: t.cod_turno, observaciones: nov });
        }
        localStorage.setItem(localKey, JSON.stringify(list));

        setTurnosBase(prev => prev.map(x => (x.cod_turno === t.cod_turno && !x.isTuristico) ? { ...x, observaciones: nov } : x));
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
                  <th className="px-4 py-3 text-center">Salida</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTurnos.map(t => {
                  const mechOk = t.isTuristico 
                    ? (t.unidad_id ? anyMecanicoChecked[t.unidad_id] : false)
                    : (t.unidad_id && t.turno_id ? mecanicosMap[`${t.unidad_id}_${t.turno_id}`] : false);
                    
                  const chkOk = t.isTuristico 
                    ? (t.unidad_id ? anyChecklistChecked[t.unidad_id] : false)
                    : (t.unidad_id && t.turno_id ? checklistsMap[`${t.unidad_id}_${t.turno_id}`] : false);

                  const presKey = t.isTuristico ? `ST_${t.id}` : t.cod_turno;
                  const pres = presentacionMap[presKey];
                  const sal = salidaMap[presKey];

                  return (
                    <tr key={presKey} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        {t.hora_presentacion || '-'}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        {t.hora_salida_base || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {t.isTuristico ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                            TURÍSTICO
                          </span>
                        ) : (
                          <span className="font-bold text-slate-900">{t.cod_turno}</span>
                        )}
                        {t.isTuristico && t.turno_label && (
                          <span className="block text-[10px] text-slate-500 font-medium mt-0.5 max-w-[150px] truncate" title={t.turno_label}>
                            Destino: {t.turno_label}
                          </span>
                        )}
                      </td>
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
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> {pres} hs
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDesmarcarPresente(t)}
                              title="Desmarcar presentación"
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => handleMarcarPresente(t)}
                            className="px-3 py-1 bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold uppercase hover:bg-rose-200 transition-colors"
                          >
                            AUSENTE - MARCAR
                          </button>
                        )}
                      </td>

                      {/* Semáforo Salida */}
                      <td className="px-4 py-3 text-center">
                        {sal ? (
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase">
                              <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span> {sal} hs
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDesmarcarSalida(t)}
                              title="Desmarcar salida"
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => handleMarcarSalida(t)}
                            className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-bold uppercase hover:bg-slate-200 transition-colors"
                          >
                            MARCAR SALIDA
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
              <th className="border border-black p-1 w-20">SALIDA REAL</th>
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
            {filteredTurnos.map(t => {
              const presKey = t.isTuristico ? `ST_${t.id}` : t.cod_turno;
              return (
                <tr key={presKey} className="h-8">
                  <td className="border border-black p-1 font-bold whitespace-nowrap overflow-hidden text-ellipsis text-left">{t.conductor_principal}</td>
                  <td className="border border-black p-1 font-bold">{t.legajo}</td>
                  <td className="border border-black p-1">{t.hora_presentacion}</td>
                  <td className="border border-black p-1">{presentacionMap[presKey] || ''}</td>
                  <td className="border border-black p-1">{t.hora_salida_base}</td>
                  <td className="border border-black p-1">{salidaMap[presKey] || ''}</td>
                  <td className="border border-black p-1">{t.hora_inicio}</td>
                  <td className="border border-black p-1 font-bold">{t.unidad}</td>
                  <td className="border border-black p-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">
                    {t.isTuristico ? `TURÍSTICO: ${t.turno_label}` : `${t.cod_turno} ${t.turno_label || ''}`}
                  </td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1">{t.hora_fin}</td>
                  <td className="border border-black p-1">{t.hora_llegada_base}</td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

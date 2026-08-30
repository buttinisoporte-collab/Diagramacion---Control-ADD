import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import { Printer, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const formatTime = (timeStr?: string) => {
  if (!timeStr) return '-';
  const parts = timeStr.split(':');
  if (parts.length >= 2) return parts[0] + ':' + parts[1];
  return timeStr;
};

export default function ControlGarita() {
  const getLocalDate = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const [fecha, setFecha] = useState(getLocalDate());
  const isToday = fecha === getLocalDate();
  const { user } = useAuth();
  const canEdit = isToday || user?.rol === 'Administrador';
  const [turnosBase, setTurnosBase] = useState<any[]>([]);
  const [turnosBaseAyer, setTurnosBaseAyer] = useState<any[]>([]);
  const [mecanicosMap, setMecanicosMap] = useState<Record<string, boolean>>({});
  const [checklistsMap, setChecklistsMap] = useState<Record<string, boolean>>({});
  const [anyMecanicoChecked, setAnyMecanicoChecked] = useState<Record<string, boolean>>({});
  const [anyChecklistChecked, setAnyChecklistChecked] = useState<Record<string, boolean>>({});
  const [presentacionMap, setPresentacionMap] = useState<Record<string, any>>({});
  const [salidaMap, setSalidaMap] = useState<Record<string, any>>({});
  

  const [activeTab, setActiveTab] = useState<'salidas' | 'llegadas'>('salidas');
  const [mecanicosList, setMecanicosList] = useState<any[]>([]);
  const [auxiliosList, setAuxiliosList] = useState<any[]>([]);
  const [llegadasMap, setLlegadasMap] = useState<Record<string, any>>({});
  const [llegadasAuxiliosMap, setLlegadasAuxiliosMap] = useState<Record<string, any>>({});
  const [llegadasAuxiliadasMap, setLlegadasAuxiliadasMap] = useState<Record<string, any>>({});
  const [verificaciones, setVerificaciones] = useState<any[]>([]);
  const [verifStateMap, setVerifStateMap] = useState<Record<string, any>>({});
  const [editedTimes, setEditedTimes] = useState<Record<string, string>>({});
  
    const handleSaveVerifToDB = async (v: any, field: string, value: string) => {
    if (!canEdit) return;
    if (supabase) {
      const { error } = await supabase.from('diagramaciones')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('fecha', v.fecha || fecha)
        .eq('cod_turno', v.cod_turno);
      if (error) {
        console.warn('Error updating verificacion in Supabase:', error.message);
      } else {
        // Optimistic update locally
        setVerificaciones(prev => prev.map(item => item.cod_turno === v.cod_turno ? { ...item, [field]: value } : item));
      }
    }
  };

  const getVerifUnitState = (v: any, unit: string) => {
    let parsed: any = {};
    try {
      if (v.observaciones && v.observaciones.startsWith('{')) {
        parsed = JSON.parse(v.observaciones);
      }
    } catch (e) {}
    return parsed[unit] || {};
  };

  const handleSaveVerifUnitToDB = async (v: any, unit: string, field: string, value: string) => {
    if (!canEdit) return;
    
    let parsed: any = {};
    try {
      if (v.observaciones && v.observaciones.startsWith('{')) {
        parsed = JSON.parse(v.observaciones);
      } else if (v.observaciones) {
        parsed = { _general: v.observaciones };
      }
    } catch (e) {}
    
    if (!parsed[unit]) parsed[unit] = {};
    parsed[unit][field] = value;
    
    const newVal = JSON.stringify(parsed);
    
    if (supabase) {
      const { error } = await supabase.from('diagramaciones')
        .update({ observaciones: newVal, updated_at: new Date().toISOString() })
        .eq('fecha', v.fecha || fecha)
        .eq('cod_turno', v.cod_turno);
      if (error) {
        console.warn('Error updating verificacion in Supabase:', error.message);
      } else {
        setVerificaciones(prev => prev.map(item => item.cod_turno === v.cod_turno ? { ...item, observaciones: newVal } : item));
      }
    } else {
      setVerificaciones(prev => prev.map(item => item.cod_turno === v.cod_turno ? { ...item, observaciones: newVal } : item));
    }
  };
  
  const handleNovedadVerifUnit = async (v: any, unit: string) => {
    if (!canEdit) {
      const st = getVerifUnitState(v, unit);
      alert("Solo se pueden editar las novedades en la fecha actual.\n\nNovedad registrada: " + (st.novedades || 'Ninguna.'));
      return;
    }
    const st = getVerifUnitState(v, unit);
    const prevNov = st.novedades || '';
    const nov = prompt('Ingrese novedad para la verificación de Unidad ' + unit + ':', prevNov);
    if (nov !== null) {
      handleSaveVerifUnitToDB(v, unit, 'novedades', nov);
    }
  };

  const [auxiliosBase, setAuxiliosBase] = useState<any[]>([]);
  const [auxiliosTerminal, setAuxiliosTerminal] = useState<any[]>([]);

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
      let loadedFeriados: any[] = [];

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


          const { data: mRes } = await supabase.from('nomina_mecanicos').select('apellido_nombre');
          if (mRes) setMecanicosList(mRes.map((m: any) => m.apellido_nombre));

          const lastWeekDate = new Date(new Date(fecha).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const { data: auxRes } = await supabase.from('auxilios').select('*').gte('fecha', lastWeekDate).lte('fecha', fecha);
          if (auxRes) {
            const filteredAux = auxRes.filter((aux: any) => {
              if (aux.fecha === fecha) return true;
              let arrived = false;
              let d = new Date(aux.fecha + "T00:00:00");
              const end = new Date(fecha + "T00:00:00");
              while (d < end) { // Check dates STRICTLY BEFORE the currently viewed date
                const checkDateStr = d.toISOString().split('T')[0];
                const local = localStorage.getItem(`llegada_aux_${checkDateStr}`);
                if (local) {
                   try {
                     const parsed = JSON.parse(local);
                     if (parsed[aux.id || aux.created_at]) {
                       arrived = true;
                       break;
                     }
                   } catch(e){}
                }
                d.setDate(d.getDate() + 1);
              }
              return !arrived;
            });
            setAuxiliosList(filteredAux);
          }

          const { data: stRes } = await supabase.from('servicios_turisticos').select('*').eq('fecha', fecha);
          if (stRes) loadedTuristicos = stRes;

          const { data: feriadosRes } = await supabase.from('feriados').select('*');
          if (feriadosRes) loadedFeriados = feriadosRes;
        } catch (e) {
          console.error('Error fetching data from Supabase:', e);
        }
      }

      // Merge with localStorage for local/fallback support
      const localFeriados = localStorage.getItem('ext_store_feriados');
      if (localFeriados) {
        try { loadedFeriados = JSON.parse(localFeriados); } catch (e) {}
      }

      // Merge with localStorage for local/fallback support
      // Check local storage for llegadas
      const localLlegadas = localStorage.getItem(`llegada_${fecha}`);
      if (localLlegadas) {
        try { setLlegadasMap(JSON.parse(localLlegadas)); } catch (e) {}
      }
      
      const localLlegadasAux = localStorage.getItem(`llegada_aux_${fecha}`);
      if (localLlegadasAux) {
        try { setLlegadasAuxiliosMap(JSON.parse(localLlegadasAux)); } catch (e) {}
      }
      const localLlegadasAuxiliada = localStorage.getItem(`llegada_auxiliada_${fecha}`);
      if (localLlegadasAuxiliada) {
        try { setLlegadasAuxiliadasMap(JSON.parse(localLlegadasAuxiliada)); } catch (e) {}
      }

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

      const dateObj = new Date(fecha + "T12:00:00");
      const day = dateObj.getDay(); // 0 = Sunday
      const isHoliday = loadedFeriados.some(f => f.fecha === fecha);

      // Deduplicate turnosRes by normalized cod_turno
      const seenCodesGarita = new Set<string>();
      turnosRes = turnosRes.filter(t => {
        const c = String(t.cod_turno || '').trim().toLowerCase();
        if (!c || seenCodesGarita.has(c)) return false;
        seenCodesGarita.add(c);
        return true;
      });

      const turnosDeFecha = turnosRes.filter(t => {
        if (t.es_refuerzo) {
          return (t.dias_refuerzo || []).includes(fecha);
        }

        const f = String(t.frecuencia || '').toLowerCase().trim();
        let matchesFrec = false;
        if (!f) matchesFrec = true;
        else if (isHoliday) {
          if (f.includes('domingo') || f.includes('feriado')) matchesFrec = true;
        } else if (day === 0) {
          if (f.includes('domingo') || f.includes('feriado') || f.includes('fin de semana')) matchesFrec = true;
        } else if (day === 6) {
          if (f.includes('sabado') || f.includes('sábado') || f.includes('fin de semana') || f.includes('lunes a sabado') || f.includes('lunes a sábado')) matchesFrec = true;
        } else if (day >= 1 && day <= 5) {
          if (f.includes('habil') || f.includes('hábil') || f.includes('lunes a viernes') || f.includes('lunes a sabado') || f.includes('lunes a sábado')) matchesFrec = true;
        }

        if (f.includes('diario') || f.includes('todos los d')) matchesFrec = true;

        return matchesFrec;
      });

      // Merge local diagramacion data so it appears even if not in DB yet
      const localDiagStorage = localStorage.getItem(`diagramacion_${fecha}`);
      if (localDiagStorage) {
        try {
          const list = JSON.parse(localDiagStorage);
          list.forEach((item: any) => {
            const idx = diagRes.findIndex(x => x.cod_turno === item.cod_turno);
            if (idx >= 0) {
              diagRes[idx] = { ...diagRes[idx], ...item };
            } else {
              diagRes.push({ fecha, cod_turno: item.cod_turno, ...item });
            }
          });
        } catch(e) {}
      }

      const enrichedTurnos = turnosDeFecha.map(t => {
        const d = diagRes.find(x => x.cod_turno === t.cod_turno) || {};
        return {
          ...d,
          cod_turno: t.cod_turno,
          turno_id: t.id_turno,
          unidad_id: d.unidad ? flotaMap[d.unidad] : undefined,
          hora_presentacion: t.hora_presentacion,
          hora_salida_base: t.hora_salida_base,
          hora_inicio: t.hora_inicio,
          hora_fin: t.hora_fin,
          hora_llegada_base: t.hora_llegada_base,
          turno_label: t.turno,
          legajo: d.conductor_principal ? legajoMap[d.conductor_principal] : '',
          isTuristico: false
        };
      });

      const enrichedTuristicos = finalTuristicos.map(s => {
        // extract [F_LLEGADA:]
        let fLlegada = s.fecha;
        const m = (s.observaciones || '').match(/\[F_LLEGADA:(.*?)\]/);
        if (m) fLlegada = m[1];
        
        return {
          id: s.id,
          cod_turno: s.id.substring(0, 8).toUpperCase(),
          hora_presentacion: s.hora_salida,
          hora_salida: s.hora_salida,
          hora_fin: s.hora_regreso,
          hora_llegada_base: s.hora_regreso,
          turno_label: s.destino,
          conductor_principal: s.conductor,
          unidad: s.unidad,
          observaciones: (s.observaciones || '').replace(/\[F_LLEGADA:.*?\]/g, '').trim(),
          isTuristico: true,
          fecha_llegada_esperada: fLlegada
        };
      });

      let combined = [...enrichedTurnos, ...enrichedTuristicos];
      
      const bAux = combined.filter((t: any) => t.turno_label && (t.turno_label.toLowerCase().includes('auxilio base') || t.turno_label.toLowerCase().includes('auxilio en base') || t.turno_label.toLowerCase() === 'aux base'));
      const tAux = combined.filter((t: any) => t.turno_label && (t.turno_label.toLowerCase().includes('auxilio terminal') || t.turno_label.toLowerCase().includes('auxilio en terminal') || t.turno_label.toLowerCase() === 'aux term'));
      
      const vTech = combined.filter((t: any) => t.turno_label && t.turno_label.toLowerCase().includes('verificaci'));
      
      combined = combined.filter((t: any) => !(t.turno_label && (t.turno_label.toLowerCase().includes('auxilio base') || t.turno_label.toLowerCase().includes('auxilio en base') || t.turno_label.toLowerCase() === 'aux base' || t.turno_label.toLowerCase().includes('auxilio terminal') || t.turno_label.toLowerCase().includes('auxilio en terminal') || t.turno_label.toLowerCase() === 'aux term' || t.turno_label.toLowerCase().includes('verificaci'))));

      combined.sort((a, b) => (a.hora_presentacion || '').localeCompare(b.hora_presentacion || ''));
      setTurnosBase(combined);

      // --- FETCH AYER FOR LLEGADAS ---
      let diagResAyer = [];
      const yesterdayObj = new Date(dateObj.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterdayObj.toISOString().split('T')[0];
      if (supabase) {
        try {
          const { data: dResAyer } = await supabase.from('diagramaciones').select('*').eq('fecha', yesterdayStr);
          if (dResAyer) diagResAyer = dResAyer;
        } catch(e) {}
      }

      const localDiagStorageAyer = localStorage.getItem(`diagramacion_${yesterdayStr}`);
      if (localDiagStorageAyer) {
        try {
          const list = JSON.parse(localDiagStorageAyer);
          list.forEach((item: any) => {
            const idx = diagResAyer.findIndex(x => x.cod_turno === item.cod_turno);
            if (idx >= 0) {
              diagResAyer[idx] = { ...diagResAyer[idx], ...item };
            } else {
              diagResAyer.push({ fecha: yesterdayStr, cod_turno: item.cod_turno, ...item });
            }
          });
        } catch(e) {}
      }

      const dayAyer = yesterdayObj.getDay();
      const isHolidayAyer = loadedFeriados.some(f => f.fecha === yesterdayStr);
      
      // Deduplicate turnosDeAyer by normalized cod_turno
      const seenAyerCodes = new Set<string>();
      const turnosDeAyer = turnosRes.filter(t => {
        // Only care about cross-midnight turnos
        if (!(t.hora_llegada_base && t.hora_salida_base && t.hora_llegada_base < t.hora_salida_base)) return false;

        const c = String(t.cod_turno || '').trim().toLowerCase();
        if (!c || seenAyerCodes.has(c)) return false;
        seenAyerCodes.add(c);

        if (t.es_refuerzo) {
          return (t.dias_refuerzo || []).includes(yesterdayStr);
        }

        const f = String(t.frecuencia || '').toLowerCase().trim();
        let matchesFrec = false;
        if (!f) matchesFrec = true;
        else if (isHolidayAyer) {
          if (f.includes('domingo') || f.includes('feriado')) matchesFrec = true;
        } else if (dayAyer === 0) {
          if (f.includes('domingo') || f.includes('feriado') || f.includes('fin de semana')) matchesFrec = true;
        } else if (dayAyer === 6) {
          if (f.includes('sabado') || f.includes('sábado') || f.includes('fin de semana') || f.includes('lunes a sabado') || f.includes('lunes a sábado')) matchesFrec = true;
        } else if (dayAyer >= 1 && dayAyer <= 5) {
          if (f.includes('habil') || f.includes('hábil') || f.includes('lunes a viernes') || f.includes('lunes a sabado') || f.includes('lunes a sábado')) matchesFrec = true;
        }
        if (f.includes('diario') || f.includes('todos los d')) matchesFrec = true;
        
        return matchesFrec;
      });

      const enrichedTurnosAyer = turnosDeAyer.map(t => {
        const d = diagResAyer.find(x => x.cod_turno === t.cod_turno) || {};
        return {
          ...d,
          cod_turno: t.cod_turno,
          turno_id: t.id_turno,
          unidad_id: d.unidad ? flotaMap[d.unidad] : undefined,
          hora_presentacion: t.hora_presentacion,
          hora_salida_base: t.hora_salida_base,
          hora_inicio: t.hora_inicio,
          hora_fin: t.hora_fin,
          hora_llegada_base: t.hora_llegada_base,
          turno_label: t.turno,
          legajo: d.conductor_principal ? legajoMap[d.conductor_principal] : '',
          isTuristico: false,
          isYesterday: true,
          fecha_salida: yesterdayStr
        };
      });

      // Fetch turisticos ayer
      let turisticosAyer = [];
      if (supabase) {
        try {
          const { data: stResAyer } = await supabase.from('servicios_turisticos').select('*').eq('fecha', yesterdayStr);
          if (stResAyer) turisticosAyer = turisticosAyer.concat(stResAyer);
          
          // Also fetch explicitly those that arrive today but departed earlier
          const { data: stLlegadas } = await supabase.from('servicios_turisticos').select('*').ilike('observaciones', `%[F_LLEGADA:${fecha}]%`);
          if (stLlegadas) {
             const existingIds = new Set(turisticosAyer.map(t => t.id));
             stLlegadas.forEach(t => {
               if (t.fecha !== fecha && !existingIds.has(t.id)) {
                 turisticosAyer.push(t);
               }
             });
          }
        } catch(e) {}
      }
      const enrichedTuristicosAyer = turisticosAyer.filter(t => {
        const m = (t.observaciones || '').match(/\[F_LLEGADA:(.*?)\]/);
        if (m) {
          return m[1] === fecha;
        }
        // Fallback: if no F_LLEGADA is set, it arrives today if it departed yesterday and hora_regreso < hora_salida
        return t.fecha === yesterdayStr && t.hora_regreso && t.hora_salida && t.hora_regreso < t.hora_salida;
      }).map(t => ({
        id: t.id,
        cod_turno: t.id.substring(0, 8).toUpperCase(),
        turno_label: t.destino,
        unidad: t.unidad,
        conductor_principal: t.conductor,
        hora_salida_base: t.hora_salida,
        hora_llegada_base: t.hora_regreso,
        hora_presentacion: t.hora_salida,
        isTuristico: true,
        isYesterday: true,
        fecha_salida: t.fecha,
        observaciones: (t.observaciones || '').replace(/\[F_LLEGADA:.*?\]/g, '').trim()
      }));
      
      setTurnosBaseAyer([...enrichedTurnosAyer, ...enrichedTuristicosAyer].filter(t => {
        return !(t.turno_label && (t.turno_label.toLowerCase().includes('auxilio base') || t.turno_label.toLowerCase().includes('auxilio en base') || t.turno_label.toLowerCase() === 'aux base' || t.turno_label.toLowerCase().includes('auxilio terminal') || t.turno_label.toLowerCase().includes('auxilio en terminal') || t.turno_label.toLowerCase() === 'aux term' || t.turno_label.toLowerCase().includes('verificaci')));
      }));
      // --- END FETCH AYER ---

      setAuxiliosBase(bAux);
      setAuxiliosTerminal(tAux);
      setVerificaciones(vTech);

      // 2. Fetch Control Mecanico
      let mecRes: any[] = [];
      if (supabase) {
        try {
          const { data } = await supabase.from('control_mecanico').select('id_unidad, id_turno, turnos(cod_turno)').eq('fecha', fecha);
          if (data) mecRes = data;
        } catch (e) {
          console.error(e);
        }
      }
      const mMap: Record<string, boolean> = {};
      const anyMec: Record<string, boolean> = {};
      mecRes.forEach(m => {
        mMap[`${m.id_unidad}_${m.id_turno}`] = true;
        const cTurno = m.turnos?.cod_turno;
        if (cTurno) anyMec[cTurno] = true;
      });

      // 3. Fetch Controles (Checklist)
      let chkRes: any[] = [];
      if (supabase) {
        try {
          const { data } = await supabase.from('controles').select('id_unidad, id_turno, flu_agua, turnos(cod_turno)').eq('fecha', fecha);
          if (data) chkRes = data;
        } catch (e) {
          console.error(e);
        }
      }
      const cMap: Record<string, boolean> = {};
      const anyChk: Record<string, boolean> = {};
      chkRes.forEach(c => {
        cMap[`${c.id_unidad}_${c.id_turno}`] = true;
        const cTurno = c.turnos?.cod_turno;
        if (cTurno) anyChk[cTurno] = true;
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
             (t.unidad?.toLowerCase().includes(search)) ||
             (t.turno_label?.toLowerCase().includes(search));
    });
  }, [turnosBase, searchTerm]);

    const filteredTurnosLlegadas = useMemo(() => {
    return [...turnosBaseAyer, ...turnosBase].filter(t => {
      if (t.isTuristico) {
        if (!t.isYesterday && t.fecha_llegada_esperada && t.fecha_llegada_esperada !== fecha) {
          return false; // Arrives on a different day
        }
      } else {
        const startsBeforeArrives = t.hora_inicio && t.hora_llegada_base && t.hora_llegada_base < t.hora_inicio;
        if (startsBeforeArrives) {
          if (!t.isYesterday) return false; // Arrives tomorrow, don't show today
        } else {
          if (t.isYesterday) return false; // Arrived yesterday, don't show today
        }
      }
      const search = searchTerm.toLowerCase();
      return (t.cod_turno?.toLowerCase().includes(search)) || 
             (t.conductor_principal?.toLowerCase().includes(search)) ||
             (t.unidad?.toLowerCase().includes(search)) ||
             (t.turno_label?.toLowerCase().includes(search));
    }).sort((a, b) => {
      const hA = a.hora_llegada_base || a.hora_llegada_verificacion || '';
      const hB = b.hora_llegada_base || b.hora_llegada_verificacion || '';
      return hA.localeCompare(hB);
    });
  }, [turnosBase, turnosBaseAyer, searchTerm]);

  const handleMarcarPresente = async (t: any, customTime?: string) => {
    if (!canEdit) return;
    const presKey = t.isTuristico ? `ST_${t.id}` : t.cod_turno;
    const horaStr = customTime || new Date().toTimeString().substring(0, 5);

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
    if (!canEdit) return;
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

  const handleMarcarSalida = async (t: any, customTime?: string) => {
    if (!canEdit) return;
    const salKey = t.isTuristico ? `ST_${t.id}` : t.cod_turno;
    const horaStr = customTime || new Date().toTimeString().substring(0, 5);

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

  const handleLlegada = async (t: any, timeValue: string) => {
    if (!canEdit) return;
    const key = t.isTuristico ? `ST_${t.id}` : t.cod_turno;
    setLlegadasMap(prev => {
      const next = { ...prev, [key]: timeValue };
      localStorage.setItem(`llegada_${fecha}`, JSON.stringify(next));
      return next;
    });
    if (supabase) {
      try {
        if (t.isTuristico) {
          await supabase
            .from('servicios_turisticos')
            .update({ hora_llegada_real: timeValue }) // Assuming a field for this or just update
            .eq('id', t.id);
        } else {
          await supabase
            .from('diagramaciones')
            .update({ llegada: timeValue })
            .eq('fecha', fecha)
            .eq('cod_turno', t.cod_turno);
        }
      } catch (e) {}
    }
  };
    const handleAuxilioLlegadaAuxiliada = async (id: string, timeValue: string) => {
    if (!canEdit) return;
    setLlegadasAuxiliadasMap(prev => {
      const next = { ...prev, [id]: timeValue };
      localStorage.setItem(`llegada_auxiliada_${fecha}`, JSON.stringify(next));
      return next;
    });
    if (supabase) {
      try {
        await supabase
          .from('auxilios')
          .update({ hora_llegada_auxiliada: timeValue })
          .eq('id', id);
      } catch (e) {}
    }
  };

  const handleAuxilioLlegada = async (id: string, timeValue: string) => {
    if (!canEdit) return;
    setLlegadasAuxiliosMap(prev => {
      const next = { ...prev, [id]: timeValue };
      localStorage.setItem(`llegada_aux_${fecha}`, JSON.stringify(next));
      return next;
    });
    if (supabase) {
      try {
        await supabase
          .from('auxilios')
          .update({ hora_llegada_base: timeValue })
          .eq('id', id);
      } catch (e) {}
    }
  };

  const handleDesmarcarSalida = async (t: any) => {
    if (!canEdit) return;
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

    const handleNovedadAuxilio = async (a: any) => {
    if (!canEdit) {
      alert("Solo se pueden editar las novedades en la fecha actual (o con rol Administrador).\n\nNovedad registrada: " + (a.observaciones || 'Ninguna.'));
      return;
    }
    const prevNov = a.observaciones || '';
    const nov = prompt('Ingrese novedad para el auxilio (Unidad ' + (a.unidad_reemplazo || '-') + '):', prevNov);
    if (nov !== null) {
      if (supabase) {
        let query = supabase.from('auxilios').update({ observaciones: nov });
        if (a.id) query = query.eq('id', a.id);
        else query = query.eq('created_at', a.created_at);
        const { error } = await query;
        if (error) console.warn('Error updating auxilio novedad in Supabase:', error.message);
      }
      setAuxiliosBase(prev => prev.map(x => (x.id === a.id && x.created_at === a.created_at) ? { ...x, observaciones: nov } : x));
      setAuxiliosTerminal(prev => prev.map(x => (x.id === a.id && x.created_at === a.created_at) ? { ...x, observaciones: nov } : x));
      // Reload is tricky because auxiliosList is derived from combined, so let's just trigger loadData
      
    }
  };

  const handleNovedad = async (t: any) => {
    if (!canEdit) {
      alert("Solo se pueden editar las novedades en la fecha actual (o con rol Administrador).\n\nNovedad registrada: " + (t.observaciones || 'Ninguna.'));
      return;
    }
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
      <Header title="Control Garita" subtitle="Consolidación de Garita">
        <button
          onClick={() => window.print()}
          className="print:hidden flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Imprimir Planilla</span>
        </button>
      </Header>

      <div className="flex-1 p-6 flex flex-col min-h-0 bg-slate-50 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col flex-1 min-h-0 w-full space-y-4">
          
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Fecha</label>
                <input 
                  type="date" 
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 text-sm font-bold" 
                />
              </div>
              
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('salidas')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${activeTab === 'salidas' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Salidas
                </button>
                <button
                  onClick={() => setActiveTab('llegadas')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${activeTab === 'llegadas' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Llegadas
                </button>
              </div>
            </div>
            
            <div className="relative w-full md:w-80">
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar..." 
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-500 text-sm"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>

          {activeTab === 'salidas' && (
            <div className="flex flex-col flex-1 min-h-0 space-y-3">
              {/* Turnos Base */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col flex-1 min-h-[200px]">
                <div className="bg-slate-50 border-b border-slate-200 px-2 py-1.5 text-xs flex-shrink-0">
                  <h3 className="font-bold text-slate-700 text-sm">Turnos (Salida Base)</h3>
                </div>
                <div className="overflow-auto flex-1 bg-white relative">
                  <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 uppercase text-[10px] font-bold shadow-sm">
                      <tr>
                        <th className="px-2 py-1.5 text-xs bg-slate-50">H. Presentación</th>
                        <th className="px-2 py-1.5 text-xs bg-slate-50">H. Salida Base</th>
                        <th className="px-2 py-1.5 text-xs bg-slate-50">Turno</th>
                        <th className="px-2 py-1.5 text-xs bg-slate-50">Unidad</th>
                        <th className="px-2 py-1.5 text-xs bg-slate-50">Conductor Principal</th>
                        <th className="px-2 py-1.5 text-xs bg-slate-50 text-center">Mecánico</th>
                        <th className="px-2 py-1.5 text-xs bg-slate-50 text-center">Checklist</th>
                        <th className="px-2 py-1.5 text-xs bg-slate-50 text-center">Presentación</th>
                        <th className="px-2 py-1.5 text-xs bg-slate-50 text-center">Salida</th>
                        <th className="px-2 py-1.5 text-xs bg-slate-50 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTurnos.map((t, idx) => {
                        const hasCond = !!t.conductor_principal;
                        const mechOk = anyMecanicoChecked[t.cod_turno];
                        const chkOk = anyChecklistChecked[t.cod_turno];
                        const pres = presentacionMap[t.cod_turno];
                        const sal = salidaMap[t.cod_turno];
                        const isRowReady = hasCond && mechOk && chkOk;
                        
                        return (
                          <tr key={t.isTuristico ? `ST_${t.id}_${t.isYesterday?'ayer':'hoy'}_${idx}` : `${t.cod_turno}_${t.isYesterday?'ayer':'hoy'}_${idx}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <td className="px-2 py-1.5 text-xs font-mono font-bold text-slate-700">{formatTime(t.hora_presentacion)}</td>
                            <td className="px-2 py-1.5 text-xs font-mono font-bold text-slate-700">{formatTime(t.hora_salida_base)}</td>
                            <td className="px-2 py-1.5"><div className="flex flex-col"><span className="font-bold text-slate-900">{t.cod_turno}</span>{t.turno_label && t.turno_label !== t.cod_turno && (<span className="text-[10px] text-slate-500 font-medium leading-tight">{t.turno_label}</span>)}</div></td>
                            <td className="px-2 py-1.5 text-xs font-bold text-[#5c6bc0]">{t.unidad || '-'}</td>
                            <td className="px-2 py-1.5 text-xs font-medium text-slate-700">{t.conductor_principal || '-'}</td>
                            
                            <td className="px-2 py-1.5 text-xs text-center">
                              {mechOk ? (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> OK
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase">
                                  <span className="w-2 h-2 rounded-full bg-slate-400 mr-1.5"></span> Pendiente
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-xs text-center">
                              {chkOk ? (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> OK
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase">
                                  <span className="w-2 h-2 rounded-full bg-slate-400 mr-1.5"></span> Pendiente
                                </span>
                              )}
                            </td>
                            
                            <td className="px-2 py-1.5 text-xs text-center">
                              {pres ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input 
    type="time" 
    disabled={!canEdit}
    value={editedTimes['pres-'+(t.isTuristico ? t.id : t.cod_turno)] !== undefined ? editedTimes['pres-'+(t.isTuristico ? t.id : t.cod_turno)] : (typeof pres === 'string' ? pres : (pres?.time || ''))}
    onChange={(e) => setEditedTimes(prev => ({...prev, ['pres-'+(t.isTuristico ? t.id : t.cod_turno)]: e.target.value}))}
    className="w-[75px] text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 rounded px-1 py-1 font-bold text-center" 
  />
  {canEdit && (
    <button 
      onClick={() => {
        const val = editedTimes['pres-'+(t.isTuristico ? t.id : t.cod_turno)] || (typeof pres === 'string' ? pres : (pres?.time || ''));
        if(val) handleMarcarPresente(t, val);
      }} 
                                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 uppercase"
                                    >
                                      OK
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button 
                                   
                                  disabled={!canEdit}
                                  onClick={() => handleMarcarPresente(t)} 
                                  className={`px-3 py-1 border rounded text-[10px] font-bold uppercase transition-colors ${!canEdit ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50' : 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200'}`}
                                >
                                  AUSENTE - MARCAR
                                </button>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-xs text-center">
                              {sal ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input 
    type="time" 
    disabled={!canEdit}
    value={editedTimes['sal-'+(t.isTuristico ? t.id : t.cod_turno)] !== undefined ? editedTimes['sal-'+(t.isTuristico ? t.id : t.cod_turno)] : (typeof sal === 'string' ? sal : (sal?.time || ''))}
    onChange={(e) => setEditedTimes(prev => ({...prev, ['sal-'+(t.isTuristico ? t.id : t.cod_turno)]: e.target.value}))}
    className="w-[75px] text-xs border border-blue-300 bg-blue-50 text-blue-700 rounded px-1 py-1 font-bold text-center" 
  />
  {canEdit && (
    <button 
      onClick={() => {
        const val = editedTimes['sal-'+(t.isTuristico ? t.id : t.cod_turno)] || (typeof sal === 'string' ? sal : (sal?.time || ''));
        if(val) handleMarcarSalida(t, val);
      }} 
                                      className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700 uppercase"
                                    >
                                      OK
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button 
                                   
                                  disabled={!pres || !canEdit}
                                  onClick={() => handleMarcarSalida(t)} 
                                  className={`px-3 py-1 border rounded text-[10px] font-bold uppercase transition-colors ${(!pres || !canEdit) ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'}`}
                                >
                                  MARCAR SALIDA
                                </button>
                              )}
                            </td>
                            
                            <td className="px-2 py-1.5 text-xs text-center min-w-[120px]">
                              <button 
                                onClick={() => handleNovedad(t)}
                                className={`px-3 py-1 ${t.observaciones ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'} text-white rounded text-xs font-bold w-full max-w-[100px]`}
                              >
                                {t.observaciones ? 'Ver Novedad' : 'Novedad'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Verificaciones Tecnicas */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                <div className="bg-blue-50 border-b border-blue-100 px-2 py-1.5 text-xs">
                  <h3 className="font-bold text-blue-800 text-sm">Verificación Técnica</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-2 py-1.5 text-xs">Turno</th>
                        <th className="px-2 py-1.5 text-xs">Unidad</th>
                        <th className="px-2 py-1.5 text-xs">Conductor</th>
                        <th className="px-2 py-1.5 text-xs">Hora Salida</th>
                        <th className="px-2 py-1.5 text-xs">Mecánico a Cargo</th>
                        <th className="px-2 py-1.5 text-xs">Novedades</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {verificaciones.length === 0 ? (
                        <tr><td colSpan={5} className="px-2 py-3 text-center text-xs text-slate-400">Sin unidades a verificar</td></tr>
                      ) : (
                        (() => {
                        const allUnits: { cod: string; unit: string; original: any }[] = [];
                        verificaciones.forEach(v => {
                          if (v.unidad) {
                            const units = v.unidad.split(',').map((u: string) => u.trim()).filter(Boolean);
                            units.forEach((u: string, idx: number) => {
                              allUnits.push({ cod: `${v.cod_turno}-${idx}`, unit: u, original: v });
                            });
                          } else {
                            allUnits.push({ cod: `${v.cod_turno}-0`, unit: '-', original: v });
                          }
                        });
                        
                        return allUnits.map((uInfo, idx) => {
                          const v = uInfo.original;
                          const cod = uInfo.cod;
                          const unit = uInfo.unit;
                          const st = getVerifUnitState(v, unit);
                          
                          const hSalida = editedTimes['vsalida-' + cod] !== undefined ? editedTimes['vsalida-' + cod] : (st.hora_salida || '');
                          return (
                            <tr key={`vtech-${cod}-${idx}`} className="border-b border-blue-100 bg-blue-50/30 hover:bg-blue-50">
                              <td className="px-2 py-1.5 text-xs font-bold text-blue-800">Verificación Técnica</td>
                              <td className="px-2 py-1.5 text-xs font-bold text-[#5c6bc0]">{unit}</td>
                              <td className="px-2 py-1.5 text-xs font-medium text-slate-700">{v.conductor_principal || '-'}</td>
                              <td className="px-2 py-1.5 text-xs">
                                {unit !== '-' ? (st.hora_salida ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> {formatTime(st.hora_salida)} hs
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <input 
                                      type="time" 
                                      disabled={!canEdit} 
                                      value={hSalida} 
                                      onChange={(e) => setEditedTimes(prev => ({...prev, ['vsalida-' + cod]: e.target.value}))}
                                      className="w-[80px] text-xs border border-slate-300 rounded px-2 py-1" 
                                    />
                                    <button disabled={!canEdit} onClick={() => {
                                      if(hSalida) handleSaveVerifUnitToDB(v, unit, 'hora_salida', hSalida);
                                    }} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${canEdit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>OK</button>
                                    <button disabled={!canEdit} onClick={() => {
                                      handleSaveVerifUnitToDB(v, unit, 'hora_salida', new Date().toTimeString().substring(0, 5));
                                    }} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${canEdit ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Ya</button>
                                  </div>
                                )) : <span className="text-slate-400">-</span>}
                              </td>
                              <td className="px-2 py-1.5 text-xs">
                                {unit !== '-' ? (<select value={st.mecanico || ''} onChange={(e) => handleSaveVerifUnitToDB(v, unit, 'mecanico', e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1 w-full min-w-[160px]">
                                  <option value="">-- Seleccionar --</option>
                                  {mecanicosList.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>) : <span className="text-slate-400">-</span>}
                              </td>
                              <td className="px-2 py-1.5 text-xs text-center">
                                <button 
                                  onClick={() => handleNovedadVerifUnit(v, unit)}
                                  className={`px-3 py-1 ${st.novedades ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'} text-white rounded text-xs font-bold w-full max-w-[100px]`}
                                >
                                  {st.novedades ? 'Ver Novedad' : 'Novedad'}
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Informative Auxilios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0">
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <h3 className="font-bold text-slate-700 text-sm border-b pb-1.5 mb-1.5">Auxilio en Base (Info)</h3>
                  {auxiliosBase.length > 0 ? auxiliosBase.map((a, idx) => <div key={a.id ? `bAux-${a.id}-${idx}` : `${a.cod_turno}_${idx}`} className="text-sm font-mono">{a.unidad}</div>) : <div className="text-xs text-slate-400">Sin unidades</div>}
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <h3 className="font-bold text-slate-700 text-sm border-b pb-1.5 mb-1.5">Auxilio en Terminal SR (Info)</h3>
                  {auxiliosTerminal.length > 0 ? auxiliosTerminal.map((a, idx) => <div key={a.id ? `bAux-${a.id}-${idx}` : `${a.cod_turno}_${idx}`} className="text-sm font-mono">{a.unidad}</div>) : <div className="text-xs text-slate-400">Sin unidades</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'llegadas' && (
            <div className="flex flex-col flex-1 min-h-0 space-y-3">
              {/* Turnos Base Llegadas */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col flex-1 min-h-[200px]">
                <div className="bg-slate-50 border-b border-slate-200 px-2 py-1.5 text-xs flex-shrink-0">
                  <h3 className="font-bold text-slate-700 text-sm">Consolidación de Llegadas (Turnos)</h3>
                </div>
                <div className="overflow-auto flex-1 bg-white relative">
                  <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 uppercase text-[10px] font-bold shadow-sm">
                      <tr>
                        <th className="px-2 py-1.5 text-xs bg-slate-50">Turno</th>
                        <th className="px-2 py-1.5 text-xs bg-slate-50">Unidad</th>
                        <th className="px-2 py-1.5 text-xs bg-slate-50">Conductor Principal</th>
                        <th className="px-2 py-1.5 text-xs bg-slate-50">Hora Salida</th>
                        <th className="px-2 py-1.5 text-xs bg-slate-50">Hora Llegada a Base</th>
                        <th className="px-2 py-1.5 text-xs bg-slate-50">Novedades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTurnosLlegadas.map((t, idx) => {
                        const llegKey = t.isTuristico ? `ST_${t.id}` : t.cod_turno;
                        const lleg = llegadasMap[llegKey] || t.hora_llegada_verificacion;
                        return (
                          <tr key={t.isTuristico ? `ST_${t.id}_${t.isYesterday?'ayer':'hoy'}_${idx}` : `${t.cod_turno}_${t.isYesterday?'ayer':'hoy'}_${idx}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <td className="px-2 py-1.5"><div className="flex flex-col"><span className="font-bold text-slate-900">{t.cod_turno}</span>{t.turno_label && t.turno_label !== t.cod_turno && (<span className="text-[10px] text-slate-500 font-medium leading-tight">{t.turno_label}</span>)}</div></td>
                            <td className="px-2 py-1.5 text-xs font-bold text-[#5c6bc0]">{t.unidad || '-'}</td>
                            <td className="px-2 py-1.5 text-xs font-medium text-slate-700">{t.conductor_principal || '-'}</td>
                            <td className="px-2 py-1.5 text-xs font-bold text-slate-600">
                              {t.isYesterday && t.fecha_salida ? <span className="mr-1 text-[10px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded">{t.fecha_salida.split('-')[2]}/{t.fecha_salida.split('-')[1]}</span> : null}
                              {t.hora_salida_base || '-'}
                            </td>
                            <td className="px-2 py-1.5 text-xs">
                              {lleg ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input 
    type="time" 
    disabled={!canEdit}
    value={editedTimes['llegada-'+(t.isTuristico ? t.id : t.cod_turno)] !== undefined ? editedTimes['llegada-'+(t.isTuristico ? t.id : t.cod_turno)] : (typeof lleg === 'string' ? lleg : (lleg?.time || ''))}
    onChange={(e) => setEditedTimes(prev => ({...prev, ['llegada-'+(t.isTuristico ? t.id : t.cod_turno)]: e.target.value}))}
    className="w-[75px] text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 rounded px-1 py-1 font-bold text-center" 
  />
  {canEdit && (
    <button 
      onClick={() => {
        const val = editedTimes['llegada-'+(t.isTuristico ? t.id : t.cod_turno)] || (typeof lleg === 'string' ? lleg : (lleg?.time || ''));
        if(val) handleLlegada(t, val);
      }} 
                                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 uppercase"
                                    >
                                      OK
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
  <input 
    type="time" 
    disabled={!canEdit} 
    value={editedTimes['llegada-'+(t.isTuristico ? t.id : t.cod_turno)] || ''}
    onChange={(e) => setEditedTimes(prev => ({...prev, ['llegada-'+(t.isTuristico ? t.id : t.cod_turno)]: e.target.value}))}
    className="w-[90px] text-xs border border-slate-300 rounded px-2 py-1" 
  />
  <button disabled={!canEdit} onClick={() => {
    const val = editedTimes['llegada-'+(t.isTuristico ? t.id : t.cod_turno)];
    if(val) handleLlegada(t, val);
  }} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${canEdit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Guardar</button>
  <button disabled={!canEdit} onClick={() => {
    handleLlegada(t, new Date().toTimeString().substring(0, 5));
  }} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${canEdit ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Ahora</button>
</div>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-xs">
                              <button 
                                onClick={() => handleNovedad(t)}
                                className={`px-3 py-1 ${t.observaciones ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'} text-white rounded text-xs font-bold w-full max-w-[120px]`}
                              >
                                {t.observaciones ? 'Ver Novedad' : 'Novedad'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Verificaciones Tecnicas Llegadas */}
                      
                      {(() => {
                        const allUnits: { cod: string; unit: string; original: any }[] = [];
                        verificaciones.forEach(v => {
                          if (v.unidad) {
                            const units = v.unidad.split(',').map((u: string) => u.trim()).filter(Boolean);
                            units.forEach((u: string, idx: number) => {
                              allUnits.push({ cod: `${v.cod_turno}-${idx}`, unit: u, original: v });
                            });
                          } else {
                            allUnits.push({ cod: `${v.cod_turno}-0`, unit: '-', original: v });
                          }
                        });
                        
                        return allUnits.map((uInfo, idx) => {
                          const v = uInfo.original;
                          const cod = uInfo.cod;
                          const unit = uInfo.unit;
                          const st = getVerifUnitState(v, unit);
                          
                          const hLlegada = editedTimes['vllegada-' + cod] !== undefined ? editedTimes['vllegada-' + cod] : (st.hora_llegada || '');
                          return (
                            <tr key={`vllegada-${cod}-${idx}`} className="border-b border-blue-100 bg-blue-50/30 hover:bg-blue-50">
                              <td className="px-2 py-1.5"><div className="flex flex-col"><span className="font-bold text-blue-800">Verificación Técnica</span></div></td>
                              <td className="px-2 py-1.5 text-xs font-bold text-[#5c6bc0]">{unit}</td>
                              <td className="px-2 py-1.5 text-xs font-medium text-slate-700">{v.conductor_principal || '-'}</td>
                              <td className="px-2 py-1.5 text-xs font-bold text-slate-600">{st.hora_salida || '-'}</td>
                              <td className="px-2 py-1.5 text-xs">
                                {unit !== '-' ? (st.hora_llegada ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> {formatTime(st.hora_llegada)} hs
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <input 
                                      type="time" 
                                      disabled={!canEdit} 
                                      value={hLlegada}
                                      onChange={(e) => setEditedTimes(prev => ({...prev, ['vllegada-' + cod]: e.target.value}))}
                                      className="w-[80px] text-xs border border-slate-300 rounded px-2 py-1" 
                                    />
                                    <button disabled={!canEdit} onClick={() => {
                                      if(hLlegada) handleSaveVerifUnitToDB(v, unit, 'hora_llegada', hLlegada);
                                    }} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${canEdit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>OK</button>
                                    <button disabled={!canEdit} onClick={() => {
                                      handleSaveVerifUnitToDB(v, unit, 'hora_llegada', new Date().toTimeString().substring(0, 5));
                                    }} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${canEdit ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Ya</button>
                                  </div>
                                )) : <span className="text-slate-400">-</span>}
                              </td>
                              <td className="px-2 py-1.5 text-xs">
                                {unit !== '-' ? (<button 
                                  onClick={() => handleNovedadVerifUnit(v, unit)}
                                  className={`px-3 py-1 ${st.novedades ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'} text-white rounded text-xs font-bold w-full max-w-[120px]`}
                                >
                                  {st.novedades ? 'Ver Novedad' : 'Novedad'}
                                </button>) : <span className="text-slate-400">-</span>}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Auxilios Llegadas */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                <div className="bg-red-50 border-b border-red-100 px-2 py-1.5 text-xs">
                  <h3 className="font-bold text-red-800 text-sm">Unidades de Auxilio en Curso</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-2 py-1.5 text-xs">Unidad Reemplazo</th>
                        <th className="px-2 py-1.5 text-xs">Mecánico a Cargo</th>
                        <th className="px-2 py-1.5 text-xs">Hora Salida</th>
                        <th className="px-2 py-1.5 text-xs">Llegada Reemplazo</th>
                        <th className="px-2 py-1.5 text-xs">Llegada Unidad Rota</th>
                        <th className="px-2 py-1.5 text-xs">Novedades</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auxiliosList.map((a, idx) => {
                        const lleg = llegadasAuxiliosMap[a.id || a.created_at];
                        const llegAux = llegadasAuxiliadasMap[a.id || a.created_at];
                        return (
                          <tr key={a.id ? `asis-${a.id}-${idx}` : `asis-${a.created_at}-${idx}`} className="hover:bg-slate-50">
                            <td className="px-2 py-1.5 text-xs font-mono font-bold text-slate-700">{a.unidad_reemplazo || '-'}</td>
                            <td className="px-2 py-1.5 text-xs text-xs">{a.personal_mecanico || '-'}</td>
                            <td className="px-2 py-1.5 text-xs font-bold text-slate-600">
                              {a.fecha && a.fecha !== fecha ? <span className="mr-1 text-[10px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded">{a.fecha.split('-')[2]}/{a.fecha.split('-')[1]}</span> : null}
                              {a.hora_salida_mecanico || '-'}
                            </td>
                            <td className="px-2 py-1.5 text-xs">
                              {lleg ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input 
    type="time" 
    disabled={!canEdit}
    value={editedTimes['auxllegada-'+(a.id || a.created_at)] !== undefined ? editedTimes['auxllegada-'+(a.id || a.created_at)] : (typeof lleg === 'string' ? lleg : (lleg?.time || ''))}
    onChange={(e) => setEditedTimes(prev => ({...prev, ['auxllegada-'+(a.id || a.created_at)]: e.target.value}))}
    className="w-[75px] text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 rounded px-1 py-1 font-bold text-center" 
  />
  {canEdit && (
    <button 
      onClick={() => {
        const val = editedTimes['auxllegada-'+(a.id || a.created_at)] || (typeof lleg === 'string' ? lleg : (lleg?.time || ''));
        if(val) handleAuxilioLlegada(a.id || a.created_at, val);
      }} 
                                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 uppercase"
                                    >
                                      OK
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
  <input 
    type="time" 
    disabled={!canEdit} 
    value={editedTimes['auxllegada-'+(a.id || a.created_at)] || ''}
    onChange={(e) => setEditedTimes(prev => ({...prev, ['auxllegada-'+(a.id || a.created_at)]: e.target.value}))}
    className="w-[80px] text-xs border border-slate-300 rounded px-2 py-1" 
  />
  <button disabled={!canEdit} onClick={() => {
    const val = editedTimes['auxllegada-'+(a.id || a.created_at)];
    if(val) handleAuxilioLlegada(a.id || a.created_at, val);
  }} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${canEdit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>OK</button>
  <button disabled={!canEdit} onClick={() => {
    handleAuxilioLlegada(a.id || a.created_at, new Date().toTimeString().substring(0, 5));
  }} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${canEdit ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Ya</button>
</div>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-xs">
                              {llegAux ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input 
    type="time" 
    disabled={!canEdit}
    value={editedTimes['auxllegAuxada-'+(a.id || a.created_at)] !== undefined ? editedTimes['auxllegAuxada-'+(a.id || a.created_at)] : (typeof llegAux === 'string' ? llegAux : (llegAux?.time || ''))}
    onChange={(e) => setEditedTimes(prev => ({...prev, ['auxllegAuxada-'+(a.id || a.created_at)]: e.target.value}))}
    className="w-[75px] text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 rounded px-1 py-1 font-bold text-center" 
  />
  {canEdit && (
    <button 
      onClick={() => {
        const val = editedTimes['auxllegAuxada-'+(a.id || a.created_at)] || (typeof llegAux === 'string' ? llegAux : (llegAux?.time || ''));
        if(val) handleAuxilioLlegadaAuxiliada(a.id || a.created_at, val);
      }} 
                                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 uppercase"
                                    >
                                      OK
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
  <input 
    type="time" 
    disabled={!canEdit} 
    value={editedTimes['auxllegAuxada-'+(a.id || a.created_at)] || ''}
    onChange={(e) => setEditedTimes(prev => ({...prev, ['auxllegAuxada-'+(a.id || a.created_at)]: e.target.value}))}
    className="w-[80px] text-xs border border-slate-300 rounded px-2 py-1" 
  />
  <button disabled={!canEdit} onClick={() => {
    const val = editedTimes['auxllegAuxada-'+(a.id || a.created_at)];
    if(val) handleAuxilioLlegadaAuxiliada(a.id || a.created_at, val);
  }} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${canEdit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>OK</button>
  <button disabled={!canEdit} onClick={() => {
    handleAuxilioLlegadaAuxiliada(a.id || a.created_at, new Date().toTimeString().substring(0, 5));
  }} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${canEdit ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Ya</button>
</div>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-xs">
                              <button 
                                onClick={() => handleNovedadAuxilio(a)}
                                className={`px-3 py-1 ${a.observaciones ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'} text-white rounded text-xs font-bold w-full max-w-[120px]`}
                              >
                                {a.observaciones ? 'Ver Novedad' : 'Novedad'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {auxiliosList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No hay auxilios registrados para esta fecha.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Printable Area */}
      <div className="hidden print:block absolute inset-0 bg-white p-4">
        <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-2">
          <div className="w-32 text-left leading-tight"><h2 className="text-2xl font-black text-blue-800 tracking-tighter italic">A.Buttini</h2><p className="text-[7px] font-bold text-red-600">EMPRESA E HIJOS S.R.L.</p></div>
          <h1 className="text-xl font-bold uppercase tracking-wider">Registro de Garita</h1>
          <div className="w-32 text-right text-xs">
            <span className="font-bold">Fecha:</span> {new Date(fecha + "T12:00:00").toLocaleDateString('es-AR')}
          </div>
        </div>
        <p className="text-center text-xs text-slate-500 my-4">Impresión de reporte de garita no optimizada para este modo de visualización en la nueva versión por pestañas.</p>
      </div>
    </>
  );
}

import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import { Printer, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { fetchPersonalConcatenado } from '../lib/catalogoService'; 

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
  const [personalConcatenadoList, setPersonalConcatenadoList] = useState<any[]>([]);
  const [turnosBase, setTurnosBase] = useState<any[]>([]);
  const [turnosBaseAyer, setTurnosBaseAyer] = useState<any[]>([]);
  const [mecanicosMap, setMecanicosMap] = useState<Record<string, boolean>>({});
  const [checklistsMap, setChecklistsMap] = useState<Record<string, boolean>>({});
  const [anyMecanicoChecked, setAnyMecanicoChecked] = useState<Record<string, boolean>>({});
  const [anyChecklistChecked, setAnyChecklistChecked] = useState<Record<string, boolean>>({});
  const [presentacionMap, setPresentacionMap] = useState<Record<string, any>>({});
  const [salidaMap, setSalidaMap] = useState<Record<string, any>>({});
  const [datosSalidaModal, setDatosSalidaModal] = useState(false);
  const [activeAuxilioForModal, setActiveAuxilioForModal] = useState(null);
  const [activeTab, setActiveTab] = useState<'salidas' | 'llegadas'>('salidas');
  const [mecanicosList, setMecanicosList] = useState<any[]>([]);
  const [flotaList, setFlotaList] = useState<any[]>([]);
  const [auxiliosList, setAuxiliosList] = useState<any[]>([]);
  const [llegadasMap, setLlegadasMap] = useState<Record<string, any>>({});
  const [llegadasAuxiliosMap, setLlegadasAuxiliosMap] = useState<Record<string, any>>({});
  const [llegadasAuxiliadasMap, setLlegadasAuxiliadasMap] = useState<Record<string, any>>({});
  const [llegadasAsistenciaMap, setLlegadasAsistenciaMap] = useState<Record<string, any>>({});
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

      // ---> AGREGAR ESTA LLAMADA AQUÍ DENTRO DE loadData: <---
      try {
        const personalRes = await fetchPersonalConcatenado();
        setPersonalConcatenadoList(personalRes);
      } catch (err) {
        console.error("Error al cargar personal unificado:", err);
      }
      
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
          if (fRes) { flotaRes = fRes; setFlotaList(fRes); }


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
    const handleAuxilioLlegadaAsistencia = async (id: string, timeValue: string) => {
    if (!canEdit) return;
    setLlegadasAsistenciaMap(prev => {
      const next = { ...prev, [id]: timeValue };
      localStorage.setItem(`llegada_asis_${fecha}`, JSON.stringify(next));
      return next;
    });
    if (supabase) {
      try {
        await supabase.from('auxilios').update({ hora_llegada_asistencia: timeValue }).eq('id', id);
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

            {/* RESUMEN DE AUXILIOS - MODIFICACIÓN SOLICITADA */}
            <div className="flex items-center space-x-12 px-6 border-x border-slate-100">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Auxilio Base</span>
                <span className="text-sm font-bold text-indigo-700 tracking-tight">
                  {auxiliosBase.length > 0 ? auxiliosBase.map(a => a.unidad).join(', ') : '-'}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Auxilio Terminal</span>
                <span className="text-sm font-bold text-blue-600 tracking-tight">
                  {auxiliosTerminal.length > 0 ? auxiliosTerminal.map(a => a.unidad).join(', ') : '-'}
                </span>
              </div>
            </div>
            
            <div className="relative w-full md:w-64">
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

              {/* Sección Verificación Técnica */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                <div className="bg-blue-50 border-b border-blue-100 px-3 py-2 text-xs flex justify-between items-center">
                  <h3 className="font-bold text-blue-800 text-sm">Verificación Técnica</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-3 py-2">TURNO</th>
                        <th className="px-3 py-2">UNIDAD</th>
                        <th className="px-3 py-2">CONDUCTOR</th>
                        <th className="px-3 py-2">HORA SALIDA</th>
                        <th className="px-3 py-2">MECÁNICO A CARGO</th>
                        <th className="px-3 py-2 text-center">NOVEDADES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {verificaciones.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-center text-xs text-slate-400">
                            Sin unidades para verificación técnica en esta fecha.
                          </td>
                        </tr>
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

                            const hSalida = editedTimes['vsalida-' + cod] !== undefined 
                              ? editedTimes['vsalida-' + cod] 
                              : (st.hora_salida || v.hora_salida_base || '');
                            
                            const personalSeleccionado = editedTimes['personal-' + cod] !== undefined 
                              ? editedTimes['personal-' + cod] 
                              : (v.conductor_principal || '');

                            return (
                              <tr key={`vtech-${cod}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-3 py-2 text-xs font-bold text-slate-800">Verificación Técnica</td>
                                <td className="px-3 py-2 text-xs font-bold text-[#5c6bc0]">{unit}</td>
                                <td className="px-3 py-2 text-xs text-slate-500">-</td>
                                
                                {/* Hora Salida + Botón OK */}
                                <td className="px-3 py-2 text-xs">
                                  <div className="flex items-center gap-1">
                                    <input 
                                      type="time" 
                                      disabled={!canEdit}
                                      value={hSalida}
                                      onChange={(e) => setEditedTimes(prev => ({ ...prev, ['vsalida-' + cod]: e.target.value }))}
                                      className="w-[85px] text-xs border border-slate-300 rounded px-2 py-1 font-mono font-bold text-center"
                                    />
                                    {canEdit && (
                                      <button 
                                        onClick={async () => {
                                          const horaFinal = editedTimes['vsalida-' + cod] || st.hora_salida || '';
                                          const personaFinal = editedTimes['personal-' + cod] !== undefined ? editedTimes['personal-' + cod] : (v.conductor_principal || '');
                                          
                                          // Guardar en la base de datos (actualiza conductor_principal y hora de salida o estado)
                                          if (supabase) {
                                            await supabase.from('diagramaciones')
                                              .update({ 
                                                conductor_principal: personaFinal,
                                                updated_at: new Date().toISOString() 
                                              })
                                              .eq('fecha', v.fecha || fecha)
                                              .eq('cod_turno', v.cod_turno);
                                          }
                                          handleSaveVerifUnitToDB(v, unit, 'hora_salida', horaFinal);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase"
                                      >
                                        OK
                                      </button>
                                    )}
                                  </div>
                                </td>

                                {/* Mecánico a cargo (Select unificado de conductores y mecánicos) */}
                                <td className="px-3 py-2 text-xs min-w-[220px]">
                                  <select
                                    disabled={!canEdit}
                                    value={personalSeleccionado}
                                    onChange={async (e) => {
                                      const val = e.target.value;
                                      setEditedTimes(prev => ({ ...prev, ['personal-' + cod]: val }));
                                      
                                      // Guardar automáticamente en la columna conductor_principal de diagramaciones
                                      if (supabase) {
                                        const { error } = await supabase.from('diagramaciones')
                                          .update({ 
                                            conductor_principal: val,
                                            updated_at: new Date().toISOString() 
                                          })
                                          .eq('fecha', v.fecha || fecha)
                                          .eq('cod_turno', v.cod_turno);

                                        if (error) {
                                          console.warn("Error al actualizar conductor_principal en diagramaciones:", error.message);
                                        } else {
                                          // Actualizar estado local de verificaciones
                                          setVerificaciones(prev => prev.map(item => 
                                            item.cod_turno === v.cod_turno ? { ...item, conductor_principal: val } : item
                                          ));
                                        }
                                      }
                                    }}
                                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-semibold bg-white text-slate-700 focus:border-blue-500"
                                  >
                                    <option value="">-- Seleccionar personal --</option>
                                    {personalConcatenadoList.map((p, pIdx) => (
                                      <option key={`pers-${pIdx}`} value={p.value}>
                                        {p.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                {/* Botón Novedades */}
                                <td className="px-3 py-2 text-xs text-center">
                                  <button 
                                    onClick={() => handleNovedadVerifUnit(v, unit)}
                                    className={`px-3 py-1 ${st.novedades ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-slate-800'} text-white rounded text-xs font-bold`}
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
              
              {/* Salida de Auxilios */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                <div className="bg-red-50 border-b border-red-100 px-2 py-1.5 text-xs">
                  <h3 className="font-bold text-red-800 text-sm">Salida de Auxilios</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-2 py-1.5 text-xs">Unidad Rota</th>
                        <th className="px-2 py-1.5 text-xs">Mecánico a Cargo</th>
                        <th className="px-2 py-1.5 text-xs text-center">Unidad de Auxilio</th>
                        <th className="px-2 py-1.5 text-xs text-center">Hora Salida (Auxilio)</th>
                        <th className="px-2 py-1.5 text-xs text-center">Mecánico Asistencia</th>
                        <th className="px-2 py-1.5 text-xs text-center">Unidad de Asistencia</th>
                        <th className="px-2 py-1.5 text-xs text-center">Hora Salida (Asistencia)</th>
                        <th className="px-2 py-1.5 text-xs text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auxiliosList.map((a, idx) => {
                        return (
                          <tr key={a.id ? `salasis-${a.id}-${idx}` : `salasis-${a.created_at}-${idx}`} className="hover:bg-slate-50">
                            <td className="px-2 py-1.5 text-xs font-bold text-slate-700">{a.unidad || '-'}</td>
                            <td className="px-2 py-1.5 text-xs text-slate-700">{a.personal_mecanico || '-'}</td>
                            <td className="px-2 py-1.5 text-xs text-center font-bold font-mono text-slate-700">{a.unidad_reemplazo || '-'}</td>
                            <td className="px-2 py-1.5 text-xs text-center">
                              <div className="flex items-center justify-center gap-1">
                                <input 
                                  type="time" 
                                  disabled={!canEdit || !a.detalle_causa || !a.detalle_herramientas}
                                  value={editedTimes['salaux-'+a.id] !== undefined ? editedTimes['salaux-'+a.id] : (a.hora_salida_mecanico || '')}
                                  onChange={(e) => setEditedTimes(prev => ({...prev, ['salaux-'+a.id]: e.target.value}))}
                                  className="w-[80px] text-xs border border-slate-300 rounded px-2 py-1 font-mono text-center"
                                />
                                <button disabled={!canEdit || !a.detalle_causa || !a.detalle_herramientas} onClick={async () => {
                                  const timeValue = editedTimes['salaux-'+a.id];
                                  if(!timeValue) return;
                                  setAuxiliosList(prev => prev.map(x => x.id === a.id ? { ...x, hora_salida_mecanico: timeValue } : x));
                                  if (supabase) await supabase.from('auxilios').update({ hora_salida_mecanico: timeValue }).eq('id', a.id);
                                }} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${canEdit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>OK</button>
                              </div>
                            </td>
                            
                            {/* NUEVA COLUMNA: MECÁNICO ASISTENCIA */}
                            <td className="px-2 py-1.5 text-xs text-center text-slate-700 font-medium">
                              {a.mecanico_asistencia || '-'}
                            </td>

                            <td className="px-2 py-1.5 text-xs text-center font-bold font-mono text-slate-700">{a.unidad_asistencia || '-'}</td>
                            <td className="px-2 py-1.5 text-xs text-center">
                              {a.unidad_asistencia ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input 
                                    type="time" 
                                    disabled={!canEdit || !a.detalle_causa || !a.detalle_herramientas}
                                    value={editedTimes['salasis-'+a.id] !== undefined ? editedTimes['salasis-'+a.id] : (a.hora_salida_asistencia || '')}
                                    onChange={(e) => setEditedTimes(prev => ({...prev, ['salasis-'+a.id]: e.target.value}))}
                                    className="w-[80px] text-xs border border-slate-300 rounded px-2 py-1 font-mono text-center"
                                  />
                                  <button disabled={!canEdit || !a.detalle_causa || !a.detalle_herramientas} onClick={async () => {
                                    const timeValue = editedTimes['salasis-'+a.id];
                                    if(!timeValue) return;
                                    setAuxiliosList(prev => prev.map(x => x.id === a.id ? { ...x, hora_salida_asistencia: timeValue } : x));
                                    if (supabase) await supabase.from('auxilios').update({ hora_salida_asistencia: timeValue }).eq('id', a.id);
                                  }} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${canEdit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>OK</button>
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            
                            <td className="px-2 py-1.5 text-xs text-center">
                              <button onClick={() => { setActiveAuxilioForModal(a); setDatosSalidaModal(true); }} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 whitespace-nowrap">Datos Salida</button>
                            </td>
                          </tr>
                        );
                      })}
                      {auxiliosList.length === 0 && (
                        <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No hay unidades de auxilio en curso.</td></tr>
                      )}
                    </tbody>
                  </table>
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
                              {t.hora_salida || '-'}
                            </td>
                            <td className="px-2 py-1.5 text-xs">
                              <div className="flex items-center gap-1">
                                <input 
                                  type="time" 
                                  disabled={!canEdit}
                                  value={editedTimes['lleg-'+llegKey] !== undefined ? editedTimes['lleg-'+llegKey] : (lleg || '')}
                                  onChange={(e) => setEditedTimes(prev => ({...prev, ['lleg-'+llegKey]: e.target.value}))}
                                  className="w-[80px] text-xs border border-slate-300 rounded px-2 py-1"
                                />
                                <button disabled={!canEdit} onClick={() => handleLlegada(t, editedTimes['lleg-'+llegKey])} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${canEdit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>OK</button>
                              </div>
                            </td>
                            <td className="px-2 py-1.5 text-xs w-[120px]">
                              <button disabled={!canEdit} onClick={() => handleNovedad(t)} className={`px-3 py-1 ${t.observaciones ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'} text-white rounded text-xs font-bold w-full max-w-[100px]`}>{t.observaciones ? 'Ver Novedad' : 'Novedad'}</button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredTurnosLlegadas.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No hay turnos para consolidar llegadas.</td></tr>
                      )}
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
                <th className="px-2 py-1.5 text-xs">UNIDADES</th>
                <th className="px-2 py-1.5 text-xs">HORA SALIDA</th>
                <th className="px-2 py-1.5 text-xs text-center">UNIDAD AUXILIO</th>
                <th className="px-2 py-1.5 text-xs text-center">UNIDAD DE ASISTENCIA</th>
                <th className="px-2 py-1.5 text-xs text-center">NOVEDADES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auxiliosList.map((a, idx) => {
                const llegAsis = llegadasAsistenciaMap[a.id || a.created_at];
                const llegMecanico = a.hora_llegada_mecanico || '';
                const retMecanico = a.unidad_que_retorna || 'REEMPLAZO';
                
                return (
                  <tr key={a.id ? `asis-${a.id}-${idx}` : `asis-${a.created_at}-${idx}`} className="hover:bg-slate-50">
                    
                    {/* Columna UNIDADES */}
                    <td className="px-2 py-1.5 text-xs font-mono text-slate-700">
                      <div><b>Reemplazo:</b> {a.unidad_reemplazo || '-'}</div>
                      <div><b>Rota:</b> {a.unidad || '-'}</div>
                      {a.unidad_asistencia && <div><b>Asist:</b> {a.unidad_asistencia}</div>}
                    </td>

                    {/* Columna HORA SALIDA */}
                    <td className="px-2 py-1.5 text-xs text-slate-600 font-mono">
                      {a.fecha && a.fecha !== fecha ? <div className="mb-1"><span className="text-[10px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded">{a.fecha.split('-')[2]}/{a.fecha.split('-')[1]}</span></div> : null}
                      <div><b>Reemp:</b> {a.hora_salida_mecanico || '-'}</div>
                      {a.unidad_asistencia && <div><b>Asist:</b> {a.hora_salida_asistencia || '-'}</div>}
                    </td>

                    {/* Columna UNIDAD AUXILIO (Guarda hora_llegada_mecanico y unidad_retorno_mecanico) */}
                    <td className="px-2 py-1.5 text-xs text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2 mb-1 text-[10px]">
                          <label className="flex items-center gap-1 cursor-pointer font-semibold text-slate-700">
                            <input 
                              type="radio" 
                              name={`retorno-${a.id || a.created_at}`} 
                              checked={retMecanico === 'REEMPLAZO'}
                              disabled={!canEdit}
                              onChange={async () => {
                                const nuevoValor = 'REEMPLAZO';
                                // 1. Actualización optimista en el estado local
                                setAuxiliosList(prev => prev.map(x => 
                                  (x.id === a.id || (x.created_at === a.created_at && !a.id)) 
                                    ? { ...x, unidad_que_retorna: nuevoValor } 
                                    : x
                                ));
                                
                                // 2. Persistencia en Supabase usando 'unidad_que_retorna'
                                if (supabase) {
                                  let query = supabase.from('auxilios').update({ unidad_que_retorna: nuevoValor });
                                  if (a.id) query = query.eq('id', a.id);
                                  else query = query.eq('created_at', a.created_at);
                                  
                                  const { error } = await query;
                                  if (error) {
                                    console.warn('Error al guardar unidad_que_retorna en Supabase:', error.message);
                                  }
                                }
                              }}
                            /> Reemplazo
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer font-semibold text-slate-700">
                            <input 
                              type="radio" 
                              name={`retorno-${a.id || a.created_at}`} 
                              checked={retMecanico === 'ROTA'}
                              disabled={!canEdit}
                              onChange={async () => {
                                const nuevoValor = 'ROTA';
                                // 1. Actualización optimista en el estado local
                                setAuxiliosList(prev => prev.map(x => 
                                  (x.id === a.id || (x.created_at === a.created_at && !a.id)) 
                                    ? { ...x, unidad_que_retorna: nuevoValor } 
                                    : x
                                ));
                                
                                // 2. Persistencia en Supabase usando 'unidad_que_retorna'
                                if (supabase) {
                                  let query = supabase.from('auxilios').update({ unidad_que_retorna: nuevoValor });
                                  if (a.id) query = query.eq('id', a.id);
                                  else query = query.eq('created_at', a.created_at);
                                  
                                  const { error } = await query;
                                  if (error) {
                                    console.warn('Error al guardar unidad_que_retorna en Supabase:', error.message);
                                  }
                                }
                              }}
                            /> Rota
                          </label>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <input 
                            type="time" 
                            disabled={!canEdit}
                            value={editedTimes['llegmeca-'+a.id] !== undefined ? editedTimes['llegmeca-'+a.id] : (llegMecanico || '')}
                            onChange={(e) => setEditedTimes(prev => ({...prev, ['llegmeca-'+a.id]: e.target.value}))}
                            className="w-[80px] text-xs border border-slate-300 rounded px-2 py-1 font-mono text-center"
                          />
                          <button 
                            disabled={!canEdit} 
                            onClick={async () => {
                              const timeValue = editedTimes['llegmeca-'+a.id];
                              if(!timeValue) return;
                              setAuxiliosList(prev => prev.map(x => x.id === a.id ? { ...x, hora_llegada_mecanico: timeValue } : x));
                              if (supabase) {
                                await supabase.from('auxilios')
                                  .update({ hora_llegada_mecanico: timeValue })
                                  .eq('id', a.id);
                              }
                            }} 
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${canEdit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Columna UNIDAD DE ASISTENCIA (Guarda hora_llegada_asistencia) */}
                    <td className="px-2 py-1.5 text-xs text-center">
                      {a.unidad_asistencia ? (
                        <div className="flex items-center justify-center gap-1">
                          <input 
                            type="time" 
                            disabled={!canEdit}
                            value={editedTimes['llegasis-'+a.id] !== undefined ? editedTimes['llegasis-'+a.id] : (llegAsis || a.hora_llegada_asistencia || '')}
                            onChange={(e) => setEditedTimes(prev => ({...prev, ['llegasis-'+a.id]: e.target.value}))}
                            className="w-[80px] text-xs border border-slate-300 rounded px-2 py-1 font-mono text-center"
                          />
                          <button 
                            disabled={!canEdit} 
                            onClick={() => handleAuxilioLlegadaAsistencia(a.id, editedTimes['llegasis-'+a.id])} 
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${canEdit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Columna NOVEDADES (Guarda en la base de datos en el campo novedad_aux) */}
                    <td className="px-2 py-1.5 text-xs text-center w-[120px]">
                      <button 
                        disabled={!canEdit} 
                        onClick={async () => {
                          const prevNov = a.novedad_aux || '';
                          const nov = prompt('Ingrese novedad de llegada para el auxilio (Unidad ' + (a.unidad_reemplazo || a.unidad || '-') + '):', prevNov);
                          if (nov !== null) {
                            if (supabase) {
                              let query = supabase.from('auxilios').update({ novedad_aux: nov });
                              if (a.id) query = query.eq('id', a.id);
                              else query = query.eq('created_at', a.created_at);
                              const { error } = await query;
                              if (error) console.warn('Error al actualizar novedad_aux en Supabase:', error.message);
                            }
                            setAuxiliosList(prev => prev.map(x => (x.id === a.id && x.created_at === a.created_at) ? { ...x, novedad_aux: nov } : x));
                          }
                        }} 
                        className={`px-3 py-1 ${a.novedad_aux ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-slate-800'} text-white rounded text-xs font-bold w-full max-w-[100px]`}
                      >
                        {a.novedad_aux ? 'Ver Novedad' : 'Novedad'}
                      </button>
                    </td>

                  </tr>
                );
              })}
              {auxiliosList.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No hay unidades de auxilio en curso.</td></tr>
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
      {/* MODAL DATOS SALIDA */}
      {datosSalidaModal && activeAuxilioForModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Datos Salida (Auxilio {activeAuxilioForModal.unidad})</h2>
              <button onClick={() => setDatosSalidaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3 bg-blue-50/30 p-3 rounded-lg border border-blue-100">
                  <h4 className="font-bold text-blue-800 text-xs uppercase mb-2">Unidad de Reemplazo</h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Unidad Reemplazo</label>
                    <select 
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs"
                      value={activeAuxilioForModal.unidad_reemplazo || ''}
                      onChange={(e) => setActiveAuxilioForModal({...activeAuxilioForModal, unidad_reemplazo: e.target.value})}
                    >
                      <option value="">-- Sin asignar --</option>
                      {flotaList.map(f => (
                        <option key={f.id_unidad} value={f.unidad}>{f.unidad}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mecánico (Reemplazo)</label>
                    <select 
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs"
                      value={activeAuxilioForModal.personal_mecanico || ''}
                      onChange={(e) => setActiveAuxilioForModal({...activeAuxilioForModal, personal_mecanico: e.target.value})}
                    >
                      <option value="">-- Sin asignar --</option>
                      {mecanicosList.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Hora Salida (Reemplazo)</label>
                    <input 
                      type="time"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs disabled:opacity-50"
                      value={activeAuxilioForModal.hora_salida_mecanico || ''}
                      disabled={!activeAuxilioForModal.detalle_causa || !activeAuxilioForModal.detalle_herramientas}
                      onChange={(e) => setActiveAuxilioForModal({...activeAuxilioForModal, hora_salida_mecanico: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3 bg-amber-50/30 p-3 rounded-lg border border-amber-100">
                  <h4 className="font-bold text-amber-800 text-xs uppercase mb-2">Unidad de Asistencia</h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Unidad Asistencia</label>
                    <select 
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs"
                      value={activeAuxilioForModal.unidad_asistencia || ''}
                      onChange={(e) => setActiveAuxilioForModal({...activeAuxilioForModal, unidad_asistencia: e.target.value})}
                    >
                      <option value="">-- Sin asignar --</option>
                      {flotaList.map(f => (
                        <option key={f.id_unidad} value={f.unidad}>{f.unidad}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mecánico (Asistencia)</label>
                    <select 
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs"
                      value={activeAuxilioForModal.mecanico_asistencia || ''}
                      onChange={(e) => setActiveAuxilioForModal({...activeAuxilioForModal, mecanico_asistencia: e.target.value})}
                    >
                      <option value="">-- Sin asignar --</option>
                      {mecanicosList.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Hora Salida (Asistencia)</label>
                    <input 
                      type="time"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs disabled:opacity-50"
                      value={activeAuxilioForModal.hora_salida_asistencia || ''}
                      disabled={!activeAuxilioForModal.detalle_causa || !activeAuxilioForModal.detalle_herramientas}
                      onChange={(e) => setActiveAuxilioForModal({...activeAuxilioForModal, hora_salida_asistencia: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase">Detalles del Auxilio</h4>
                  <span className="text-[10px] text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-100">Obligatorios para marcar salidas</span>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Detalle Técnico de la Causa Constatada *</label>
                  <textarea 
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-xs"
                    value={activeAuxilioForModal.detalle_causa || ''}
                    onChange={(e) => setActiveAuxilioForModal({...activeAuxilioForModal, detalle_causa: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Detalle de Herramientas *</label>
                  <textarea 
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-xs"
                    value={activeAuxilioForModal.detalle_herramientas || ''}
                    onChange={(e) => setActiveAuxilioForModal({...activeAuxilioForModal, detalle_herramientas: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button 
                onClick={() => setDatosSalidaModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  if (supabase) {
                    await supabase.from('auxilios').update({
                      unidad_reemplazo: activeAuxilioForModal.unidad_reemplazo,
                      personal_mecanico: activeAuxilioForModal.personal_mecanico,
                      hora_salida_mecanico: activeAuxilioForModal.hora_salida_mecanico,
                      unidad_asistencia: activeAuxilioForModal.unidad_asistencia,
                      mecanico_asistencia: activeAuxilioForModal.mecanico_asistencia,
                      hora_salida_asistencia: activeAuxilioForModal.hora_salida_asistencia,
                      detalle_causa: activeAuxilioForModal.detalle_causa,
                      detalle_herramientas: activeAuxilioForModal.detalle_herramientas
                    }).eq('id', activeAuxilioForModal.id);
                  }
                  setAuxiliosList(prev => prev.map(a => a.id === activeAuxilioForModal.id ? activeAuxilioForModal : a));
                  setDatosSalidaModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700"
              >
                Guardar Datos
              </button>
            </div>
          </div>
        </div>
      )}
    </>

      

  );
}
const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// State Additions
const stateInsert = `
  const [activeTab, setActiveTab] = useState<'salidas' | 'llegadas'>('salidas');
  const [mecanicosList, setMecanicosList] = useState<any[]>([]);
  const [auxiliosList, setAuxiliosList] = useState<any[]>([]);
  const [llegadasMap, setLlegadasMap] = useState<Record<string, any>>({});
  const [llegadasAuxiliosMap, setLlegadasAuxiliosMap] = useState<Record<string, any>>({});
  const [verificaciones, setVerificaciones] = useState<any[]>([]);
  const [auxiliosBase, setAuxiliosBase] = useState<any[]>([]);
  const [auxiliosTerminal, setAuxiliosTerminal] = useState<any[]>([]);
`;
code = code.replace(`  const [searchTerm, setSearchTerm] = useState('');`, stateInsert + `\n  const [searchTerm, setSearchTerm] = useState('');`);

// Data Fetching Additions
const fetchInsert = `
          const { data: mRes } = await supabase.from('nomina_mecanicos').select('apellido_nombre');
          if (mRes) setMecanicosList(mRes.map((m: any) => m.apellido_nombre));

          const { data: auxRes } = await supabase.from('auxilios').select('*').eq('fecha', fecha);
          if (auxRes) setAuxiliosList(auxRes);
`;
code = code.replace(`          const { data: stRes } = await supabase.from('servicios_turisticos').select('*').eq('fecha', fecha);`, fetchInsert + `\n          const { data: stRes } = await supabase.from('servicios_turisticos').select('*').eq('fecha', fecha);`);

// Data Filtering Additions
const filterInsert = `
      const localVerif: any[] = [];
      const localAuxB: any[] = [];
      const localAuxT: any[] = [];
      diagRes.forEach(d => {
        if (d.cod_turno?.startsWith('VERIF-')) localVerif.push(d);
        else if (d.cod_turno?.startsWith('AUX-BASE-')) localAuxB.push(d);
        else if (d.cod_turno?.startsWith('AUX-TERM-')) localAuxT.push(d);
      });
      setVerificaciones(localVerif);
      setAuxiliosBase(localAuxB);
      setAuxiliosTerminal(localAuxT);
`;
code = code.replace(`      setTurnosBase(enrichedTurnos.sort((a, b) => (a.hora_presentacion || '').localeCompare(b.hora_presentacion || '')));`, filterInsert + `\n      setTurnosBase(enrichedTurnos.sort((a, b) => (a.hora_presentacion || '').localeCompare(b.hora_presentacion || '')));`);

// Save Methods
const saveInsert = `
  const handleSaveVerif = async (cod: string, field: string, value: string) => {
    try {
      const existing = verificaciones.find(v => v.cod_turno === cod);
      const updated = { ...existing, [field]: value };
      setVerificaciones(prev => prev.map(v => v.cod_turno === cod ? updated : v));
      
      if (supabase) {
        await supabase.from('diagramaciones').upsert({
          fecha,
          cod_turno: cod,
          es_verificacion: true,
          [field]: value
        }, { onConflict: 'fecha,cod_turno' });
      }
    } catch (e) {
      console.error('Error saving verificacion', e);
    }
  };

  const handleLlegada = async (turnoId: string, time: string) => {
    setLlegadasMap(prev => ({ ...prev, [turnoId]: { time, by: 'garita' } }));
    if (supabase) {
      try {
        const t = turnosBase.find(x => x.cod_turno === turnoId);
        if (t) {
          const { error } = await supabase.from('diagramaciones').upsert({
            fecha,
            cod_turno: t.cod_turno,
            unidad: t.unidad,
            conductor_principal: t.conductor_principal,
            conductor_secundario: t.conductor_secundario,
            hora_llegada_verificacion: time
          }, { onConflict: 'fecha,cod_turno' });
        }
      } catch (e) { console.error(e); }
    }
  };

  const handleAuxilioLlegada = async (auxId: string, time: string) => {
    setLlegadasAuxiliosMap(prev => ({ ...prev, [auxId]: time }));
    // Try to update auxiliary CRM arrival
    const localCRM = localStorage.getItem('app_auxilios_crm');
    if (localCRM) {
      try {
        const parsed = JSON.parse(localCRM);
        if (parsed[auxId]) {
          parsed[auxId].hora_llegada = time;
          localStorage.setItem('app_auxilios_crm', JSON.stringify(parsed));
        }
      } catch (e) {}
    }
  };
`;
code = code.replace(`  const handleNovedad = async (turnoId: string, nov: string) => {`, saveInsert + `\n  const handleNovedad = async (turnoId: string, nov: string) => {`);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

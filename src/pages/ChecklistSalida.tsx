import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import Select from 'react-select';

interface Option { value: string; label: string; }

export default function ChecklistSalida() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState(new Date().toTimeString().substring(0, 5));
  
  const [unidades, setUnidades] = useState<Option[]>([]);
  const [turnos, setTurnos] = useState<Option[]>([]);
  const [conductores, setConductores] = useState<Option[]>([]);

  const [unidad, setUnidad] = useState<Option | null>(null);
  const [turno, setTurno] = useState<Option | null>(null);
  const [conductor, setConductor] = useState<Option | null>(null);

  const [mechanicCheck, setMechanicCheck] = useState<{ id: string; mecanico: string } | null>(null);

  // States for checkbox values (true = OK, false = bad, null = unchecked)
  const [checks, setChecks] = useState<Record<string, boolean | null>>({
    flu_agua: null, flu_aceite: null, flu_combustible: null, flu_hidraulico: null, flu_frenos: null,
    seg_martillos: null, seg_cint_seguridad: null, seg_matafuego: null,
    luces_internas: null, luces_frenos: null, luces_giros: null,
    equ_calef_ac: null, equ_cort_cabez: null, equ_limp_parab: null, equ_puertas: null,
    equ_cristales_espejos: null, equ_cubiertas: null, equ_micronauta_sube: null, equ_documentos: null
  });
  
  const [observaciones, setObservaciones] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!supabase) return;
      const [uRes, tRes, cRes] = await Promise.all([
        supabase.from('flota_activa').select('id_unidad, unidad').order('unidad'),
        supabase.from('turnos').select('id_turno, cod_turno').order('cod_turno'),
        supabase.from('nomina_conductores').select('id_conductor, apellido_nombre').order('apellido_nombre')
      ]);
      if (uRes.data) setUnidades(uRes.data.map((u: any) => ({ value: u.id_unidad, label: u.unidad })));
      if (tRes.data) setTurnos(tRes.data.map((t: any) => ({ value: t.id_turno, label: t.cod_turno })));
      if (cRes.data) setConductores(cRes.data.map((c: any) => ({ value: c.id_conductor, label: c.apellido_nombre })));
    }
    loadData();
  }, []);

  useEffect(() => {
    async function checkMechanic() {
      if (!supabase || !unidad || !turno || !fecha) {
        setMechanicCheck(null);
        return;
      }
      const { data, error } = await supabase
        .from('control_mecanico')
        .select(`
          id_control_mecanico,
          nomina_mecanicos ( apellido_nombre )
        `)
        .eq('fecha', fecha)
        .eq('id_unidad', unidad.value)
        .eq('id_turno', turno.value)
        .maybeSingle();
      
      if (data) {
        setMechanicCheck({
          id: data.id_control_mecanico,
          mecanico: data.nomina_mecanicos?.apellido_nombre || 'Mecánico'
        });
      } else {
        setMechanicCheck(null);
      }
    }
    checkMechanic();
  }, [unidad, turno, fecha]);

  const handleCheck = (key: string, val: boolean) => {
    setChecks(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    if (!unidad || !turno || !conductor) {
      setMessage({ type: 'error', text: 'Debe seleccionar Unidad, Turno y Conductor.' });
      return;
    }
    if (!supabase) return;
    setIsSaving(true);
    setMessage(null);

    try {
      // Create controls payload
      const payload = {
        fecha,
        hora,
        id_unidad: unidad.value,
        id_turno: turno.value,
        id_conductor: conductor.value,
        id_control_mecanico: mechanicCheck ? mechanicCheck.id : null,
        ...checks,
        obs_gral: observaciones
      };

      const { error } = await supabase.from('controles').insert([payload]);
      
      if (error) throw error;

      setMessage({ type: 'success', text: 'Checklist guardado exitosamente.' });
      setChecks(Object.keys(checks).reduce((acc, key) => ({ ...acc, [key]: null }), {}));
      setObservaciones('');
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Error al guardar.' });
    } finally {
      setIsSaving(false);
    }
  };

  const CheckItem = ({ id, label, isFluid = false }: { id: string, label: string, isFluid?: boolean }) => {
    const isMechanicOk = isFluid && mechanicCheck;
    const value = isMechanicOk ? true : checks[id];

    return (
      <div className="flex items-center justify-between p-2 border-b border-slate-100 last:border-0 hover:bg-slate-50">
        <span className="text-sm text-slate-700 font-medium">
          {label} 
          {isMechanicOk && <span className="ml-2 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200" title={`Controlado por ${mechanicCheck.mecanico}`}>Mecánico OK</span>}
        </span>
        <div className="flex space-x-1">
          <button 
            disabled={!!isMechanicOk}
            onClick={() => handleCheck(id, true)}
            className={`w-8 h-8 rounded border flex items-center justify-center transition-colors ${value === true ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'border-slate-300 text-slate-300 hover:border-emerald-500 hover:text-emerald-500'} ${isMechanicOk ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          </button>
          <button 
            disabled={!!isMechanicOk}
            onClick={() => handleCheck(id, false)}
            className={`w-8 h-8 rounded border flex items-center justify-center transition-colors ${value === false ? 'bg-rose-50 border-rose-500 text-rose-600' : 'border-slate-300 text-slate-300 hover:border-rose-500 hover:text-rose-500'} ${isMechanicOk ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header title="CONTROL PRESTACIÓN DE SERVICIO" subtitle="Buttini | Verificación Diaria" />
      <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {message && (
            <div className={`p-4 rounded-lg font-medium text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              {message.text}
            </div>
          )}

          {/* Top Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Fecha:</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Hora:</label>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Unidad N°:</label>
              <Select options={unidades} value={unidad} onChange={setUnidad} placeholder="Escriba unidad..." className="text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Turno:</label>
              <Select options={turnos} value={turno} onChange={setTurno} placeholder="Buscar turno..." className="text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Conductor:</label>
              <Select options={conductores} value={conductor} onChange={setConductor} placeholder="Apellido y Nombre..." className="text-sm" />
            </div>
          </div>

          {/* Grid of Checklists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
              <h3 className="text-[13px] font-extrabold text-[#5c6bc0] uppercase mb-3 border-b-2 border-[#5c6bc0] pb-2 inline-block">Fluidos</h3>
              <div className="flex flex-col">
                <CheckItem id="flu_agua" label="Agua" isFluid />
                <CheckItem id="flu_aceite" label="Aceite" isFluid />
                <CheckItem id="flu_combustible" label="Combustible" isFluid />
                <CheckItem id="flu_hidraulico" label="Hidráulico" isFluid />
                <CheckItem id="flu_frenos" label="Frenos" isFluid />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
              <h3 className="text-[13px] font-extrabold text-[#5c6bc0] uppercase mb-3 border-b-2 border-[#5c6bc0] pb-2 inline-block">Seguridad</h3>
              <div className="flex flex-col">
                <CheckItem id="seg_martillos" label="Martillos" />
                <CheckItem id="seg_cint_seguridad" label="Cint. Seguridad" />
                <CheckItem id="seg_matafuego" label="Matafuego" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
              <h3 className="text-[13px] font-extrabold text-[#5c6bc0] uppercase mb-3 border-b-2 border-[#5c6bc0] pb-2 inline-block">Luces</h3>
              <div className="flex flex-col">
                <CheckItem id="luces_internas" label="Internas" />
                <CheckItem id="luces_frenos" label="Frenos" />
                <CheckItem id="luces_giros" label="Giros" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
              <h3 className="text-[13px] font-extrabold text-[#5c6bc0] uppercase mb-3 border-b-2 border-[#5c6bc0] pb-2 inline-block">Equipamiento</h3>
              <div className="flex flex-col">
                <CheckItem id="equ_calef_ac" label="Calefacción - A/C" />
                <CheckItem id="equ_cort_cabez" label="Cabezales" />
                <CheckItem id="equ_limp_parab" label="Limp Parabrisas" />
                <CheckItem id="equ_puertas" label="Puertas" />
                <CheckItem id="equ_cristales_espejos" label="Cristales / Espejos" />
                <CheckItem id="equ_cubiertas" label="Cubiertas" />
                <CheckItem id="equ_micronauta_sube" label="Micronauta / SUBE" />
                <CheckItem id="equ_documentos" label="Documentación" />
              </div>
            </div>

          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
             <label className="block text-sm font-bold text-slate-700 mb-2">Observaciones:</label>
             <textarea 
               value={observaciones}
               onChange={e => setObservaciones(e.target.value)}
               className="w-full border border-slate-300 rounded p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
               rows={3} 
               placeholder="Detalle cualquier novedad aquí..."
             />
          </div>

          <div className="flex flex-col space-y-3">
             <button onClick={() => window.open('http://buttini.sgm.lym.com.ar/Account/Login', '_blank')} className="w-full py-3 border-2 border-rose-700 text-rose-700 font-bold rounded-lg hover:bg-rose-50 transition-colors uppercase text-sm tracking-wide">
               Solicitud de OT
             </button>
             <button onClick={handleSave} disabled={isSaving} className="w-full py-3 bg-[#6a5acd] text-white font-bold rounded-lg hover:bg-[#5c4eba] transition-colors uppercase text-sm tracking-wide shadow-sm disabled:opacity-50">
               {isSaving ? 'Guardando...' : 'Firmar en conformidad'}
             </button>
          </div>

        </div>
      </div>
    </>
  );
}

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function ChecklistSalida() {
  const { user, logout } = useAuth();
  
  const [isDiagramado, setIsDiagramado] = useState<boolean | null>(null);
  const [fecha] = useState(new Date().toISOString().split('T')[0]);
  const [hora] = useState(new Date().toTimeString().substring(0, 5));
  
  const [assignment, setAssignment] = useState<any>(null);
  
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
    async function initChecklist() {
      if (!supabase || !user) return;
      
      // Look for a diagramacion for today where this user is conductor_principal or conductor_secundario
      const { data: diagRes } = await supabase.from('diagramaciones')
        .select('*')
        .eq('fecha', fecha)
        .or(`conductor_principal.ilike.${user.nombre_apellido},conductor_secundario.ilike.${user.nombre_apellido}`)
        .maybeSingle();

      if (!diagRes) {
        setIsDiagramado(false);
        return;
      }
      
      // Need to resolve id_unidad, id_turno, and id_conductor
      // id_conductor can be found by matching user.nombre_apellido in nomina_conductores
      const [uRes, tRes, cRes] = await Promise.all([
        supabase.from('flota_activa').select('id_unidad, unidad').eq('unidad', diagRes.unidad).maybeSingle(),
        supabase.from('turnos').select('id_turno, cod_turno').eq('cod_turno', diagRes.cod_turno).maybeSingle(),
        supabase.from('nomina_conductores').select('id_conductor, apellido_nombre').eq('apellido_nombre', user.nombre_apellido).maybeSingle()
      ]);
      
      if (!uRes.data || !tRes.data || !cRes.data) {
         // Missing some required referenced data, act as if not scheduled for completeness
         setIsDiagramado(false);
         return;
      }
      
      setAssignment({
        id_unidad: uRes.data.id_unidad,
        unidadLabel: uRes.data.unidad,
        id_turno: tRes.data.id_turno,
        turnoLabel: tRes.data.cod_turno,
        id_conductor: cRes.data.id_conductor,
        conductorLabel: cRes.data.apellido_nombre
      });
      
      setIsDiagramado(true);
    }
    initChecklist();
  }, [user, fecha]);

  const handleCheck = (key: string, val: boolean) => {
    setChecks(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    // Validar completos
    const pending = Object.values(checks).some(v => v === null);
    if (pending) {
      setMessage({ type: 'error', text: 'Debe completar todas las verificaciones del checklist.' });
      return;
    }

    if (!supabase || !assignment) return;
    setIsSaving(true);
    setMessage(null);

    try {
      // Create controls payload
      const payload = {
        fecha,
        hora,
        id_unidad: assignment.id_unidad,
        id_turno: assignment.id_turno,
        id_conductor: assignment.id_conductor,
        // we omit id_control_mecanico for this simple save since we didn't fetch it explicitly here, 
        // or we could fetch it if we strictly needed to link it, but typically it links if exists, else null.
        ...checks,
        luces_externas: checks.luces_internas,
        obs_gral: observaciones || null
      };

      const { error } = await supabase.from('controles').insert([payload]);
      if (error) throw error;

      setMessage({ type: 'success', text: 'Checklist guardado exitosamente.' });
      
      // Reset checks
      const resetChecks: any = {};
      Object.keys(checks).forEach(k => resetChecks[k] = null);
      setChecks(resetChecks);
      setObservaciones('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al guardar el checklist.' });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isDiagramado === null) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-bold">Verificando diagramación...</p>
      </div>
    );
  }

  if (isDiagramado === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg text-center max-w-md w-full border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">No tiene diagramación activa</h2>
          <p className="text-slate-600 mb-8 text-sm md:text-base leading-relaxed">
            Por favor comunicarse con Tráfico / Inspector para resolver esta situación.
          </p>
          <button 
            onClick={logout}
            className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Salir del sistema
          </button>
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: "Fluidos Matutinos",
      items: [
        { key: 'flu_agua', label: 'Agua' },
        { key: 'flu_aceite', label: 'Aceite' },
        { key: 'flu_combustible', label: 'Combustible' },
        { key: 'flu_hidraulico', label: 'Hidráulico' },
        { key: 'flu_frenos', label: 'Frenos' }
      ]
    },
    {
      title: "Elementos de Seguridad",
      items: [
        { key: 'seg_martillos', label: 'Martillos (7 un.)' },
        { key: 'seg_cint_seguridad', label: 'Cinturones de Seg.' },
        { key: 'seg_matafuego', label: 'Matafuego' }
      ]
    },
    {
      title: "Luces",
      items: [
        { key: 'luces_internas', label: 'Internas y Externas' },
        { key: 'luces_frenos', label: 'Luces de Freno' },
        { key: 'luces_giros', label: 'Luces de Giro' }
      ]
    },
    {
      title: "Equipamiento",
      items: [
        { key: 'equ_calef_ac', label: 'Calefacción / AC' },
        { key: 'equ_cort_cabez', label: 'Cortinas y Cabezales' },
        { key: 'equ_limp_parab', label: 'Limpia Parabrisas' },
        { key: 'equ_puertas', label: 'Funcionamiento Puertas' },
        { key: 'equ_cristales_espejos', label: 'Cristales y Espejos' },
        { key: 'equ_cubiertas', label: 'Estado Cubiertas' },
        { key: 'equ_micronauta_sube', label: 'Micronauta / SUBE' },
        { key: 'equ_documentos', label: 'Documentación Unidad' }
      ]
    }
  ];

  return (
    <>
      <Header title="Checklist Salida" subtitle="Verificación previa al inicio del servicio" />
      <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50">
        <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-sm">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Fecha</label>
                  <div className="bg-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700">{fecha}</div>
               </div>
               <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Unidad</label>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm font-bold text-blue-700">{assignment?.unidadLabel}</div>
               </div>
               <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Turno</label>
                  <div className="bg-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700">{assignment?.turnoLabel}</div>
               </div>
               <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Conductor</label>
                  <div className="bg-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 truncate" title={assignment?.conductorLabel}>{assignment?.conductorLabel}</div>
               </div>
             </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            {sections.map(section => (
              <div key={section.title} className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-sm">
                 <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">{section.title}</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                   {section.items.map(item => (
                     <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors">
                       <span className="font-bold text-slate-700 text-xs md:text-sm">{item.label}</span>
                       <div className="flex space-x-2">
                         <button
                           onClick={() => handleCheck(item.key, true)}
                           className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg font-bold text-lg transition-all ${checks[item.key] === true ? 'bg-emerald-500 text-white shadow-md scale-105' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'}`}
                         >
                           ✓
                         </button>
                         <button
                           onClick={() => handleCheck(item.key, false)}
                           className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg font-bold text-lg transition-all ${checks[item.key] === false ? 'bg-rose-500 text-white shadow-md scale-105' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'}`}
                         >
                           ✗
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            ))}
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-sm">
            <label className="block text-sm font-bold text-slate-800 mb-2">Observaciones / Novedades</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 bg-slate-50" 
              rows={3} 
              placeholder="Indique cualquier problema encontrado..."
            ></textarea>
          </div>

          {message && (
             <div className={`p-4 rounded-lg text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
               {message.text}
             </div>
          )}
          
          <div className="pt-2 pb-8">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full bg-blue-600 text-white font-bold py-3.5 md:py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/30 disabled:opacity-50 text-sm md:text-base uppercase tracking-wide"
            >
              {isSaving ? 'Guardando...' : 'Guardar y Enviar Checklist'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

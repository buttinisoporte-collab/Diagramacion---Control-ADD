import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import Select from 'react-select';

interface Option { value: string; label: string; }

export default function MecanicaMatutina() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [mecanicos, setMecanicos] = useState<Option[]>([]);
  const [selectedMecanico, setSelectedMecanico] = useState<Option | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    async function loadMecanicos() {
      if (!supabase) return;
      const { data } = await supabase.from('nomina_mecanicos').select('id_mecanico, apellido_nombre').order('apellido_nombre');
      if (data) {
        setMecanicos(data.map((m: any) => ({ value: m.id_mecanico, label: m.apellido_nombre })));
      }
    }
    loadMecanicos();
  }, []);

  useEffect(() => {
    async function loadAssignedMecanico() {
      if (!supabase || !fecha) return;
      const { data } = await supabase.from('diagramacion_mecanicos').select('id_mecanico').eq('fecha', fecha).maybeSingle();
      if (data && mecanicos.length > 0) {
        const found = mecanicos.find(m => m.value === data.id_mecanico);
        setSelectedMecanico(found || null);
      } else {
        setSelectedMecanico(null);
      }
    }
    loadAssignedMecanico();
  }, [fecha, mecanicos]);

  const handleSave = async () => {
    if (!selectedMecanico) {
      setMessage({ type: 'error', text: 'Debe seleccionar un mecánico.' });
      return;
    }
    if (!supabase) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('diagramacion_mecanicos')
        .upsert({ fecha, id_mecanico: selectedMecanico.value }, { onConflict: 'fecha' });
      
      if (error) throw error;
      setMessage({ type: 'success', text: 'Mecánico asignado exitosamente.' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Error al guardar.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Header title="Mecánica Matutina" subtitle="Diagramación Diaria de Mecánico" />
      <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 max-w-xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Diagramar Mecánico del Día</h3>
            <p className="text-sm text-slate-500">Seleccione el mecánico encargado del control de fluidos matutino.</p>
          </div>
          
          {message && (
            <div className={`p-4 rounded text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Fecha</label>
              <input 
                type="date" 
                value={fecha} 
                onChange={e => setFecha(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Mecánico Asignado</label>
              <Select 
                options={mecanicos} 
                value={selectedMecanico} 
                onChange={setSelectedMecanico} 
                placeholder="Buscar mecánico..."
                noOptionsMessage={() => "No se encontraron mecánicos"}
              />
            </div>
          </div>
          
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded hover:bg-slate-800 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Asignación'}
          </button>
        </div>
      </div>
    </>
  );
}

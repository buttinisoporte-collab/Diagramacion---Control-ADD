const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// 1. Add state for edited times
code = code.replace(
  "const [verifStateMap, setVerifStateMap] = useState<Record<string, any>>({});",
  "const [verifStateMap, setVerifStateMap] = useState<Record<string, any>>({});\n  const [editedTimes, setEditedTimes] = useState<Record<string, string>>({});"
);

// 2. Add handleNovedadAuxilio
const handleNovStr = `  const handleNovedadAuxilio = async (a: any) => {
    if (!canEdit) {
      alert("Solo se pueden editar las novedades en la fecha actual (o con rol Administrador).\\n\\nNovedad registrada: " + (a.observaciones || 'Ninguna.'));
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
      loadData();
    }
  };`;
code = code.replace(/const handleNovedad = async \(t: any\) => \{/, handleNovStr + "\n\n  const handleNovedad = async (t: any) => {");

// 3. Fix Verificaciones to be one row per v, and save directly to Supabase
// First, create a handleSaveVerifToDB function.
const saveVerifStr = `  const handleSaveVerifToDB = async (v: any, field: string, value: string) => {
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
  };`;
code = code.replace(/const handleSaveVerif = \(cod: string, field: string, value: string\) => \{[\s\S]*?\};\n/, saveVerifStr + "\n");

// Replace the Verificaciones map logic
const verifTableHtml = `<tbody className="divide-y divide-slate-100">
                      {verificaciones.length === 0 ? (
                        <tr><td colSpan={5} className="px-2 py-3 text-center text-xs text-slate-400">Sin unidades a verificar</td></tr>
                      ) : (
                        verificaciones.map(v => {
                          const cod = v.cod_turno;
                          const hSalida = editedTimes['vsalida-' + cod] !== undefined ? editedTimes['vsalida-' + cod] : (v.hora_salida_verificacion || '');
                          return (
                            <tr key={cod} className="border-b border-blue-100 bg-blue-50/30 hover:bg-blue-50">
                              <td className="px-2 py-1.5 text-xs font-bold text-blue-800">Verificación Técnica</td>
                              <td className="px-2 py-1.5 text-xs font-bold text-[#5c6bc0]">{v.unidad || '-'}</td>
                              <td className="px-2 py-1.5 text-xs font-medium text-slate-700">{v.conductor_principal || '-'}</td>
                              <td className="px-2 py-1.5 text-xs">
                                {v.hora_salida_verificacion ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> {formatTime(v.hora_salida_verificacion)} hs
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
                                      if(hSalida) handleSaveVerifToDB(v, 'hora_salida_verificacion', hSalida);
                                    }} className={\`px-2 py-1 rounded text-[10px] font-bold uppercase \${canEdit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}\`}>OK</button>
                                    <button disabled={!canEdit} onClick={() => {
                                      handleSaveVerifToDB(v, 'hora_salida_verificacion', new Date().toTimeString().substring(0, 5));
                                    }} className={\`px-2 py-1 rounded text-[10px] font-bold uppercase \${canEdit ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}\`}>Ya</button>
                                  </div>
                                )}
                              </td>
                              <td className="px-2 py-1.5 text-xs">
                                <select value={v.mecanico_verificacion || ''} onChange={(e) => handleSaveVerifToDB(v, 'mecanico_verificacion', e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1 max-w-[120px]">
                                  <option value="">-- Seleccionar --</option>
                                  {mecanicosList.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                              </td>
                              <td className="px-2 py-1.5 text-xs text-center">
                                <button 
                                  onClick={() => handleNovedad(v)}
                                  className={\`px-3 py-1 \${v.observaciones ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'} text-white rounded text-xs font-bold w-full max-w-[100px]\`}
                                >
                                  {v.observaciones ? 'Ver Novedad' : 'Novedad'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>`;

// Notice: Verificaciones table originally had: Salida a Revisión, Turno, Unidad, Mecánico a Cargo, Novedades.
// The user asked to load conductors like normal turnos. So we changed columns to:
const verifTheadHtml = `<thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-2 py-1.5 text-xs">Turno</th>
                        <th className="px-2 py-1.5 text-xs">Unidad</th>
                        <th className="px-2 py-1.5 text-xs">Conductor</th>
                        <th className="px-2 py-1.5 text-xs">Hora Salida</th>
                        <th className="px-2 py-1.5 text-xs">Mecánico a Cargo</th>
                        <th className="px-2 py-1.5 text-xs">Novedades</th>
                      </tr>
                    </thead>`;

code = code.replace(/<thead className="bg-slate-50 text-slate-500 uppercase text-\[10px\] font-bold">[\s\S]*?<\/thead>/, verifTheadHtml);
code = code.replace(/<tbody className="divide-y divide-slate-100">[\s\S]*?<\/tbody>/, verifTableHtml);


fs.writeFileSync('src/pages/ControlGarita.tsx', code);

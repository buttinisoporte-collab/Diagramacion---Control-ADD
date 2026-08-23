const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

const targetTableStart = `              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
                  <h3 className="font-bold text-slate-700 text-sm">Turnos (Salida Base)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">`;

const oldUIStart = `              <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col flex-1 min-h-[400px]">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex-shrink-0">
                  <h3 className="font-bold text-slate-700 text-sm">Turnos (Salida Base)</h3>
                </div>
                <div className="overflow-auto flex-1 bg-white relative">
                  <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 uppercase text-[10px] font-bold shadow-sm">
                      <tr>
                        <th className="px-4 py-3 bg-slate-50">H. Presentación</th>
                        <th className="px-4 py-3 bg-slate-50">H. Salida Base</th>
                        <th className="px-4 py-3 bg-slate-50">Turno</th>
                        <th className="px-4 py-3 bg-slate-50">Unidad</th>
                        <th className="px-4 py-3 bg-slate-50">Conductor Principal</th>
                        <th className="px-4 py-3 bg-slate-50 text-center">Mecánico</th>
                        <th className="px-4 py-3 bg-slate-50 text-center">Checklist</th>
                        <th className="px-4 py-3 bg-slate-50 text-center">Presentación</th>
                        <th className="px-4 py-3 bg-slate-50 text-center">Salida</th>
                        <th className="px-4 py-3 bg-slate-50 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTurnos.map(t => {
                        const hasCond = !!t.conductor_principal;
                        const mechOk = anyMecanicoChecked[t.cod_turno];
                        const chkOk = anyChecklistChecked[t.cod_turno];
                        const pres = presentacionMap[t.cod_turno];
                        const sal = salidaMap[t.cod_turno];
                        const isRowReady = hasCond && mechOk && chkOk;
                        
                        return (
                          <tr key={t.cod_turno} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono font-bold text-slate-700">{t.hora_presentacion || '-'}</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-700">{t.hora_salida_base || '-'}</td>
                            <td className="px-4 py-3">
                               <span className="font-bold text-slate-900">{t.cod_turno}</span>
                            </td>
                            <td className="px-4 py-3 font-bold text-[#5c6bc0]">{t.unidad || '-'}</td>
                            <td className="px-4 py-3 font-medium text-slate-700">{t.conductor_principal || '-'}</td>
                            
                            <td className="px-4 py-3 text-center">
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
                            <td className="px-4 py-3 text-center">
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
                            
                            <td className="px-4 py-3 text-center">
                              {pres ? (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> {pres.time} hs
                                </span>
                              ) : (
                                <button 
                                  disabled={!isRowReady} 
                                  onClick={() => handleMarcar(t.cod_turno, 'presentacion')} 
                                  className={\`px-3 py-1 border rounded text-[10px] font-bold uppercase transition-colors \${isRowReady ? 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}\`}
                                >
                                  AUSENTE - MARCAR
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {sal ? (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span> {sal.time} hs
                                </span>
                              ) : (
                                <button 
                                  disabled={!pres} 
                                  onClick={() => handleMarcar(t.cod_turno, 'salida')} 
                                  className={\`px-3 py-1 border rounded text-[10px] font-bold uppercase transition-colors \${pres ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}\`}
                                >
                                  MARCAR SALIDA
                                </button>
                              )}
                            </td>
                            
                            <td className="px-4 py-3 text-center min-w-[120px]">
                              <button 
                                onClick={() => {
                                  const nov = prompt("Ingrese la novedad:", t.observaciones || '');
                                  if (nov !== null) handleNovedad(t.cod_turno, nov);
                                }}
                                className={\`px-3 py-1 \${t.observaciones ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'} text-white rounded text-xs font-bold w-full max-w-[100px]\`}
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
              </div>`;

const startIndex = code.indexOf(targetTableStart);
if (startIndex !== -1) {
  // Find the end of this block
  const endMarker = '              </div>\n\n              {/* Verificaciones Tecnicas */}';
  const endIndex = code.indexOf(endMarker, startIndex);
  
  if (endIndex !== -1) {
    code = code.substring(0, startIndex) + oldUIStart + code.substring(endIndex);
    fs.writeFileSync('src/pages/ControlGarita.tsx', code);
    console.log("Successfully patched Salidas table");
  } else {
    console.log("Could not find endIndex marker");
  }
} else {
  console.log("Could not find targetTableStart marker");
}

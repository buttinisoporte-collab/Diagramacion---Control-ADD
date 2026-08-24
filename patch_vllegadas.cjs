const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

const regex = /\{\/\* Verificaciones Tecnicas Llegadas \*\/\}[\s\S]*?return allUnits\.map\(uInfo => \{[\s\S]*?<\/tr>\s*\);\s*\}\);\s*\}\)\(\)\}/;

const replacement = `{/* Verificaciones Tecnicas Llegadas */}
                      {verificaciones.length > 0 && verificaciones.map(v => {
                        const cod = v.cod_turno;
                        const hLlegada = editedTimes['vllegada-' + cod] !== undefined ? editedTimes['vllegada-' + cod] : (v.hora_llegada_verificacion || '');
                        return (
                          <tr key={'vllegada-'+cod} className="border-b border-blue-100 bg-blue-50/30 hover:bg-blue-50">
                            <td className="px-2 py-1.5"><div className="flex flex-col"><span className="font-bold text-blue-800">Verificación Técnica</span></div></td>
                            <td className="px-2 py-1.5 text-xs font-bold text-[#5c6bc0]">{v.unidad || '-'}</td>
                            <td className="px-2 py-1.5 text-xs font-medium text-slate-700">{v.conductor_principal || '-'}</td>
                            <td className="px-2 py-1.5 text-xs font-bold text-slate-600">{v.hora_salida_verificacion || '-'}</td>
                            <td className="px-2 py-1.5 text-xs">
                              {v.hora_llegada_verificacion ? (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> {formatTime(v.hora_llegada_verificacion)} hs
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
                                    if(hLlegada) handleSaveVerifToDB(v, 'hora_llegada_verificacion', hLlegada);
                                  }} className={\`px-2 py-1 rounded text-[10px] font-bold uppercase \${canEdit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}\`}>OK</button>
                                  <button disabled={!canEdit} onClick={() => {
                                    handleSaveVerifToDB(v, 'hora_llegada_verificacion', new Date().toTimeString().substring(0, 5));
                                  }} className={\`px-2 py-1 rounded text-[10px] font-bold uppercase \${canEdit ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}\`}>Ya</button>
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-xs">
                              <button 
                                onClick={() => handleNovedad(v)}
                                className={\`px-3 py-1 \${v.observaciones ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'} text-white rounded text-xs font-bold w-full max-w-[120px]\`}
                              >
                                {v.observaciones ? 'Ver Novedad' : 'Novedad'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/ControlGarita.tsx', code);

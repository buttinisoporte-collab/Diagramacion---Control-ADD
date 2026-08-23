const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

const newLlegada = `{(() => {
                        const allUnits: { cod: string; unit: string }[] = [];
                        verificaciones.forEach(v => {
                          if (v.unidad) {
                            const units = v.unidad.split(',').map((u: string) => u.trim()).filter(Boolean);
                            units.forEach((u: string, idx: number) => {
                              allUnits.push({ cod: \`\${v.cod_turno}-\${idx}\`, unit: u });
                            });
                          }
                        });
                        if (allUnits.length === 0) return null;
                        
                        return allUnits.map(uInfo => {
                          const cod = uInfo.cod;
                          const v = verifStateMap[cod] || {};
                          return (
                            <tr key={cod} className="border-b border-blue-100 bg-blue-50/30 hover:bg-blue-50">
                              <td className="px-2 py-1.5 text-xs font-bold text-blue-800">Verificación Técnica</td>
                              <td className="px-2 py-1.5 text-xs font-bold text-[#5c6bc0]">{uInfo.unit}</td>
                              <td className="px-2 py-1.5 text-xs font-medium text-slate-700">{v.mecanico_verificacion || '-'}</td>
                              <td className="px-2 py-1.5 text-xs">
                                {v.hora_llegada_verificacion ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> {formatTime(v.hora_llegada_verificacion)} hs
                                  </span>
                                ) : (
                                  <input type="time" onChange={(e) => handleSaveVerif(cod, 'hora_llegada_verificacion', e.target.value)} className="w-[120px] text-xs border border-slate-300 rounded px-2 py-1" />
                                )}
                              </td>
                              <td className="px-2 py-1.5 text-xs">
                                <button 
                                  onClick={() => {
                                    const nov = prompt("Ingrese la novedad:", v.observaciones || '');
                                    if (nov !== null) handleSaveVerif(cod, 'observaciones', nov);
                                  }}
                                  className={\`px-3 py-1 \${v.observaciones ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'} text-white rounded text-xs font-bold w-full max-w-[120px]\`}
                                >
                                  {v.observaciones ? 'Ver Novedad' : 'Novedad'}
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}`;

code = code.replace(/\{\[1, 2, 3\]\.map\(idx => \{\s*const cod = `VERIF-\$\{idx\}`;\s*const v = verificaciones\.find\(x => x\.cod_turno === cod\);\s*if \(!v\?\.unidad\) return null;\s*return \(\s*<tr key=\{cod\}.*?<\/tr>\s*\);\s*\}\)\}/s, newLlegada);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

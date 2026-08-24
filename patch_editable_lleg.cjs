const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// Replace Llegadas span
code = code.replace(
  /<span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-\[10px\] font-bold uppercase">\s+<span className="w-2 h-2 rounded-full bg-emerald-500 mr-1\.5"><\/span> \{formatTime\(typeof lleg === 'string' \? lleg : lleg\.time\)\} hs\s+<\/span>/,
  `<div className="flex items-center justify-center gap-1">
                                  <input 
                                    type="time" 
                                    id={\`time-llegada-\${t.isTuristico ? t.id : t.cod_turno}\`} 
                                    defaultValue={typeof lleg === 'string' ? lleg : lleg.time} 
                                    disabled={!canEdit}
                                    className="w-[75px] text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 rounded px-1 py-1 font-bold text-center" 
                                  />
                                  {canEdit && (
                                    <button 
                                      onClick={() => {
                                        const val = (document.getElementById(\`time-llegada-\${t.isTuristico ? t.id : t.cod_turno}\`) as HTMLInputElement)?.value;
                                        if(val) handleLlegada(t, val);
                                      }} 
                                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 uppercase"
                                    >
                                      OK
                                    </button>
                                  )}
                                </div>`
);

// Replace Auxilios Llegadas span
code = code.replace(
  /<span className="font-bold text-emerald-600">\{formatTime\(lleg\)\}<\/span>/,
  `<div className="flex items-center justify-center gap-1">
                                  <input 
                                    type="time" 
                                    id={\`time-auxllegada-\${a.id || a.created_at}\`} 
                                    defaultValue={typeof lleg === 'string' ? lleg : lleg.time} 
                                    disabled={!canEdit}
                                    className="w-[75px] text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 rounded px-1 py-1 font-bold text-center" 
                                  />
                                  {canEdit && (
                                    <button 
                                      onClick={() => {
                                        const val = (document.getElementById(\`time-auxllegada-\${a.id || a.created_at}\`) as HTMLInputElement)?.value;
                                        if(val) handleAuxilioLlegada(a.id || a.created_at, val);
                                      }} 
                                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 uppercase"
                                    >
                                      OK
                                    </button>
                                  )}
                                </div>`
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// Update handleMarcarPresente signature and logic
code = code.replace(
  /const handleMarcarPresente = async \(t: any\) => \{/,
  `const handleMarcarPresente = async (t: any, customTime?: string) => {`
);
code = code.replace(
  /const horaStr = new Date\(\)\.toTimeString\(\)\.substring\(0, 5\);/,
  `const horaStr = customTime || new Date().toTimeString().substring(0, 5);`
);

// Update handleMarcarSalida signature and logic
code = code.replace(
  /const handleMarcarSalida = async \(t: any\) => \{/,
  `const handleMarcarSalida = async (t: any, customTime?: string) => {`
);
code = code.replace(
  // Use a second replace for the second instance (which is in handleMarcarSalida)
  /const horaStr = new Date\(\)\.toTimeString\(\)\.substring\(0, 5\);/,
  `const horaStr = customTime || new Date().toTimeString().substring(0, 5);`
);

// Update render for pres
code = code.replace(
  /<span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-\[10px\] font-bold uppercase">\s+<span className="w-2 h-2 rounded-full bg-emerald-500 mr-1\.5"><\/span> \{pres\.time\} hs\s+<\/span>/,
  `<div className="flex items-center justify-center gap-1">
                                  <input 
                                    type="time" 
                                    id={\`time-pres-\${t.cod_turno}\`} 
                                    defaultValue={typeof pres === 'string' ? pres : pres.time} 
                                    disabled={!isToday}
                                    className="w-[75px] text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 rounded px-1 py-1 font-bold text-center" 
                                  />
                                  {isToday && (
                                    <button 
                                      onClick={() => {
                                        const val = (document.getElementById(\`time-pres-\${t.cod_turno}\`) as HTMLInputElement)?.value;
                                        if(val) handleMarcarPresente(t, val);
                                      }} 
                                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 uppercase"
                                    >
                                      OK
                                    </button>
                                  )}
                                </div>`
);

// Update render for sal
code = code.replace(
  /<span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-\[10px\] font-bold uppercase">\s+<span className="w-2 h-2 rounded-full bg-blue-500 mr-1\.5"><\/span> \{sal\.time\} hs\s+<\/span>/,
  `<div className="flex items-center justify-center gap-1">
                                  <input 
                                    type="time" 
                                    id={\`time-sal-\${t.cod_turno}\`} 
                                    defaultValue={typeof sal === 'string' ? sal : sal.time} 
                                    disabled={!isToday}
                                    className="w-[75px] text-xs border border-blue-300 bg-blue-50 text-blue-700 rounded px-1 py-1 font-bold text-center" 
                                  />
                                  {isToday && (
                                    <button 
                                      onClick={() => {
                                        const val = (document.getElementById(\`time-sal-\${t.cod_turno}\`) as HTMLInputElement)?.value;
                                        if(val) handleMarcarSalida(t, val);
                                      }} 
                                      className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700 uppercase"
                                    >
                                      OK
                                    </button>
                                  )}
                                </div>`
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

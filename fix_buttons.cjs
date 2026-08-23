const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// 1. Remove disabled=!isRowReady and disabled=!pres
code = code.replace(/disabled=\{!isRowReady\}/g, '');
code = code.replace(/disabled=\{!pres\}/g, '');

// Adjust button classes so they are clickable
code = code.replace(/className=\{`px-3 py-1 border rounded text-\[10px\] font-bold uppercase transition-colors \$\{isRowReady \? 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'\}`\}/g, 
"className={`px-3 py-1 border rounded text-[10px] font-bold uppercase transition-colors ${isRowReady ? 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'}`}");

code = code.replace(/className=\{`px-3 py-1 border rounded text-\[10px\] font-bold uppercase transition-colors \$\{pres \? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'\}`\}/g, 
"className={`px-3 py-1 border rounded text-[10px] font-bold uppercase transition-colors ${pres ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'}`}");

// 2. Llegadas de Turnos
// Replace: <input type="time" onChange={(e) => handleLlegada(t.cod_turno, e.target.value)} className="w-[120px] text-xs border border-slate-300 rounded px-2 py-1" />
code = code.replace(/<input type="time" onChange=\{\(e\) => handleLlegada\(t\.cod_turno, e\.target\.value\)\} className="w-\[120px\] text-xs border border-slate-300 rounded px-2 py-1" \/>/g, 
`<div className="flex items-center gap-1">
  <input type="time" id={\`time-llegada-\${t.cod_turno}\`} className="w-[90px] text-xs border border-slate-300 rounded px-2 py-1" />
  <button onClick={() => {
    const val = (document.getElementById(\`time-llegada-\${t.cod_turno}\`) as HTMLInputElement)?.value;
    if(val) handleLlegada(t.cod_turno, val);
  }} className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700 uppercase">Guardar</button>
  <button onClick={() => {
    handleLlegada(t.cod_turno, new Date().toTimeString().substring(0, 5));
  }} className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 uppercase">Ahora</button>
</div>`);

// 3. Verificaciones Tecnicas Salidas
// Replace: <input type="time" onChange={(e) => handleSaveVerif(cod, 'hora_salida_verificacion', e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1" />
code = code.replace(/<input type="time" onChange=\{\(e\) => handleSaveVerif\(cod, 'hora_salida_verificacion', e\.target\.value\)\} className="text-xs border border-slate-200 rounded px-2 py-1" \/>/g, 
`<div className="flex items-center gap-1">
  <input type="time" id={\`time-vsalida-\${cod}\`} className="w-[80px] text-xs border border-slate-300 rounded px-2 py-1" />
  <button onClick={() => {
    const val = (document.getElementById(\`time-vsalida-\${cod}\`) as HTMLInputElement)?.value;
    if(val) handleSaveVerif(cod, 'hora_salida_verificacion', val);
  }} className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700">OK</button>
  <button onClick={() => {
    handleSaveVerif(cod, 'hora_salida_verificacion', new Date().toTimeString().substring(0, 5));
  }} className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700">Ya</button>
</div>`);

// 4. Verificaciones Tecnicas Llegadas
// Replace: <input type="time" onChange={(e) => handleSaveVerif(cod, 'hora_llegada_verificacion', e.target.value)} className="w-[120px] text-xs border border-slate-300 rounded px-2 py-1" />
code = code.replace(/<input type="time" onChange=\{\(e\) => handleSaveVerif\(cod, 'hora_llegada_verificacion', e\.target\.value\)\} className="w-\[120px\] text-xs border border-slate-300 rounded px-2 py-1" \/>/g, 
`<div className="flex items-center gap-1">
  <input type="time" id={\`time-vllegada-\${cod}\`} className="w-[80px] text-xs border border-slate-300 rounded px-2 py-1" />
  <button onClick={() => {
    const val = (document.getElementById(\`time-vllegada-\${cod}\`) as HTMLInputElement)?.value;
    if(val) handleSaveVerif(cod, 'hora_llegada_verificacion', val);
  }} className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700">OK</button>
  <button onClick={() => {
    handleSaveVerif(cod, 'hora_llegada_verificacion', new Date().toTimeString().substring(0, 5));
  }} className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700">Ya</button>
</div>`);

// 5. Auxilios Llegadas
// Replace: <input type="time" onChange={(e) => handleAuxilioLlegada(a.id || a.created_at, e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1" />
code = code.replace(/<input type="time" onChange=\{\(e\) => handleAuxilioLlegada\(a\.id \|\| a\.created_at, e\.target\.value\)\} className="text-xs border border-slate-200 rounded px-2 py-1" \/>/g, 
`<div className="flex items-center gap-1">
  <input type="time" id={\`time-auxllegada-\${a.id || a.created_at}\`} className="w-[80px] text-xs border border-slate-300 rounded px-2 py-1" />
  <button onClick={() => {
    const val = (document.getElementById(\`time-auxllegada-\${a.id || a.created_at}\`) as HTMLInputElement)?.value;
    if(val) handleAuxilioLlegada(a.id || a.created_at, val);
  }} className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700">OK</button>
  <button onClick={() => {
    handleAuxilioLlegada(a.id || a.created_at, new Date().toTimeString().substring(0, 5));
  }} className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700">Ya</button>
</div>`);


fs.writeFileSync('src/pages/ControlGarita.tsx', code);

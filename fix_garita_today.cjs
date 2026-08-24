const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// 1. Add isToday
code = code.replace(
  /const \[fecha, setFecha\] = useState\(new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\);/,
  `const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const isToday = fecha === new Date().toISOString().split('T')[0];`
);

// 2. handleNovedad
code = code.replace(
  /const handleNovedad = async \(t: any\) => \{/,
  `const handleNovedad = async (t: any) => {
    if (!isToday) {
      alert("Solo se pueden editar las novedades en la fecha actual.\\n\\nNovedad registrada: " + (t.observaciones || 'Ninguna.'));
      return;
    }`
);

// 3. handleSaveVerif (Verificaciones Novedad)
code = code.replace(
  /const handleSaveVerif = \(cod: string, field: string, value: string\) => \{/,
  `const handleSaveVerif = (cod: string, field: string, value: string) => {
    if (!isToday) return;`
);

// 4. Disable buttons and inputs
// AUSENTE - MARCAR
code = code.replace(
  /disabled=\{!isRowReady\}/, 
  `disabled={!isRowReady || !isToday}`
);
code = code.replace(
  /className=\{`px-3 py-1 border rounded text-\[10px\] font-bold uppercase transition-colors \$\{isRowReady \? 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'\}`\}/g,
  `className={\`px-3 py-1 border rounded text-[10px] font-bold uppercase transition-colors \${(!isRowReady || !isToday) ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50' : 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200'}\`}`
);

// MARCAR SALIDA
code = code.replace(
  /disabled=\{!pres\}/,
  `disabled={!pres || !isToday}`
);
code = code.replace(
  /className=\{`px-3 py-1 border rounded text-\[10px\] font-bold uppercase transition-colors \$\{pres \? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'\}`\}/g,
  `className={\`px-3 py-1 border rounded text-[10px] font-bold uppercase transition-colors \${(!pres || !isToday) ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'}\`}`
);

// Llegadas and Verificaciones time inputs + buttons
code = code.replace(/<input type="time" (.*?) className="/g, `<input type="time" disabled={!isToday} $1 className="`);

// Llegadas Guardar/Ahora buttons
code = code.replace(/<button onClick=\{\(\) => \{\s*const val = \(document\.getElementById/g, `<button disabled={!isToday} onClick={() => {
    const val = (document.getElementById`);
code = code.replace(/<button onClick=\{\(\) => \{\s*handleLlegada\(t\.cod_turno/g, `<button disabled={!isToday} onClick={() => {
    handleLlegada(t.cod_turno`);
code = code.replace(/<button onClick=\{\(\) => \{\s*handleSaveVerif\(cod, 'hora/g, `<button disabled={!isToday} onClick={() => {
    handleSaveVerif(cod, 'hora`);
code = code.replace(/<button onClick=\{\(\) => \{\s*handleAuxilioLlegada\(a/g, `<button disabled={!isToday} onClick={() => {
    handleAuxilioLlegada(a`);
    
// Button classes for llegadas/verificaciones disabled state
code = code.replace(/className="px-2 py-1 bg-blue-600 text-white rounded text-\[10px\] font-bold hover:bg-blue-700(.*?)"/g, 
  `className={\`px-2 py-1 rounded text-[10px] font-bold uppercase \${isToday ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}\`}`);

code = code.replace(/className="px-2 py-1 bg-emerald-600 text-white rounded text-\[10px\] font-bold hover:bg-emerald-700(.*?)"/g, 
  `className={\`px-2 py-1 rounded text-[10px] font-bold uppercase \${isToday ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}\`}`);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

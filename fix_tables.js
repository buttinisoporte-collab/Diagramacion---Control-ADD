import fs from 'fs';

let content = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf-8');

// Replace setAuxiliosList and auxiliosList
// In Salidas table
content = content.replace(
  /\{auxiliosList\.map\(\(a, idx\) => \{\s*return \(\s*<tr key=\{a\.id \? \`salasis-\$\{a\.id\}-\$\{idx\}\` : \`salasis-\$\{a\.created_at\}-\$\{idx\}\`\}/g,
  "{salidasAuxiliosList.map((a, idx) => {                        return (                          <tr key={a.id ? `salasis-${a.id}-${idx}` : `salasis-${a.created_at}-${idx}`}"
);
content = content.replace(
  /\{auxiliosList\.length === 0 && \(/g,
  "{salidasAuxiliosList.length === 0 && ("
);

// We have two places with auxiliosList.length === 0, one in Salidas and one in Llegadas
content = content.replace(
  /\{salidasAuxiliosList\.length === 0 && \(\s*<tr><td colSpan=\{5\} className="px-4 py-8 text-center text-slate-500">No hay unidades de auxilio en curso\./g,
  "{llegadasAuxiliosList.length === 0 && (                <tr><td colSpan={5} className=\"px-4 py-8 text-center text-slate-500\">No hay unidades de auxilio en curso."
);

content = content.replace(
  /\{auxiliosList\.map\(\(a, idx\) => \{\s*const llegAsis = llegadasAsistenciaMap/g,
  "{llegadasAuxiliosList.map((a, idx) => {                const llegAsis = llegadasAsistenciaMap"
);

// We need to replace setAuxiliosList in the OK buttons for Salida
// hora_salida_mecanico OK
content = content.replace(
  /setAuxiliosList\(prev => prev\.map\(x => x\.id === a\.id \? \{ \.\.\.x, hora_salida_mecanico: timeValue \} : x\)\);/g,
  "setSalidasAuxiliosList(prev => prev.map(x => x.id === a.id ? { ...x, hora_salida_mecanico: timeValue } : x)); saveAuxilioSalida(a.id || a.created_at, fecha);"
);
// hora_salida_asistencia OK
content = content.replace(
  /setAuxiliosList\(prev => prev\.map\(x => x\.id === a\.id \? \{ \.\.\.x, hora_salida_asistencia: timeValue \} : x\)\);/g,
  "setSalidasAuxiliosList(prev => prev.map(x => x.id === a.id ? { ...x, hora_salida_asistencia: timeValue } : x)); saveAuxilioSalida(a.id || a.created_at, fecha);"
);

// In Llegadas, OK buttons for hora_llegada_mecanico
// Wait, there is one setAuxiliosList for hora_llegada_mecanico
content = content.replace(
  /setAuxiliosList\(prev => prev\.map\(x => x\.id === a\.id \? \{ \.\.\.x, hora_llegada_mecanico: timeValue \} : x\)\);/g,
  "setLlegadasAuxiliosList(prev => prev.map(x => x.id === a.id ? { ...x, hora_llegada_mecanico: timeValue } : x)); saveAuxilioLlegada(a.id || a.created_at, fecha);"
);
// And setLlegadasAsistenciaMap for hora_llegada_asistencia
// Wait, handleAuxilioLlegadaAsistencia doesn't update setAuxiliosList, it updates setLlegadasAsistenciaMap!
// But we should also saveAuxilioLlegada!
content = content.replace(
  /const handleAuxilioLlegadaAsistencia = async \(id: string, timeValue: string\) => \{/g,
  "const handleAuxilioLlegadaAsistencia = async (id: string, timeValue: string) => { saveAuxilioLlegada(id, fecha);"
);


// In Modal Save
content = content.replace(
  /setAuxiliosList\(prev => prev\.map\(a => a\.id === activeAuxilioForModal\.id \? activeAuxilioForModal : a\)\);/g,
  "setSalidasAuxiliosList(prev => prev.map(a => a.id === activeAuxilioForModal.id ? activeAuxilioForModal : a)); setLlegadasAuxiliosList(prev => prev.map(a => a.id === activeAuxilioForModal.id ? activeAuxilioForModal : a));"
);

// For Rota/Reemplazo radio buttons in Llegadas
content = content.replace(
  /setAuxiliosList\(prev => prev\.map\(x => \s*\(x\.id === a\.id \|\| \(x\.created_at === a\.created_at && !a\.id\)\) \s*\? \{ \.\.\.x, unidad_que_retorna: nuevoValor \} \s*: x\s*\)\);/g,
  "setLlegadasAuxiliosList(prev => prev.map(x => (x.id === a.id || (x.created_at === a.created_at && !a.id)) ? { ...x, unidad_que_retorna: nuevoValor } : x));"
);

// For Novedad
content = content.replace(
  /setAuxiliosList\(prev => prev\.map\(x => \(x\.id === a\.id && x\.created_at === a\.created_at\) \? \{ \.\.\.x, novedad_aux: nov \} : x\)\);/g,
  "setLlegadasAuxiliosList(prev => prev.map(x => (x.id === a.id && x.created_at === a.created_at) ? { ...x, novedad_aux: nov } : x)); setSalidasAuxiliosList(prev => prev.map(x => (x.id === a.id && x.created_at === a.created_at) ? { ...x, novedad_aux: nov } : x));"
);

// Display the correct departure date in Llegadas
// Find: {a.fecha && a.fecha !== fecha ? <div className="mb-1"><span className="text-[10px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded">{a.fecha.split('-')[2]}/{a.fecha.split('-')[1]}</span></div> : null}
// We need to replace it with a dynamic departure date
const oldDepartureLabel = "{a.fecha && a.fecha !== fecha ? <div className=\"mb-1\"><span className=\"text-[10px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded\">{a.fecha.split('-')[2]}/{a.fecha.split('-')[1]}</span></div> : null}";
const newDepartureLabel = "{(getAuxiliosDates()[a.id || a.created_at]?.salida || a.fecha) !== fecha ? <div className=\"mb-1\"><span className=\"text-[10px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded\">{(getAuxiliosDates()[a.id || a.created_at]?.salida || a.fecha).split('-')[2]}/{(getAuxiliosDates()[a.id || a.created_at]?.salida || a.fecha).split('-')[1]}</span></div> : null}";

content = content.replace(oldDepartureLabel, newDepartureLabel);

fs.writeFileSync('src/pages/ControlGarita.tsx', content);

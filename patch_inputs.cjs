const fs = require('fs');
let code = fs.readFileSync('src/pages/Auxilios.tsx', 'utf8');

const targetUnidad = `<input type="text" className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none" value={unidadReemplazo} onChange={(e) => setUnidadReemplazo(e.target.value)} />`;
const replacementUnidad = `<select className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none" value={unidadReemplazo} onChange={(e) => setUnidadReemplazo(e.target.value)}>
                      <option value="">-- Sin Unidad --</option>
                      {flotaList.sort((a, b) => (a.unidad || '').localeCompare(b.unidad || '', undefined, { numeric: true })).map((f: any) => (
                        <option key={f.id_unidad} value={f.unidad}>{f.unidad}</option>
                      ))}
                    </select>`;

const targetPersonal = `<input type="text" className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none" value={personalMecanico} onChange={(e) => setPersonalMecanico(e.target.value)} />`;
const replacementPersonal = `<select className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none" value={personalMecanico} onChange={(e) => setPersonalMecanico(e.target.value)}>
                      <option value="">-- Seleccionar --</option>
                      {mecanicosList.sort((a, b) => (a.apellido_nombre || '').localeCompare(b.apellido_nombre || '')).map((m: any) => (
                        <option key={m.id_mecanico} value={m.apellido_nombre}>{m.apellido_nombre}</option>
                      ))}
                    </select>`;

code = code.replace(targetUnidad, replacementUnidad);
code = code.replace(targetPersonal, replacementPersonal);
fs.writeFileSync('src/pages/Auxilios.tsx', code);

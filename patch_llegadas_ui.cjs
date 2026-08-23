const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

const targetTableStart = `              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
                  <h3 className="font-bold text-slate-700 text-sm">Consolidación de Llegadas (Turnos)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">`;

const oldUIStart = `              <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col flex-1 min-h-[300px]">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex-shrink-0">
                  <h3 className="font-bold text-slate-700 text-sm">Consolidación de Llegadas (Turnos)</h3>
                </div>
                <div className="overflow-auto flex-1 bg-white relative">
                  <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 uppercase text-[10px] font-bold shadow-sm">
                      <tr>
                        <th className="px-4 py-3 bg-slate-50">Turno</th>
                        <th className="px-4 py-3 bg-slate-50">Unidad</th>
                        <th className="px-4 py-3 bg-slate-50">Conductor Principal</th>
                        <th className="px-4 py-3 bg-slate-50">Hora Llegada a Base</th>
                        <th className="px-4 py-3 bg-slate-50">Novedades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTurnos.map(t => {
                        const lleg = llegadasMap[t.cod_turno] || t.hora_llegada_verificacion;
                        return (
                          <tr key={t.cod_turno} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-700">{t.cod_turno}</td>
                            <td className="px-4 py-3 font-bold text-[#5c6bc0]">{t.unidad || '-'}</td>
                            <td className="px-4 py-3 font-medium text-slate-700">{t.conductor_principal || '-'}</td>
                            <td className="px-4 py-3">
                              {lleg ? (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> {typeof lleg === 'string' ? lleg : lleg.time} hs
                                </span>
                              ) : (
                                <input type="time" onChange={(e) => handleLlegada(t.cod_turno, e.target.value)} className="w-[120px] text-xs border border-slate-300 rounded px-2 py-1" />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button 
                                onClick={() => {
                                  const nov = prompt("Ingrese la novedad a la llegada:", t.observaciones || '');
                                  if (nov !== null) handleNovedad(t.cod_turno, nov);
                                }}
                                className={\`px-3 py-1 \${t.observaciones ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'} text-white rounded text-xs font-bold w-full max-w-[120px]\`}
                              >
                                {t.observaciones ? 'Ver Novedad' : 'Novedad'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Verificaciones Tecnicas Llegadas */}
                      {[1, 2, 3].map(idx => {
                        const cod = \`VERIF-\${idx}\`;
                        const v = verificaciones.find(x => x.cod_turno === cod);
                        if (!v?.unidad) return null;
                        return (
                          <tr key={cod} className="border-b border-blue-100 bg-blue-50/30 hover:bg-blue-50">
                            <td className="px-4 py-3 font-bold text-blue-800">Verificación Técnica</td>
                            <td className="px-4 py-3 font-bold text-[#5c6bc0]">{v.unidad}</td>
                            <td className="px-4 py-3 font-medium text-slate-700">{v.mecanico_verificacion || '-'}</td>
                            <td className="px-4 py-3">
                              {v.hora_llegada_verificacion ? (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> {v.hora_llegada_verificacion} hs
                                </span>
                              ) : (
                                <input type="time" onChange={(e) => handleSaveVerif(cod, 'hora_llegada_verificacion', e.target.value)} className="w-[120px] text-xs border border-slate-300 rounded px-2 py-1" />
                              )}
                            </td>
                            <td className="px-4 py-3">
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
                      })}
                    </tbody>
                  </table>
                </div>
              </div>`;

const startIndex = code.indexOf(targetTableStart);
if (startIndex !== -1) {
  const endMarker = '              </div>\n\n              {/* Auxilios Llegadas */}';
  const endIndex = code.indexOf(endMarker, startIndex);
  if (endIndex !== -1) {
    code = code.substring(0, startIndex) + oldUIStart + code.substring(endIndex);
    fs.writeFileSync('src/pages/ControlGarita.tsx', code);
    console.log("Successfully patched Llegadas table");
  } else {
    console.log("Could not find endIndex marker");
  }
} else {
  console.log("Could not find targetTableStart marker");
}

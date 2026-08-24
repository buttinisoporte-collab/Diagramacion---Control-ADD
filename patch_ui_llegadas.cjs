const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// 1. Add "Hora Salida" column to Turnos Llegadas
code = code.replace(
  /<th className="px-2 py-1\.5 text-xs bg-slate-50">Conductor Principal<\/th>\s*<th className="px-2 py-1\.5 text-xs bg-slate-50">Hora Llegada a Base<\/th>/,
  '<th className="px-2 py-1.5 text-xs bg-slate-50">Conductor Principal</th>\n                        <th className="px-2 py-1.5 text-xs bg-slate-50">Hora Salida</th>\n                        <th className="px-2 py-1.5 text-xs bg-slate-50">Hora Llegada a Base</th>'
);

// 2. Add the corresponding td to the Turnos Llegadas map
code = code.replace(
  /<td className="px-2 py-1\.5 text-xs font-medium text-slate-700">\{t\.conductor_principal \|\| '-'\}<\/td>\s*<td className="px-2 py-1\.5 text-xs">/,
  `<td className="px-2 py-1.5 text-xs font-medium text-slate-700">{t.conductor_principal || '-'}</td>
                            <td className="px-2 py-1.5 text-xs font-bold text-slate-600">
                              {t.isYesterday && t.fecha_salida ? <span className="mr-1 text-[10px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded">{t.fecha_salida.split('-')[2]}/{t.fecha_salida.split('-')[1]}</span> : null}
                              {t.hora_salida_base || '-'}
                            </td>
                            <td className="px-2 py-1.5 text-xs">`
);

// 3. For Auxilios Llegadas, add the date before the Hora Salida
code = code.replace(
  /<td className="px-2 py-1\.5 text-xs font-bold text-slate-600">\{a\.hora_salida_mecanico \|\| '-'\}<\/td>/,
  `<td className="px-2 py-1.5 text-xs font-bold text-slate-600">
                              {a.fecha && a.fecha !== fecha ? <span className="mr-1 text-[10px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded">{a.fecha.split('-')[2]}/{a.fecha.split('-')[1]}</span> : null}
                              {a.hora_salida_mecanico || '-'}
                            </td>`
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

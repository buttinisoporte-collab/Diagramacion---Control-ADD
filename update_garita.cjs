const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// Replace header
code = code.replace('<th className="px-4 py-3">Horario</th>', '<th className="px-4 py-3">H. Presentación</th>\n                  <th className="px-4 py-3">H. Salida Base</th>');

// Also replace the data cell
code = code.replace(
`<td className="px-4 py-3 font-mono font-bold text-slate-700">
                        {t.hora_presentacion || '-'}
                      </td>`, 
`<td className="px-4 py-3 font-mono font-bold text-slate-700">
                        {t.hora_presentacion || '-'}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        {t.hora_salida_base || '-'}
                      </td>`
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

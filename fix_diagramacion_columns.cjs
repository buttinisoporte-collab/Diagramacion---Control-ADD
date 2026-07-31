const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');

code = code.replace(
    '<th className="py-3 px-3 min-w-[200px]">Servicio</th>',
    '<th className="py-3 px-3 min-w-[200px]">Salida</th>'
);

// Add Llegada header
code = code.replace(
    '<th className="py-3 px-3">Llegada Base</th>',
    '<th className="py-3 px-3">Llegada Base</th>\n                    <th className="py-3 px-3">Llegada</th>'
);

// Add Llegada column in tbody
code = code.replace(
    '<td className="py-2.5 px-3 font-mono text-[11px] font-bold text-slate-600">\n                          {formatTime(t.hora_llegada_base)}\n                        </td>',
    '<td className="py-2.5 px-3 font-mono text-[11px] font-bold text-slate-600">\n                          {formatTime(t.hora_llegada_base)}\n                        </td>\n                        <td className="py-2.5 px-3 font-bold text-slate-700 text-xs">\n                          {t.llegada || "-"}\n                        </td>'
);

fs.writeFileSync('src/pages/Diagramacion.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// 1. Add verifStateMap state
code = code.replace(
  /const \[verificaciones, setVerificaciones\] = useState<any\[\]>\(\[\]\);/,
  `const [verificaciones, setVerificaciones] = useState<any[]>([]);
  const [verifStateMap, setVerifStateMap] = useState<Record<string, any>>({});
  
  const handleSaveVerif = (cod: string, field: string, value: string) => {
    setVerifStateMap(prev => ({
      ...prev,
      [cod]: {
        ...(prev[cod] || {}),
        [field]: value
      }
    }));
  };`
);

// 2. Fix the rendering in Salidas
const oldSalida = `{[1, 2, 3].map(idx => {
                        const cod = \\\`VERIF-\\\${idx}\\\`;
                        const v = verificaciones.find(x => x.cod_turno === cod) || { cod_turno: cod, unidad: '' };
                        if (!v.unidad) return null;
                        return (
                          <tr key={cod} className="hover:bg-slate-50">
                            <td className="px-2 py-1.5 text-xs">
                              {v.hora_salida_verificacion ? (
                                <span className="font-bold text-emerald-600">{formatTime(v.hora_salida_verificacion)}</span>
                              ) : (
                                <input type="time" onChange={(e) => handleSaveVerif(cod, 'hora_salida_verificacion', e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1" />
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-xs font-bold text-slate-700">Verificación Técnica</td>
                            <td className="px-2 py-1.5 text-xs font-mono font-bold text-slate-600">{v.unidad}</td>
                            <td className="px-2 py-1.5 text-xs">
                              <select value={v.mecanico_verificacion || ''} onChange={(e) => handleSaveVerif(cod, 'mecanico_verificacion', e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1">
                                <option value="">-- Seleccionar --</option>
                                {mecanicosList.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-1.5 text-xs">
                              <input type="text" defaultValue={v.observaciones || ''} onBlur={(e) => handleSaveVerif(cod, 'observaciones', e.target.value)} placeholder="Novedad..." className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:border-blue-500" />
                            </td>
                          </tr>
                        );
                      })}`;

const newSalida = `{(() => {
                        const allUnits: { cod: string; unit: string }[] = [];
                        verificaciones.forEach(v => {
                          if (v.unidad) {
                            const units = v.unidad.split(',').map((u: string) => u.trim()).filter(Boolean);
                            units.forEach((u: string, idx: number) => {
                              allUnits.push({ cod: \`\${v.cod_turno}-\${idx}\`, unit: u });
                            });
                          }
                        });
                        if (allUnits.length === 0) return <tr><td colSpan={5} className="px-2 py-3 text-center text-xs text-slate-400">Sin unidades a verificar</td></tr>;
                        
                        return allUnits.map(uInfo => {
                          const cod = uInfo.cod;
                          const v = verifStateMap[cod] || {};
                          return (
                            <tr key={cod} className="hover:bg-slate-50">
                              <td className="px-2 py-1.5 text-xs">
                                {v.hora_salida_verificacion ? (
                                  <span className="font-bold text-emerald-600">{formatTime(v.hora_salida_verificacion)}</span>
                                ) : (
                                  <input type="time" onChange={(e) => handleSaveVerif(cod, 'hora_salida_verificacion', e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1" />
                                )}
                              </td>
                              <td className="px-2 py-1.5 text-xs font-bold text-slate-700">Verificación Técnica</td>
                              <td className="px-2 py-1.5 text-xs font-mono font-bold text-slate-600">{uInfo.unit}</td>
                              <td className="px-2 py-1.5 text-xs">
                                <select value={v.mecanico_verificacion || ''} onChange={(e) => handleSaveVerif(cod, 'mecanico_verificacion', e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1">
                                  <option value="">-- Seleccionar --</option>
                                  {mecanicosList.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                              </td>
                              <td className="px-2 py-1.5 text-xs">
                                <input type="text" defaultValue={v.observaciones || ''} onBlur={(e) => handleSaveVerif(cod, 'observaciones', e.target.value)} placeholder="Novedad..." className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:border-blue-500" />
                              </td>
                            </tr>
                          );
                        });
                      })()}`;

// We will use standard replace on the file contents.
code = code.replace(/\{\[1, 2, 3\]\.map\(idx => \{\s*const cod = `VERIF-\$\{idx\}`;\s*const v = verificaciones\.find\(x => x\.cod_turno === cod\) \|\| \{ cod_turno: cod, unidad: '' \};\s*if \(!v\.unidad\) return null;\s*return \(\s*<tr key=\{cod\}.*?<\/tr>\s*\);\s*\}\)\}/s, newSalida);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');

// Sort data when setting it
code = code.replace(
  /setFlota\(loadedFlota\);/,
  `setFlota(loadedFlota.sort((a, b) => (a.unidad || '').localeCompare(b.unidad || '')));`
);
code = code.replace(
  /setConductores\(loadedConductores\);/,
  `setConductores(loadedConductores.sort((a, b) => (a.apellido_nombre || '').localeCompare(b.apellido_nombre || '')));`
);

// We need to change the <select> to <Select> for Unidad and Conductor
// The <select> for unidad is around line 1280.
// Let's replace the whole Table Cell for Unidad
const unidadSelectRegex = /\{\/\* Unidad Dropdown \*\/\}.*?<select[^>]*>.*?<\/select>\s*<\/td>/s;
const unidadSelectReplacement = `{/* Unidad Dropdown */}
                        <td className="py-2.5 px-4 min-w-[200px]">
                          <Select
                            value={assign.unidad ? { value: assign.unidad, label: assign.unidad } : null}
                            onChange={(option) => handleAssignmentChange(t.cod_turno, 'unidad', option ? option.value : '')}
                            options={flota.map(u => ({ value: u.unidad, label: \`\${u.unidad} \${u.patente ? '(' + u.patente + ')' : ''}\` }))}
                            isClearable
                            placeholder="-- Unidad --"
                            menuPortalTarget={document.body}
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: '32px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                borderColor: hasUnitConflict ? '#ef4444' : assign.unidad ? '#6ee7b7' : '#cbd5e1',
                                backgroundColor: hasUnitConflict ? '#fef2f2' : 'white'
                              }),
                              menuPortal: base => ({ ...base, zIndex: 9999 })
                            }}
                          />
                        </td>`;

code = code.replace(unidadSelectRegex, unidadSelectReplacement);

// Same for Conductor Principal
const cond1Regex = /\{\/\* Conductor Principal Dropdown \*\/\}.*?<select[^>]*>.*?<\/select>\s*<\/td>/s;
const cond1Replacement = `{/* Conductor Principal Dropdown */}
                        <td className="py-2.5 px-4 min-w-[220px]">
                          <Select
                            value={assign.conductor_principal ? { value: assign.conductor_principal, label: assign.conductor_principal } : null}
                            onChange={(option) => handleAssignmentChange(t.cod_turno, 'conductor_principal', option ? option.value : '')}
                            options={conductores.map(c => ({ value: c.apellido_nombre, label: \`\${c.apellido_nombre} \${c.legajo ? '(' + c.legajo + ')' : ''}\` }))}
                            isClearable
                            placeholder="-- Conductor --"
                            menuPortalTarget={document.body}
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: '32px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                borderColor: hasDriverConflict ? '#ef4444' : assign.conductor_principal ? '#6ee7b7' : '#cbd5e1',
                                backgroundColor: hasDriverConflict ? '#fef2f2' : 'white'
                              }),
                              menuPortal: base => ({ ...base, zIndex: 9999 })
                            }}
                          />
                        </td>`;

code = code.replace(cond1Regex, cond1Replacement);

// Same for Conductor Secundario
const cond2Regex = /\{\/\* Conductor Secundario \*\/\}.*?<select[^>]*>.*?<\/select>\s*<\/td>/s;
const cond2Replacement = `{/* Conductor Secundario */}
                        <td className="py-2.5 px-4 min-w-[220px]">
                          <Select
                            value={assign.conductor_secundario ? { value: assign.conductor_secundario, label: assign.conductor_secundario } : null}
                            onChange={(option) => handleAssignmentChange(t.cod_turno, 'conductor_secundario', option ? option.value : '')}
                            options={conductores.map(c => ({ value: c.apellido_nombre, label: \`\${c.apellido_nombre} \${c.legajo ? '(' + c.legajo + ')' : ''}\` }))}
                            isClearable
                            placeholder="-- Opcional --"
                            menuPortalTarget={document.body}
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: '32px',
                                fontSize: '12px',
                                borderColor: '#cbd5e1'
                              }),
                              menuPortal: base => ({ ...base, zIndex: 9999 })
                            }}
                          />
                        </td>`;

code = code.replace(cond2Regex, cond2Replacement);

// We must also update grid view selects!
// The grid view selects are similar, let's just do a regex replace on them too.
// Or we can manually find and replace them.
fs.writeFileSync('src/pages/Diagramacion.tsx', code, 'utf8');

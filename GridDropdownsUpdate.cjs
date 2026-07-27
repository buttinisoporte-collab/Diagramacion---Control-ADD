const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');

// For grid view:
// Look for <div><label ...>Unidad</label><select...>...</select></div>
const gridUnidadRegex = /<div>\s*<label[^>]*>Unidad<\/label>\s*<select[^>]*>.*?<\/select>\s*<\/div>/s;
const gridUnidadReplacement = `<div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unidad</label>
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
                          </div>`;
code = code.replace(gridUnidadRegex, gridUnidadReplacement);

const gridCond1Regex = /<div>\s*<label[^>]*>Cond\. Principal<\/label>\s*<select[^>]*>.*?<\/select>\s*<\/div>/s;
const gridCond1Replacement = `<div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cond. Principal</label>
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
                          </div>`;
code = code.replace(gridCond1Regex, gridCond1Replacement);

const gridCond2Regex = /<div>\s*<label[^>]*>Cond\. Secundario<\/label>\s*<select[^>]*>.*?<\/select>\s*<\/div>/s;
const gridCond2Replacement = `<div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cond. Secundario</label>
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
                          </div>`;
code = code.replace(gridCond2Regex, gridCond2Replacement);

fs.writeFileSync('src/pages/Diagramacion.tsx', code, 'utf8');

const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');

// I will replace everything from {/* Unidad Dropdown */} where it has <td ...> inside the grid view
// up to the start of the table view's {/* Observaciones */} 

// Actually, I can use a simpler approach. I will replace the broken section entirely.
const startMarker = '{/* Selectors */}';
const endMarker = '{/* Observaciones */}';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newSection = `{/* Selectors */}
                      <div className="space-y-2.5">
                        {/* Unidad Dropdown */}
                        <div>
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
                        </div>
                        {/* Conductor Principal Dropdown */}
                        <div>
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
                        </div>
                        {/* Conductor Secundario Dropdown */}
                        <div>
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
                        </div>
                        {/* Observaciones Grid */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Observaciones</label>
                          <input type="text" placeholder="Notas..." value={assign.observaciones || ''} onChange={(e) => handleAssignmentChange(t.cod_turno, 'observaciones', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:bg-white focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 rounded-tl-xl">Código</th>
                    <th className="py-3 px-3">Tipo / Grupo</th>
                    <th className="py-3 px-3 min-w-[200px]">Servicio</th>
                    <th className="py-3 px-3">Presentación</th>
                    <th className="py-3 px-3">Salida Base</th>
                    <th className="py-3 px-3">Inicio - Fin</th>
                    <th className="py-3 px-3">Llegada Base</th>
                    <th className="py-3 px-4">Unidad</th>
                    <th className="py-3 px-4">Conductor Principal</th>
                    <th className="py-3 px-4">Conductor Secundario</th>
                    <th className="py-3 px-4 rounded-tr-xl">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredTurnos.map((t) => {
                    const assign = assignments[t.cod_turno] || { unidad: '', conductor_principal: '', conductor_secundario: '', observaciones: '' };
                    const conflict = conflictsMap[t.cod_turno];
                    const hasUnitConflict = conflict?.hasUnitConflict;
                    const hasDriverConflict = conflict?.hasDriverConflict;
                    
                    return (
                      <tr key={t.cod_turno} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-2.5 px-4 font-bold text-slate-800">{t.cod_turno}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-1 items-start">
                            {t.tipo_turno && (
                              <span className={\`px-2 py-0.5 rounded text-[10px] font-bold border \${t.tipo_turno === 'Urbano' ? 'bg-blue-50 text-blue-700 border-blue-200' : t.tipo_turno === 'Media' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-purple-50 text-purple-700 border-purple-200'}\`}>
                                {t.tipo_turno.toUpperCase()}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-medium">{t.grupo}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="text-xs font-bold text-slate-800 whitespace-normal line-clamp-2">{t.turno}</p>
                          <p className="text-[10px] text-slate-500 font-medium whitespace-normal">{t.temporada}</p>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{formatTime(t.hora_presentacion)}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{formatTime(t.hora_salida_base)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">{formatTime(t.hora_inicio)} - {formatTime(t.hora_fin)}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{formatTime(t.hora_llegada_base)}</td>
                        {/* Unidad Dropdown */}
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
                        </td>
                        {/* Conductor Principal Dropdown */}
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
                        </td>
                        {/* Conductor Secundario */}
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
                        </td>
                        `;
  code = code.substring(0, startIndex) + newSection + code.substring(endIndex);
  fs.writeFileSync('src/pages/Diagramacion.tsx', code, 'utf8');
} else {
  console.log("Could not find markers");
}

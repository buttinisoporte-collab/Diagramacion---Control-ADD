const fs = require('fs');
let code = fs.readFileSync('src/pages/Configuracion.tsx', 'utf8');

const regex = /\{<input type="checkbox" className="w-4 h-4 text-blue-600 rounded" \/>\}/g;
// Wait, let's just replace the map function contents.

const oldStr = `const key = \`\${r}_\${p}\`;
                            return (
                              <tr key={key} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-bold text-slate-700">{r}</td>
                                <td className="px-4 py-2 text-slate-600">{p}</td>
                                <td className="px-4 py-2 text-center">
                                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                                </td>
                              </tr>
                            );`;

const newStr = `const key = \`\${r}_\${p}\`;
                            const hasAccess = rolesPermisos.find(rp => rp.rol === r && rp.pantalla === p)?.acceso || false;
                            return (
                              <tr key={key} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-bold text-slate-700">{r}</td>
                                <td className="px-4 py-2 text-slate-600">{p}</td>
                                <td className="px-4 py-2 text-center">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-blue-600 rounded" 
                                    checked={hasAccess}
                                    onChange={() => handleTogglePermiso(r, p, hasAccess)}
                                  />
                                </td>
                              </tr>
                            );`;

code = code.replace(oldStr, newStr);

// Also remove the old activeTab === 'Roles' ? block at line 1008
const oldBlock = `) : activeTab === 'Roles' ? (
                <div className="p-8">
                  <h4 className="text-sm font-bold text-slate-800 mb-4">Niveles de Acceso por Rol</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { r: 'Administrador', desc: 'Acceso total a todas las pantallas, configuraciones y ABM.' },
                      { r: 'Diagramador', desc: 'Acceso a Diagramación de turnos, visualización de nómina y flota.' },
                      { r: 'Garita', desc: 'Acceso exclusivo a la pantalla de Control de Garita.' },
                      { r: 'Planific-Mantenimiento', desc: 'Acceso a reportes y diagramación de mecánicos matutinos.' },
                      { r: 'Mecanico', desc: 'Acceso a Control Mecánico, Mis Controles y checklist matutino.' },
                      { r: 'Conductor', desc: 'Acceso a Checklist de Salida, Durante Viaje y Después del Viaje (vía móvil).' }
                    ].map(role => (
                      <div key={role.r} className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs flex items-start space-x-3">
                        <div className="w-2.5 h-2.5 mt-1 bg-blue-600 rounded-full flex-shrink-0"></div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{role.r}</p>
                          <p className="text-xs text-slate-500 mt-1">{role.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>`;
code = code.replace(oldBlock, "");

fs.writeFileSync('src/pages/Configuracion.tsx', code);

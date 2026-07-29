const fs = require('fs');
let code = fs.readFileSync('src/pages/Configuracion.tsx', 'utf8');

// Insert Roles permissions logic
const rolesCode = `
             {/* Roles Tab */}
             {activeTab === 'Roles' ? (
                <div className="p-8">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Gestión de Permisos por Rol</h3>
                  <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="px-4 py-3">Rol</th>
                          <th className="px-4 py-3">Pantalla</th>
                          <th className="px-4 py-3 text-center">Acceso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {['Administrador', 'Diagramador', 'Garita', 'Planific-Mantenimiento', 'Mecanico', 'Conductor'].map(r => (
                          ['Garita', 'Diagramacion', 'Mecanica Matutina', 'Checklist Salida', 'Durante Viaje', 'Despues de Viaje', 'Control Mecanico', 'Mis Controles', 'Reportes', 'Configuracion'].map(p => {
                            const key = \`\${r}_\${p}\`;
                            return (
                              <tr key={key} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-bold text-slate-700">{r}</td>
                                <td className="px-4 py-2 text-slate-600">{p}</td>
                                <td className="px-4 py-2 text-center">
                                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                                </td>
                              </tr>
                            );
                          })
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
             ) : activeTab === 'Ajustes Generales' ? (
`;

code = code.replace("{activeTab === 'Ajustes Generales' ? (", rolesCode);

fs.writeFileSync('src/pages/Configuracion.tsx', code);

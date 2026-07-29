const fs = require('fs');
let code = fs.readFileSync('src/pages/Configuracion.tsx', 'utf8');

// Add state for roles
code = code.replace("const [pasteText, setPasteText] = useState('');", "const [pasteText, setPasteText] = useState('');\n  const [rolesPermisos, setRolesPermisos] = useState<any[]>([]);");

// Add fetch inside fetchData if tab is Roles
const fetchLogic = `
  async function fetchData() {
    setLoading(true);
    if (activeTab === 'Roles') {
      const { data } = await supabase.from('roles_permisos').select('*');
      if (data) setRolesPermisos(data);
      setLoading(false);
      return;
    }
    let query = supabase.from(tableName).select('*');
`;
code = code.replace("  async function fetchData() {\n    setLoading(true);\n    let query = supabase.from(tableName).select('*');", fetchLogic);

// Add toggle function
const toggleLogic = `
  async function handleTogglePermiso(rol: string, pantalla: string, currentVal: boolean) {
    const newVal = !currentVal;
    // update state optimistically
    setRolesPermisos(prev => {
      const existing = prev.find(p => p.rol === rol && p.pantalla === pantalla);
      if (existing) {
        return prev.map(p => p.id === existing.id ? { ...p, acceso: newVal } : p);
      } else {
        return [...prev, { rol, pantalla, acceso: newVal }];
      }
    });
    // upsert in db
    const { error } = await supabase.from('roles_permisos').upsert({ rol, pantalla, acceso: newVal }, { onConflict: 'rol,pantalla' });
    if (error) console.error(error);
  }
`;

code = code.replace("  async function handleImportExcel() {", toggleLogic + "\n  async function handleImportExcel() {");

const renderLogicOld = `{['Administrador', 'Diagramador', 'Garita', 'Planific-Mantenimiento', 'Mecanico', 'Conductor'].map(r => (
                          ['Garita', 'Diagramacion', 'Mecanica Matutina', 'Checklist Salida', 'Durante Viaje', 'Despues de Viaje', 'Control Mecanico', 'Mis Controles', 'Reportes', 'Configuracion'].map(p => {
                            const key = \\\`\\$\\{r\\}_\\$\\{p\\}\\\`;
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
                        ))}`;

const renderLogicNew = `{['Administrador', 'Diagramador', 'Garita', 'Planific-Mantenimiento', 'Mecanico', 'Conductor'].map(r => (
                          ['Garita', 'Diagramacion', 'Mecanica Matutina', 'Checklist Salida', 'Durante Viaje', 'Despues de Viaje', 'Control Mecanico', 'Mis Controles', 'Reportes', 'Configuracion'].map(p => {
                            const key = \`\${r}_\${p}\`;
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
                            );
                          })
                        ))}`;

code = code.replace(renderLogicOld, renderLogicNew);

fs.writeFileSync('src/pages/Configuracion.tsx', code);

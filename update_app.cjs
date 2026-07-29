const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const defaultRouteRedirect = `
function DefaultRouteRedirect() {
  const { user, loading, hasAccess } = useAuth();
  
  if (loading) return <div className="flex-1 flex items-center justify-center">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (hasAccess('Garita')) return <Navigate to="/garita" replace />;
  if (hasAccess('Diagramacion')) return <Navigate to="/diagramacion" replace />;
  if (hasAccess('Mecanica Matutina')) return <Navigate to="/mecanica-matutina" replace />;
  if (hasAccess('Control Mecanico')) return <Navigate to="/control-mecanico" replace />;
  if (hasAccess('Mis Controles')) return <Navigate to="/mis-controles" replace />;
  if (hasAccess('Checklist Salida')) return <Navigate to="/checklist-salida" replace />;
  if (hasAccess('Durante Viaje')) return <Navigate to="/durante-viaje" replace />;
  if (hasAccess('Despues de Viaje')) return <Navigate to="/despues-viaje" replace />;
  if (hasAccess('Reportes') || hasAccess('Reportes - Mecanica') || hasAccess('Reportes - Presentacion') || hasAccess('Reportes - Operaciones') || hasAccess('Reportes - Generales')) return <Navigate to="/reportes" replace />;
  if (hasAccess('Configuracion')) return <Navigate to="/configuracion" replace />;
  
  return <div className="p-8 text-center font-bold text-slate-500">No tiene pantallas asignadas.</div>;
}
`;

if (!code.includes('DefaultRouteRedirect')) {
  // insert before export default function App
  code = code.replace('export default function App() {', defaultRouteRedirect + '\nexport default function App() {');
}

// replace <Route path="/" element={<Navigate to="/garita" replace />} />
code = code.replace('<Route path="/" element={<Navigate to="/garita" replace />} />', '<Route path="/" element={<DefaultRouteRedirect />} />');

fs.writeFileSync('src/App.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldCheck = `function ProtectedRoute({ children, pantalla }: { children: React.ReactNode, pantalla: string }) {
  const { user, loading, hasAccess } = useAuth();
  
  if (loading) return <div className="flex-1 flex items-center justify-center">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  // Si no tiene acceso, lo mandamos a la primera pantalla que tenga o un unauthorized
  // Por ahora lo mandamos a una vista genérica o a login.
  // Exception: Administrador might have bypass if not configured, but we rely on DB.
  // Actually, wait, let's just show an Access Denied message if they try to access something they shouldn't.
  if (!hasAccess(pantalla)) {`;

const newCheck = `function ProtectedRoute({ children, pantalla }: { children: React.ReactNode, pantalla: string }) {
  const { user, loading, hasAccess } = useAuth();
  
  if (loading) return <div className="flex-1 flex items-center justify-center">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  let access = hasAccess(pantalla);
  if (pantalla === 'Reportes') {
      access = access || hasAccess('Reportes - Mecanica') || hasAccess('Reportes - Presentacion') || hasAccess('Reportes - Operaciones') || hasAccess('Reportes - Generales');
  }

  if (!access) {`;

code = code.replace(oldCheck, newCheck);
fs.writeFileSync('src/App.tsx', code);

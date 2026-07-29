const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = `import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SidebarProvider } from './context/SidebarContext';
import { AuthProvider, useAuth, RouteTracker } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import ControlGarita from './pages/ControlGarita';
import Diagramacion from './pages/Diagramacion';
import MecanicaMatutina from './pages/MecanicaMatutina';
import ChecklistSalida from './pages/ChecklistSalida';
import DuranteViaje from './pages/DuranteViaje';
import DespuesViaje from './pages/DespuesViaje';
import ControlMecanico from './pages/ControlMecanico';
import MisControles from './pages/MisControles';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';

function ProtectedRoute({ children, pantalla }: { children: React.ReactNode, pantalla: string }) {
  const { user, loading, hasAccess } = useAuth();
  
  if (loading) return <div className="flex-1 flex items-center justify-center">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  // Si no tiene acceso, lo mandamos a la primera pantalla que tenga o un unauthorized
  // Por ahora lo mandamos a una vista genérica o a login.
  // Exception: Administrador might have bypass if not configured, but we rely on DB.
  // Actually, wait, let's just show an Access Denied message if they try to access something they shouldn't.
  if (!hasAccess(pantalla) && user.rol !== 'Administrador') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Acceso Denegado</h2>
        <p>No tienes permiso para ver esta pantalla.</p>
      </div>
    );
  }

  return <>{children}</>;
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <>{children}</>; // Only Login will be rendered if not user

  return (
    <SidebarProvider>
      <div className="flex h-full w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <RouteTracker />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<Navigate to="/garita" replace />} />
            <Route path="/garita" element={<ProtectedRoute pantalla="Garita"><ControlGarita /></ProtectedRoute>} />
            <Route path="/diagramacion" element={<ProtectedRoute pantalla="Diagramacion"><Diagramacion /></ProtectedRoute>} />
            <Route path="/mecanica-matutina" element={<ProtectedRoute pantalla="Mecanica Matutina"><MecanicaMatutina /></ProtectedRoute>} />
            <Route path="/checklist-salida" element={<ProtectedRoute pantalla="Checklist Salida"><ChecklistSalida /></ProtectedRoute>} />
            <Route path="/durante-viaje" element={<ProtectedRoute pantalla="Durante Viaje"><DuranteViaje /></ProtectedRoute>} />
            <Route path="/despues-viaje" element={<ProtectedRoute pantalla="Despues de Viaje"><DespuesViaje /></ProtectedRoute>} />
            <Route path="/control-mecanico" element={<ProtectedRoute pantalla="Control Mecanico"><ControlMecanico /></ProtectedRoute>} />
            <Route path="/mis-controles" element={<ProtectedRoute pantalla="Mis Controles"><MisControles /></ProtectedRoute>} />
            <Route path="/reportes" element={<ProtectedRoute pantalla="Reportes"><Reportes /></ProtectedRoute>} />
            <Route path="/configuracion" element={<ProtectedRoute pantalla="Configuracion"><Configuracion /></ProtectedRoute>} />
          </Routes>
        </MainLayout>
      </Router>
    </AuthProvider>
  );
}
`;

fs.writeFileSync('src/App.tsx', code);

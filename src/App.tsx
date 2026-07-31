import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import Auxilios from './pages/Auxilios';

function ProtectedRoute({ children, pantalla }: { children: React.ReactNode, pantalla: string }) {
  const { user, loading, hasAccess } = useAuth();
  
  if (loading) return <div className="flex-1 flex items-center justify-center">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  let access = hasAccess(pantalla);
  if (pantalla === 'Reportes') {
      access = access || hasAccess('Reportes - Mecanica') || hasAccess('Reportes - Presentacion') || hasAccess('Reportes - Operaciones') || hasAccess('Reportes - Generales');
  }

  if (!access) {
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

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<DefaultRouteRedirect />} />
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
            <Route path="/auxilios" element={<ProtectedRoute pantalla="Auxilios"><Auxilios /></ProtectedRoute>} />
          </Routes>
        </MainLayout>
      </Router>
    </AuthProvider>
  );
}

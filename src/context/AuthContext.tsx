import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';

export interface Usuario {
  id: string;
  usuario: string;
  nombre_apellido: string;
  rol: string;
}

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (user: Usuario) => void;
  logout: () => void;
  hasAccess: (pantalla: string) => boolean;
}

export function getDefaultPermiso(rol: string, pantalla: string): boolean {
  if (rol === 'Administrador') return true;
  if (rol === 'Diagramador') {
    return ['Diagramacion', 'Garita', 'Reportes - Generales', 'Reportes - Operaciones', 'Auxilios', 'Servicios Turísticos', 'Seguimiento CRM'].includes(pantalla);
  }
  if (rol === 'Garita') {
    return ['Garita', 'Checklist Salida', 'Despues de Viaje', 'Auxilios', 'Seguimiento CRM'].includes(pantalla);
  }
  if (rol === 'Planific-Mantenimiento') {
    return ['Mecanica Matutina', 'Control Mecanico', 'Reportes - Mecanica', 'Auxilios', 'Seguimiento CRM'].includes(pantalla);
  }
  if (rol === 'Mecanico') {
    return ['Mecanica Matutina', 'Control Mecanico', 'Auxilios', 'Seguimiento CRM'].includes(pantalla);
  }
  if (rol === 'Conductor') {
    return ['Checklist Salida', 'Durante Viaje', 'Despues de Viaje', 'Mis Controles', 'Auxilios'].includes(pantalla);
  }
  return false;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('logged_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [permisos, setPermisos] = useState<any[]>([]);

  // Fetch permissions when user changes
  useEffect(() => {
    async function fetchPermisos() {
      if (user) {
        let loaded: any[] = [];
        try {
          const local = localStorage.getItem('app_roles_permisos');
          if (local) loaded = JSON.parse(local);
        } catch (e) {}
        const { data } = await supabase.from('roles_permisos').select('*').eq('rol', user.rol);
        if (data && data.length > 0) {
          loaded = data;
        }
        setPermisos(loaded);
      } else {
        setPermisos([]);
      }
      setLoading(false);
    }
    fetchPermisos();
  }, [user]);

  const login = async (newUser: Usuario) => {
    setUser(newUser);
    localStorage.setItem('logged_user', JSON.stringify(newUser));
    // log login
    await supabase.from('usuario_logs').insert([{
      usuario_id: newUser.id,
      accion: 'LOGIN',
      detalle: 'Sesión iniciada'
    }]);
  };

  const logout = async () => {
    if (user) {
      await supabase.from('usuario_logs').insert([{
        usuario_id: user.id,
        accion: 'LOGOUT',
        detalle: 'Sesión finalizada'
      }]);
    }
    setUser(null);
    localStorage.removeItem('logged_user');
  };

  const hasAccess = (pantalla: string) => {
    if (!user) return false;
    if (user.rol === 'Administrador') return true;
    const p = permisos.find(x => x.pantalla === pantalla);
    if (p !== undefined) return Boolean(p.acceso);
    return getDefaultPermiso(user.rol, pantalla);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function RouteTracker() {
  const location = useLocation();
  const { user } = useAuth();
  const [lastPath, setLastPath] = useState<string | null>(null);

  useEffect(() => {
    if (user && location.pathname !== lastPath) {
      setLastPath(location.pathname);
      const pantalla = location.pathname.substring(1) || 'inicio';
      supabase.from('usuario_logs').insert([{
        usuario_id: user.id,
        accion: 'PANTALLA',
        detalle: `Accedió a pantalla: ${pantalla}`
      }]).then();
    }
  }, [location.pathname, user, lastPath]);

  return null;
}

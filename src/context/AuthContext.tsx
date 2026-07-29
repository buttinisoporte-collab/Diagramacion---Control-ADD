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
        const { data } = await supabase.from('roles_permisos').select('*').eq('rol', user.rol);
        if (data) {
          setPermisos(data);
        }
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
    return p ? p.acceso : false;
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

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export function DiagramacionConductorGuard({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isDiagramado, setIsDiagramado] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkDiagramacion() {
      if (!supabase || !user) return;
      const fecha = new Date().toISOString().split('T')[0];
      
      const { data: diagRes } = await supabase.from('diagramaciones')
        .select('id_diagramacion')
        .eq('fecha', fecha)
        .or(`conductor_principal.ilike.${user.nombre_apellido},conductor_secundario.ilike.${user.nombre_apellido}`)
        .maybeSingle();

      setIsDiagramado(!!diagRes);
    }
    checkDiagramacion();
  }, [user]);

  if (isDiagramado === null) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-bold">Verificando diagramación...</p>
      </div>
    );
  }

  if (isDiagramado === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg text-center max-w-md w-full border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">No tiene diagramación activa</h2>
          <p className="text-slate-600 mb-8 text-sm md:text-base leading-relaxed">
            Por favor comunicarse con Tráfico / Inspector para resolver esta situación.
          </p>
          <button 
            onClick={logout}
            className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Salir del sistema
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

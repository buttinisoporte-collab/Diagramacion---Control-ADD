import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export function DiagramacionMecanicoGuard({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isDiagramado, setIsDiagramado] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkDiagramacion() {
      if (!supabase || !user) return;
      const fecha = new Date().toISOString().split('T')[0];
      
      const { data: mRes } = await supabase.from('nomina_mecanicos')
        .select('id_mecanico')
        .eq('apellido_nombre', user.nombre_apellido)
        .maybeSingle();
        
      if (!mRes) {
        setIsDiagramado(false);
        return;
      }
      
      const { data: dRes } = await supabase.from('diagramacion_mecanicos')
        .select('id_mecanico')
        .eq('fecha', fecha)
        .eq('id_mecanico', mRes.id_mecanico)
        .maybeSingle();
        
      setIsDiagramado(!!dRes);
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
          <h2 className="text-xl font-bold text-slate-800 mb-4">Acceso Denegado</h2>
          <p className="text-slate-600 mb-6 text-sm md:text-base leading-relaxed">
            No tiene turno asignado para el día de hoy. Por favor comunicarse con Administración de Taller.
          </p>
          <div className="space-y-4 mb-8 text-sm">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="block font-bold text-slate-800">Mario Días</span>
              <a href="https://wa.link/8jmhzv" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">
                2604 000772
              </a>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="block font-bold text-slate-800">Oficina Técnica</span>
              <a href="https://wa.link/1fzosv" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">
                2604 030789
              </a>
            </div>
          </div>
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

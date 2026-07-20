import { ClipboardCheck, Bus, LayoutDashboard, Settings, Wrench, FileText } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center font-bold text-white">
          B
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          BUTTINI <span className="text-blue-400">LOG</span>
        </span>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 px-3">Operaciones</div>
        <NavLink to="/garita" className={navLinkClass}>
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-sm font-medium">Control Garita</span>
        </NavLink>
        <NavLink to="/diagramacion" className={navLinkClass}>
          <Bus className="w-4 h-4" />
          <span className="text-sm font-medium">Diagramación</span>
        </NavLink>
        
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-6 mb-2 px-3">Mecánica</div>
        <NavLink to="/mecanica-matutina" className={navLinkClass}>
          <Wrench className="w-4 h-4" />
          <span className="text-sm font-medium">Mecánica Matutina</span>
        </NavLink>
        <NavLink to="/control-mecanico" className={navLinkClass}>
          <ClipboardCheck className="w-4 h-4" />
          <span className="text-sm font-medium">Control Mecánico</span>
        </NavLink>
        <NavLink to="/mis-controles" className={navLinkClass}>
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">Mis Controles</span>
        </NavLink>

        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-6 mb-2 px-3">Conductor</div>
        <NavLink to="/checklist-salida" className={navLinkClass}>
          <ClipboardCheck className="w-4 h-4" />
          <span className="text-sm font-medium">Checklist Salida</span>
        </NavLink>
        <NavLink to="/durante-viaje" className={navLinkClass}>
          <Bus className="w-4 h-4" />
          <span className="text-sm font-medium">Durante Viaje</span>
        </NavLink>
        <NavLink to="/despues-viaje" className={navLinkClass}>
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">Después del Viaje</span>
        </NavLink>

        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-6 mb-2 px-3">Administración</div>
        <NavLink to="/reportes" className={navLinkClass}>
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">Reportes</span>
        </NavLink>
        <NavLink to="/configuracion" className={navLinkClass}>
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Configuración / ABM</span>
        </NavLink>
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs">
            CR
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Carlos Rivas</p>
            <p className="text-[10px] text-slate-500 uppercase">Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

import { 
  ClipboardCheck, 
  Bus, 
  LayoutDashboard, 
  Settings, 
  Wrench, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  PanelLeftClose, 
  PanelLeftOpen,
  EyeOff
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';

export default function Sidebar() {
  const { mode, setMode, toggleSidebar } = useSidebar();

  if (mode === 'hidden') {
    return null;
  }

  const isCompact = mode === 'compact';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all group relative ${
      isActive 
        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-semibold' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    } ${isCompact ? 'justify-center px-0' : ''}`;

  return (
    <aside 
      className={`bg-slate-900 flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out flex-shrink-0 relative z-30 select-none ${
        isCompact ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Header / Branding */}
      <div className={`p-4 border-b border-slate-800 flex items-center ${isCompact ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center space-x-3 overflow-hidden">
          <div 
            onClick={() => isCompact && setMode('expanded')}
            className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-black text-white text-base shadow-sm flex-shrink-0 cursor-pointer hover:bg-blue-400 transition-colors"
            title={isCompact ? "Expandir menú" : "Buttini Log"}
          >
            B
          </div>
          {!isCompact && (
            <span className="text-lg font-black tracking-tight text-white whitespace-nowrap">
              BUTTINI <span className="text-blue-400">LOG</span>
            </span>
          )}
        </div>

        {!isCompact ? (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setMode('compact')}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Contraer menú a íconos (Ctrl+B)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMode('hidden')}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Ocultar menú completamente"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setMode('expanded')}
            className="hidden sm:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer absolute -right-3 top-5 bg-slate-800 border border-slate-700 shadow-md"
            title="Expandir menú (Ctrl+B)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Navigation Body */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Section: Operaciones */}
        {!isCompact ? (
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 px-3 mt-1">
            Operaciones
          </div>
        ) : (
          <div className="h-px bg-slate-800 my-2" />
        )}
        
        <NavLink to="/garita" className={navLinkClass} title={isCompact ? "Control Garita" : undefined}>
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
          {!isCompact && <span className="text-sm font-medium truncate">Control Garita</span>}
        </NavLink>

        <NavLink to="/diagramacion" className={navLinkClass} title={isCompact ? "Diagramación" : undefined}>
          <Bus className="w-4 h-4 flex-shrink-0 text-blue-400" />
          {!isCompact && <span className="text-sm font-medium truncate">Diagramación</span>}
        </NavLink>

        {/* Section: Mecánica */}
        {!isCompact ? (
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-5 mb-1 px-3">
            Mecánica
          </div>
        ) : (
          <div className="h-px bg-slate-800 my-2" />
        )}

        <NavLink to="/mecanica-matutina" className={navLinkClass} title={isCompact ? "Mecánica Matutina" : undefined}>
          <Wrench className="w-4 h-4 flex-shrink-0" />
          {!isCompact && <span className="text-sm font-medium truncate">Mecánica Matutina</span>}
        </NavLink>

        <NavLink to="/control-mecanico" className={navLinkClass} title={isCompact ? "Control Mecánico" : undefined}>
          <ClipboardCheck className="w-4 h-4 flex-shrink-0" />
          {!isCompact && <span className="text-sm font-medium truncate">Control Mecánico</span>}
        </NavLink>

        <NavLink to="/mis-controles" className={navLinkClass} title={isCompact ? "Mis Controles" : undefined}>
          <FileText className="w-4 h-4 flex-shrink-0" />
          {!isCompact && <span className="text-sm font-medium truncate">Mis Controles</span>}
        </NavLink>

        {/* Section: Conductor */}
        {!isCompact ? (
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-5 mb-1 px-3">
            Conductor
          </div>
        ) : (
          <div className="h-px bg-slate-800 my-2" />
        )}

        <NavLink to="/checklist-salida" className={navLinkClass} title={isCompact ? "Checklist Salida" : undefined}>
          <ClipboardCheck className="w-4 h-4 flex-shrink-0" />
          {!isCompact && <span className="text-sm font-medium truncate">Checklist Salida</span>}
        </NavLink>

        <NavLink to="/durante-viaje" className={navLinkClass} title={isCompact ? "Durante Viaje" : undefined}>
          <Bus className="w-4 h-4 flex-shrink-0" />
          {!isCompact && <span className="text-sm font-medium truncate">Durante Viaje</span>}
        </NavLink>

        <NavLink to="/despues-viaje" className={navLinkClass} title={isCompact ? "Después del Viaje" : undefined}>
          <FileText className="w-4 h-4 flex-shrink-0" />
          {!isCompact && <span className="text-sm font-medium truncate">Después del Viaje</span>}
        </NavLink>

        {/* Section: Administración */}
        {!isCompact ? (
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-5 mb-1 px-3">
            Administración
          </div>
        ) : (
          <div className="h-px bg-slate-800 my-2" />
        )}

        <NavLink to="/reportes" className={navLinkClass} title={isCompact ? "Reportes" : undefined}>
          <FileText className="w-4 h-4 flex-shrink-0" />
          {!isCompact && <span className="text-sm font-medium truncate">Reportes</span>}
        </NavLink>

        <NavLink to="/configuracion" className={navLinkClass} title={isCompact ? "Configuración / ABM" : undefined}>
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!isCompact && <span className="text-sm font-medium truncate">Configuración / ABM</span>}
        </NavLink>
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className={`flex items-center ${isCompact ? 'justify-center' : 'space-x-3 px-2 py-1'}`}>
          <div 
            className="w-8 h-8 rounded-full bg-blue-700/80 border border-blue-500/50 flex items-center justify-center text-white font-black text-xs shadow-sm flex-shrink-0"
            title="Carlos Rivas (Administrador)"
          >
            CR
          </div>
          {!isCompact && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">Carlos Rivas</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase">Administrador</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

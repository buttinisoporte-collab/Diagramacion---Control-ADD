import { 
  ClipboardCheck, 
  Bus, 
  LayoutDashboard, 
  Settings, 
  Wrench,
  Megaphone, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  PanelLeftClose, 
  PanelLeftOpen,
  EyeOff,
  Compass,
  Activity,
  MapPin,
  Clock,
  Users,
  Calendar,
  CalendarCheck,
  UserCheck,
  Package,
  QrCode
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';


export default function Sidebar() {
  const { mode, setMode, toggleSidebar } = useSidebar();
  const { user, hasAccess, logout } = useAuth();

  const [logoUrl, setLogoUrl] = useState<string | null>(() => localStorage.getItem('app_logo'));

  useEffect(() => {
    const handleStorageChange = () => {
      setLogoUrl(localStorage.getItem('app_logo'));
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Check periodically for updates in the same tab
    const interval = setInterval(() => {
      const current = localStorage.getItem('app_logo');
      if (current !== logoUrl) {
        setLogoUrl(current);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [logoUrl]);

  const isHidden = mode === 'hidden';
  const isCompact = mode === 'compact';

  const location = useLocation();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    operaciones: false,
    mantenimiento: false,
    conductor: false,
    administracion: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderSection = (id: string, label: string, items: React.ReactNode) => {
    const isOpen = openSections[id];
    
    // In compact mode, we do NOT show headers/collapsibles, just render items directly
    if (isCompact) {
      return (
        <>
          <div className="h-px bg-slate-800 my-2" />
          {items}
        </>
      );
    }
    
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-500 font-bold mt-4 mb-1 px-3 py-2 hover:bg-slate-800/40 hover:text-slate-300 rounded-lg transition-all cursor-pointer select-none"
        >
          <span>{label}</span>
          <ChevronRight className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="pl-1.5 space-y-1 transition-all duration-200">
            {items}
          </div>
        )}
      </div>
    );
  };

  const isLinkActive = (toPath: string) => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab') || '';
    
    if (toPath.includes('?')) {
      const [path, queryStr] = toPath.split('?');
      const targetParams = new URLSearchParams(queryStr);
      const targetTab = targetParams.get('tab') || '';
      return location.pathname === path && tab === targetTab;
    }
    
    if (toPath === '/configuracion') {
      const isMovedTab = ['Turnos', 'Etapas de Servicios', 'Nómina Conductores', 'Temporadas', 'Feriados', 'Nómina Mecánicos', 'Flota Activa'].includes(tab);
      return location.pathname === '/configuracion' && !isMovedTab;
    }
    
    return location.pathname === toPath;
  };

  const getLinkClass = (toPath: string) => {
    const active = isLinkActive(toPath);
    return `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all group relative ${
      active 
        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-semibold' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    } ${isCompact ? 'justify-center px-0' : ''}`;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {!isHidden && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40"
          onClick={() => setMode('hidden')}
        />
      )}
      <aside 
        className={`bg-slate-900 flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out flex-shrink-0 absolute md:relative z-50 h-full select-none ${
          isCompact ? 'w-16' : 'w-64'
        } ${
          isHidden ? '-translate-x-full md:hidden' : 'translate-x-0'
        }`}
      >
      {/* Sidebar Header / Branding */}
      <div className={`p-4 border-b border-slate-800 flex items-center ${isCompact ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center space-x-3 overflow-hidden">
          <div 
            onClick={() => isCompact && setMode('expanded')}
            className={`w-8 h-8 rounded flex items-center justify-center font-black text-white text-base shadow-sm flex-shrink-0 cursor-pointer transition-colors overflow-hidden ${
              logoUrl ? 'bg-transparent' : 'bg-blue-500 hover:bg-blue-400'
            }`}
            title={isCompact ? "Expandir menú" : "A. Buttini"}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              'B'
            )}
          </div>
          {!isCompact && (
            <span className="text-lg font-black tracking-tight text-white whitespace-nowrap">
              A. <span className="text-blue-400">Buttini</span>
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
        {renderSection('operaciones', 'Operaciones', (
          <>
            {hasAccess('Garita') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/garita" className={getLinkClass("/garita")} title={isCompact ? "Control Garita" : undefined}>
              <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
              {!isCompact && <span className="text-sm font-medium truncate">Control Garita</span>}
            </NavLink>)}

            {hasAccess('Objetos Perdidos') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/objetos-perdidos" className={getLinkClass("/objetos-perdidos")} title={isCompact ? "Objetos Perdidos" : undefined}>
              <Package className="w-4 h-4 flex-shrink-0 text-amber-400" />
              {!isCompact && <span className="text-sm font-medium truncate">Objetos Perdidos</span>}
            </NavLink>)}

            {hasAccess('Registrar Firma') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/registrar-firma" className={getLinkClass("/registrar-firma")} title={isCompact ? "Registrar Firma / QR" : undefined}>
              <QrCode className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              {!isCompact && <span className="text-sm font-medium truncate">Registrar Firma / QR</span>}
            </NavLink>)}

            {hasAccess('Comunicador') && (
              <li className="mb-2">
                <NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/comunicador" className={getLinkClass("/comunicador")} title={isCompact ? "Comunicador de Turnos" : undefined}>
                  <Megaphone className="w-5 h-5 flex-shrink-0" />
                  {!isCompact && <span>Comunicador de Turnos</span>}
                </NavLink>
              </li>
            )}
            {hasAccess('Diagramacion') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/diagramacion" className={getLinkClass("/diagramacion")} title={isCompact ? "Diagramación" : undefined}>
              <Bus className="w-4 h-4 flex-shrink-0 text-blue-400" />
              {!isCompact && <span className="text-sm font-medium truncate">Diagramación</span>}
            </NavLink>)}

            {hasAccess('Servicios Turísticos') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/servicios-turisticos" className={getLinkClass("/servicios-turisticos")} title={isCompact ? "Servicios Turísticos" : undefined}>
              <Compass className="w-4 h-4 flex-shrink-0 text-amber-400" />
              {!isCompact && <span className="text-sm font-medium truncate">Servicios Turísticos</span>}
            </NavLink>)}

            {hasAccess('Servicios') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/servicios" className={getLinkClass("/servicios")} title={isCompact ? "Servicios Regulares" : undefined}>
              <MapPin className="w-4 h-4 flex-shrink-0 text-blue-400" />
              {!isCompact && <span className="text-sm font-medium truncate">Servicios Regulares</span>}
            </NavLink>)}

            {hasAccess('Configuracion') && (
              <>
                <NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/configuracion?tab=Turnos" className={getLinkClass("/configuracion?tab=Turnos")} title={isCompact ? "Turnos" : undefined}>
                  <Clock className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  {!isCompact && <span className="text-sm font-medium truncate">Turnos</span>}
                </NavLink>
                <NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/configuracion?tab=Etapas de Servicios" className={getLinkClass("/configuracion?tab=Etapas de Servicios")} title={isCompact ? "Etapas de Servicios" : undefined}>
                  <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  {!isCompact && <span className="text-sm font-medium truncate">Etapas</span>}
                </NavLink>
                <NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/configuracion?tab=Nómina Conductores" className={getLinkClass("/configuracion?tab=Nómina Conductores")} title={isCompact ? "Nómina Conductores" : undefined}>
                  <Users className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  {!isCompact && <span className="text-sm font-medium truncate">Nómina Conductores</span>}
                </NavLink>
                <NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/configuracion?tab=Temporadas" className={getLinkClass("/configuracion?tab=Temporadas")} title={isCompact ? "Temporadas" : undefined}>
                  <Calendar className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  {!isCompact && <span className="text-sm font-medium truncate">Temporadas</span>}
                </NavLink>
                <NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/configuracion?tab=Feriados" className={getLinkClass("/configuracion?tab=Feriados")} title={isCompact ? "Feriados" : undefined}>
                  <CalendarCheck className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  {!isCompact && <span className="text-sm font-medium truncate">Feriados</span>}
                </NavLink>
              </>
            )}
          </>
        ))}

        {renderSection('mantenimiento', 'Mantenimiento', (
          <>
            {hasAccess('Mecanica Matutina') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/mecanica-matutina" className={getLinkClass("/mecanica-matutina")} title={isCompact ? "Mecánica Matutina" : undefined}>
              <Wrench className="w-4 h-4 flex-shrink-0" />
              {!isCompact && <span className="text-sm font-medium truncate">Mecánica Matutina</span>}
            </NavLink>)}

            {hasAccess('Control Mecanico') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/control-mecanico" className={getLinkClass("/control-mecanico")} title={isCompact ? "Control Mecánico" : undefined}>
              <ClipboardCheck className="w-4 h-4 flex-shrink-0" />
              {!isCompact && <span className="text-sm font-medium truncate">Control Mecánico</span>}
            </NavLink>)}

            {hasAccess('Mis Controles') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/mis-controles" className={getLinkClass("/mis-controles")} title={isCompact ? "Mis Controles" : undefined}>
              <FileText className="w-4 h-4 flex-shrink-0" />
              {!isCompact && <span className="text-sm font-medium truncate">Mis Controles</span>}
            </NavLink>)}

            {hasAccess('Auxilios') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/auxilios" className={getLinkClass("/auxilios")} title={isCompact ? "Auxilios" : undefined}>
              <Wrench className="w-4 h-4 flex-shrink-0 text-amber-500" />
              {!isCompact && <span className="text-sm font-medium truncate">Auxilios (Mantenimiento)</span>}
            </NavLink>)}

            {hasAccess('SGC Auxilios') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/sgc-auxilios" className={getLinkClass("/sgc-auxilios")} title={isCompact ? "SGC Auxilios" : undefined}>
              <Activity className="w-4 h-4 flex-shrink-0 text-emerald-500" />
              {!isCompact && <span className="text-sm font-medium truncate">SGC Auxilios</span>}
            </NavLink>)}

            {hasAccess('Configuracion') && (
              <>
                <NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/configuracion?tab=Nómina Mecánicos" className={getLinkClass("/configuracion?tab=Nómina Mecánicos")} title={isCompact ? "Nómina Mecánicos" : undefined}>
                  <UserCheck className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  {!isCompact && <span className="text-sm font-medium truncate">Nómina Mecánicos</span>}
                </NavLink>
                <NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/configuracion?tab=Flota Activa" className={getLinkClass("/configuracion?tab=Flota Activa")} title={isCompact ? "Flota Activa" : undefined}>
                  <Bus className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  {!isCompact && <span className="text-sm font-medium truncate">Flota Activa</span>}
                </NavLink>
              </>
            )}
          </>
        ))}

        {renderSection('conductor', 'Conductor', (
          <>
            {hasAccess('Checklist Salida') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/checklist-salida" className={getLinkClass("/checklist-salida")} title={isCompact ? "Checklist Salida" : undefined}>
              <ClipboardCheck className="w-4 h-4 flex-shrink-0" />
              {!isCompact && <span className="text-sm font-medium truncate">Checklist Salida</span>}
            </NavLink>)}

            {hasAccess('Durante Viaje') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/durante-viaje" className={getLinkClass("/durante-viaje")} title={isCompact ? "Durante Viaje" : undefined}>
              <Bus className="w-4 h-4 flex-shrink-0" />
              {!isCompact && <span className="text-sm font-medium truncate">Durante Viaje</span>}
            </NavLink>)}

            {hasAccess('Despues de Viaje') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/despues-viaje" className={getLinkClass("/despues-viaje")} title={isCompact ? "Después del Viaje" : undefined}>
              <FileText className="w-4 h-4 flex-shrink-0" />
              {!isCompact && <span className="text-sm font-medium truncate">Después del Viaje</span>}
            </NavLink>)}

            {hasAccess('Registrar Firma') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/registrar-firma" className={getLinkClass("/registrar-firma")} title={isCompact ? "Registrar Firma / QR" : undefined}>
              <QrCode className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              {!isCompact && <span className="text-sm font-medium truncate">Registrar Firma / QR</span>}
            </NavLink>)}
          </>
        ))}

        {renderSection('administracion', 'Administración', (
          <>
            {(hasAccess('Reportes') || hasAccess('Reportes - Mecanica') || hasAccess('Reportes - Presentacion') || hasAccess('Reportes - Operaciones') || hasAccess('Reportes - Generales')) && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/reportes" className={getLinkClass("/reportes")} title={isCompact ? "Reportes" : undefined}>
              <FileText className="w-4 h-4 flex-shrink-0" />
              {!isCompact && <span className="text-sm font-medium truncate">Reportes</span>}
            </NavLink>)}

            {hasAccess('Configuracion') && (<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/configuracion" className={getLinkClass("/configuracion")} title={isCompact ? "Configuración / ABM" : undefined}>
              <Settings className="w-4 h-4 flex-shrink-0" />
              {!isCompact && <span className="text-sm font-medium truncate">Configuración / ABM</span>}
            </NavLink>)}
          </>
        ))}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className={`flex items-center ${isCompact ? 'flex-col justify-center space-y-2' : 'space-x-3 px-2 py-1'}`}>
          <div 
            className="w-8 h-8 rounded-full bg-blue-700/80 border border-blue-500/50 flex items-center justify-center text-white font-black text-xs shadow-sm flex-shrink-0"
            title={user ? `${user.nombre_apellido} (${user.rol})` : ''}
          >
            {user ? user.nombre_apellido.substring(0, 2).toUpperCase() : 'U'}
          </div>
          {!isCompact && user && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.nombre_apellido}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase">{user.rol}</p>
            </div>
          )}
          <button 
            onClick={logout}
            title="Cerrar Sesión"
            className={`p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors ${isCompact ? 'mt-2' : ''}`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}

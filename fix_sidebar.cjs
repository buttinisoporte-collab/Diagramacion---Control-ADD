const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const imports = "import { useAuth } from '../context/AuthContext';\nimport { LogOut } from 'lucide-react';\n";
code = code.replace("import { useSidebar } from '../context/SidebarContext';", "import { useSidebar } from '../context/SidebarContext';\n" + imports);

const hook = "  const { mode, setMode, toggleSidebar } = useSidebar();\n  const { user, hasAccess, logout } = useAuth();";
code = code.replace("  const { mode, setMode, toggleSidebar } = useSidebar();", hook);

function wrapItem(path, pantalla, originalHTML) {
    return `{hasAccess('${pantalla}') && (${originalHTML})}`;
}

code = code.replace(/<NavLink to="\/garita".*?<\/NavLink>/gs, wrapItem("/garita", "Garita", "$&"));
code = code.replace(/<NavLink to="\/diagramacion".*?<\/NavLink>/gs, wrapItem("/diagramacion", "Diagramacion", "$&"));
code = code.replace(/<NavLink to="\/mecanica-matutina".*?<\/NavLink>/gs, wrapItem("/mecanica-matutina", "Mecanica Matutina", "$&"));
code = code.replace(/<NavLink to="\/control-mecanico".*?<\/NavLink>/gs, wrapItem("/control-mecanico", "Control Mecanico", "$&"));
code = code.replace(/<NavLink to="\/mis-controles".*?<\/NavLink>/gs, wrapItem("/mis-controles", "Mis Controles", "$&"));
code = code.replace(/<NavLink to="\/checklist-salida".*?<\/NavLink>/gs, wrapItem("/checklist-salida", "Checklist Salida", "$&"));
code = code.replace(/<NavLink to="\/durante-viaje".*?<\/NavLink>/gs, wrapItem("/durante-viaje", "Durante Viaje", "$&"));
code = code.replace(/<NavLink to="\/despues-viaje".*?<\/NavLink>/gs, wrapItem("/despues-viaje", "Despues de Viaje", "$&"));
code = code.replace(/<NavLink to="\/reportes".*?<\/NavLink>/gs, wrapItem("/reportes", "Reportes", "$&"));
code = code.replace(/<NavLink to="\/configuracion".*?<\/NavLink>/gs, wrapItem("/configuracion", "Configuracion", "$&"));

const oldFooter = `      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className={\`flex items-center \${isCompact ? 'justify-center' : 'space-x-3 px-2 py-1'}\`}>
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
      </div>`;

const newFooter = `      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className={\`flex items-center \${isCompact ? 'flex-col justify-center space-y-2' : 'space-x-3 px-2 py-1'}\`}>
          <div 
            className="w-8 h-8 rounded-full bg-blue-700/80 border border-blue-500/50 flex items-center justify-center text-white font-black text-xs shadow-sm flex-shrink-0"
            title={user ? \`\${user.nombre_apellido} (\${user.rol})\` : ''}
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
            className={\`p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors \${isCompact ? 'mt-2' : ''}\`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>`;
code = code.replace(oldFooter, newFooter);

// We should also remove sections if their children are empty, but it's okay to just show the sections for now, or conditionally render the section headers. Let's just leave the section headers as they are for now, it's acceptable.

fs.writeFileSync('src/components/Sidebar.tsx', code);

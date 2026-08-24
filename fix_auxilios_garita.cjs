const fs = require('fs');
let code = fs.readFileSync('src/pages/Auxilios.tsx', 'utf8');

// Add isGarita definition
code = code.replace(
  /const isConductor = user\?\.rol === 'Conductor';/,
  `const isConductor = user?.rol === 'Conductor';
  const isGarita = user?.rol === 'Garita';`
);

// Conditionally hide Editar GPS button
code = code.replace(
  /<button\s+onClick=\{\(e\) => \{\s+e\.stopPropagation\(\);\s+setEditingLocationId\(item\.id \|\| item\.created_at\);\s+setIsPickingLocation\(true\);\s+showStatus\('info', 'Haga clic en el mapa para actualizar la ubicación de este auxilio\.'\);\s+\}\}\s+className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-\[10px\] font-bold border border-slate-200 transition-colors opacity-0 group-hover:opacity-100"\s+>/,
  `{!isGarita && (<button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLocationId(item.id || item.created_at);
                        setIsPickingLocation(true);
                        showStatus('info', 'Haga clic en el mapa para actualizar la ubicación de este auxilio.');
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold border border-slate-200 transition-colors opacity-0 group-hover:opacity-100"
                    >`
);
// And the closing tag
code = code.replace(
  /Editar GPS\s+<\/button>/,
  `Editar GPS\n                    </button>)}`
);

fs.writeFileSync('src/pages/Auxilios.tsx', code);

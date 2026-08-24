const fs = require('fs');
let code = fs.readFileSync('src/pages/SGCAuxilios.tsx', 'utf8');

// Add isGarita definition
code = code.replace(
  /const \{ user \} = useAuth\(\);/,
  `const { user } = useAuth();
  const isGarita = user?.rol === 'Garita';`
);

// Conditionally hide/disable Eliminar Auxilio button
code = code.replace(
  /<button\s+onClick=\{\(\) => handleDeleteAuxilio\(item\.id\)\}\s+className="[^"]+"\s+>/,
  `{!isGarita && (<button
                              onClick={() => handleDeleteAuxilio(item.id)}
                              className="px-2 py-1.5 bg-red-50 text-red-600 rounded text-xs font-bold border border-red-200 hover:bg-red-100 flex items-center gap-1 mt-2"
                            >`
);
// And the closing tag for that button
code = code.replace(
  /<span>Eliminar Auxilio<\/span>\s+<\/button>/,
  `<span>Eliminar Auxilio</span>\n                            </button>)}`
);

// Disable the inputs if Garita
// We can just add readOnly={isGarita} to inputs and disabled={isGarita} to selects.
// Alternatively, just hide the Save button.
code = code.replace(
  /<button\s+onClick=\{handleSave\}\s+className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black uppercase text-xs px-5 py-3 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer flex items-center gap-1\.5"\s+>/,
  `{!isGarita && (<button
                      onClick={handleSave}
                      className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black uppercase text-xs px-5 py-3 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >`
);
code = code.replace(
  /<span>Guardar Seguimiento SGC<\/span>\s+<\/button>/,
  `<span>Guardar Seguimiento SGC</span>\n                    </button>)}`
);

fs.writeFileSync('src/pages/SGCAuxilios.tsx', code);

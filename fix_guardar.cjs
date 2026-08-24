const fs = require('fs');
let code = fs.readFileSync('src/pages/SGCAuxilios.tsx', 'utf8');

code = code.replace(
  /<button\s+type="button"\s+onClick=\{handleSaveCRM\}\s+className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black uppercase text-xs px-5 py-3 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer flex items-center gap-1.5"\s+>\s+<Save className="w-4 h-4 text-white" \/>\s+<span>Guardar Seguimiento SGC<\/span>\s+<\/button>\)\}/,
  `{!isGarita && (<button
                      type="button"
                      onClick={handleSaveCRM}
                      className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black uppercase text-xs px-5 py-3 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4 text-white" />
                      <span>Guardar Seguimiento SGC</span>
                    </button>)}`
);

fs.writeFileSync('src/pages/SGCAuxilios.tsx', code);

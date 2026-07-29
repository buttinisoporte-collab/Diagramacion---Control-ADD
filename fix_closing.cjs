const fs = require('fs');
let code = fs.readFileSync('src/pages/Configuracion.tsx', 'utf8');

code = code.replace(`                </div>\n             \n                </div>\n             ) : (`, `                </div>\n             ) : (`);

fs.writeFileSync('src/pages/Configuracion.tsx', code);

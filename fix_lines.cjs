const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

code = code.replace(/<\/div>\s*<\/div>\s*{\/\* Verificaciones Tecnicas \*\/}/, "</div>\n\n              {/* Verificaciones Tecnicas */}");
code = code.replace(/<\/div>\s*<\/div>\s*{\/\* Auxilios Llegadas \*\/}/, "</div>\n\n              {/* Auxilios Llegadas */}");

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

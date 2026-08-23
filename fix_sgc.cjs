const fs = require('fs');
let code = fs.readFileSync('src/pages/SGCAuxilios.tsx', 'utf8');

code = code.replace(/  detalle_herramientas\?: string;\n  detalle_herramientas\?: string;/, "  detalle_herramientas?: string;");

fs.writeFileSync('src/pages/SGCAuxilios.tsx', code);

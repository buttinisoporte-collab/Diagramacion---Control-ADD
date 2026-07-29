const fs = require('fs');
let code = fs.readFileSync('src/components/DiagramacionConductorGuard.tsx', 'utf8');

code = code.replace(/select\('id_diagramacion'\)/, "select('id')");

fs.writeFileSync('src/components/DiagramacionConductorGuard.tsx', code);

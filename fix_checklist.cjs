const fs = require('fs');
let code = fs.readFileSync('src/pages/ChecklistSalida.tsx', 'utf8');

code = code.replace(/cons\.\.\.checks,\n        luces_externas: checks\.luces_internas, setChecks\]/, 'const [checks, setChecks]');
fs.writeFileSync('src/pages/ChecklistSalida.tsx', code);

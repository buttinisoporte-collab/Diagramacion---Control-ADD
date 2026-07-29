const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldCheck = `if (!hasAccess(pantalla) && user.rol !== 'Administrador') {`;
const newCheck = `if (!hasAccess(pantalla)) {`;

code = code.replace(oldCheck, newCheck);
fs.writeFileSync('src/App.tsx', code);

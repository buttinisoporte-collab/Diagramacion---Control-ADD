const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const oldReportes = `{hasAccess('Reportes') && (<NavLink to="/reportes"`;
const newReportes = `{(hasAccess('Reportes') || hasAccess('Reportes - Mecanica') || hasAccess('Reportes - Presentacion') || hasAccess('Reportes - Operaciones') || hasAccess('Reportes - Generales')) && (<NavLink to="/reportes"`;

code = code.replace(oldReportes, newReportes);
fs.writeFileSync('src/components/Sidebar.tsx', code);

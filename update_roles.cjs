const fs = require('fs');
let code = fs.readFileSync('src/pages/Configuracion.tsx', 'utf8');

const oldMap = `['Garita', 'Diagramacion', 'Mecanica Matutina', 'Checklist Salida', 'Durante Viaje', 'Despues de Viaje', 'Control Mecanico', 'Mis Controles', 'Reportes', 'Configuracion'].map(p => {`;
const newMap = `['Garita', 'Diagramacion', 'Mecanica Matutina', 'Checklist Salida', 'Durante Viaje', 'Despues de Viaje', 'Control Mecanico', 'Mis Controles', 'Configuracion', 'Reportes - Generales', 'Reportes - Presentacion', 'Reportes - Mecanica', 'Reportes - Operaciones'].map(p => {`;

code = code.replace(oldMap, newMap);

fs.writeFileSync('src/pages/Configuracion.tsx', code);

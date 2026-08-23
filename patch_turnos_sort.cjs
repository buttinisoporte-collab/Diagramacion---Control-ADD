const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');

const target = `        if (isMounted) {
          setTurnos(loadedTurnos);`;
const replacement = `        if (isMounted) {
          loadedTurnos.sort((a, b) => (a.cod_turno || '').localeCompare(b.cod_turno || '', undefined, { numeric: true }));
          setTurnos(loadedTurnos);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Diagramacion.tsx', code);

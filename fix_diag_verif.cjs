const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');

code = code.replace(
  /const isAux = t\.turno\?\.toLowerCase\(\)\.includes\('auxilio base'\) \|\| t\.turno\?\.toLowerCase\(\)\.includes\('auxilio en base'\) \|\| t\.turno\?\.toLowerCase\(\) === 'aux base' \|\| t\.turno\?\.toLowerCase\(\)\.includes\('auxilio terminal'\) \|\| t\.turno\?\.toLowerCase\(\)\.includes\('auxilio en terminal'\) \|\| t\.turno\?\.toLowerCase\(\) === 'aux term';/g,
  `const isAux = t.turno?.toLowerCase().includes('auxilio base') || t.turno?.toLowerCase().includes('auxilio en base') || t.turno?.toLowerCase() === 'aux base' || t.turno?.toLowerCase().includes('auxilio terminal') || t.turno?.toLowerCase().includes('auxilio en terminal') || t.turno?.toLowerCase() === 'aux term' || t.turno?.toLowerCase().includes('verificaci');`
);

fs.writeFileSync('src/pages/Diagramacion.tsx', code);

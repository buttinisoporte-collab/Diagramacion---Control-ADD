const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');

code = code.replace(
  /\/\/ Sort by departure time earliest to latest\s*filtered\.sort\(\(a, b\) => \{\s*const timeA = a\.hora_salida_base \|\| a\.hora_inicio \|\| '';\s*const timeB = b\.hora_salida_base \|\| b\.hora_inicio \|\| '';\s*return timeA\.localeCompare\(timeB\);\s*\}\);/,
  `// Sort by cod_turno ascending
    filtered.sort((a, b) => {
      const codeA = String(a.cod_turno || '');
      const codeB = String(b.cod_turno || '');
      return codeA.localeCompare(codeB, undefined, { numeric: true });
    });`
);

fs.writeFileSync('src/pages/Diagramacion.tsx', code);

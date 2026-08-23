const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// Fix the onClick completely
code = code.replace(
  /onClick=\{\(\) => \{\s*const nov = prompt\("Ingrese la novedad:", t\.observaciones \|\| ''\);\s*if \(nov !== null\) \{ t\.observaciones = nov; handleNovedad\(t\); \}\s*\}\}/g,
  `onClick={() => handleNovedad(t)}`
);
code = code.replace(
  /onClick=\{\(\) => \{\s*const nov = prompt\("Ingrese la novedad a la llegada:", t\.observaciones \|\| ''\);\s*if \(nov !== null\) \{ t\.observaciones = nov; handleNovedad\(t\); \}\s*\}\}/g,
  `onClick={() => handleNovedad(t)}`
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

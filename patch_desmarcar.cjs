const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

code = code.replace(
  /const handleDesmarcarPresente = async \(t: any\) => \{/,
  "const handleDesmarcarPresente = async (t: any) => {\n    if (!canEdit) return;"
);
code = code.replace(
  /const handleDesmarcarSalida = async \(t: any\) => \{/,
  "const handleDesmarcarSalida = async (t: any) => {\n    if (!canEdit) return;"
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

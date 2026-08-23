const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// Update extraction in loadData
code = code.replace(
  /const tAux = combined\.filter\(\(t: any\) => t\.turno_label && \(t\.turno_label\.toLowerCase\(\)\.includes\('auxilio terminal'\) \|\| t\.turno_label\.toLowerCase\(\)\.includes\('auxilio en terminal'\) \|\| t\.turno_label\.toLowerCase\(\) === 'aux term'\)\);/,
  `const tAux = combined.filter((t: any) => t.turno_label && (t.turno_label.toLowerCase().includes('auxilio terminal') || t.turno_label.toLowerCase().includes('auxilio en terminal') || t.turno_label.toLowerCase() === 'aux term'));
      
      const vTech = combined.filter((t: any) => t.turno_label && t.turno_label.toLowerCase().includes('verificaci'));`
);

code = code.replace(
  /combined = combined\.filter\(\(t: any\) => !\(t\.turno_label && \(t\.turno_label\.toLowerCase\(\)\.includes\('auxilio base'\) \|\| t\.turno_label\.toLowerCase\(\)\.includes\('auxilio en base'\) \|\| t\.turno_label\.toLowerCase\(\) === 'aux base' \|\| t\.turno_label\.toLowerCase\(\)\.includes\('auxilio terminal'\) \|\| t\.turno_label\.toLowerCase\(\)\.includes\('auxilio en terminal'\) \|\| t\.turno_label\.toLowerCase\(\) === 'aux term'\)\)\);/,
  `combined = combined.filter((t: any) => !(t.turno_label && (t.turno_label.toLowerCase().includes('auxilio base') || t.turno_label.toLowerCase().includes('auxilio en base') || t.turno_label.toLowerCase() === 'aux base' || t.turno_label.toLowerCase().includes('auxilio terminal') || t.turno_label.toLowerCase().includes('auxilio en terminal') || t.turno_label.toLowerCase() === 'aux term' || t.turno_label.toLowerCase().includes('verificaci'))));`
);

code = code.replace(
  /setAuxiliosTerminal\(tAux\);/,
  `setAuxiliosTerminal(tAux);
      setVerificaciones(vTech);`
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

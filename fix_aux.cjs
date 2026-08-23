const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

code = code.replace(
  'setAuxiliosList(filteredAuxilios);',
  `setAuxiliosList(filteredAuxilios);

      // Populate auxilios designated in base and terminal
      const bAux = dData.filter((t: any) => t.turno && (t.turno.toLowerCase().includes('auxilio base') || t.turno.toLowerCase().includes('auxilio en base') || t.turno.toLowerCase() === 'aux base'));
      const tAux = dData.filter((t: any) => t.turno && (t.turno.toLowerCase().includes('auxilio terminal') || t.turno.toLowerCase().includes('auxilio en terminal') || t.turno.toLowerCase() === 'aux term'));
      
      setAuxiliosBase(bAux);
      setAuxiliosTerminal(tAux);`
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');
code = code.replace(/fontSize: '12px',/g, "fontSize: '11px',");
code = code.replace(/menuPortal: base => \(\{ \.\.\.base, zIndex: 9999 \}\)/g, "menuPortal: base => ({ ...base, zIndex: 9999 }),\n                              singleValue: (base) => ({ ...base, whiteSpace: 'normal' }),\n                              option: (base) => ({ ...base, fontSize: '11px' })");
fs.writeFileSync('src/pages/Diagramacion.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/Auxilios.tsx', 'utf8');

code = code.replace(/const showStatus = \(type: 'success' \| 'error', text: string\) => \{/, 
"const showStatus = (type: 'success' | 'error' | 'info', text: string) => {");

fs.writeFileSync('src/pages/Auxilios.tsx', code);

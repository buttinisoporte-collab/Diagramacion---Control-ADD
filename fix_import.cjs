const fs = require('fs');
let code = fs.readFileSync('src/pages/Auxilios.tsx', 'utf8');

if (!code.includes('Info,')) {
  code = code.replace(/MapPin,/, "MapPin,\n  Info,");
}

fs.writeFileSync('src/pages/Auxilios.tsx', code);

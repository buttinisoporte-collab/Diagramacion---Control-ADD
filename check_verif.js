const fs = require('fs');
const code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');
console.log(code.match(/setVerificaciones/g));

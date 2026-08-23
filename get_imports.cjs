const fs = require('fs');
console.log(fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8').split('export default function')[0]);

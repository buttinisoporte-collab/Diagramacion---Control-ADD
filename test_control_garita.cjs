const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// Insert isToday
code = code.replace(/const \[fecha, setFecha\] = useState\(.*\);/, 
  "const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);\n  const isToday = fecha === new Date().toISOString().split('T')[0];"); // Actually timezone might be tricky. Let's just use the same logic: new Date().toISOString().split('T')[0] or local time. Wait, if I do `new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]` that gets local time date.


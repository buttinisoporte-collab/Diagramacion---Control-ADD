const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// Change `new Date().toISOString().split('T')[0]` to local date
code = code.replace(
  /const \[fecha, setFecha\] = useState\(new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\);/,
  `const getLocalDate = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return \`\${y}-\${m}-\${d}\`;
  };
  const [fecha, setFecha] = useState(getLocalDate());`
);

code = code.replace(
  /const isToday = fecha === new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\];/,
  `const isToday = fecha === getLocalDate();`
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

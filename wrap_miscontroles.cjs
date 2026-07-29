const fs = require('fs');
let code = fs.readFileSync('src/pages/MisControles.tsx', 'utf8');

if (!code.includes('DiagramacionMecanicoGuard')) {
  code = code.replace("import Header from '../components/Header';", "import Header from '../components/Header';\nimport { DiagramacionMecanicoGuard } from '../components/DiagramacionMecanicoGuard';");
  
  const search = `return (\n    <>`;
  const replace = `return (\n    <DiagramacionMecanicoGuard>\n    <>`;
  code = code.replace(search, replace);
  
  code = code.replace(/<\/>\n  \);\n}/, `</>\n    </DiagramacionMecanicoGuard>\n  );\n}`);
  
  fs.writeFileSync('src/pages/MisControles.tsx', code);
}

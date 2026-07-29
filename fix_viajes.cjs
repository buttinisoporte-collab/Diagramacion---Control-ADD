const fs = require('fs');

function wrapComponent(filePath, componentName) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  if (!code.includes('DiagramacionConductorGuard')) {
    code = code.replace("import Header from '../components/Header';", "import Header from '../components/Header';\nimport { DiagramacionConductorGuard } from '../components/DiagramacionConductorGuard';");
    
    // Replace the main return block
    const search = `return (\n    <>`;
    const replace = `return (\n    <DiagramacionConductorGuard>\n    <>`;
    code = code.replace(search, replace);
    
    code = code.replace(/<\/>\n  \);\n}/, `</>\n    </DiagramacionConductorGuard>\n  );\n}`);
    
    fs.writeFileSync(filePath, code);
  }
}

wrapComponent('src/pages/DuranteViaje.tsx', 'DuranteViaje');
wrapComponent('src/pages/DespuesViaje.tsx', 'DespuesViaje');

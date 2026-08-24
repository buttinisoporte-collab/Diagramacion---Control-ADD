const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

code = code.replace(/id=\{\`time-pres-\$\{t\.cod_turno\}\`\}/g, "id={`time-pres-${t.isTuristico ? t.id : t.cod_turno}`}");
code = code.replace(/document\.getElementById\(\`time-pres-\$\{t\.cod_turno\}\`\)/g, "document.getElementById(`time-pres-${t.isTuristico ? t.id : t.cod_turno}`)");

code = code.replace(/id=\{\`time-sal-\$\{t\.cod_turno\}\`\}/g, "id={`time-sal-${t.isTuristico ? t.id : t.cod_turno}`}");
code = code.replace(/document\.getElementById\(\`time-sal-\$\{t\.cod_turno\}\`\)/g, "document.getElementById(`time-sal-${t.isTuristico ? t.id : t.cod_turno}`)");

// Also check llegadas for t.cod_turno
code = code.replace(/id=\{\`time-llegada-\$\{t\.cod_turno\}\`\}/g, "id={`time-llegada-${t.isTuristico ? t.id : t.cod_turno}`}");
code = code.replace(/document\.getElementById\(\`time-llegada-\$\{t\.cod_turno\}\`\)/g, "document.getElementById(`time-llegada-${t.isTuristico ? t.id : t.cod_turno}`)");

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

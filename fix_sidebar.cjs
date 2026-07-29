const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(/<\/aside>\n  \);\n}/, '</aside>\n    </>\n  );\n}');
fs.writeFileSync('src/components/Sidebar.tsx', code);

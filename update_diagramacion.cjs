const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');

// Increase min-width for the dropdown columns (both Mobile/Grid view and Table view)
code = code.replace(/min-w-\[220px\]/g, 'min-w-[280px]');

// Increase font size inside Select components from 11px to 12px
code = code.replace(/fontSize: '11px'/g, "fontSize: '12px'");

fs.writeFileSync('src/pages/Diagramacion.tsx', code);

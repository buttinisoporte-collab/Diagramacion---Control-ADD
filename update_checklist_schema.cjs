const fs = require('fs');
let code = fs.readFileSync('src/pages/ChecklistSalida.tsx', 'utf8');

code = code.replace(/observaciones: observaciones \|\| null/g, 'obs_gral: observaciones || null');
code = code.replace(/...checks,/g, '...checks,\n        luces_externas: checks.luces_internas,');
code = code.replace(/supabase\.from\('checklist_salida'\)/g, "supabase.from('controles')");

fs.writeFileSync('src/pages/ChecklistSalida.tsx', code);

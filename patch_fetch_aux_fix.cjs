const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

code = code.replace(
  `              while (d <= end) {
                const checkDateStr = d.toISOString().split('T')[0];
                const local = localStorage.getItem(\`llegada_aux_\${checkDateStr}\`);
                if (local) {
                   try {
                     const parsed = JSON.parse(local);
                     if (parsed[aux.id || aux.created_at]) {
                       arrived = true;
                       break;
                     }
                   } catch(e){}
                }
                d.setDate(d.getDate() + 1);
              }`,
  `              while (d < end) { // Check dates STRICTLY BEFORE the currently viewed date
                const checkDateStr = d.toISOString().split('T')[0];
                const local = localStorage.getItem(\`llegada_aux_\${checkDateStr}\`);
                if (local) {
                   try {
                     const parsed = JSON.parse(local);
                     if (parsed[aux.id || aux.created_at]) {
                       arrived = true;
                       break;
                     }
                   } catch(e){}
                }
                d.setDate(d.getDate() + 1);
              }`
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

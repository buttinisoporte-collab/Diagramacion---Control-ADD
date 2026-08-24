const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

code = code.replace(/<tr key=\{t\.cod_turno\} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">/g, '<tr key={t.isTuristico ? `ST_${t.id}` : t.cod_turno} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">');

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

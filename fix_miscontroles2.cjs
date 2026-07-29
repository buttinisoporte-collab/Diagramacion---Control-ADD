const fs = require('fs');
let code = fs.readFileSync('src/pages/MisControles.tsx', 'utf8');

code = code.replace(/<div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden overflow-x-auto">/g, '<div className="bg-white border border-slate-200 rounded-lg shadow-sm">');
code = code.replace(/<div className="overflow-x-auto"><table/g, '<div className="overflow-x-auto"><table'); // already there
code = code.replace(/<\/table><\/div><\/div><\/div>/g, '</table></div></div></div>'); 
fs.writeFileSync('src/pages/MisControles.tsx', code);

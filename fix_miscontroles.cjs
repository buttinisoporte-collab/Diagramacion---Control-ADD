const fs = require('fs');
let code = fs.readFileSync('src/pages/MisControles.tsx', 'utf8');

code = code.replace(/<div className="flex-1 p-8 overflow-y-auto bg-slate-50">/, '<div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50">');
code = code.replace(/<div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">/, '<div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden overflow-x-auto">');

// also replace <table className="w-full text-left border-collapse"> with something that allows horizontal scrolling
if (!code.includes('overflow-x-auto')) {
  code = code.replace(/<table/, '<div className="overflow-x-auto"><table');
  code = code.replace(/<\/table>/, '</table></div>');
}

fs.writeFileSync('src/pages/MisControles.tsx', code);

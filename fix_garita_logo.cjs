const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

code = code.replace(
    "<div className=\"w-32\"><img src=\"https://i.ibb.co/68Z4rN8/logo.png\" alt=\"Logo\" className=\"w-full\" style={{ filter: 'grayscale(100%)' }} /></div>",
    "<div className=\"w-32 text-left leading-tight\"><h2 className=\"text-2xl font-black text-blue-800 tracking-tighter italic\">A.Buttini</h2><p className=\"text-[7px] font-bold text-red-600\">EMPRESA E HIJOS S.R.L.</p></div>"
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

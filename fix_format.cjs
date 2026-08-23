const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

code = code.replace(
  /typeof lleg === 'string' \? lleg : lleg\.time/g,
  "formatTime(typeof lleg === 'string' ? lleg : lleg.time)"
);

code = code.replace(
  /<span className="font-bold text-emerald-600">\{lleg\}<\/span>/g,
  '<span className="font-bold text-emerald-600">{formatTime(lleg)}</span>'
);

code = code.replace(
  /<span className="font-bold text-emerald-600">\{v.hora_salida_verificacion\}<\/span>/g,
  '<span className="font-bold text-emerald-600">{formatTime(v.hora_salida_verificacion)}</span>'
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/SGCAuxilios.tsx', 'utf8');

code = code.replace(
  /\{!isGarita && \(\<button\s+type="button"\s+onClick=\{\(\) => setConfirmDelete\(true\)\}/,
  `<button
                              type="button"
                              onClick={() => setConfirmDelete(true)}`
);

code = code.replace(
  /<span>Eliminar Auxilio<\/span>\s+<\/button>\)\}/,
  `<span>Eliminar Auxilio</span>\n                            </button>`
);

fs.writeFileSync('src/pages/SGCAuxilios.tsx', code);

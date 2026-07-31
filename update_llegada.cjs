const fs = require('fs');
let code = fs.readFileSync('src/pages/Configuracion.tsx', 'utf8');

code = code.replace(
    "{ name: 'llegada', label: 'Llegada', type: 'select', options: ['No', 'Si', 'Sí'], help: 'Indica si queda fuera (Si / No)' }",
    "{ name: 'llegada', label: 'Llegada', type: 'text', help: 'BASE u otro lugar' }"
);

fs.writeFileSync('src/pages/Configuracion.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/Configuracion.tsx', 'utf8');

code = code.replace(
    "{ name: 'tipo_turno', label: 'Tipo', type: 'select', options: ['Urbano', 'Media', 'Larga'], help: 'Urbano, Media o Larga' },",
    "{ name: 'tipo_turno', label: 'Tipo', type: 'select', options: ['Urbano', 'Media', 'Larga'], help: 'Urbano, Media o Larga' },\n    { name: 'salida', label: 'Salida', type: 'text', help: 'BASE u otro' },"
);

code = code.replace(
    "{ name: 'llegada', label: 'Queda Fuera'",
    "{ name: 'llegada', label: 'Llegada'"
);

code = code.replace(
    "'tipo_turno': 'tipo_turno', 'tipo': 'tipo_turno', 'tipo turno': 'tipo_turno', 'tipo de turno': 'tipo_turno',",
    "'tipo_turno': 'tipo_turno', 'tipo': 'tipo_turno', 'tipo turno': 'tipo_turno', 'tipo de turno': 'tipo_turno',\n    'salida': 'salida', 'servicio': 'salida',"
);

fs.writeFileSync('src/pages/Configuracion.tsx', code);

const fs = require('fs');

function replaceInFile(path, replacements) {
    let code = fs.readFileSync(path, 'utf8');
    for (let r of replacements) {
        code = code.replace(r.from, r.to);
    }
    fs.writeFileSync(path, code);
}

replaceInFile('src/pages/Configuracion.tsx', [
    { from: /'servicio'/g, to: "'salida'" },
    { from: /'queda_fuera'/g, to: "'llegada'" },
    { from: /name: 'queda_fuera', label: 'Queda Fuera'/g, to: "name: 'llegada', label: 'Llegada'" },
    { from: /'queda_fuera': 'queda_fuera'/g, to: "'llegada': 'llegada'" },
    { from: /'queda fuera': 'queda_fuera'/g, to: "'llegada': 'llegada'" },
    { from: /'queda_fuera \(si \/ no\)': 'queda_fuera'/g, to: "'llegada': 'llegada'" },
    { from: /'queda fuera \(si \/ no\)': 'queda_fuera'/g, to: "'llegada': 'llegada'" },
    { from: /'queda fuera \(sí \/ no\)': 'queda_fuera'/g, to: "'llegada': 'llegada'" },
    { from: /'fuera': 'queda_fuera'/g, to: "'llegada': 'llegada'" },
    { from: /name: 'servicio', label: 'Servicio'/g, to: "name: 'salida', label: 'Salida'" },
    { from: /'servicio': 'servicio'/g, to: "'salida': 'salida'" }
]);

replaceInFile('src/pages/Diagramacion.tsx', [
    { from: /servicio\?: string;/g, to: "salida?: string;" },
    { from: /queda_fuera\?: string;/g, to: "llegada?: string;" },
    { from: /servicio: /g, to: "salida: " },
    { from: /queda_fuera: /g, to: "llegada: " },
    { from: /t\.servicio/g, to: "t.salida" },
    { from: /t\.queda_fuera/g, to: "t.llegada" }
]);


const fs = require('fs');

function fixILike(file) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/conductor_principal\.ilike\.\$\{user\.nombre_apellido\},conductor_secundario\.ilike\.\$\{user\.nombre_apellido\}/, 
        'conductor_principal.ilike.%${user.nombre_apellido}%,conductor_secundario.ilike.%${user.nombre_apellido}%');
    fs.writeFileSync(file, code);
}

fixILike('src/components/DiagramacionConductorGuard.tsx');
fixILike('src/pages/ChecklistSalida.tsx');

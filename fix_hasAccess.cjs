const fs = require('fs');
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

const oldFunc = `  const hasAccess = (pantalla: string) => {
    if (!user) return false;
    // Administrador has full access implicitly if we want, or we rely on DB.
    // Relying on DB is safer as requested: "en función del rol... serán las pantallas que se habilitarán"
    const p = permisos.find(x => x.pantalla === pantalla);
    return p ? p.acceso : false;
  };`;

const newFunc = `  const hasAccess = (pantalla: string) => {
    if (!user) return false;
    if (user.rol === 'Administrador') return true;
    const p = permisos.find(x => x.pantalla === pantalla);
    return p ? p.acceso : false;
  };`;

code = code.replace(oldFunc, newFunc);

fs.writeFileSync('src/context/AuthContext.tsx', code);

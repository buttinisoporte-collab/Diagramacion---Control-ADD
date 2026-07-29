const fs = require('fs');
let code = fs.readFileSync('supabase/schema.sql', 'utf8');

code = code.replace(/servicio VARCHAR\(100\)/g, 'salida VARCHAR(100)');
code = code.replace(/queda_fuera VARCHAR\(2\) DEFAULT 'No'/g, "llegada VARCHAR(100)");

fs.writeFileSync('supabase/schema.sql', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

if (!code.includes("useAuth")) {
    code = code.replace(
        "import { supabase } from '../lib/supabase';",
        "import { supabase } from '../lib/supabase';\nimport { useAuth } from '../context/AuthContext';"
    );
}

code = code.replace(
    "const isToday = fecha === getLocalDate();",
    "const isToday = fecha === getLocalDate();\n  const { user } = useAuth();\n  const canEdit = isToday || user?.rol === 'Administrador';"
);

// Replace occurrences of isToday inside functions with canEdit, but handle the string replacement carefully.
// 41: if (!isToday) return;
code = code.replace(/if \(!isToday\) return;/g, "if (!canEdit) return;");

// 678: if (!isToday) {
code = code.replace(/if \(!isToday\) \{/g, "if (!canEdit) {");

// alert("Solo se pueden editar las novedades en la fecha actual.\n\nNovedad registrada: " + (t.observaciones || 'Ninguna.'));
code = code.replace(
    "Solo se pueden editar las novedades en la fecha actual.",
    "Solo se pueden editar las novedades en la fecha actual (o con rol Administrador)."
);

// Buttons and inputs disabled
code = code.replace(/disabled=\{!isToday\}/g, "disabled={!canEdit}");

// Button renders {isToday && (
code = code.replace(/\{isToday && \(/g, "{canEdit && (");

// CSS strings using isToday
code = code.replace(/!\(isRowReady \|\| !isToday\)/g, "(!isRowReady || !canEdit)");
code = code.replace(/\(!isRowReady \|\| !isToday\)/g, "(!isRowReady || !canEdit)");
code = code.replace(/\(!pres \|\| !isToday\)/g, "(!pres || !canEdit)");
code = code.replace(/\$\{isToday \?/g, "${canEdit ?");

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

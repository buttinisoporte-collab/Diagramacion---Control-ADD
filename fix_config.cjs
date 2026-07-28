const fs = require('fs');
let code = fs.readFileSync('src/pages/Configuracion.tsx', 'utf8');

code = code.replace(
  'if (editingRecord && primaryKey) {\n       const { data: updated, error: updateError } = await supabase\n         .from(tableName)\n         .update(remotePayload)\n         .eq(primaryKey, editingRecord[primaryKey])',
  'if (editingRecord && primaryKey) {\n       const payloadWithoutPk = { ...remotePayload };\n       delete payloadWithoutPk[primaryKey];\n       const { data: updated, error: updateError } = await supabase\n         .from(tableName)\n         .update(payloadWithoutPk)\n         .eq(primaryKey, editingRecord[primaryKey])'
);

code = code.replace(
  'if (match && match[primaryKeyCol]) {\n        // UPDATE existing record\n        const { data: updatedRows, error: updateError } = await supabase\n          .from(tableName)\n          .update(remotePayload)\n          .eq(primaryKeyCol, match[primaryKeyCol])',
  'if (match && match[primaryKeyCol]) {\n        const payloadWithoutPk = { ...remotePayload };\n        delete payloadWithoutPk[primaryKeyCol];\n        // UPDATE existing record\n        const { data: updatedRows, error: updateError } = await supabase\n          .from(tableName)\n          .update(payloadWithoutPk)\n          .eq(primaryKeyCol, match[primaryKeyCol])'
);

fs.writeFileSync('src/pages/Configuracion.tsx', code);

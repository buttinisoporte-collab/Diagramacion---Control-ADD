const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');

code = code.replace(
  `onChange={(option) => handleAssignmentChange(t.cod_turno, 'unidad', option ? option.value : '')}`,
  `isMulti={t.turno?.toLowerCase().includes('auxilio base') || t.turno?.toLowerCase().includes('auxilio en base') || t.turno?.toLowerCase() === 'aux base' || t.turno?.toLowerCase().includes('auxilio terminal') || t.turno?.toLowerCase().includes('auxilio en terminal') || t.turno?.toLowerCase() === 'aux term'}
                            onChange={(option: any) => {
                              if (Array.isArray(option)) {
                                const vals = option.map((o: any) => o.value).join(', ');
                                handleAssignmentChange(t.cod_turno, 'unidad', vals);
                              } else {
                                handleAssignmentChange(t.cod_turno, 'unidad', option ? option.value : '');
                              }
                            }}`
);
console.log(code.includes('isMulti={t.turno'));

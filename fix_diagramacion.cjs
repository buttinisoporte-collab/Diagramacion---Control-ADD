const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');

// 1. Fix isComplete for Auxilio
code = code.replace(
  /const isComplete = Boolean\(assign\?\.unidad && assign\?\.conductor_principal\);/g,
  `const isAux = t.turno?.toLowerCase().includes('auxilio base') || t.turno?.toLowerCase().includes('auxilio en base') || t.turno?.toLowerCase() === 'aux base' || t.turno?.toLowerCase().includes('auxilio terminal') || t.turno?.toLowerCase().includes('auxilio en terminal') || t.turno?.toLowerCase() === 'aux term';
      const isComplete = isAux ? Boolean(assign?.unidad) : Boolean(assign?.unidad && assign?.conductor_principal);`
);

// 2. Fix Grid View status
code = code.replace(
  /const isComplete = Boolean\(assign\?\.unidad && assign\?\.conductor_principal\);/g, // if there is another one inside map
  `const isAux = t.turno?.toLowerCase().includes('auxilio base') || t.turno?.toLowerCase().includes('auxilio en base') || t.turno?.toLowerCase() === 'aux base' || t.turno?.toLowerCase().includes('auxilio terminal') || t.turno?.toLowerCase().includes('auxilio en terminal') || t.turno?.toLowerCase() === 'aux term';
                            const isComplete = isAux ? Boolean(assign?.unidad) : Boolean(assign?.unidad && assign?.conductor_principal);`
);
// In grid map
code = code.replace(
  /const isComplete = Boolean\(assign\.unidad && assign\.conductor_principal\);/g, 
  `const isAux = t.turno?.toLowerCase().includes('auxilio base') || t.turno?.toLowerCase().includes('auxilio en base') || t.turno?.toLowerCase() === 'aux base' || t.turno?.toLowerCase().includes('auxilio terminal') || t.turno?.toLowerCase().includes('auxilio en terminal') || t.turno?.toLowerCase() === 'aux term';
                    const isComplete = isAux ? Boolean(assign.unidad) : Boolean(assign.unidad && assign.conductor_principal);`
);

// 3. Fix Table view Dropdown for Unidad
const selectUnidadOld = `<Select
                            value={assign.unidad ? { value: assign.unidad, label: assign.unidad } : null}
                            onChange={(option) => handleAssignmentChange(t.cod_turno, 'unidad', option ? option.value : '')}`;

const selectUnidadNew = `
                          {(() => {
                            const isAux = t.turno?.toLowerCase().includes('auxilio base') || t.turno?.toLowerCase().includes('auxilio en base') || t.turno?.toLowerCase() === 'aux base' || t.turno?.toLowerCase().includes('auxilio terminal') || t.turno?.toLowerCase().includes('auxilio en terminal') || t.turno?.toLowerCase() === 'aux term';
                            const parsedValue = assign.unidad ? assign.unidad.split(',').map(u => u.trim()).filter(Boolean).map(u => ({ value: u, label: u })) : null;
                            const multiValue = parsedValue ? (isAux ? parsedValue : parsedValue[0]) : null;
                            
                            return (
                              <Select
                                isMulti={isAux}
                                value={multiValue}
                                onChange={(option: any) => {
                                  if (Array.isArray(option)) {
                                    handleAssignmentChange(t.cod_turno, 'unidad', option.map(o => o.value).join(', '));
                                  } else {
                                    handleAssignmentChange(t.cod_turno, 'unidad', option ? option.value : '');
                                  }
                                }}`;

code = code.replace(
  /<Select\s+value=\{assign\.unidad \? \{ value: assign\.unidad, label: assign\.unidad \} : null\}\s+onChange=\{\(option\) => handleAssignmentChange\(t\.cod_turno, 'unidad', option \? option\.value : ''\)\}/g,
  selectUnidadNew
);

// Close the IIFE for Table view select
code = code.replace(
  /option: \(base\) => \(\{ \.\.\.base, fontSize: '12px' \}\)\s*\}\}\s*\/>/g,
  `option: (base) => ({ ...base, fontSize: '12px' })
                              }}
                            />
                            );
                          })()}`
);

// Do the same for grid view
const gridUnidadOld = `<Select
                          value={assign.unidad ? { value: assign.unidad, label: assign.unidad } : null}
                          onChange={(option) => handleAssignmentChange(t.cod_turno, 'unidad', option ? option.value : '')}`;

code = code.replace(
  /<Select\s+value=\{assign\.unidad \? \{ value: assign\.unidad, label: assign\.unidad \} : null\}\s+onChange=\{\(option\) => handleAssignmentChange\(t\.cod_turno, 'unidad', option \? option\.value : ''\)\}/g,
  selectUnidadNew
);

fs.writeFileSync('src/pages/Diagramacion.tsx', code);

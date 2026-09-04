import fs from 'fs';

let content = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf-8');

// 1. Update handleSaveVerifUnitToDB to accept multiple fields
const oldHandleSave = `const handleSaveVerifUnitToDB = async (v: any, unit: string, field: string, value: string) => {
    if (!canEdit) return;
    
    let parsed: any = {};
    try {
      if (v.observaciones && v.observaciones.startsWith('{')) {
        parsed = JSON.parse(v.observaciones);
      } else if (v.observaciones) {
        parsed = { _general: v.observaciones };
      }
    } catch (e) {}
    
    if (!parsed[unit]) parsed[unit] = {};
    parsed[unit][field] = value;`;

const newHandleSave = `const handleSaveVerifUnitToDB = async (v: any, unit: string, updates: Record<string, string>) => {
    if (!canEdit) return;
    
    let parsed: any = {};
    try {
      if (v.observaciones && v.observaciones.startsWith('{')) {
        parsed = JSON.parse(v.observaciones);
      } else if (v.observaciones) {
        parsed = { _general: v.observaciones };
      }
    } catch (e) {}
    
    if (!parsed[unit]) parsed[unit] = {};
    Object.assign(parsed[unit], updates);`;

content = content.replace(oldHandleSave, newHandleSave);

// 2. Update usages of handleSaveVerifUnitToDB
content = content.replace(/handleSaveVerifUnitToDB\(([^,]+),\s*([^,]+),\s*'hora_salida',\s*([^)]+)\)/g, 'handleSaveVerifUnitToDB($1, $2, { hora_salida: $3 })');
content = content.replace(/handleSaveVerifUnitToDB\(([^,]+),\s*([^,]+),\s*'hora_llegada',\s*([^)]+)\)/g, 'handleSaveVerifUnitToDB($1, $2, { hora_llegada: $3 })');
content = content.replace(/handleSaveVerifUnitToDB\(([^,]+),\s*([^,]+),\s*'novedades',\s*([^)]+)\)/g, 'handleSaveVerifUnitToDB($1, $2, { novedades: $3 })');
content = content.replace(/handleSaveVerifUnitToDB\(([^,]+),\s*([^,]+),\s*'mecanico',\s*([^)]+)\)/g, 'handleSaveVerifUnitToDB($1, $2, { mecanico: $3 })');

// Update the specific Salidas OK button to save the mechanic too
const oldSalidaSave = `handleSaveVerifUnitToDB(v, unit, { hora_salida: horaFinal });`;
const newSalidaSave = `handleSaveVerifUnitToDB(v, unit, { hora_salida: horaFinal, mecanico: personaFinal });`;
content = content.replace(oldSalidaSave, newSalidaSave);

// 3. Add the Verificación Técnica (Llegadas) table
const llegadasTable = `
      {/* Verificación Técnica Llegadas */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-shrink-0">
        <div className="bg-blue-50 border-b border-blue-100 px-3 py-2 text-xs flex justify-between items-center">
          <h3 className="font-bold text-blue-800 text-sm">Verificación Técnica (Llegadas)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-3 py-2">TURNO</th>
                <th className="px-3 py-2">UNIDAD</th>
                <th className="px-3 py-2">MECÁNICO A CARGO</th>
                <th className="px-3 py-2">HORA SALIDA</th>
                <th className="px-3 py-2">HORA LLEGADA</th>
                <th className="px-3 py-2 text-center">NOVEDADES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const allUnits: { cod: string; unit: string; original: any; st: any }[] = [];
                verificaciones.forEach(v => {
                  if (v.unidad) {
                    const units = v.unidad.split(',').map((u: string) => u.trim()).filter(Boolean);
                    units.forEach((u: string, idx: number) => {
                      const st = getVerifUnitState(v, u);
                      if (st.hora_salida) {
                         allUnits.push({ cod: \`\${v.cod_turno}-\${idx}\`, unit: u, original: v, st });
                      }
                    });
                  }
                });
                
                if (allUnits.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-xs text-slate-400">
                        Sin unidades en curso para verificación técnica.
                      </td>
                    </tr>
                  );
                }

                return allUnits.map((uInfo, idx) => {
                  const { original: v, cod, unit, st } = uInfo;
                  
                  const hLlegada = editedTimes['vllegada-' + cod] !== undefined 
                    ? editedTimes['vllegada-' + cod] 
                    : (st.hora_llegada || '');
                  
                  return (
                    <tr key={\`vtech-lleg-\${cod}-\${idx}\`} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 text-xs font-bold text-slate-800">Verificación Técnica</td>
                      <td className="px-3 py-2 text-xs font-bold text-[#5c6bc0]">{unit}</td>
                      <td className="px-3 py-2 text-xs font-medium text-slate-700">{st.mecanico || v.conductor_principal || '-'}</td>
                      <td className="px-3 py-2 text-xs font-bold text-slate-600">{st.hora_salida}</td>
                      <td className="px-3 py-2 text-xs">
                        <div className="flex items-center gap-1">
                          <input 
                            type="time" 
                            disabled={!canEdit}
                            value={hLlegada}
                            onChange={(e) => setEditedTimes(prev => ({ ...prev, ['vllegada-' + cod]: e.target.value }))}
                            className="w-[85px] text-xs border border-slate-300 rounded px-2 py-1 font-mono font-bold text-center"
                          />
                          {canEdit && (
                            <button 
                              onClick={async () => {
                                const horaFinal = editedTimes['vllegada-' + cod] || st.hora_llegada || '';
                                handleSaveVerifUnitToDB(v, unit, { hora_llegada: horaFinal });
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase"
                            >
                              OK
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-center">
                        <button 
                          onClick={() => handleNovedadVerifUnit(v, unit)}
                          className={\`px-3 py-1 \${st.novedades ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'} text-white rounded text-xs font-bold w-full max-w-[100px]\`}
                        >
                          {st.novedades ? 'Ver Novedad' : 'Novedad'}
                        </button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
`;

// Insert the new table just after the Turnos Llegadas table
// Find: {/* Auxilios Llegadas */}
content = content.replace('{/* Auxilios Llegadas */}', llegadasTable + '\n      {/* Auxilios Llegadas */}');

fs.writeFileSync('src/pages/ControlGarita.tsx', content);

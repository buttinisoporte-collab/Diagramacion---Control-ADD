const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');

const regex = /const handleAssignmentChange = \(codTurno: string, field: keyof Assignment, value: string\) => \{(.*?)\};\n/s;

const newFunc = `const handleAssignmentChange = (codTurno: string, field: keyof Assignment, value: string) => {
    // Overlap checking when assigning value
    if (value && (field === 'unidad' || field === 'conductor_principal' || field === 'conductor_secundario')) {
      const targetTurno = turnos.find(t => t.cod_turno === codTurno);
      if (targetTurno) {
        const targetInterval = getShiftInterval(targetTurno);
        if (targetInterval) {
          // Check all other assigned shifts for overlaps
          const activeIntervals: {cod_turno: string, interval: any, val: string}[] = [];
          turnos.forEach(t => {
            if (t.cod_turno === codTurno) return;
            const assign = assignments[t.cod_turno];
            if (!assign) return;
            if (field === 'unidad' && assign.unidad && assign.unidad === value) {
              const iv = getShiftInterval(t);
              if (iv) activeIntervals.push({cod_turno: t.cod_turno, interval: iv, val: assign.unidad});
            } else if ((field === 'conductor_principal' || field === 'conductor_secundario') && 
                      (assign.conductor_principal === value || assign.conductor_secundario === value)) {
              const iv = getShiftInterval(t);
              if (iv) activeIntervals.push({cod_turno: t.cod_turno, interval: iv, val: value});
            }
          });
          
          for (const a of activeIntervals) {
            const overlaps = targetInterval.start < a.interval.end && targetInterval.end > a.interval.start;
            if (overlaps) {
              const entityName = field === 'unidad' ? 'La unidad' : 'El conductor';
              alert(\`\${entityName} \${value} ya está asignado al turno \${a.cod_turno} que se superpone con este horario.\`);
            }
          }
        }
      }
    }

    setAssignments((prev) => {
      const existing = prev[codTurno] || {
        cod_turno: codTurno,
        fecha: selectedDate,
        unidad: '',
        conductor_principal: '',
        conductor_secundario: '',
        observaciones: '',
        estado: 'Pendiente'
      };

      const updated = {
        ...existing,
        [field]: value,
        fecha: selectedDate
      };

      return { ...prev, [codTurno]: updated };
    });
  };
`;

code = code.replace(regex, newFunc);
fs.writeFileSync('src/pages/Diagramacion.tsx', code, 'utf8');

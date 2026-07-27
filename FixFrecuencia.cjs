const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');

const oldBlock = `      const f = String(t.frecuencia || '').toLowerCase().trim();
      let matchesFrec = false;
      if (!f) matchesFrec = true;
      else if (isHoliday) {
        if (f.includes('feriado') || f === 'diario' || f.includes('todos los d') || f === 'domingo - feriado') matchesFrec = true;
      } else if (f.includes('feriado') && !f.includes('domingo') && !f.includes('sábado') && !f.includes('sabado') && !f.includes('lunes')) {
        matchesFrec = false; // Solo feriado
      } else if (f === 'diario' || f.includes('todos los d')) {
        matchesFrec = true;
      } else if (day >= 1 && day <= 5) {
        if (f.includes('lunes a viernes') || f.includes('habil') || f.includes('hábil') || f.includes('lunes a sabado') || f.includes('lunes a sábado')) matchesFrec = true;
      } else if (day === 6) {
        if (f.includes('sabado') || f.includes('sábado') || f.includes('lunes a sabado') || f.includes('lunes a sábado') || f.includes('fin de semana')) matchesFrec = true;
      } else if (day === 0) {
        if (f.includes('domingo') || f.includes('fin de semana')) matchesFrec = true;
      }`;

const newBlock = `      const f = String(t.frecuencia || '').toLowerCase().trim();
      let matchesFrec = false;
      if (!f) matchesFrec = true;
      else if (isHoliday) {
        if (f.includes('domingo') || f.includes('feriado')) matchesFrec = true;
      } else if (day === 0) {
        if (f.includes('domingo') || f.includes('feriado') || f.includes('fin de semana')) matchesFrec = true;
      } else if (day === 6) {
        if (f.includes('sabado') || f.includes('sábado') || f.includes('fin de semana') || f.includes('lunes a sabado') || f.includes('lunes a sábado')) matchesFrec = true;
      } else if (day >= 1 && day <= 5) {
        if (f.includes('habil') || f.includes('hábil') || f.includes('lunes a viernes') || f.includes('lunes a sabado') || f.includes('lunes a sábado')) matchesFrec = true;
      }
      
      // Siempre coinciden
      if (f.includes('diario') || f.includes('todos los d')) matchesFrec = true;`;

code = code.replace(oldBlock, newBlock);
fs.writeFileSync('src/pages/Diagramacion.tsx', code);

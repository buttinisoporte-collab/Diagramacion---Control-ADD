const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');

// 1. Add feriados state and load it
code = code.replace(
  /const \[temporadas, setTemporadas\] = useState<Temporada\[\]>\(\[\]\);/,
  `const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [feriados, setFeriados] = useState<any[]>([]);`
);

code = code.replace(
  /let loadedTemporadas: Temporada\[\] = \[\];/,
  `let loadedFeriados: any[] = [];
        if (supabase) {
          const { data: feriadosRes } = await supabase.from('feriados').select('*');
          if (feriadosRes) loadedFeriados = feriadosRes;
        }
        if (loadedFeriados.length === 0) {
          const localFeriados = localStorage.getItem('ext_store_feriados');
          loadedFeriados = localFeriados ? JSON.parse(localFeriados) : [];
        }
        setFeriados(loadedFeriados);
        
        let loadedTemporadas: Temporada[] = [];`
);

// 2. Import react-select
code = code.replace(
  /import \{ (.*?) \} from 'lucide-react';/,
  `import { $1 } from 'lucide-react';\nimport Select from 'react-select';`
);

// 3. Frecuencia filter function
const filterLogic = `// Filter by Frecuencia
      const dateObj = new Date(selectedDate + "T12:00:00");
      const day = dateObj.getDay(); // 0 = Sunday
      const isHoliday = feriados.some(f => f.fecha === selectedDate);
      
      const f = String(t.frecuencia || '').toLowerCase().trim();
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
      }
      
      if (!matchesFrec) return false;

      // 3. Assignment status filter`;

code = code.replace(
  /\/\/ 3\. Assignment status filter/,
  filterLogic
);

// Update dependencies of useMemo
code = code.replace(
  /\[turnos, assignments, conflictsMap, tipoFilter, seasonFilter, assignmentFilter, grupoFilter, searchTerm\]\)/,
  `[turnos, assignments, conflictsMap, tipoFilter, seasonFilter, assignmentFilter, grupoFilter, searchTerm, selectedDate, feriados])`
);

fs.writeFileSync('src/pages/Diagramacion.tsx', code, 'utf8');

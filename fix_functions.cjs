const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// 1. Add llegadas parsing to loadData
code = code.replace(
  /const localST = localStorage\.getItem\('app_servicios_turisticos'\);/,
  `// Check local storage for llegadas
      const localLlegadas = localStorage.getItem(\`llegada_\${fecha}\`);
      if (localLlegadas) {
        try { setLlegadasMap(JSON.parse(localLlegadas)); } catch (e) {}
      }
      
      const localLlegadasAux = localStorage.getItem(\`llegada_aux_\${fecha}\`);
      if (localLlegadasAux) {
        try { setLlegadasAuxiliosMap(JSON.parse(localLlegadasAux)); } catch (e) {}
      }

      const localST = localStorage.getItem('app_servicios_turisticos');`
);

// 2. Define the missing functions handleLlegada and handleAuxilioLlegada
code = code.replace(
  /const handleDesmarcarSalida = async \(t: any\) => \{/,
  `const handleLlegada = async (codTurno: string, timeValue: string) => {
    setLlegadasMap(prev => {
      const next = { ...prev, [codTurno]: timeValue };
      localStorage.setItem(\`llegada_\${fecha}\`, JSON.stringify(next));
      return next;
    });
    if (supabase) {
      try {
        await supabase
          .from('diagramaciones')
          .update({ llegada: timeValue })
          .eq('fecha', fecha)
          .eq('cod_turno', codTurno);
      } catch (e) {}
    }
  };

  const handleAuxilioLlegada = async (id: string, timeValue: string) => {
    setLlegadasAuxiliosMap(prev => {
      const next = { ...prev, [id]: timeValue };
      localStorage.setItem(\`llegada_aux_\${fecha}\`, JSON.stringify(next));
      return next;
    });
    if (supabase) {
      try {
        await supabase
          .from('auxilios')
          .update({ hora_llegada_base: timeValue })
          .eq('id', id);
      } catch (e) {}
    }
  };

  const handleDesmarcarSalida = async (t: any) => {`
);

// 3. Fix handleMarcar and handleNovedad usage
code = code.replace(
  /onClick=\{\(\) => handleMarcar\(t\.cod_turno, 'presentacion'\)\}/g,
  `onClick={() => handleMarcarPresente(t)}`
);

code = code.replace(
  /onClick=\{\(\) => handleMarcar\(t\.cod_turno, 'salida'\)\}/g,
  `onClick={() => handleMarcarSalida(t)}`
);

code = code.replace(
  /if \(nov !== null\) handleNovedad\(t\.cod_turno, nov\);/g,
  `if (nov !== null) { t.observaciones = nov; handleNovedad(t); }`
);

// Also need to fix the JSX definition for novelty prompt, it passes cod_turno when handleNovedad wants t.
code = code.replace(
  /onClick=\{\(\) => \{\s*const nov = prompt\("Ingrese la novedad:", t\.observaciones \|\| ''\);\s*if \(nov !== null\) handleNovedad\(t\.cod_turno, nov\);\s*\}\}/g,
  `onClick={() => handleNovedad(t)}`
);
code = code.replace(
  /onClick=\{\(\) => \{\s*const nov = prompt\("Ingrese la novedad a la llegada:", t\.observaciones \|\| ''\);\s*if \(nov !== null\) handleNovedad\(t\.cod_turno, nov\);\s*\}\}/g,
  `onClick={() => handleNovedad(t)}`
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

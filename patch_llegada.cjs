const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

code = code.replace(
  /const handleLlegada = async \(codTurno: string, timeValue: string\) => \{[\s\S]*?\}\s*\};\s*const handleAuxilioLlegada/,
  `const handleLlegada = async (t: any, timeValue: string) => {
    const key = t.isTuristico ? \`ST_\${t.id}\` : t.cod_turno;
    setLlegadasMap(prev => {
      const next = { ...prev, [key]: timeValue };
      localStorage.setItem(\`llegada_\${fecha}\`, JSON.stringify(next));
      return next;
    });
    if (supabase) {
      try {
        if (t.isTuristico) {
          await supabase
            .from('servicios_turisticos')
            .update({ hora_llegada_real: timeValue }) // Assuming a field for this or just update
            .eq('id', t.id);
        } else {
          await supabase
            .from('diagramaciones')
            .update({ llegada: timeValue })
            .eq('fecha', fecha)
            .eq('cod_turno', t.cod_turno);
        }
      } catch (e) {}
    }
  };
  const handleAuxilioLlegada`
);

// We need to fix the places calling handleLlegada
code = code.replace(/handleLlegada\(t\.cod_turno, val\)/g, "handleLlegada(t, val)");
code = code.replace(/handleLlegada\(t\.cod_turno, new Date/g, "handleLlegada(t, new Date");

// We also need to fix llegadasMap usage to use the correct key for turisticos.
// Search where llegadasMap is used: const lleg = llegadasMap[t.cod_turno] || t.hora_llegada_verificacion;
code = code.replace(
  /const lleg = llegadasMap\[t\.cod_turno\] \|\| t\.hora_llegada_verificacion;/,
  `const llegKey = t.isTuristico ? \`ST_\${t.id}\` : t.cod_turno;
                        const lleg = llegadasMap[llegKey] || t.hora_llegada_verificacion;`
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

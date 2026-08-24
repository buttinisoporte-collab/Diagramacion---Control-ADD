const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// Insert after setTurnosBase(combined);
code = code.replace(
  "setTurnosBase(combined);",
  `setTurnosBase(combined);

      // --- FETCH AYER FOR LLEGADAS ---
      let diagResAyer = [];
      const yesterdayObj = new Date(dateObj.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterdayObj.toISOString().split('T')[0];
      if (supabase) {
        try {
          const { data: dResAyer } = await supabase.from('diagramaciones').select('*').eq('fecha', yesterdayStr);
          if (dResAyer) diagResAyer = dResAyer;
        } catch(e) {}
      }

      const localDiagStorageAyer = localStorage.getItem(\`diagramacion_\${yesterdayStr}\`);
      if (localDiagStorageAyer) {
        try {
          const list = JSON.parse(localDiagStorageAyer);
          list.forEach((item: any) => {
            const idx = diagResAyer.findIndex(x => x.cod_turno === item.cod_turno);
            if (idx >= 0) {
              diagResAyer[idx] = { ...diagResAyer[idx], ...item };
            } else {
              diagResAyer.push({ fecha: yesterdayStr, cod_turno: item.cod_turno, ...item });
            }
          });
        } catch(e) {}
      }

      const dayAyer = yesterdayObj.getDay();
      const isHolidayAyer = loadedFeriados.some(f => f.fecha === yesterdayStr);
      
      const turnosDeAyer = turnosRes.filter(t => {
        // Only care about cross-midnight turnos
        if (!(t.hora_llegada_base && t.hora_salida_base && t.hora_llegada_base < t.hora_salida_base)) return false;

        if (t.es_refuerzo) {
          return (t.dias_refuerzo || []).includes(yesterdayStr);
        }

        const f = String(t.frecuencia || '').toLowerCase().trim();
        let matchesFrec = false;
        if (!f) matchesFrec = true;
        else if (isHolidayAyer) {
          if (f.includes('domingo') || f.includes('feriado')) matchesFrec = true;
        } else if (dayAyer === 0) {
          if (f.includes('domingo') || f.includes('feriado') || f.includes('fin de semana')) matchesFrec = true;
        } else if (dayAyer === 6) {
          if (f.includes('sabado') || f.includes('sábado') || f.includes('fin de semana') || f.includes('lunes a sabado') || f.includes('lunes a sábado')) matchesFrec = true;
        } else if (dayAyer >= 1 && dayAyer <= 5) {
          if (f.includes('habil') || f.includes('hábil') || f.includes('lunes a viernes') || f.includes('lunes a sabado') || f.includes('lunes a sábado')) matchesFrec = true;
        }
        if (f.includes('diario') || f.includes('todos los d')) matchesFrec = true;
        
        return matchesFrec;
      });

      const enrichedTurnosAyer = turnosDeAyer.map(t => {
        const d = diagResAyer.find(x => x.cod_turno === t.cod_turno) || {};
        return {
          ...d,
          cod_turno: t.cod_turno,
          turno_id: t.id_turno,
          unidad_id: d.unidad ? flotaMap[d.unidad] : undefined,
          hora_presentacion: t.hora_presentacion,
          hora_salida_base: t.hora_salida_base,
          hora_inicio: t.hora_inicio,
          hora_fin: t.hora_fin,
          hora_llegada_base: t.hora_llegada_base,
          turno_label: t.turno,
          legajo: d.conductor_principal ? legajoMap[d.conductor_principal] : '',
          isTuristico: false,
          isYesterday: true,
          fecha_salida: yesterdayStr
        };
      });

      // Fetch turisticos ayer
      let turisticosAyer = [];
      if (supabase) {
        try {
          const { data: stResAyer } = await supabase.from('servicios_turisticos').select('*').eq('fecha', yesterdayStr);
          if (stResAyer) turisticosAyer = stResAyer;
        } catch(e) {}
      }
      const enrichedTuristicosAyer = turisticosAyer.filter(t => t.hora_llegada && t.hora_salida && t.hora_llegada < t.hora_salida).map(t => ({
        id: t.id,
        cod_turno: \`Tur_\${t.id}\`,
        turno_label: \`Tur_\${t.id}\`,
        unidad: t.unidad,
        conductor_principal: t.conductor,
        hora_salida_base: t.hora_salida,
        hora_llegada_base: t.hora_llegada,
        hora_presentacion: t.hora_salida,
        isTuristico: true,
        isYesterday: true,
        fecha_salida: yesterdayStr
      }));
      
      setTurnosBaseAyer([...enrichedTurnosAyer, ...enrichedTuristicosAyer].filter(t => {
        return !(t.turno_label && (t.turno_label.toLowerCase().includes('auxilio base') || t.turno_label.toLowerCase().includes('auxilio en base') || t.turno_label.toLowerCase() === 'aux base' || t.turno_label.toLowerCase().includes('auxilio terminal') || t.turno_label.toLowerCase().includes('auxilio en terminal') || t.turno_label.toLowerCase() === 'aux term' || t.turno_label.toLowerCase().includes('verificaci')));
      }));
      // --- END FETCH AYER ---`
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

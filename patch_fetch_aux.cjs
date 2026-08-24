const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

const oldFetch = "const { data: auxRes } = await supabase.from('auxilios').select('*').eq('fecha', fecha);\n          if (auxRes) setAuxiliosList(auxRes);";
const newFetch = `const lastWeekDate = new Date(new Date(fecha).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const { data: auxRes } = await supabase.from('auxilios').select('*').gte('fecha', lastWeekDate).lte('fecha', fecha);
          if (auxRes) {
            const filteredAux = auxRes.filter((aux: any) => {
              if (aux.fecha === fecha) return true;
              let arrived = false;
              let d = new Date(aux.fecha + "T00:00:00");
              const end = new Date(fecha + "T00:00:00");
              while (d <= end) {
                const checkDateStr = d.toISOString().split('T')[0];
                const local = localStorage.getItem(\`llegada_aux_\${checkDateStr}\`);
                if (local) {
                   try {
                     const parsed = JSON.parse(local);
                     if (parsed[aux.id || aux.created_at]) {
                       arrived = true;
                       break;
                     }
                   } catch(e){}
                }
                d.setDate(d.getDate() + 1);
              }
              return !arrived;
            });
            setAuxiliosList(filteredAux);
          }`;

code = code.replace(oldFetch, newFetch);
fs.writeFileSync('src/pages/ControlGarita.tsx', code);

import fs from 'fs';

let content = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf-8');

// 1. Add helper functions
const helpers = `
function getAuxiliosDates() {
  try {
    return JSON.parse(localStorage.getItem('app_auxilios_dates') || '{}');
  } catch {
    return {};
  }
}

function saveAuxilioSalida(id: string, fecha: string) {
  const dates = getAuxiliosDates();
  if (!dates[id]) dates[id] = {};
  dates[id].salida = fecha;
  localStorage.setItem('app_auxilios_dates', JSON.stringify(dates));
}

function saveAuxilioLlegada(id: string, fecha: string) {
  const dates = getAuxiliosDates();
  if (!dates[id]) dates[id] = {};
  dates[id].llegada = fecha;
  localStorage.setItem('app_auxilios_dates', JSON.stringify(dates));
}
`;

content = content.replace("export default function ControlGarita() {", helpers + "\nexport default function ControlGarita() {");

// 2. Add new states
content = content.replace(
  "const [auxiliosList, setAuxiliosList] = useState<any[]>([]);",
  "const [salidasAuxiliosList, setSalidasAuxiliosList] = useState<any[]>([]);\n  const [llegadasAuxiliosList, setLlegadasAuxiliosList] = useState<any[]>([]);"
);

// 3. Update data fetching logic
const oldFetchLogic = `
          const lastWeekDate = new Date(new Date(fecha).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const { data: auxRes } = await supabase.from('auxilios').select('*').gte('fecha', lastWeekDate).lte('fecha', fecha);
          if (auxRes) {
            const filteredAux = auxRes.filter((aux: any) => {
              if (aux.fecha === fecha) return true;
              let arrived = false;
              let d = new Date(aux.fecha + "T00:00:00");
              const end = new Date(fecha + "T00:00:00");
              while (d < end) { // Check dates STRICTLY BEFORE the currently viewed date
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
          }
`;

const newFetchLogic = `
          // Expand window to 30 days to ensure we don't miss open auxilios
          const last30Days = new Date(new Date(fecha).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const { data: auxRes } = await supabase.from('auxilios').select('*').gte('fecha', last30Days).lte('fecha', fecha);
          if (auxRes) {
            const auxDates = getAuxiliosDates();
            
            const salidasAux = auxRes.filter((aux: any) => {
               const dates = auxDates[aux.id || aux.created_at] || {};
               const departureDate = dates.salida || aux.fecha;
               
               if (!aux.hora_salida_mecanico && !aux.hora_salida_asistencia) {
                  return aux.fecha <= fecha;
               }
               return departureDate === fecha;
            });
            
            const llegadasAux = auxRes.filter((aux: any) => {
               const dates = auxDates[aux.id || aux.created_at] || {};
               const arrivalDate = dates.llegada || dates.salida || aux.fecha;
               const departureDate = dates.salida || aux.fecha;
               
               if (!aux.hora_llegada_mecanico && !aux.hora_llegada_asistencia) {
                  return departureDate <= fecha; 
               }
               return arrivalDate === fecha;
            });
            
            setSalidasAuxiliosList(salidasAux);
            setLlegadasAuxiliosList(llegadasAux);
          }
`;

content = content.replace(oldFetchLogic.trim(), newFetchLogic.trim());

// 4. Update the "Salidas" table mappings (auxiliosList -> salidasAuxiliosList)
// But only for the Salidas tab! We need to be careful.
// Let's manually replace in the file where activeTab === 'salidas' and activeTab === 'llegadas'

fs.writeFileSync('src/pages/ControlGarita.tsx', content);

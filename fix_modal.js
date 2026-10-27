import fs from 'fs';

let content = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf-8');

// Update the modal's save button to record the salida if it has a departure time
const oldSaveModal = "setSalidasAuxiliosList(prev => prev.map(a => a.id === activeAuxilioForModal.id ? activeAuxilioForModal : a)); setLlegadasAuxiliosList(prev => prev.map(a => a.id === activeAuxilioForModal.id ? activeAuxilioForModal : a));";
const newSaveModal = "setSalidasAuxiliosList(prev => prev.map(a => a.id === activeAuxilioForModal.id ? activeAuxilioForModal : a)); setLlegadasAuxiliosList(prev => prev.map(a => a.id === activeAuxilioForModal.id ? activeAuxilioForModal : a));\n                  if (activeAuxilioForModal.hora_salida_mecanico || activeAuxilioForModal.hora_salida_asistencia) {\n                    saveAuxilioSalida(activeAuxilioForModal.id || activeAuxilioForModal.created_at, fecha);\n                  }";

content = content.replace(oldSaveModal, newSaveModal);

fs.writeFileSync('src/pages/ControlGarita.tsx', content);

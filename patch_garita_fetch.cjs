const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

const oldMec = `          const { data } = await supabase.from('control_mecanico').select('id_unidad, id_turno').eq('fecha', fecha);`;
const newMec = `          const { data } = await supabase.from('control_mecanico').select('id_unidad, id_turno, turnos(cod_turno)').eq('fecha', fecha);`;

const oldMecLoop = `      mecRes.forEach(m => {
        mMap[\`\${m.id_unidad}_\${m.id_turno}\`] = true;
        if (m.id_unidad) anyMec[m.id_unidad] = true;
      });`;
const newMecLoop = `      mecRes.forEach(m => {
        mMap[\`\${m.id_unidad}_\${m.id_turno}\`] = true;
        const cTurno = m.turnos?.cod_turno;
        if (cTurno) anyMec[cTurno] = true;
      });`;

const oldChk = `          const { data } = await supabase.from('controles').select('id_unidad, id_turno, flu_agua').eq('fecha', fecha);`;
const newChk = `          const { data } = await supabase.from('controles').select('id_unidad, id_turno, flu_agua, turnos(cod_turno)').eq('fecha', fecha);`;

const oldChkLoop = `      chkRes.forEach(c => {
        cMap[\`\${c.id_unidad}_\${c.id_turno}\`] = true;
        if (c.id_unidad) anyChk[c.id_unidad] = true;
      });`;
const newChkLoop = `      chkRes.forEach(c => {
        cMap[\`\${c.id_unidad}_\${c.id_turno}\`] = true;
        const cTurno = c.turnos?.cod_turno;
        if (cTurno) anyChk[cTurno] = true;
      });`;

code = code.replace(oldMec, newMec);
code = code.replace(oldMecLoop, newMecLoop);
code = code.replace(oldChk, newChk);
code = code.replace(oldChkLoop, newChkLoop);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

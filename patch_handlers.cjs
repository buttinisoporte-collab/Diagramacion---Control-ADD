const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

code = code.replace(
    /const handleMarcarPresente = async \(t: any, customTime\?: string\) => \{/,
    "const handleMarcarPresente = async (t: any, customTime?: string) => {\n    if (!canEdit) return;"
);

code = code.replace(
    /const handleMarcarSalida = async \(t: any, customTime\?: string\) => \{/,
    "const handleMarcarSalida = async (t: any, customTime?: string) => {\n    if (!canEdit) return;"
);

code = code.replace(
    /const handleLlegada = async \(t: any, timeValue: string\) => \{/,
    "const handleLlegada = async (t: any, timeValue: string) => {\n    if (!canEdit) return;"
);

code = code.replace(
    /const handleAuxilioLlegada = async \(id: string, timeValue: string\) => \{/,
    "const handleAuxilioLlegada = async (id: string, timeValue: string) => {\n    if (!canEdit) return;"
);

// We should also disable the buttons if they don't meet the conditions:
// AUSENTE - MARCAR button
code = code.replace(
    /onClick=\{\(\) => handleMarcarPresente\(t\)\} \n\s*className=\{\`px-3 py-1 border rounded text-\[10px\] font-bold uppercase transition-colors \$\{\(\!isRowReady \|\| \!canEdit\) \? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50' : 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200'\}\`\}/,
    `disabled={!isRowReady || !canEdit}\n                                  onClick={() => handleMarcarPresente(t)} \n                                  className={\`px-3 py-1 border rounded text-[10px] font-bold uppercase transition-colors \${(!isRowReady || !canEdit) ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50' : 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200'}\`}`
);

// MARCAR SALIDA button
code = code.replace(
    /onClick=\{\(\) => handleMarcarSalida\(t\)\} \n\s*className=\{\`px-3 py-1 border rounded text-\[10px\] font-bold uppercase transition-colors \$\{\(\!pres \|\| \!canEdit\) \? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'\}\`\}/,
    `disabled={!pres || !canEdit}\n                                  onClick={() => handleMarcarSalida(t)} \n                                  className={\`px-3 py-1 border rounded text-[10px] font-bold uppercase transition-colors \${(!pres || !canEdit) ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'}\`}`
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

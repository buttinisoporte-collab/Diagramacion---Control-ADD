const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

const formatTimeShort = `const formatTime = (timeStr?: string) => {
  if (!timeStr) return '-';
  const parts = timeStr.split(':');
  if (parts.length >= 2) return parts[0] + ':' + parts[1];
  return timeStr;
};`;

if (!code.includes('const formatTime =')) {
    code = code.replace("export default function ControlGarita() {", formatTimeShort + "\n\nexport default function ControlGarita() {");
}

code = code.replace(
  /\{t\.hora_presentacion \|\| '-'\}/g,
  "{formatTime(t.hora_presentacion)}"
);
code = code.replace(
  /\{t\.hora_salida_base \|\| '-'\}/g,
  "{formatTime(t.hora_salida_base)}"
);
code = code.replace(
  /\{t\.hora_inicio \|\| '-'\}/g,
  "{formatTime(t.hora_inicio)}"
);
code = code.replace(
  /\{t\.hora_llegada_base \|\| '-'\}/g,
  "{formatTime(t.hora_llegada_base)}"
);

code = code.replace(
  /\{v\.hora_llegada_verificacion\}\s*hs/g,
  "{formatTime(v.hora_llegada_verificacion)} hs"
);

code = code.replace(
  /<td className="px-4 py-3 font-bold text-slate-700">\{t\.cod_turno\}<\/td>/g,
  '<td className="px-2 py-1.5"><div className="flex flex-col"><span className="font-bold text-slate-900">{t.cod_turno}</span>{t.turno_label && t.turno_label !== t.cod_turno && (<span className="text-[10px] text-slate-500 font-medium leading-tight">{t.turno_label}</span>)}</div></td>'
);

code = code.replace(
  /<td className="px-4 py-3">\s*<span className="font-bold text-slate-900">\{t\.cod_turno\}<\/span>\s*<\/td>/g,
  '<td className="px-2 py-1.5"><div className="flex flex-col"><span className="font-bold text-slate-900">{t.cod_turno}</span>{t.turno_label && t.turno_label !== t.cod_turno && (<span className="text-[10px] text-slate-500 font-medium leading-tight">{t.turno_label}</span>)}</div></td>'
);

code = code.replace(/px-4 py-3/g, "px-2 py-1.5 text-xs");
code = code.replace(/px-4 py-2/g, "px-2 py-1.5 text-xs");

// Let's also adjust padding and margins in the top bar
code = code.replace(
  /className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4"/g,
  'className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2"'
);

code = code.replace(
  /className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center z-10 flex-shrink-0"/g,
  'className="bg-white border-b border-slate-200 px-4 py-2 flex flex-col md:flex-row gap-3 justify-between items-center z-10 flex-shrink-0"'
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

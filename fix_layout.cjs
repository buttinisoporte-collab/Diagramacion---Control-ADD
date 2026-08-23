const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// Top layout: <div className="flex flex-col flex-1 min-h-0 bg-slate-50 p-3"> -> ok
// Inside: 
// <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-col md:flex-row gap-3 justify-between items-center z-10 flex-shrink-0">
code = code.replace(
  'className="bg-white border-b border-slate-200 px-4 py-2 flex flex-col md:flex-row gap-3 justify-between items-center z-10 flex-shrink-0"',
  'className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex flex-col md:flex-row gap-3 justify-between items-center z-10 flex-shrink-0 shadow-sm mb-3"'
);

// We need to also remove the main page header to save space if it's there. 
// Right now it mounts: <Header title="Control Garita" subtitle="CONSOLIDACIÓN DE GARITA" />
// We can leave it but make sure the container doesn't overflow. The screen height uses `flex flex-col flex-1 min-h-0`.

// Turnos container
code = code.replace(
  /className="flex flex-col flex-1 min-h-0 space-y-6"/g,
  'className="flex flex-col flex-1 min-h-0 space-y-3"'
);

code = code.replace(
  /className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col flex-1 min-h-\[400px\]"/g,
  'className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col flex-1 min-h-[200px]"'
);

code = code.replace(
  /className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col flex-1 min-h-\[300px\]"/g,
  'className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col flex-1 min-h-[200px]"'
);

// Auxilios panels compacting
code = code.replace(
  /className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0"/g,
  'className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0"'
);

code = code.replace(
  /className="bg-white border border-slate-200 rounded-lg p-4"/g,
  'className="bg-white border border-slate-200 rounded-lg p-3"'
);

code = code.replace(
  /border-b pb-2 mb-2/g,
  'border-b pb-1.5 mb-1.5'
);

// The time format function
// Let's refine formatTime to just take the "HH:mm" from a full Date if provided, or from string.
const newFormatTime = `const formatTime = (timeStr?: string) => {
  if (!timeStr) return '-';
  const parts = timeStr.split(':');
  if (parts.length >= 2) return parts[0] + ':' + parts[1];
  return timeStr;
};`;
// already there

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// 1. Add turnosBaseAyer state
code = code.replace(
  "const [turnosBase, setTurnosBase] = useState<any[]>([]);",
  "const [turnosBase, setTurnosBase] = useState<any[]>([]);\n  const [turnosBaseAyer, setTurnosBaseAyer] = useState<any[]>([]);"
);

// 2. Fix the useMemo for filteredTurnos to include unidad, and create filteredTurnosLlegadas
code = code.replace(
  /const filteredTurnos = useMemo\(\(\) => \{\s*return turnosBase\.filter\(t => \{\s*const search = searchTerm\.toLowerCase\(\);\s*return \(t\.cod_turno\?\.toLowerCase\(\)\.includes\(search\)\) \|\|\s*\(t\.conductor_principal\?\.toLowerCase\(\)\.includes\(search\)\) \|\|\s*\(t\.turno_label\?\.toLowerCase\(\)\.includes\(search\)\);\s*\}\);\s*\}, \[turnosBase, searchTerm\]\);/,
  `const filteredTurnos = useMemo(() => {
    return turnosBase.filter(t => {
      const search = searchTerm.toLowerCase();
      return (t.cod_turno?.toLowerCase().includes(search)) || 
             (t.conductor_principal?.toLowerCase().includes(search)) ||
             (t.unidad?.toLowerCase().includes(search)) ||
             (t.turno_label?.toLowerCase().includes(search));
    });
  }, [turnosBase, searchTerm]);

  const filteredTurnosLlegadas = useMemo(() => {
    return [...turnosBaseAyer, ...turnosBase].filter(t => {
      const search = searchTerm.toLowerCase();
      return (t.cod_turno?.toLowerCase().includes(search)) || 
             (t.conductor_principal?.toLowerCase().includes(search)) ||
             (t.unidad?.toLowerCase().includes(search)) ||
             (t.turno_label?.toLowerCase().includes(search));
    }).sort((a, b) => {
      const hA = a.hora_llegada_base || a.hora_llegada_verificacion || '';
      const hB = b.hora_llegada_base || b.hora_llegada_verificacion || '';
      return hA.localeCompare(hB);
    });
  }, [turnosBase, turnosBaseAyer, searchTerm]);`
);

// 3. Render filteredTurnosLlegadas in the Llegadas tab instead of filteredTurnos
code = code.replace(
  /\{activeTab === 'llegadas' && \(\s*<div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-shrink-0">\s*<div className="overflow-x-auto">\s*<table className="w-full text-sm text-left whitespace-nowrap">\s*<thead className="bg-slate-50 text-slate-500 uppercase text-\[10px\] font-bold">\s*<tr>([\s\S]*?)<\/thead>\s*<tbody>\s*\{filteredTurnos\.map\(t => \{/,
  `{activeTab === 'llegadas' && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-shrink-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>$1</thead>
                  <tbody>
                    {filteredTurnosLlegadas.map(t => {`
);

// 4. In Llegadas rendering, display previous date if t.isYesterday
// Replace {t.hora_salida_base || '-'} with logic
code = code.replace(
  /<td className="px-2 py-1.5 text-xs">\{t\.hora_salida_base \|\| '-'\}/g,
  '<td className="px-2 py-1.5 text-xs">{t.isYesterday && t.fecha_salida ? `${t.fecha_salida.split("-")[2]}/${t.fecha_salida.split("-")[1]} ` : ""}{t.hora_salida_base || "-"}'
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);

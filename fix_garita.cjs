const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// Import Printer
code = code.replace("import Header from '../components/Header';", "import Header from '../components/Header';\nimport { Printer } from 'lucide-react';");

// Fetch conductores
const loadDataOld = `const { data: turnosRes } = await supabase.from('turnos').select('*').in('queda_fuera', ['No', 'no', 'NO']);
      if (!turnosRes || !diagRes) { setIsLoading(false); return; }`;

const loadDataNew = `const { data: turnosRes } = await supabase.from('turnos').select('*').ilike('salida', '%BASE%');
      const { data: conductRes } = await supabase.from('nomina_conductores').select('apellido_nombre, legajo');
      
      const legajoMap: Record<string, string> = {};
      if (conductRes) {
        conductRes.forEach(c => {
          legajoMap[c.apellido_nombre] = c.legajo;
        });
      }
      
      if (!turnosRes || !diagRes) { setIsLoading(false); return; }`;

code = code.replace(loadDataOld, loadDataNew);

// Map turnos
const enrichOld = `          unidad_id: d.unidad ? flotaMap[d.unidad] : undefined,
          hora_presentacion: t?.hora_presentacion,
          hora_salida_base: t?.hora_salida_base
        };`;

const enrichNew = `          unidad_id: d.unidad ? flotaMap[d.unidad] : undefined,
          hora_presentacion: t?.hora_presentacion,
          hora_salida_base: t?.hora_salida_base,
          hora_inicio: t?.hora_inicio,
          hora_fin: t?.hora_fin,
          hora_llegada_base: t?.hora_llegada_base,
          turno_label: t?.turno,
          legajo: d.conductor_principal ? legajoMap[d.conductor_principal] : ''
        };`;
        
code = code.replace(enrichOld, enrichNew);

// Add Print button to header
const headerOld = `<Header title="Control Garita" subtitle="Consolidación de Salidas" />`;
const headerNew = `<Header title="Control Garita" subtitle="Consolidación de Salidas">
        <button
          onClick={() => window.print()}
          className="print:hidden flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Imprimir Planilla</span>
        </button>
      </Header>`;
      
code = code.replace(headerOld, headerNew);

// Add print wrapper to UI
code = code.replace('<div className="flex-1 p-6 overflow-y-auto bg-slate-50">', '<div className="flex-1 p-6 overflow-y-auto bg-slate-50 print:hidden">');

// Add printable area at the bottom
const endDivs = `      </div>\n    </>\n  );\n}`;
const printArea = `      </div>

      {/* Printable Area */}
      <div className="hidden print:block absolute inset-0 bg-white p-4">
        <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-2">
          <div className="w-32"><img src="https://i.ibb.co/68Z4rN8/logo.png" alt="Logo" className="w-full" style={{ filter: 'grayscale(100%)' }} /></div>
          <h1 className="text-xl font-bold uppercase tracking-wider">Registro de Presentación Diaria de Conductores</h1>
          <div className="w-32 text-right text-xs">
            <p className="font-bold">AÑO {fecha.substring(0,4)}</p>
            <p className="font-bold">REVISIÓN 1</p>
          </div>
        </div>
        <div className="flex justify-between mb-4 text-sm font-bold uppercase">
          <div>DIA HÁBIL / SÁBADO / DOMINGO</div>
          <div>FECHA: {fecha.split('-').reverse().join('/')}</div>
        </div>
        <table className="w-full text-[10px] border-collapse border border-black text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-black p-1 w-24">CHOFER</th>
              <th className="border border-black p-1 w-12">LEGAJO</th>
              <th className="border border-black p-1 w-16">HORARIO DE PRESENTACION</th>
              <th className="border border-black p-1 w-20">PRESENTACION REAL</th>
              <th className="border border-black p-1 w-16">HORARIO SALIDA BASE</th>
              <th className="border border-black p-1 w-16">HORA SALIDA TERMINAL</th>
              <th className="border border-black p-1 w-12">COCHE</th>
              <th className="border border-black p-1">SERVICIO / TURNO</th>
              <th className="border border-black p-1 w-16">FIRMA CHOFER</th>
              <th className="border border-black p-1 w-16">HORARIO FIN DE SERVICIO</th>
              <th className="border border-black p-1 w-16">HORARIO REGRESO A BASE APROX.</th>
              <th className="border border-black p-1 w-20">HORARIO REGRESO A BASE REAL</th>
              <th className="border border-black p-1 w-16">FIRMA GARITA</th>
            </tr>
          </thead>
          <tbody>
            {filteredTurnos.map(t => (
              <tr key={t.cod_turno} className="h-8">
                <td className="border border-black p-1 font-bold whitespace-nowrap overflow-hidden text-ellipsis text-left">{t.conductor_principal}</td>
                <td className="border border-black p-1 font-bold">{t.legajo}</td>
                <td className="border border-black p-1">{t.hora_presentacion}</td>
                <td className="border border-black p-1">{presentacionMap[t.cod_turno] || ''}</td>
                <td className="border border-black p-1">{t.hora_salida_base}</td>
                <td className="border border-black p-1">{t.hora_inicio}</td>
                <td className="border border-black p-1 font-bold">{t.unidad}</td>
                <td className="border border-black p-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{t.cod_turno} {t.turno_label}</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1">{t.hora_fin}</td>
                <td className="border border-black p-1">{t.hora_llegada_base}</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}`;

code = code.replace(endDivs, printArea);
fs.writeFileSync('src/pages/ControlGarita.tsx', code);

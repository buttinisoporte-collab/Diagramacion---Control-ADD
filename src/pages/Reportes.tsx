import Header from '../components/Header';

export default function Reportes() {
  return (
    <>
      <Header title="Reporte Diario" subtitle="Nivel de Fluidos y Aceites">
        <button className="px-4 py-2 text-sm font-bold bg-white border border-slate-300 rounded hover:bg-slate-50">Imprimir Reporte</button>
      </Header>
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-lg shadow-sm">
           <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                 <h3 className="text-lg font-bold text-slate-800">Reporte de Controles</h3>
                 <p className="text-sm text-slate-500">Filtrar por fecha</p>
              </div>
              <input type="date" defaultValue="2026-05-24" className="border border-slate-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500" />
           </div>

           <div className="p-8 space-y-8 font-mono text-sm text-slate-800">
              <h2 className="text-xl font-bold uppercase tracking-widest text-center border-b border-slate-300 pb-4">Nivel de Fluidos y Aceites</h2>
              
              <div className="space-y-4 font-bold">
                 <p>1- CONTROL DE ACEITE DE MOTOR</p>
                 <p>2- CONTROL DE NIVEL DE LÍQUIDO REFRIGERANTE</p>
                 <p>3- CONTROL DE LÍQUIDO DE DIRECCIÓN HIDRÁULICA</p>
                 <p>4- CONTROL DE LÍQUIDO DE FRENOS / EMBRAGUE</p>
              </div>

              <div className="pt-8 border-t border-slate-200">
                 <p className="font-bold mb-4 uppercase">Unidades a inspeccionar (Mecánico matutino):</p>
                 <p className="leading-relaxed">
                   L540-01, L540-02, L540-08, L540-12, L540-19, L540-22
                 </p>
              </div>
              
              <div className="pt-8 border-t border-slate-200">
                 <p className="font-bold mb-4 uppercase">Unidades Reportadas por Conductores (Novedades):</p>
                 <p className="leading-relaxed text-red-600">
                   L540-05 (Aceite bajo - Requiere revisión)
                 </p>
              </div>
           </div>
        </div>
      </div>
    </>
  );
}

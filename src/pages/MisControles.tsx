import Header from '../components/Header';

export default function MisControles() {
  return (
    <>
      <Header title="Mis Controles" subtitle="Mecánico" />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-slate-200 flex items-center space-x-3 bg-slate-50 rounded-t-lg">
            <span className="text-2xl">📋</span>
            <h3 className="text-lg font-bold text-slate-800">Últimos Chequeos - Arabena, Javier Antonio</h3>
          </div>
          <div className="p-0">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                 <tr>
                   <th className="px-6 py-4 border-b border-slate-200">Fecha</th>
                   <th className="px-6 py-4 border-b border-slate-200">Hora</th>
                   <th className="px-6 py-4 border-b border-slate-200">Unidad</th>
                   <th className="px-6 py-4 border-b border-slate-200">Obs</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {[1, 2, 3, 4, 5].map((i) => (
                   <tr key={i} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4 font-mono font-bold">24/05/2026</td>
                     <td className="px-6 py-4 font-mono">05:1{i} a.m.</td>
                     <td className="px-6 py-4 font-bold text-slate-700">540-0{i}</td>
                     <td className="px-6 py-4 text-slate-500 italic">Sin novedades</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </>
  );
}

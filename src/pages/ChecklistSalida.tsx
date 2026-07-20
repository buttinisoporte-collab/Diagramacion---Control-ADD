import Header from '../components/Header';

export default function ChecklistSalida() {
  return (
    <>
      <Header title="Checklist de Salida" subtitle="Conductor">
        <button 
          onClick={() => window.open('http://buttini.sgm.lym.com.ar/Account/Login', '_blank')}
          className="px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Solicitud de OT
        </button>
        <button className="px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded">Firmar en Conformidad</button>
      </Header>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 rounded-t-lg">
             <div>
               <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Fecha</label>
               <div className="font-mono text-sm font-bold">24/05/2026</div>
             </div>
             <div>
               <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Hora</label>
               <div className="font-mono text-sm font-bold">06:45</div>
             </div>
             <div>
               <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Unidad N°</label>
               <div className="font-bold text-sm">540-12</div>
             </div>
             <div>
               <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Turno</label>
               <div className="font-bold text-sm">T-1025</div>
             </div>
          </div>
          
          <div className="p-6">
             <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Fluidos (Verificación ocular)</h4>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
               {['Agua / Refrigerante', 'Aceite del motor', 'Combustible', 'Hidráulico', 'Frenos'].map((item) => (
                 <div key={item} className="flex items-center justify-between p-3 border border-slate-200 rounded bg-slate-50">
                    <span className="text-xs font-bold text-slate-700">{item}</span>
                    <div className="flex space-x-2">
                       <button className="w-8 h-8 rounded border border-slate-300 flex items-center justify-center text-slate-400 hover:border-green-500 hover:text-green-500">✓</button>
                       <button className="w-8 h-8 rounded border border-slate-300 flex items-center justify-center text-slate-400 hover:border-red-500 hover:text-red-500">✗</button>
                    </div>
                 </div>
               ))}
             </div>

             <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Seguridad y Equipamiento</h4>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
               {['Martillos', 'Cinturón de seguridad', 'Matafuego', 'Luces internas', 'Luces externas', 'Luces frenos', 'Luces giros', 'Calefacción / A-C', 'Micronauta / SUBE', 'Documentación'].map((item) => (
                 <div key={item} className="flex items-center justify-between p-3 border border-slate-200 rounded bg-slate-50">
                    <span className="text-xs font-bold text-slate-700">{item}</span>
                    <div className="flex space-x-2">
                       <button className="w-8 h-8 rounded border border-slate-300 flex items-center justify-center text-slate-400 hover:border-green-500 hover:text-green-500">✓</button>
                       <button className="w-8 h-8 rounded border border-slate-300 flex items-center justify-center text-slate-400 hover:border-red-500 hover:text-red-500">✗</button>
                    </div>
                 </div>
               ))}
             </div>

             <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Observaciones Generales</label>
                <textarea className="w-full border border-slate-300 rounded p-3 text-sm focus:outline-none focus:border-blue-500" rows={4} placeholder="Detalle cualquier novedad..."></textarea>
             </div>
             
             <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800 font-medium">
               En caso de necesidad de cargar solicitud de trabajo a mantenimiento, luego de que termine de realizar en el sistema, regrese a esta pantalla y finalice el check list.
             </div>
          </div>
        </div>
      </div>
    </>
  );
}

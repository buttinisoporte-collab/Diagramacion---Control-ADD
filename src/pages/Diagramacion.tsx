import Header from '../components/Header';

export default function Diagramacion() {
  return (
    <>
      <Header title="Diagramación" subtitle="Turnos del Día">
        <button className="px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded">Guardar Cambios</button>
      </Header>
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800">Asignación de Turnos</h3>
            <p className="text-sm text-slate-500">Asigne conductores y unidades a los turnos del día evitando superposiciones.</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-mono text-sm font-bold text-slate-900">TURNO-{1000 + i}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">Urbano</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Unidad</label>
                      <select className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm">
                        <option>Seleccionar unidad...</option>
                        <option>540-01</option>
                        <option>540-02</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Conductor Principal</label>
                      <select className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm">
                        <option>Seleccionar conductor...</option>
                        <option>Mendoza, Sebastian</option>
                        <option>Gomez, Facundo</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

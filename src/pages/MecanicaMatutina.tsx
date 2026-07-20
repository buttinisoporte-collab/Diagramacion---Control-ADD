import Header from '../components/Header';

export default function MecanicaMatutina() {
  return (
    <>
      <Header title="Diagramación de Mecánicos" subtitle="Control Matutino">
        <button className="px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded">Asignar Mecánicos</button>
      </Header>
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 max-w-3xl mx-auto">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Asignación para fluidos matutinos</h3>
          <p className="text-sm text-slate-500 mb-6">Asigne mecánicos a los turnos que salen antes de las 07:00 AM.</p>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                <div className="w-24 font-mono text-sm font-bold text-slate-900">05:30 AM</div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-slate-700">Turno {1000 + i} - Unidad 540-0{i}</span>
                </div>
                <div className="w-64">
                  <select className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm">
                    <option>Asignar mecánico...</option>
                    <option>Arabena, Javier Antonio</option>
                    <option>García, Luis</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

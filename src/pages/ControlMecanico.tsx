import Header from '../components/Header';
import { useState } from 'react';

export default function ControlMecanico() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 w-96 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-6">Acceso Mecánicos</h2>
          <div className="space-y-4">
            <select className="w-full bg-slate-50 border border-slate-300 rounded px-4 py-3 text-sm focus:outline-none focus:border-blue-500">
              <option>Seleccione su Nombre...</option>
              <option>Arabena, Javier Antonio</option>
              <option>García, Luis</option>
            </select>
            <input 
              type="password" 
              placeholder="Ingrese contraseña" 
              className="w-full bg-slate-50 border border-slate-300 rounded px-4 py-3 text-sm focus:outline-none focus:border-blue-500" 
            />
            <button 
              onClick={() => setIsAuthenticated(true)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors"
            >
              INGRESAR
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header title="Control Mecánico" subtitle="Fluidos Matutinos">
        <button 
          onClick={() => window.open('http://buttini.sgm.lym.com.ar/Account/Login', '_blank')}
          className="px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Guardar y Solicitar O.T.
        </button>
        <button className="px-4 py-2 text-sm font-bold bg-green-600 text-white rounded hover:bg-green-700 transition-colors">Guardar Chequeo</button>
      </Header>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-lg shadow-sm">
           <div className="p-6 border-b border-slate-200 bg-slate-50">
             <div className="flex items-center space-x-2 text-slate-700 font-bold mb-6 justify-center">
                <span className="text-xl">🔧</span>
                <span className="text-lg">Chequeo: 090 - ARABENA, JAVIER ANTONIO</span>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                   <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Fecha</label>
                   <input type="text" value="24/05/2026" readOnly className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm font-mono" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Hora</label>
                   <input type="text" value="05:11 a.m." readOnly className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm font-mono" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Unidad (INT)</label>
                   <select className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm font-bold">
                     <option>Seleccione...</option>
                     <option>540-01 (Turno 1024)</option>
                     <option>540-08 (Turno 1026)</option>
                   </select>
                </div>
             </div>
           </div>

           <div className="p-6">
             <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">Indique niveles (1=Bajo ... 5=Óptimo)</p>
             <div className="space-y-6">
                {['Agua', 'Aceite', 'Combustible', 'Hidráulico', 'Frenos'].map((fluido) => (
                  <div key={fluido}>
                    <label className="block text-sm font-bold text-slate-800 mb-2">{fluido}</label>
                    <div className="flex space-x-2">
                       {[1, 2, 3, 4, 5].map((level) => (
                          <button key={level} className="flex-1 py-3 bg-slate-100 hover:bg-blue-100 focus:bg-blue-600 focus:text-white border border-slate-200 rounded font-bold text-slate-600 transition-colors">
                            {level}
                          </button>
                       ))}
                    </div>
                  </div>
                ))}
             </div>
             
             <div className="mt-8">
                <label className="block text-sm font-bold text-slate-800 mb-2">Observaciones</label>
                <textarea className="w-full border border-slate-300 rounded p-4 text-sm focus:outline-none focus:border-blue-500 bg-slate-50" rows={4} placeholder="Detalle trabajos realizados o pendientes..."></textarea>
             </div>
           </div>
        </div>
      </div>
    </>
  );
}

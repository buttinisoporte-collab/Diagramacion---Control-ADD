import Header from '../components/Header';
import { useState } from 'react';

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState('usuarios');

  return (
    <>
      <Header title="Configuración y ABM" subtitle="Administrador">
        <button className="px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded">Guardar Cambios</button>
      </Header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sub-sidebar for settings */}
        <div className="w-64 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-3">Gestión de Datos</div>
            <nav className="space-y-1">
              {['Usuarios', 'Nómina Conductores', 'Nómina Mecánicos', 'Flota Activa', 'Temporadas', 'Turnos', 'Feriados', 'Ajustes Generales'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.toLowerCase() ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main settings content */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center">
               <h3 className="text-lg font-bold text-slate-800 capitalize">{activeTab}</h3>
               <button className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors">
                 + Agregar Nuevo
               </button>
             </div>
             
             {activeTab === 'ajustes generales' ? (
                <div className="p-8 max-w-xl">
                  <label className="block text-sm font-bold text-slate-800 mb-2">Logo de la Empresa</label>
                  <div className="flex items-center space-x-4 mb-6">
                     <div className="w-24 h-24 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                        <span className="text-sm text-slate-400">Logo</span>
                     </div>
                     <button className="px-4 py-2 bg-white border border-slate-300 rounded text-sm font-bold hover:bg-slate-50">Cambiar Imagen</button>
                  </div>
                  
                  <label className="block text-sm font-bold text-slate-800 mb-2">Nombre de la Empresa</label>
                  <input type="text" defaultValue="Transportes Buttini" className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none mb-6" />
                </div>
             ) : (
               <div className="p-0">
                 <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-center justify-between">
                    <span className="text-xs text-amber-800 font-bold">💡 Puede pegar datos directamente desde un Excel aquí. (Seleccione la tabla y presione Ctrl+V)</span>
                    <button className="text-xs text-blue-600 font-bold hover:underline">Importar CSV</button>
                 </div>
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                     <tr>
                       <th className="px-6 py-4 border-b border-slate-200">ID</th>
                       <th className="px-6 py-4 border-b border-slate-200">Nombre / Detalle</th>
                       <th className="px-6 py-4 border-b border-slate-200">Estado</th>
                       <th className="px-6 py-4 border-b border-slate-200 text-right">Acciones</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {[1, 2, 3].map((i) => (
                       <tr key={i} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 font-mono font-bold text-slate-500">#{1000 + i}</td>
                         <td className="px-6 py-4 font-bold text-slate-800">Registro Ejemplo {i}</td>
                         <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Activo</span></td>
                         <td className="px-6 py-4 text-right">
                           <button className="text-blue-600 hover:underline text-xs font-bold mr-3">Editar</button>
                           <button className="text-red-600 hover:underline text-xs font-bold">Eliminar</button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        </div>
      </div>
    </>
  );
}

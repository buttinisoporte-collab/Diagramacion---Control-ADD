import Header from '../components/Header';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TABS = ['Usuarios', 'Nómina Conductores', 'Nómina Mecánicos', 'Flota Activa', 'Temporadas', 'Turnos', 'Feriados', 'Ajustes Generales'];

const TABLE_MAP: Record<string, string> = {
  'usuarios': 'usuarios',
  'nómina conductores': 'nomina_conductores',
  'nómina mecánicos': 'nomina_mecanicos',
  'flota activa': 'flota_activa',
  'temporadas': 'temporadas',
  'turnos': 'turnos',
  'feriados': 'feriados'
};

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState('Usuarios');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const tableName = TABLE_MAP[activeTab.toLowerCase()];

  useEffect(() => {
    if (tableName) {
      fetchData();
      setIsPasting(false);
      setPasteText('');
    }
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    const { data: result, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: false });
    if (!error && result) {
      setData(result);
    } else {
      setData([]);
    }
    setLoading(false);
  }

  async function handleDelete(idField: string, id: string) {
    if (!window.confirm('¿Eliminar este registro permanentemente?')) return;
    const { error } = await supabase.from(tableName).delete().eq(idField, id);
    if (error) alert('Error: ' + error.message);
    else fetchData();
  }

  async function handleImportExcel() {
    if (!pasteText.trim()) return;
    
    // Parseado básico de TSV (Formato por defecto al copiar desde Excel)
    const rows = pasteText.split('\n').map(r => r.split('\t').map(c => c.trim()));
    if (rows.length < 2) {
        alert('Formato inválido. Asegúrese de incluir encabezados en la primera fila (que coincidan con la BD) y al menos una fila de datos.');
        return;
    }
    
    const headers = rows[0];
    const inserts = [];
    for (let i = 1; i < rows.length; i++) {
        if (rows[i].join('') === '') continue; // Ignorar filas vacías
        const obj: any = {};
        headers.forEach((h, idx) => {
            const val = rows[i][idx];
            if (val && val !== '') {
                // Supabase espera los nombres de las columnas exactos
                obj[h.toLowerCase()] = val;
            }
        });
        if (Object.keys(obj).length > 0) inserts.push(obj);
    }

    if (inserts.length > 0) {
        setLoading(true);
        const { error } = await supabase.from(tableName).insert(inserts);
        setLoading(false);
        if (error) {
            alert('Error al importar: ' + error.message);
        } else {
            alert('Datos importados correctamente.');
            fetchData();
            setIsPasting(false);
            setPasteText('');
        }
    }
  }

  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'created_at') : [];
  const primaryKey = columns.length > 0 ? columns[0] : 'id';

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
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
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
               {activeTab !== 'Ajustes Generales' && (
                 <div className="flex space-x-3">
                   <button 
                     onClick={() => setIsPasting(!isPasting)}
                     className="px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-bold rounded border border-amber-200 hover:bg-amber-200 transition-colors flex items-center space-x-2"
                   >
                     <span>📋</span>
                     <span>{isPasting ? 'Cancelar Pegado' : 'Pegar desde Excel'}</span>
                   </button>
                   <button className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors">
                     + Agregar Nuevo
                   </button>
                 </div>
               )}
             </div>
             
             {activeTab === 'Ajustes Generales' ? (
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
                 {isPasting && (
                   <div className="p-6 bg-slate-50 border-b border-slate-200">
                      <div className="mb-4 text-sm text-slate-600 bg-white p-4 rounded border border-slate-200">
                        <p className="font-bold mb-1 text-slate-800">Instrucciones para pegar desde Excel:</p>
                        <ul className="list-disc pl-5 space-y-1 text-xs">
                          <li>Asegúrese de que la <strong>primera fila</strong> copiada contenga los nombres exactos de las columnas en la base de datos (ej. <code className="bg-slate-100 px-1 rounded">legajo</code>, <code className="bg-slate-100 px-1 rounded">apellido_nombre</code>, <code className="bg-slate-100 px-1 rounded">dni</code>).</li>
                          <li>Copie la tabla desde Excel (Ctrl+C) y péguela en el cuadro de abajo (Ctrl+V).</li>
                        </ul>
                      </div>
                      <textarea 
                         className="w-full h-40 border border-slate-300 rounded p-3 text-sm focus:border-blue-500 font-mono focus:outline-none"
                         placeholder={`legajo\tapellido_nombre\tempresa\tdni\n1010\tJuan Perez\tButtini\t12345678`}
                         value={pasteText}
                         onChange={(e) => setPasteText(e.target.value)}
                      />
                      <div className="mt-3 flex justify-end space-x-3">
                         <button 
                           onClick={handleImportExcel}
                           disabled={loading}
                           className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded shadow disabled:opacity-50 transition-colors"
                         >
                           {loading ? 'Importando...' : 'Importar Datos'}
                         </button>
                      </div>
                   </div>
                 )}

                 <div className="overflow-x-auto relative">
                   {loading && !isPasting ? (
                      <div className="p-8 text-center text-slate-500 font-medium">Cargando datos desde Supabase...</div>
                   ) : data.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 font-medium">
                        <p className="text-4xl mb-3">📁</p>
                        <p>No hay registros en esta tabla.</p>
                        <p className="text-xs mt-1">Utilice "Pegar desde Excel" para cargar datos masivamente.</p>
                      </div>
                   ) : (
                     <table className="w-full text-left text-sm whitespace-nowrap">
                       <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                         <tr>
                           {columns.map(col => (
                             <th key={col} className="px-6 py-4 border-b border-slate-200">{col.replace(/_/g, ' ')}</th>
                           ))}
                           <th className="px-6 py-4 border-b border-slate-200 text-right sticky right-0 bg-slate-50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Acciones</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {data.map((row, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 transition-colors">
                             {columns.map(col => (
                               <td key={col} className="px-6 py-3 font-medium text-slate-700">
                                 {row[col] !== null ? String(row[col]) : '-'}
                               </td>
                             ))}
                             <td className="px-6 py-3 text-right sticky right-0 bg-white shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)] border-b border-slate-100">
                               <button className="text-blue-600 hover:underline text-xs font-bold mr-3">Editar</button>
                               <button 
                                  onClick={() => handleDelete(primaryKey, row[primaryKey])}
                                  className="text-red-600 hover:underline text-xs font-bold"
                               >
                                  Eliminar
                               </button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   )}
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </>
  );
}

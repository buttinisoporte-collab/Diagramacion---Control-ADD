const fs = require('fs');
let code = fs.readFileSync('src/pages/Reportes.tsx', 'utf8');

const imports = `import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';`;

code = code.replace(`import { useState, useEffect } from 'react';\nimport Header from '../components/Header';\nimport { supabase } from '../lib/supabase';`, imports);

const oldHook = `export default function Reportes() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);`;

const newHook = `export default function Reportes() {
  const { hasAccess } = useAuth();
  const [activeReport, setActiveReport] = useState<string>(() => {
    if (hasAccess('Reportes - Mecanica')) return 'mecanica';
    if (hasAccess('Reportes - Presentacion')) return 'presentacion';
    if (hasAccess('Reportes - Operaciones')) return 'operaciones';
    if (hasAccess('Reportes - Generales')) return 'generales';
    return '';
  });
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);`;

code = code.replace(oldHook, newHook);

const oldTabs = `          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex items-end space-x-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Seleccionar Fecha</label>
              <input 
                type="date" 
                value={fecha} 
                onChange={e => setFecha(e.target.value)}
                className="border border-slate-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              />
            </div>
          </div>`;

const newTabs = `          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-2">
              {hasAccess('Reportes - Mecanica') && (
                <button 
                  onClick={() => setActiveReport('mecanica')}
                  className={\`px-4 py-2 rounded-lg text-sm font-bold transition-colors \${activeReport === 'mecanica' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
                >
                  Mecánica
                </button>
              )}
              {hasAccess('Reportes - Presentacion') && (
                <button 
                  onClick={() => setActiveReport('presentacion')}
                  className={\`px-4 py-2 rounded-lg text-sm font-bold transition-colors \${activeReport === 'presentacion' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
                >
                  Presentación
                </button>
              )}
              {hasAccess('Reportes - Operaciones') && (
                <button 
                  onClick={() => setActiveReport('operaciones')}
                  className={\`px-4 py-2 rounded-lg text-sm font-bold transition-colors \${activeReport === 'operaciones' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
                >
                  Operaciones
                </button>
              )}
              {hasAccess('Reportes - Generales') && (
                <button 
                  onClick={() => setActiveReport('generales')}
                  className={\`px-4 py-2 rounded-lg text-sm font-bold transition-colors \${activeReport === 'generales' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
                >
                  Generales
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Seleccionar Fecha</label>
              <input 
                type="date" 
                value={fecha} 
                onChange={e => setFecha(e.target.value)}
                className="border border-slate-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              />
            </div>
          </div>`;

code = code.replace(oldTabs, newTabs);

const oldReportBody = `<div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
            <div className="text-center border-b border-slate-200 pb-6 mb-6">`;

const newReportBody = `<div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
            {!activeReport && (
              <div className="text-center text-slate-500 py-8">
                Seleccione un reporte para visualizar.
              </div>
            )}
            {activeReport === 'mecanica' && (
              <>
            <div className="text-center border-b border-slate-200 pb-6 mb-6">`;

const endOfMecanica = `                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}`;

const newEndOfMecanica = `                </div>
              )}
            </div>
            </>
            )}
            {activeReport !== 'mecanica' && activeReport !== '' && (
              <div className="text-center text-slate-500 py-8">
                El reporte de {activeReport} está en desarrollo y se conectará a la base de datos próximamente.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}`;

code = code.replace(oldReportBody, newReportBody).replace(endOfMecanica, newEndOfMecanica);

fs.writeFileSync('src/pages/Reportes.tsx', code);

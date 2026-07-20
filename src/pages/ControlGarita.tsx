import Header from '../components/Header';

export default function ControlGarita() {
  return (
    <>
      <Header title="Estado Operativo de Base" subtitle={`Sábado, 24 Mayo 2026`}>
        <button className="px-4 py-2 text-sm font-bold bg-white border border-slate-300 rounded hover:bg-slate-50">Exportar Excel</button>
        <button className="px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded">Nueva Diagramación</button>
      </Header>

      <div className="grid grid-cols-4 gap-6 p-8 pb-0">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Servicios Totales</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">42</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-green-500">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Salidas Completas</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">18</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">En Espera / Proceso</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">21</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-red-500">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Faltantes / Alerta</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">03</p>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-hidden">
        <div className="bg-white border border-slate-200 rounded-lg h-full flex flex-col shadow-sm">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex">
            <span className="w-[10%] text-[10px] font-bold uppercase text-slate-500 tracking-wider">Turno</span>
            <span className="w-[15%] text-[10px] font-bold uppercase text-slate-500 tracking-wider">Interno</span>
            <span className="w-[25%] text-[10px] font-bold uppercase text-slate-500 tracking-wider">Conductor</span>
            <span className="w-[10%] text-[10px] font-bold uppercase text-slate-500 tracking-wider">Salida</span>
            <span className="flex-1 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Estados (Mec/Cond/Pres)</span>
            <span className="w-[12%] text-[10px] font-bold uppercase text-slate-500 tracking-wider text-right">Acción</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {/* Row 1 */}
            <div className="px-6 py-4 flex items-center bg-white hover:bg-slate-50 transition-colors">
              <div className="w-[10%] font-mono text-sm font-bold">T-1024</div>
              <div className="w-[15%] flex items-center space-x-2">
                <span className="px-1.5 py-0.5 bg-slate-100 text-[11px] font-bold border border-slate-300 rounded">540-08</span>
              </div>
              <div className="w-[25%] font-medium text-sm">Mendoza, Sebastian</div>
              <div className="w-[10%] text-sm font-bold">07:30</div>
              <div className="flex-1 flex space-x-4">
                 <div className="flex items-center space-x-1.5">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   <span className="text-[11px] text-slate-600">Mecánico OK</span>
                 </div>
                 <div className="flex items-center space-x-1.5">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   <span className="text-[11px] text-slate-600">Checklist OK</span>
                 </div>
                 <div className="flex items-center space-x-1.5">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   <span className="text-[11px] text-slate-600">Presente</span>
                 </div>
              </div>
              <div className="w-[12%] text-right">
                 <button className="px-3 py-1 bg-green-600 hover:bg-green-700 transition-colors text-white text-[11px] font-bold rounded uppercase">Habilitar Salida</button>
              </div>
            </div>

            {/* Row 2 */}
            <div className="px-6 py-4 flex items-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-[10%] font-mono text-sm font-bold">T-1025</div>
              <div className="w-[15%] flex items-center space-x-2">
                <span className="px-1.5 py-0.5 bg-slate-100 text-[11px] font-bold border border-slate-300 rounded">540-12</span>
              </div>
              <div className="w-[25%] font-medium text-sm">Gomez, Facundo</div>
              <div className="w-[10%] text-sm font-bold">07:45</div>
              <div className="flex-1 flex space-x-4">
                 <div className="flex items-center space-x-1.5">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   <span className="text-[11px] text-slate-600">Mecánico OK</span>
                 </div>
                 <div className="flex items-center space-x-1.5">
                   <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                   <span className="text-[11px] text-slate-600">En Checklist</span>
                 </div>
                 <div className="flex items-center space-x-1.5">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   <span className="text-[11px] text-slate-600">Presente</span>
                 </div>
              </div>
              <div className="w-[12%] text-right">
                 <button className="px-3 py-1 bg-slate-200 text-slate-400 text-[11px] font-bold rounded uppercase cursor-not-allowed">Bloqueado</button>
              </div>
            </div>

            {/* Row 3 */}
            <div className="px-6 py-4 flex items-center bg-white hover:bg-slate-50 transition-colors">
              <div className="w-[10%] font-mono text-sm font-bold">T-1026</div>
              <div className="w-[15%] flex items-center space-x-2">
                <span className="px-1.5 py-0.5 bg-slate-100 text-[11px] font-bold border border-slate-300 rounded">540-01</span>
              </div>
              <div className="w-[25%] font-medium text-sm text-red-600 font-bold italic underline">Sin Conductor</div>
              <div className="w-[10%] text-sm font-bold">08:00</div>
              <div className="flex-1 flex space-x-4">
                 <div className="flex items-center space-x-1.5">
                   <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                   <span className="text-[11px] text-slate-400">Pendiente</span>
                 </div>
                 <div className="flex items-center space-x-1.5">
                   <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                   <span className="text-[11px] text-slate-400">Pendiente</span>
                 </div>
                 <div className="flex items-center space-x-1.5">
                   <div className="w-2 h-2 rounded-full bg-red-500"></div>
                   <span className="text-[11px] text-red-600 font-bold">AUSENTE</span>
                 </div>
              </div>
              <div className="w-[12%] text-right">
                 <button className="px-3 py-1 bg-red-100 hover:bg-red-200 transition-colors text-red-700 border border-red-200 text-[11px] font-bold rounded uppercase">Urgente: Asignar</button>
              </div>
            </div>
            
             {/* Row 4 */}
             <div className="px-6 py-4 flex items-center bg-white hover:bg-slate-50 transition-colors">
              <div className="w-[10%] font-mono text-sm font-bold">T-1027</div>
              <div className="w-[15%] flex items-center space-x-2">
                <span className="px-1.5 py-0.5 bg-slate-100 text-[11px] font-bold border border-slate-300 rounded">540-19</span>
              </div>
              <div className="w-[25%] font-medium text-sm">Perez, Ricardo</div>
              <div className="w-[10%] text-sm font-bold">08:15</div>
              <div className="flex-1 flex space-x-4">
                 <div className="flex items-center space-x-1.5">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   <span className="text-[11px] text-slate-600">Mecánico OK</span>
                 </div>
                 <div className="flex items-center space-x-1.5">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   <span className="text-[11px] text-slate-600">Checklist OK</span>
                 </div>
                 <div className="flex items-center space-x-1.5">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   <span className="text-[11px] text-slate-600">Presente</span>
                 </div>
              </div>
              <div className="w-[12%] text-right">
                 <button className="px-3 py-1 bg-green-600 hover:bg-green-700 transition-colors text-white text-[11px] font-bold rounded uppercase">Habilitar Salida</button>
              </div>
            </div>

          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Completo</span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>En proceso</span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Crítico / Falta</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 italic font-medium">
              * Autorización de Jefe de Base requerida para salidas con checks pendientes.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

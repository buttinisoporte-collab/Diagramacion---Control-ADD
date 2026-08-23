const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

const returnIndex = code.indexOf('  return (\n    <>');
if (returnIndex === -1) throw new Error("Could not find return");

const beforeReturn = code.substring(0, returnIndex);

const newUI = `  return (
    <>
      <Header title="Control Garita" subtitle="Consolidación de Garita">
        <button
          onClick={() => window.print()}
          className="print:hidden flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Imprimir Planilla</span>
        </button>
      </Header>

      <div className="flex-1 p-6 flex flex-col min-h-0 bg-slate-50 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col flex-1 min-h-0 w-full space-y-4">
          
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Fecha</label>
                <input 
                  type="date" 
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 text-sm font-bold" 
                />
              </div>
              
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('salidas')}
                  className={\`px-4 py-1.5 rounded-md text-sm font-bold transition-colors \${activeTab === 'salidas' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  Salidas
                </button>
                <button
                  onClick={() => setActiveTab('llegadas')}
                  className={\`px-4 py-1.5 rounded-md text-sm font-bold transition-colors \${activeTab === 'llegadas' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  Llegadas
                </button>
              </div>
            </div>
            
            <div className="relative w-full md:w-80">
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar..." 
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg focus:border-blue-500 text-sm"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>

          {activeTab === 'salidas' && (
            <div className="flex flex-col flex-1 min-h-0 space-y-6 overflow-auto">
              {/* Turnos Base */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
                  <h3 className="font-bold text-slate-700 text-sm">Turnos (Salida Base)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-4 py-2">Presentación</th>
                        <th className="px-4 py-2">Salida Base</th>
                        <th className="px-4 py-2">Turno</th>
                        <th className="px-4 py-2">Unidad</th>
                        <th className="px-4 py-2">Conductor</th>
                        <th className="px-4 py-2 text-center">Mecánico</th>
                        <th className="px-4 py-2 text-center">Checklist</th>
                        <th className="px-4 py-2">Novedades</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTurnos.map(t => {
                        const hasCond = !!t.conductor_principal;
                        const isMecChecked = anyMecanicoChecked[t.cod_turno];
                        const isChkChecked = anyChecklistChecked[t.cod_turno];
                        const pres = presentacionMap[t.cod_turno];
                        const sal = salidaMap[t.cod_turno];
                        const isRowReady = hasCond && isMecChecked && isChkChecked;
                        
                        return (
                          <tr key={t.cod_turno} className="hover:bg-slate-50">
                            <td className="px-4 py-2">
                              {pres ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded text-xs"><Printer className="w-3 h-3"/> {pres.time}</span>
                              ) : (
                                <button disabled={!isRowReady} onClick={() => handleMarcar(t.cod_turno, 'presentacion')} className={\`text-[10px] font-bold px-2 py-1 rounded \${isRowReady ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}\`}>PRESENTACIÓN</button>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {sal ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded text-xs"><Printer className="w-3 h-3"/> {sal.time}</span>
                              ) : (
                                <button disabled={!pres} onClick={() => handleMarcar(t.cod_turno, 'salida')} className={\`text-[10px] font-bold px-2 py-1 rounded \${pres ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}\`}>MARCAR SALIDA</button>
                              )}
                            </td>
                            <td className="px-4 py-2 font-bold text-slate-700">{t.cod_turno}</td>
                            <td className="px-4 py-2 font-mono font-bold text-slate-600">{t.unidad || '-'}</td>
                            <td className="px-4 py-2 text-xs truncate max-w-[120px]">{t.conductor_principal || '-'}</td>
                            <td className="px-4 py-2 text-center">
                              {isMecChecked ? <span className="inline-flex bg-emerald-100 text-emerald-700 p-1 rounded-full"><Printer className="w-3 h-3"/></span> : <span className="inline-flex bg-red-100 text-red-600 p-1 rounded-full"><X className="w-3 h-3"/></span>}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {isChkChecked ? <span className="inline-flex bg-emerald-100 text-emerald-700 p-1 rounded-full"><Printer className="w-3 h-3"/></span> : <span className="inline-flex bg-red-100 text-red-600 p-1 rounded-full"><X className="w-3 h-3"/></span>}
                            </td>
                            <td className="px-4 py-2">
                              <input type="text" defaultValue={t.observaciones || ''} onBlur={(e) => handleNovedad(t.cod_turno, e.target.value)} placeholder="Novedad..." className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:border-blue-500" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Verificaciones Tecnicas */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
                  <h3 className="font-bold text-blue-800 text-sm">Verificación Técnica</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-4 py-2">Salida a Revisión</th>
                        <th className="px-4 py-2">Turno</th>
                        <th className="px-4 py-2">Unidad</th>
                        <th className="px-4 py-2">Mecánico a Cargo</th>
                        <th className="px-4 py-2">Novedades</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[1, 2, 3].map(idx => {
                        const cod = \`VERIF-\${idx}\`;
                        const v = verificaciones.find(x => x.cod_turno === cod) || { cod_turno: cod, unidad: '' };
                        if (!v.unidad) return null;
                        return (
                          <tr key={cod} className="hover:bg-slate-50">
                            <td className="px-4 py-2">
                              {v.hora_salida_verificacion ? (
                                <span className="font-bold text-emerald-600">{v.hora_salida_verificacion}</span>
                              ) : (
                                <input type="time" onChange={(e) => handleSaveVerif(cod, 'hora_salida_verificacion', e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1" />
                              )}
                            </td>
                            <td className="px-4 py-2 font-bold text-slate-700">Verificación Técnica</td>
                            <td className="px-4 py-2 font-mono font-bold text-slate-600">{v.unidad}</td>
                            <td className="px-4 py-2">
                              <select value={v.mecanico_verificacion || ''} onChange={(e) => handleSaveVerif(cod, 'mecanico_verificacion', e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1">
                                <option value="">-- Seleccionar --</option>
                                {mecanicosList.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input type="text" defaultValue={v.observaciones || ''} onBlur={(e) => handleSaveVerif(cod, 'observaciones', e.target.value)} placeholder="Novedad..." className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:border-blue-500" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Informative Auxilios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h3 className="font-bold text-slate-700 text-sm border-b pb-2 mb-2">Auxilio en Base (Info)</h3>
                  {auxiliosBase.length > 0 ? auxiliosBase.map(a => <div key={a.cod_turno} className="text-sm font-mono">{a.unidad}</div>) : <div className="text-xs text-slate-400">Sin unidades</div>}
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h3 className="font-bold text-slate-700 text-sm border-b pb-2 mb-2">Auxilio en Terminal SR (Info)</h3>
                  {auxiliosTerminal.length > 0 ? auxiliosTerminal.map(a => <div key={a.cod_turno} className="text-sm font-mono">{a.unidad}</div>) : <div className="text-xs text-slate-400">Sin unidades</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'llegadas' && (
            <div className="flex flex-col flex-1 min-h-0 space-y-6 overflow-auto">
              {/* Turnos Base Llegadas */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
                  <h3 className="font-bold text-slate-700 text-sm">Consolidación de Llegadas (Turnos)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-4 py-2">Turno</th>
                        <th className="px-4 py-2">Unidad</th>
                        <th className="px-4 py-2">Conductor Principal</th>
                        <th className="px-4 py-2">Hora Llegada a Base</th>
                        <th className="px-4 py-2">Novedades</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTurnos.map(t => {
                        const lleg = llegadasMap[t.cod_turno] || t.hora_llegada_verificacion;
                        return (
                          <tr key={t.cod_turno} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-bold text-slate-700">{t.cod_turno}</td>
                            <td className="px-4 py-2 font-mono font-bold text-slate-600">{t.unidad || '-'}</td>
                            <td className="px-4 py-2 text-xs">{t.conductor_principal || '-'}</td>
                            <td className="px-4 py-2">
                              {lleg ? (
                                <span className="font-bold text-emerald-600">{typeof lleg === 'string' ? lleg : lleg.time}</span>
                              ) : (
                                <input type="time" onChange={(e) => handleLlegada(t.cod_turno, e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1" />
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <input type="text" defaultValue={t.observaciones || ''} onBlur={(e) => handleNovedad(t.cod_turno, e.target.value)} placeholder="Novedad a la llegada..." className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:border-blue-500" />
                            </td>
                          </tr>
                        );
                      })}
                      {/* Verificaciones Tecnicas Llegadas */}
                      {[1, 2, 3].map(idx => {
                        const cod = \`VERIF-\${idx}\`;
                        const v = verificaciones.find(x => x.cod_turno === cod);
                        if (!v?.unidad) return null;
                        return (
                          <tr key={cod} className="hover:bg-blue-50 bg-blue-50/30">
                            <td className="px-4 py-2 font-bold text-blue-800">Verificación Técnica</td>
                            <td className="px-4 py-2 font-mono font-bold text-slate-600">{v.unidad}</td>
                            <td className="px-4 py-2 text-xs">{v.mecanico_verificacion || '-'}</td>
                            <td className="px-4 py-2">
                              {v.hora_llegada_verificacion ? (
                                <span className="font-bold text-emerald-600">{v.hora_llegada_verificacion}</span>
                              ) : (
                                <input type="time" onChange={(e) => handleSaveVerif(cod, 'hora_llegada_verificacion', e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1" />
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <input type="text" defaultValue={v.observaciones || ''} onBlur={(e) => handleSaveVerif(cod, 'observaciones', e.target.value)} placeholder="Novedad..." className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:border-blue-500" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Auxilios Llegadas */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                <div className="bg-red-50 border-b border-red-100 px-4 py-2">
                  <h3 className="font-bold text-red-800 text-sm">Unidades de Auxilio en Curso</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-4 py-2">Unidad Reemplazo</th>
                        <th className="px-4 py-2">Mecánico a Cargo</th>
                        <th className="px-4 py-2">Hora Salida</th>
                        <th className="px-4 py-2">Hora Llegada a Base</th>
                        <th className="px-4 py-2">Novedades</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auxiliosList.map(a => {
                        const lleg = llegadasAuxiliosMap[a.id || a.created_at];
                        return (
                          <tr key={a.id || a.created_at} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-mono font-bold text-slate-700">{a.unidad_reemplazo || '-'}</td>
                            <td className="px-4 py-2 text-xs">{a.personal_mecanico || '-'}</td>
                            <td className="px-4 py-2 font-bold text-slate-600">{a.hora_salida_mecanico || '-'}</td>
                            <td className="px-4 py-2">
                              {lleg ? (
                                <span className="font-bold text-emerald-600">{lleg}</span>
                              ) : (
                                <input type="time" onChange={(e) => handleAuxilioLlegada(a.id || a.created_at, e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1" />
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <input type="text" placeholder="Novedad..." className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:border-blue-500" />
                            </td>
                          </tr>
                        );
                      })}
                      {auxiliosList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No hay auxilios registrados para esta fecha.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Printable Area */}
      <div className="hidden print:block absolute inset-0 bg-white p-4">
        <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-2">
          <div className="w-32 text-left leading-tight"><h2 className="text-2xl font-black text-blue-800 tracking-tighter italic">A.Buttini</h2><p className="text-[7px] font-bold text-red-600">EMPRESA E HIJOS S.R.L.</p></div>
          <h1 className="text-xl font-bold uppercase tracking-wider">Registro de Garita</h1>
          <div className="w-32 text-right text-xs">
            <span className="font-bold">Fecha:</span> {new Date(fecha + "T12:00:00").toLocaleDateString('es-AR')}
          </div>
        </div>
        <p className="text-center text-xs text-slate-500 my-4">Impresión de reporte de garita no optimizada para este modo de visualización en la nueva versión por pestañas.</p>
      </div>
    </>
  );
}
`;

fs.writeFileSync('src/pages/ControlGarita.tsx', beforeReturn + newUI);

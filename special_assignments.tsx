
        {/* Special Assignments Section */}
        <div className="max-w-7xl mx-auto space-y-6 print:hidden mt-8">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
              <Car className="w-5 h-5" />
            </span>
            Diagramación Especial (Auxilios y Verificaciones)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Auxilio en Base */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
              <h3 className="font-bold text-slate-700 text-sm">Auxilio en Base (Máx 2)</h3>
              {[1, 2].map((idx) => {
                const cod = \`AUX-BASE-\${idx}\`;
                const asig = assignments[cod];
                return (
                  <div key={cod} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Unidad {idx}</label>
                    <select
                      value={asig?.unidad || ''}
                      onChange={(e) => handleAssignmentChange(cod, 'unidad', e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                    >
                      <option value="">-- Sin Unidad --</option>
                      {flota.map((u: Unidad) => (
                        <option key={u.id_unidad || u.unidad} value={u.unidad}>{u.unidad}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Auxilio en Terminal */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
              <h3 className="font-bold text-slate-700 text-sm">Auxilio en Terminal SR (Máx 2)</h3>
              {[1, 2].map((idx) => {
                const cod = \`AUX-TERM-\${idx}\`;
                const asig = assignments[cod];
                return (
                  <div key={cod} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Unidad {idx}</label>
                    <select
                      value={asig?.unidad || ''}
                      onChange={(e) => handleAssignmentChange(cod, 'unidad', e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                    >
                      <option value="">-- Sin Unidad --</option>
                      {flota.map((u: Unidad) => (
                        <option key={u.id_unidad || u.unidad} value={u.unidad}>{u.unidad}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Verificación Técnica */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
              <h3 className="font-bold text-slate-700 text-sm">Verificación Técnica (Máx 3)</h3>
              {[1, 2, 3].map((idx) => {
                const cod = \`VERIF-\${idx}\`;
                const asig = assignments[cod];
                return (
                  <div key={cod} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Unidad {idx}</label>
                    <select
                      value={asig?.unidad || ''}
                      onChange={(e) => handleAssignmentChange(cod, 'unidad', e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                    >
                      <option value="">-- Sin Unidad --</option>
                      {flota.map((u: Unidad) => (
                        <option key={u.id_unidad || u.unidad} value={u.unidad}>{u.unidad}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


sed -i '/{\/\* Save buttons \*\//i \
              {/* Extra desktop fields */}\
              <div className="hidden md:block border-t border-slate-100 pt-3 space-y-3">\
                <p className="text-[10px] font-bold text-slate-400 uppercase">Campos Extras (Solo Computadora)</p>\
                <div className="grid grid-cols-2 gap-4">\
                  <div>\
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Unidad de Reemplazo</label>\
                    <input type="text" className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none" value={unidadReemplazo} onChange={(e) => setUnidadReemplazo(e.target.value)} />\
                  </div>\
                  <div>\
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Hora Salida Mecánico</label>\
                    <input type="time" className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none" value={horaSalidaMecanico} onChange={(e) => setHoraSalidaMecanico(e.target.value)} />\
                  </div>\
                  <div>\
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Personal (Mecánico a Cargo)</label>\
                    <input type="text" className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none" value={personalMecanico} onChange={(e) => setPersonalMecanico(e.target.value)} />\
                  </div>\
                  <div>\
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Detalle Técnico de la Causa Constatada</label>\
                    <input type="text" className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none" value={detalleCausa} onChange={(e) => setDetalleCausa(e.target.value)} />\
                  </div>\
                </div>\
                <div>\
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Detalle de Herramientas</label>\
                  <input type="text" className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none" value={detalleHerramientas} onChange={(e) => setDetalleHerramientas(e.target.value)} />\
                </div>\
              </div>\
' src/pages/Auxilios.tsx

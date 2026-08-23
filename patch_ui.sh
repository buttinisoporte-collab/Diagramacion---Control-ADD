sed -i '/<label className="text-\[10px\] uppercase font-bold text-slate-600">/!b; /Detalle Técnico de la Causa Constatada/!b; :a; /<\/div>/!{N;ba}; a\
                  {/* Detalle de Herramientas */}\
                  <div className="space-y-1">\
                    <label className="text-[10px] uppercase font-bold text-slate-600">\
                      Detalle de Herramientas\
                    </label>\
                    <input\
                      type="text"\
                      value={detalleHerramientas}\
                      onChange={(e) => setDetalleHerramientas(e.target.value)}\
                      placeholder="Ej: Llave 13, criquet, tubo 17..."\
                      className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs"\
                    />\
                  </div>' src/pages/SGCAuxilios.tsx

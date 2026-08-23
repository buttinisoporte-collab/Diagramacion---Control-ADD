const fs = require('fs');
let code = fs.readFileSync('src/pages/SGCAuxilios.tsx', 'utf8');

const target = `                  {/* 13. Detalle de la Causa */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-600">
                      Detalle Técnico de la Causa Constatada
                    </label>
                    <input
                      type="text"
                      value={detalleCausa}
                      onChange={(e) => setDetalleCausa(e.target.value)}
                      placeholder="Ej: Manguera rota a la salida de compresor de aire por roce mecánico continuo contra el chasis."
                      className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>`;

const replacement = target + `\n\n                  {/* Detalle de Herramientas */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-600">
                      Detalle de Herramientas
                    </label>
                    <input
                      type="text"
                      value={detalleHerramientas}
                      onChange={(e) => setDetalleHerramientas(e.target.value)}
                      placeholder="Ej: Llave 13, criquet, tubo 17..."
                      className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/SGCAuxilios.tsx', code);

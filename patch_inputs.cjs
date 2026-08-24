const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

// Presentacion
code = code.replace(
  /<input\s*type="time"\s*id={`time-pres-\${t\.isTuristico \? t\.id : t\.cod_turno}`}\s*defaultValue=\{typeof pres === 'string' \? pres : pres\.time\}\s*disabled=\{!canEdit\}\s*className="w-\[75px\] text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 rounded px-1 py-1 font-bold text-center"\s*\/>\s*\{canEdit && \(\s*<button\s*onClick=\{\(\) => \{\s*const val = \(document\.getElementById\(`time-pres-\${t\.isTuristico \? t\.id : t\.cod_turno}`\) as HTMLInputElement\)\?\.value;\s*if\(val\) handleMarcarPresente\(t, val\);\s*\}\}/g,
  `<input 
    type="time" 
    disabled={!canEdit}
    value={editedTimes['pres-'+(t.isTuristico ? t.id : t.cod_turno)] !== undefined ? editedTimes['pres-'+(t.isTuristico ? t.id : t.cod_turno)] : (typeof pres === 'string' ? pres : (pres?.time || ''))}
    onChange={(e) => setEditedTimes(prev => ({...prev, ['pres-'+(t.isTuristico ? t.id : t.cod_turno)]: e.target.value}))}
    className="w-[75px] text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 rounded px-1 py-1 font-bold text-center" 
  />
  {canEdit && (
    <button 
      onClick={() => {
        const val = editedTimes['pres-'+(t.isTuristico ? t.id : t.cod_turno)] || (typeof pres === 'string' ? pres : (pres?.time || ''));
        if(val) handleMarcarPresente(t, val);
      }}`
);

// Salida
code = code.replace(
  /<input\s*type="time"\s*id={`time-sal-\${t\.isTuristico \? t\.id : t\.cod_turno}`}\s*defaultValue=\{typeof sal === 'string' \? sal : sal\.time\}\s*disabled=\{!canEdit\}\s*className="w-\[75px\] text-xs border border-blue-300 bg-blue-50 text-blue-700 rounded px-1 py-1 font-bold text-center"\s*\/>\s*\{canEdit && \(\s*<button\s*onClick=\{\(\) => \{\s*const val = \(document\.getElementById\(`time-sal-\${t\.isTuristico \? t\.id : t\.cod_turno}`\) as HTMLInputElement\)\?\.value;\s*if\(val\) handleMarcarSalida\(t, val\);\s*\}\}/g,
  `<input 
    type="time" 
    disabled={!canEdit}
    value={editedTimes['sal-'+(t.isTuristico ? t.id : t.cod_turno)] !== undefined ? editedTimes['sal-'+(t.isTuristico ? t.id : t.cod_turno)] : (typeof sal === 'string' ? sal : (sal?.time || ''))}
    onChange={(e) => setEditedTimes(prev => ({...prev, ['sal-'+(t.isTuristico ? t.id : t.cod_turno)]: e.target.value}))}
    className="w-[75px] text-xs border border-blue-300 bg-blue-50 text-blue-700 rounded px-1 py-1 font-bold text-center" 
  />
  {canEdit && (
    <button 
      onClick={() => {
        const val = editedTimes['sal-'+(t.isTuristico ? t.id : t.cod_turno)] || (typeof sal === 'string' ? sal : (sal?.time || ''));
        if(val) handleMarcarSalida(t, val);
      }}`
);

// Llegadas Normales
code = code.replace(
  /<input type="time" disabled=\{!canEdit\} id={`time-llegada-\${t\.isTuristico \? t\.id : t\.cod_turno}`} className="w-\[90px\] text-xs border border-slate-300 rounded px-2 py-1" \/>\s*<button disabled=\{!canEdit\} onClick=\{\(\) => \{\s*const val = \(document\.getElementById\(`time-llegada-\${t\.isTuristico \? t\.id : t\.cod_turno}`\) as HTMLInputElement\)\?\.value;\s*if\(val\) handleLlegada\(t, val\);\s*\}\}/g,
  `<input 
    type="time" 
    disabled={!canEdit} 
    value={editedTimes['llegada-'+(t.isTuristico ? t.id : t.cod_turno)] || ''}
    onChange={(e) => setEditedTimes(prev => ({...prev, ['llegada-'+(t.isTuristico ? t.id : t.cod_turno)]: e.target.value}))}
    className="w-[90px] text-xs border border-slate-300 rounded px-2 py-1" 
  />
  <button disabled={!canEdit} onClick={() => {
    const val = editedTimes['llegada-'+(t.isTuristico ? t.id : t.cod_turno)];
    if(val) handleLlegada(t, val);
  }}`
);

// Auxilios Llegadas - edit existing
code = code.replace(
  /<input\s*type="time"\s*id={`time-auxllegada-\${a\.id \|\| a\.created_at}`}\s*defaultValue=\{typeof lleg === 'string' \? lleg : lleg\.time\}\s*disabled=\{!canEdit\}\s*className="w-\[75px\] text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 rounded px-1 py-1 font-bold text-center"\s*\/>\s*\{canEdit && \(\s*<button\s*onClick=\{\(\) => \{\s*const val = \(document\.getElementById\(`time-auxllegada-\${a\.id \|\| a\.created_at}`\) as HTMLInputElement\)\?\.value;\s*if\(val\) handleAuxilioLlegada\(a\.id \|\| a\.created_at, val\);\s*\}\}/g,
  `<input 
    type="time" 
    disabled={!canEdit}
    value={editedTimes['auxllegada-'+(a.id || a.created_at)] !== undefined ? editedTimes['auxllegada-'+(a.id || a.created_at)] : (typeof lleg === 'string' ? lleg : (lleg?.time || ''))}
    onChange={(e) => setEditedTimes(prev => ({...prev, ['auxllegada-'+(a.id || a.created_at)]: e.target.value}))}
    className="w-[75px] text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 rounded px-1 py-1 font-bold text-center" 
  />
  {canEdit && (
    <button 
      onClick={() => {
        const val = editedTimes['auxllegada-'+(a.id || a.created_at)] || (typeof lleg === 'string' ? lleg : (lleg?.time || ''));
        if(val) handleAuxilioLlegada(a.id || a.created_at, val);
      }}`
);

// Auxilios Llegadas - new input 
code = code.replace(
  /<input type="time" disabled=\{!canEdit\} id={`time-auxllegada-\${a\.id \|\| a\.created_at}`} className="w-\[80px\] text-xs border border-slate-300 rounded px-2 py-1" \/>\s*<button disabled=\{!canEdit\} onClick=\{\(\) => \{\s*const val = \(document\.getElementById\(`time-auxllegada-\${a\.id \|\| a\.created_at}`\) as HTMLInputElement\)\?\.value;\s*if\(val\) handleAuxilioLlegada\(a\.id \|\| a\.created_at, val\);\s*\}\}/g,
  `<input 
    type="time" 
    disabled={!canEdit} 
    value={editedTimes['auxllegada-'+(a.id || a.created_at)] || ''}
    onChange={(e) => setEditedTimes(prev => ({...prev, ['auxllegada-'+(a.id || a.created_at)]: e.target.value}))}
    className="w-[80px] text-xs border border-slate-300 rounded px-2 py-1" 
  />
  <button disabled={!canEdit} onClick={() => {
    const val = editedTimes['auxllegada-'+(a.id || a.created_at)];
    if(val) handleAuxilioLlegada(a.id || a.created_at, val);
  }}`
);


// Auxilios Novedades column click (currently just an empty input)
code = code.replace(
  /<td className="px-2 py-1\.5 text-xs">\s*<input type="text" placeholder="Novedad\.\.\." className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:border-blue-500" \/>\s*<\/td>/g,
  `<td className="px-2 py-1.5 text-xs">
                              <button 
                                onClick={() => handleNovedadAuxilio(a)}
                                className={\`px-3 py-1 \${a.observaciones ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'} text-white rounded text-xs font-bold w-full max-w-[120px]\`}
                              >
                                {a.observaciones ? 'Ver Novedad' : 'Novedad'}
                              </button>
                            </td>`
);


// Turnos Llegadas - edit existing input
code = code.replace(
  /<input\s*type="time"\s*id={`time-llegada-\${t\.isTuristico \? t\.id : t\.cod_turno}`}\s*defaultValue=\{typeof lleg === 'string' \? lleg : lleg\.time\}\s*disabled=\{!canEdit\}\s*className="w-\[75px\] text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 rounded px-1 py-1 font-bold text-center"\s*\/>\s*\{canEdit && \(\s*<button\s*onClick=\{\(\) => \{\s*const val = \(document\.getElementById\(`time-llegada-\${t\.isTuristico \? t\.id : t\.cod_turno}`\) as HTMLInputElement\)\?\.value;\s*if\(val\) handleLlegada\(t, val\);\s*\}\}/g,
  `<input 
    type="time" 
    disabled={!canEdit}
    value={editedTimes['llegada-'+(t.isTuristico ? t.id : t.cod_turno)] !== undefined ? editedTimes['llegada-'+(t.isTuristico ? t.id : t.cod_turno)] : (typeof lleg === 'string' ? lleg : (lleg?.time || ''))}
    onChange={(e) => setEditedTimes(prev => ({...prev, ['llegada-'+(t.isTuristico ? t.id : t.cod_turno)]: e.target.value}))}
    className="w-[75px] text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 rounded px-1 py-1 font-bold text-center" 
  />
  {canEdit && (
    <button 
      onClick={() => {
        const val = editedTimes['llegada-'+(t.isTuristico ? t.id : t.cod_turno)] || (typeof lleg === 'string' ? lleg : (lleg?.time || ''));
        if(val) handleLlegada(t, val);
      }}`
);



fs.writeFileSync('src/pages/ControlGarita.tsx', code);

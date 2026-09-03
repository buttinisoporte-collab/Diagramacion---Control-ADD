const fs = require('fs');
let code = fs.readFileSync('src/pages/ChecklistSalida.tsx', 'utf8');

code = code.replace(
  "const [isSaving, setIsSaving] = useState(false);",
  "const [isSaving, setIsSaving] = useState(false);\n  const [isReadOnly, setIsReadOnly] = useState(false);"
);

const existingFetch = `      const { data: existingChk } = await supabase.from('controles')
        .select('*')
        .eq('fecha', fecha)
        .eq('id_unidad', uRes.data.id_unidad)
        .eq('id_turno', tRes.data.id_turno)
        .maybeSingle();

      if (existingChk) {
        setIsReadOnly(true);
        setChecks(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(k => {
             if (existingChk[k] !== undefined) next[k] = existingChk[k];
          });
          return next;
        });
        setObservaciones(existingChk.obs_gral || '');
      }`;

const initChecklistEnd = `      setIsDiagramado(true);
    }
    initChecklist();`;

code = code.replace(initChecklistEnd, `${existingFetch}\n      ${initChecklistEnd}`);

const handleCheck = `  const handleCheck = (key: string, val: boolean) => {
    if (isReadOnly) return;
    setChecks(prev => ({ ...prev, [key]: val }));
  };`;

code = code.replace(/  const handleCheck = \(key: string, val: boolean\) => \{\s*setChecks\(prev => \(\{ \.\.\.prev, \[key\]: val \}\)\);\s*\};/, handleCheck);

const obsRegex = /<textarea\s*value=\{observaciones\}\s*onChange=\{e => setObservaciones\(e\.target\.value\)\}/;
code = code.replace(obsRegex, `<textarea\n              value={observaciones}\n              onChange={e => setObservaciones(e.target.value)}\n              disabled={isReadOnly}`);

const saveRegex = /<button \s*onClick=\{handleSave\}\s*disabled=\{isSaving\}/;
code = code.replace(saveRegex, `<button \n              onClick={handleSave}\n              disabled={isSaving || isReadOnly}`);

const btnLabelRegex = /\{isSaving \? 'Guardando\.\.\.' : 'Guardar y Enviar Checklist'\}/;
code = code.replace(btnLabelRegex, "{isReadOnly ? 'Checklist ya registrado' : isSaving ? 'Guardando...' : 'Guardar y Enviar Checklist'}");

// also update the buttons to look disabled when readonly: hover shouldn't work. But the return statement handles it well enough via handleCheck blocking. 
// For better UI, we can dim the buttons.
const checkBtnTrue = /onClick=\{\(\) => handleCheck\(item\.key, true\)\}\s*className=\{\`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg font-bold text-lg transition-all \$\{checks\[item\.key\] === true \? 'bg-emerald-500 text-white shadow-md scale-105' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'\}\`\}/g;

const checkBtnFalse = /onClick=\{\(\) => handleCheck\(item\.key, false\)\}\s*className=\{\`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg font-bold text-lg transition-all \$\{checks\[item\.key\] === false \? 'bg-rose-500 text-white shadow-md scale-105' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'\}\`\}/g;

code = code.replace(checkBtnTrue, `onClick={() => handleCheck(item.key, true)}\n                           disabled={isReadOnly}\n                           className={\`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg font-bold text-lg transition-all \${checks[item.key] === true ? 'bg-emerald-500 text-white shadow-md scale-105' : 'bg-slate-200 text-slate-400 ' + (!isReadOnly ? 'hover:bg-slate-300' : 'opacity-50')}\`}`);

code = code.replace(checkBtnFalse, `onClick={() => handleCheck(item.key, false)}\n                           disabled={isReadOnly}\n                           className={\`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg font-bold text-lg transition-all \${checks[item.key] === false ? 'bg-rose-500 text-white shadow-md scale-105' : 'bg-slate-200 text-slate-400 ' + (!isReadOnly ? 'hover:bg-slate-300' : 'opacity-50')}\`}`);

fs.writeFileSync('src/pages/ChecklistSalida.tsx', code);

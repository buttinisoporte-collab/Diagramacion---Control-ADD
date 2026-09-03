const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlMecanico.tsx', 'utf8');

code = code.replace(
  "const [observaciones, setObservaciones] = useState('');",
  "const [observaciones, setObservaciones] = useState('');\n  const [isReadOnly, setIsReadOnly] = useState(false);"
);

const effectCode = `
  useEffect(() => {
    async function checkExistingControl() {
      if (!selectedUnidad || !supabase) {
        setIsReadOnly(false);
        setFluids({ flu_agua: null, flu_aceite: null, flu_combustible: null, flu_hidraulico: null, flu_frenos: null });
        setObservaciones('');
        return;
      }
      
      const { data } = await supabase.from('control_mecanico')
        .select('*')
        .eq('fecha', fecha)
        .eq('id_unidad', selectedUnidad.value)
        .eq('id_turno', selectedUnidad.turnoId)
        .maybeSingle();
        
      if (data) {
        setIsReadOnly(true);
        setFluids({
          flu_agua: data.flu_agua,
          flu_aceite: data.flu_aceite,
          flu_combustible: data.flu_combustible,
          flu_hidraulico: data.flu_hidraulico,
          flu_frenos: data.flu_frenos,
        });
        setObservaciones(data.observaciones || '');
      } else {
        setIsReadOnly(false);
        setFluids({ flu_agua: null, flu_aceite: null, flu_combustible: null, flu_hidraulico: null, flu_frenos: null });
        setObservaciones('');
      }
    }
    checkExistingControl();
  }, [selectedUnidad, fecha]);

  const setFluid`;

code = code.replace("  const setFluid", effectCode);

const btnRegex = /onClick=\{\(\) => setFluid\(fluid\.key, level\.val\)\}/g;
code = code.replace(btnRegex, "onClick={() => !isReadOnly && setFluid(fluid.key, level.val)} disabled={isReadOnly}");

const hoverRegex = /: \`text-slate-500 \$\{level\.hover\}\`/g;
code = code.replace(hoverRegex, ": `text-slate-500 ${!isReadOnly ? level.hover : ''}`");

const saveRegex = /<button\s*onClick=\{handleSave\}\s*disabled=\{isSaving\}/;
code = code.replace(saveRegex, `<button\n              onClick={handleSave}\n              disabled={isSaving || isReadOnly || !selectedUnidad}`);

const btnLabelRegex = /\{isSaving \? 'Guardando\.\.\.' : 'Guardar y Enviar Control'\}/;
code = code.replace(btnLabelRegex, "{isReadOnly ? 'Control ya registrado' : isSaving ? 'Guardando...' : 'Guardar y Enviar Control'}");

const obsRegex = /<textarea\s*value=\{observaciones\}\s*onChange=\{e => setObservaciones\(e\.target\.value\)\}/;
code = code.replace(obsRegex, `<textarea\n                value={observaciones}\n                onChange={e => setObservaciones(e.target.value)}\n                disabled={isReadOnly}`);

fs.writeFileSync('src/pages/ControlMecanico.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/Auxilios.tsx', 'utf8');

// 1. Make punto_gps optional in handleSaveAuxilio
code = code.replace(
  "if (!fecha || !unidad || !lugar || !puntoGps) {",
  "if (!fecha || !unidad || !lugar) {"
);

// 2. Add editingLocationId state
const stateInsert = `  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const editingLocationIdRef = useRef(editingLocationId);
  editingLocationIdRef.current = editingLocationId;`;
code = code.replace(
  "const [isPickingLocation, setIsPickingLocation] = useState(false);",
  "const [isPickingLocation, setIsPickingLocation] = useState(false);\n" + stateInsert
);

// 3. Update onMapClickRef.current logic
const onMapClickLogic = `  onMapClickRef.current = async (lat: number, lng: number) => {
    const coordsStr = \`\${lat.toFixed(6)}, \${lng.toFixed(6)}\`;
    const dist = calculateDistance(BASE_LAT, BASE_LNG, lat, lng);

    if (editingLocationIdRef.current) {
      const auxId = editingLocationIdRef.current;
      setEditingLocationId(null);
      setIsPickingLocation(false);
      await updateAuxilioLocation(auxId, coordsStr, dist);
      return;
    }

    setPuntoGps(coordsStr);
    setKilometros(dist.toString());

    if (isPickingLocationRef.current) {
      setIsPickingLocation(false);
      setIsModalOpen(true);
      showStatus('success', \`Ubicación seleccionada con éxito: \${coordsStr}\`);
    } else {
      if (!isModalOpenRef.current) {
        resetForm();
        setPuntoGps(coordsStr);
        setKilometros(dist.toString());
        setIsModalOpen(true);
        showStatus('success', \`Nuevo auxilio iniciado en coordenadas: \${coordsStr}\`);
      }
    }
  };

  const updateAuxilioLocation = async (id: string, newGps: string, newKm: number) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('auxilios')
          .update({ punto_gps: newGps, kilometros: newKm })
          .eq('id', id);
        if (error && error.code !== 'PGRST116') {
            // ignore PGRST116 (not found) just in case it's only local
        }
      }

      // Local storage update
      const local = localStorage.getItem('app_auxilios');
      if (local) {
        const parsed = JSON.parse(local);
        const idx = parsed.findIndex((a: any) => a.id === id || a.created_at === id);
        if (idx !== -1) {
          parsed[idx].punto_gps = newGps;
          parsed[idx].kilometros = newKm;
          localStorage.setItem('app_auxilios', JSON.stringify(parsed));
        }
      }
      
      loadAuxilios();
      showStatus('success', 'Ubicación actualizada correctamente.');
    } catch (e: any) {
      showStatus('error', 'Error al actualizar ubicación: ' + e.message);
    }
  };`;

code = code.replace(
  /onMapClickRef\.current = \(lat: number, lng: number\) => \{[\s\S]*?const \[fecha, setFecha\] = useState/,
  onMapClickLogic + "\n\n  const [fecha, setFecha] = useState"
);

// 4. Update UI in historical list to show an edit button
const recordRenderCode = `                  <div className="self-center pl-2 flex flex-col items-end gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLocationId(item.id || item.created_at);
                        setIsPickingLocation(true);
                        showStatus('info', 'Haga clic en el mapa para actualizar la ubicación de este auxilio.');
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold border border-slate-200 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Editar GPS
                    </button>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>`;
                  
code = code.replace(
  /<div className="self-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity">\s*<ChevronRight className="w-4 h-4 text-slate-400" \/>\s*<\/div>/g,
  recordRenderCode
);

// 5. Remove required from punto_gps inputs
// In conductor form
code = code.replace(
  /<input\s+type="text"\s+required\s+placeholder="Latitud, Longitud"/g,
  `<input \n                      type="text"\n                      placeholder="Latitud, Longitud (Opcional)"`
);
// In modal form
code = code.replace(
  /<input\s+type="text"\s+required\s+placeholder="Lat, Lng"/g,
  `<input \n                        type="text"\n                        placeholder="Lat, Lng (Opcional)"`
);

// 6. Fix "Punto GPS *" labels
code = code.replace(/<label className="block text-xs font-bold uppercase text-slate-500 mb-1">Punto GPS \*<\/label>/g, '<label className="block text-xs font-bold uppercase text-slate-500 mb-1">Punto GPS</label>');

fs.writeFileSync('src/pages/Auxilios.tsx', code);

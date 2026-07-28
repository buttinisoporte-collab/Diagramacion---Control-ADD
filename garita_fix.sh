sed -i '/\/\/ 4. Fetch Control Garita/d' src/pages/ControlGarita.tsx
sed -i '/const { data: garitaRes } = await supabase.from('"'"'control_garita'"'"').select('"'"'*'"'"').eq('"'"'fecha_hora_salida'"'"', fecha);/d' src/pages/ControlGarita.tsx
sed -i '/\/\/ actually let'"'"'s just fetch by diag_id/d' src/pages/ControlGarita.tsx
sed -i '/setChecklistsMap(cMap);/a \
      // 4. Fetch presentacion from diagramaciones\
      const localP = localStorage.getItem(`presentacion_${fecha}`);\
      if (localP) setPresentacionMap(JSON.parse(localP));\
      else setPresentacionMap({});' src/pages/ControlGarita.tsx

sed -i "s/setUnidadReemplazo(crmData.unidad_reemplazo || '');/setUnidadReemplazo(crmData.unidad_reemplazo || aux.unidad_reemplazo || '');/" src/pages/SGCAuxilios.tsx
sed -i "s/setHoraSalida(crmData.hora_salida || '');/setHoraSalida(crmData.hora_salida || aux.hora_salida_mecanico || '');/" src/pages/SGCAuxilios.tsx
sed -i "s/setPersonalMecanico(crmData.personal_mecanico || '');/setPersonalMecanico(crmData.personal_mecanico || aux.personal_mecanico || '');/" src/pages/SGCAuxilios.tsx
sed -i "s/setDetalleCausa(crmData.detalle_causa || '');/setDetalleCausa(crmData.detalle_causa || aux.detalle_causa || '');\n      setDetalleHerramientas(crmData.detalle_herramientas || aux.detalle_herramientas || '');/" src/pages/SGCAuxilios.tsx
sed -i "s/setDetalleCausa('');/setDetalleCausa(aux.detalle_causa || '');\n      setDetalleHerramientas(aux.detalle_herramientas || '');/" src/pages/SGCAuxilios.tsx
sed -i "s/setUnidadReemplazo('');/setUnidadReemplazo(aux.unidad_reemplazo || '');/" src/pages/SGCAuxilios.tsx
sed -i "s/setHoraSalida('');/setHoraSalida(aux.hora_salida_mecanico || '');/" src/pages/SGCAuxilios.tsx
sed -i "s/setPersonalMecanico('');/setPersonalMecanico(aux.personal_mecanico || '');/" src/pages/SGCAuxilios.tsx

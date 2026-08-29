import { supabase } from './supabase';
import QRCode from 'qrcode';
import { 
  ObjetoPerdido, 
  DespachoObjetosPerdidos, 
  EventoTrazabilidad,
  DatosEntregaTitular,
  DatosDonacion,
  DatosDestruccion,
  ItemDespacho
} from '../types/objetosPerdidos';
import { Usuario } from '../context/AuthContext';

const LOCAL_KEY_OBJETOS = 'app_objetos_perdidos';
const LOCAL_KEY_DESPACHOS = 'app_despachos_objetos_perdidos';

// Helper to generate a unique human-friendly ID
export function generateObjetoId(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `OP-${dateStr}-${rand}`;
}

export function generateDespachoId(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `DESP-${dateStr}-${rand}`;
}

// QR Code Generator helper
export async function generateQrDataUrl(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generando código QR:', err);
    return '';
  }
}

// Helper to format signature date and time
export function formatFirmaFechaHora(fechaIso?: string): string {
  if (!fechaIso) return '';
  try {
    const d = new Date(fechaIso);
    if (isNaN(d.getTime())) return fechaIso;
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return fechaIso;
  }
}

// Helper to extract firmante name and date/time
export function getFirmaInfo(obj: ObjetoPerdido): { firmante: string; fechaHora: string } {
  let firmante = obj.conductor_firma_usuario?.trim();
  let fecha = obj.conductor_firma_fecha?.trim();

  // If not on object properties directly, check event in trazabilidad
  if ((!firmante || !fecha) && obj.trazabilidad && Array.isArray(obj.trazabilidad)) {
    const evFirma = obj.trazabilidad.find(e => e.accion === 'FIRMA_HALLAZGO_CONDUCTOR');
    if (evFirma) {
      if (!firmante) {
        firmante = `${evFirma.usuario_nombre}${evFirma.usuario_rol ? ` (${evFirma.usuario_rol})` : ''}`;
      }
      if (!fecha) {
        fecha = evFirma.fecha;
      }
    }
  }

  return {
    firmante: firmante || 'Personal Registrado',
    fechaHora: formatFirmaFechaHora(fecha)
  };
}

const INITIAL_DEMO_OBJETOS: ObjetoPerdido[] = [
  {
    id: 'OP-260828-1012',
    numero_planilla: 'PL-8891',
    fecha_hallazgo: '2026-08-28',
    personal_hallazgo: 'Carlos Benítez (Conductor)',
    unidad_interno: 'Interno 104',
    recorrido_turno: 'Línea 10 - Turno Mañana',
    sector_hallazgo: 'Asiento 14',
    descripcion: 'Mochila negra marca Samsonite con útiles y cuaderno',
    estado: 'Encontrado',
    operador_garita_id: 'oper-1',
    operador_garita_nombre: 'Martín Garita',
    conductor_firmo: true,
    conductor_firma_usuario: 'Carlos Benítez (Conductor)',
    conductor_firma_fecha: '2026-08-28T08:35:00.000Z',
    trazabilidad: [
      {
        id: 'tr-seed-1',
        fecha: '2026-08-28T08:20:00.000Z',
        accion: 'REGISTRO_HALLAZGO',
        usuario_id: 'oper-1',
        usuario_nombre: 'Martín Garita',
        usuario_rol: 'Garita',
        detalle: 'Hallazgo registrado en Garita por Martín Garita. Planilla N°: PL-8891'
      },
      {
        id: 'tr-seed-2',
        fecha: '2026-08-28T08:35:00.000Z',
        accion: 'FIRMA_HALLAZGO_CONDUCTOR',
        usuario_id: 'cond-1',
        usuario_nombre: 'Carlos Benítez',
        usuario_rol: 'Conductor',
        detalle: 'Firma digital y aceptación de hallazgo asentada por conductor Carlos Benítez vía escaneo QR móvil'
      }
    ],
    created_at: '2026-08-28T08:20:00.000Z'
  },
  {
    id: 'OP-260828-1015',
    numero_planilla: 'PL-8895',
    fecha_hallazgo: '2026-08-28',
    personal_hallazgo: 'Lucas Gómez (Conductor)',
    unidad_interno: 'Interno 208',
    recorrido_turno: 'Línea 22 - Turno Tarde',
    sector_hallazgo: 'Bajo asiento 4',
    descripcion: 'Billetera de cuero marrón con documentación a nombre de Juan Pérez',
    estado: 'Encontrado',
    operador_garita_id: 'oper-1',
    operador_garita_nombre: 'Martín Garita',
    conductor_firmo: false,
    trazabilidad: [
      {
        id: 'tr-seed-3',
        fecha: '2026-08-28T09:10:00.000Z',
        accion: 'REGISTRO_HALLAZGO',
        usuario_id: 'oper-1',
        usuario_nombre: 'Martín Garita',
        usuario_rol: 'Garita',
        detalle: 'Hallazgo registrado en Garita por Martín Garita. Planilla N°: PL-8895'
      }
    ],
    created_at: '2026-08-28T09:10:00.000Z'
  }
];

// Local Storage helpers
function getLocalObjetos(): ObjetoPerdido[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY_OBJETOS);
    if (!raw) {
      setLocalObjetos(INITIAL_DEMO_OBJETOS);
      return INITIAL_DEMO_OBJETOS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_OBJETOS;
  }
}

function setLocalObjetos(items: ObjetoPerdido[]): void {
  try {
    localStorage.setItem(LOCAL_KEY_OBJETOS, JSON.stringify(items));
  } catch (e) {
    console.error('Error guardando en localStorage objetos_perdidos:', e);
  }
}

function getLocalDespachos(): DespachoObjetosPerdidos[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY_DESPACHOS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalDespachos(items: DespachoObjetosPerdidos[]): void {
  try {
    localStorage.setItem(LOCAL_KEY_DESPACHOS, JSON.stringify(items));
  } catch (e) {
    console.error('Error guardando en localStorage despachos:', e);
  }
}

// Fetch all objetos perdidos (Supabase + localStorage fallback / merge)
export async function fetchObjetosPerdidos(): Promise<ObjetoPerdido[]> {
  const localList = getLocalObjetos();
  if (!supabase) return localList;

  try {
    const { data, error } = await supabase
      .from('objetos_perdidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // PGRST205: table doesn't exist yet, return local
      return localList;
    }

    if (data) {
      // Sync local with remote (remote takes priority, keep un-synced locals)
      const map = new Map<string, ObjetoPerdido>();
      localList.forEach(item => map.set(item.id, item));
      data.forEach((item: ObjetoPerdido) => map.set(item.id, item));
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setLocalObjetos(merged);
      return merged;
    }
  } catch (e) {
    console.warn('Error fetching objetos_perdidos from Supabase, using local cache:', e);
  }

  return localList;
}

// Save or create new objeto perdido
export async function createObjetoPerdido(
  data: Omit<ObjetoPerdido, 'id' | 'created_at' | 'estado' | 'conductor_firmo' | 'trazabilidad'>,
  currentUser: Usuario
): Promise<ObjetoPerdido> {
  const now = new Date().toISOString();
  const id = generateObjetoId();

  const inicialTrazabilidad: EventoTrazabilidad = {
    id: `TR-${Date.now()}-1`,
    fecha: now,
    accion: 'REGISTRO_HALLAZGO',
    usuario_id: currentUser.id,
    usuario_nombre: currentUser.nombre_apellido,
    usuario_rol: currentUser.rol,
    detalle: `Hallazgo registrado en Garita por ${currentUser.nombre_apellido}. Personal que encontró: ${data.personal_hallazgo}. Planilla N°: ${data.numero_planilla}`
  };

  const nuevoObjeto: ObjetoPerdido = {
    ...data,
    id,
    created_at: now,
    estado: 'Encontrado',
    operador_garita_id: currentUser.id,
    operador_garita_nombre: currentUser.nombre_apellido,
    conductor_firmo: false,
    ubicacion_actual: 'Garita de Entrada (Pendiente de Despacho)',
    trazabilidad: [inicialTrazabilidad]
  };

  // 1. Save local
  const currentList = getLocalObjetos();
  const updatedList = [nuevoObjeto, ...currentList.filter(o => o.id !== id)];
  setLocalObjetos(updatedList);

  // 2. Save remote if Supabase table is available
  if (supabase) {
    try {
      const { error } = await supabase.from('objetos_perdidos').insert([nuevoObjeto]);
      if (error) {
        console.warn('Could not insert to Supabase objetos_perdidos table (using local):', error.message);
      }
    } catch (e) {
      console.warn('Supabase insert error (using local):', e);
    }
  }

  return nuevoObjeto;
}

// Conductor or personnel digital signature confirmation
export async function firmarHallazgoObjeto(
  objetoId: string,
  firmante: Usuario
): Promise<ObjetoPerdido> {
  const now = new Date().toISOString();
  const objetos = await fetchObjetosPerdidos();
  const index = objetos.findIndex(o => o.id === objetoId);

  if (index === -1) {
    throw new Error(`Objeto con ID ${objetoId} no encontrado`);
  }

  const objeto = objetos[index];
  const nuevoEvento: EventoTrazabilidad = {
    id: `TR-${Date.now()}`,
    fecha: now,
    accion: 'FIRMA_HALLAZGO_CONDUCTOR',
    usuario_id: firmante.id,
    usuario_nombre: firmante.nombre_apellido,
    usuario_rol: firmante.rol,
    detalle: `Firma digital y aceptación confirmada desde celular por ${firmante.nombre_apellido} (${firmante.rol})`
  };

  const updated: ObjetoPerdido = {
    ...objeto,
    conductor_firmo: true,
    conductor_firma_fecha: now,
    conductor_firma_usuario: `${firmante.nombre_apellido} (${firmante.rol})`,
    trazabilidad: [...(objeto.trazabilidad || []), nuevoEvento]
  };

  // Update local
  objetos[index] = updated;
  setLocalObjetos(objetos);

  // Update remote
  if (supabase) {
    try {
      await supabase.from('objetos_perdidos').update({
        conductor_firmo: updated.conductor_firmo,
        conductor_firma_fecha: updated.conductor_firma_fecha,
        conductor_firma_usuario: updated.conductor_firma_usuario,
        trazabilidad: updated.trazabilidad
      }).eq('id', objetoId);
    } catch (e) {
      console.warn('Error updating Supabase objeto firma:', e);
    }
  }

  return updated;
}

// Fetch all despachos
export async function fetchDespachos(): Promise<DespachoObjetosPerdidos[]> {
  const localList = getLocalDespachos();
  if (!supabase) return localList;

  try {
    const { data, error } = await supabase
      .from('despachos_objetos_perdidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return localList;
    }

    if (data) {
      const map = new Map<string, DespachoObjetosPerdidos>();
      localList.forEach(item => map.set(item.id, item));
      data.forEach((item: DespachoObjetosPerdidos) => map.set(item.id, item));
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setLocalDespachos(merged);
      return merged;
    }
  } catch (e) {
    console.warn('Error fetching despachos from Supabase:', e);
  }

  return localList;
}

// Create new despacho
export async function crearDespacho(
  fechaEnvio: string,
  numeroPrecinto: string,
  itemIds: string[],
  currentUser: Usuario
): Promise<DespachoObjetosPerdidos> {
  const now = new Date().toISOString();
  const despachoId = generateDespachoId();
  const todosObjetos = await fetchObjetosPerdidos();

  const itemsSeleccionados = todosObjetos.filter(o => itemIds.includes(o.id));
  const despachoItems: ItemDespacho[] = itemsSeleccionados.map(o => ({
    objeto_id: o.id,
    descripcion: o.descripcion,
    numero_planilla: o.numero_planilla,
    verificado_transporte: false,
    verificado_recepcion: false
  }));

  const eventoDespacho: EventoTrazabilidad = {
    id: `TR-${Date.now()}-DESP`,
    fecha: now,
    accion: 'CREACION_DESPACHO',
    usuario_id: currentUser.id,
    usuario_nombre: currentUser.nombre_apellido,
    usuario_rol: currentUser.rol,
    detalle: `Despacho a oficina generado en Garita. Precinto N°: ${numeroPrecinto}. Total artículos: ${despachoItems.length}`
  };

  const nuevoDespacho: DespachoObjetosPerdidos = {
    id: despachoId,
    created_at: now,
    fecha_envio: fechaEnvio,
    numero_precinto: numeroPrecinto,
    estado: 'Pendiente de Transporte',
    operador_despacha_id: currentUser.id,
    operador_despacha_nombre: currentUser.nombre_apellido,
    items: despachoItems,
    trazabilidad: [eventoDespacho]
  };

  // 1. Save Despacho local
  const currentDespachos = getLocalDespachos();
  setLocalDespachos([nuevoDespacho, ...currentDespachos.filter(d => d.id !== despachoId)]);

  // 2. Associate items to this despacho
  const updatedObjetos = todosObjetos.map(obj => {
    if (itemIds.includes(obj.id)) {
      const trItem: EventoTrazabilidad = {
        id: `TR-${Date.now()}-${obj.id}`,
        fecha: now,
        accion: 'ASIGNADO_A_DESPACHO',
        usuario_id: currentUser.id,
        usuario_nombre: currentUser.nombre_apellido,
        usuario_rol: currentUser.rol,
        detalle: `Incluido en caja de transporte para Despacho ${despachoId}. Precinto N° ${numeroPrecinto}`
      };
      return {
        ...obj,
        despacho_id: despachoId,
        ubicacion_actual: `En caja precintada (Precinto N° ${numeroPrecinto})`,
        trazabilidad: [...(obj.trazabilidad || []), trItem]
      };
    }
    return obj;
  });
  setLocalObjetos(updatedObjetos);

  // 3. Save remote if available
  if (supabase) {
    try {
      await supabase.from('despachos_objetos_perdidos').insert([nuevoDespacho]);
      for (const obj of updatedObjetos.filter(o => itemIds.includes(o.id))) {
        await supabase.from('objetos_perdidos').update({
          despacho_id: obj.despacho_id,
          ubicacion_actual: obj.ubicacion_actual,
          trazabilidad: obj.trazabilidad
        }).eq('id', obj.id);
      }
    } catch (e) {
      console.warn('Error saving Despacho in Supabase:', e);
    }
  }

  return nuevoDespacho;
}

// Transporter scans QR, checks items, and confirms transport
export async function confirmarTransporteDespacho(
  despachoId: string,
  transportador: Usuario,
  verificaciones: Record<string, { verificado: boolean; obs: string }>
): Promise<DespachoObjetosPerdidos> {
  const now = new Date().toISOString();
  const despachos = await fetchDespachos();
  const index = despachos.findIndex(d => d.id === despachoId);

  if (index === -1) {
    throw new Error(`Despacho ${despachoId} no encontrado`);
  }

  const despacho = despachos[index];
  const itemsActualizados = despacho.items.map(item => {
    const v = verificaciones[item.objeto_id];
    return {
      ...item,
      verificado_transporte: v ? v.verificado : true,
      obs_transporte: v?.obs || ''
    };
  });

  const nuevoEvento: EventoTrazabilidad = {
    id: `TR-${Date.now()}-TRANS`,
    fecha: now,
    accion: 'TRANSPORTE_INICIADO',
    usuario_id: transportador.id,
    usuario_nombre: transportador.nombre_apellido,
    usuario_rol: transportador.rol,
    detalle: `Caja y precinto N° ${despacho.numero_precinto} controlados y aceptados para transporte a oficina por ${transportador.nombre_apellido}`
  };

  const despachoActualizado: DespachoObjetosPerdidos = {
    ...despacho,
    estado: 'En Tránsito',
    transportador_id: transportador.id,
    transportador_nombre: transportador.nombre_apellido,
    transportador_fecha: now,
    items: itemsActualizados,
    trazabilidad: [...(despacho.trazabilidad || []), nuevoEvento]
  };

  despachos[index] = despachoActualizado;
  setLocalDespachos(despachos);

  // Update items state to 'Enviado'
  const todosObjetos = await fetchObjetosPerdidos();
  const updatedObjetos = todosObjetos.map(obj => {
    if (obj.despacho_id === despachoId) {
      const v = verificaciones[obj.id];
      const itemTr: EventoTrazabilidad = {
        id: `TR-${Date.now()}-${obj.id}`,
        fecha: now,
        accion: 'OBJETO_ENVIADO',
        usuario_id: transportador.id,
        usuario_nombre: transportador.nombre_apellido,
        usuario_rol: transportador.rol,
        detalle: `En viaje hacia administración. Transporta: ${transportador.nombre_apellido}.${v?.obs ? ` Observación: ${v.obs}` : ''}`
      };
      return {
        ...obj,
        estado: 'Enviado' as const,
        ubicacion_actual: `En tránsito a oficina (Transporta: ${transportador.nombre_apellido})`,
        trazabilidad: [...(obj.trazabilidad || []), itemTr]
      };
    }
    return obj;
  });
  setLocalObjetos(updatedObjetos);

  // Sync Supabase
  if (supabase) {
    try {
      await supabase.from('despachos_objetos_perdidos').update({
        estado: despachoActualizado.estado,
        transportador_id: despachoActualizado.transportador_id,
        transportador_nombre: despachoActualizado.transportador_nombre,
        transportador_fecha: despachoActualizado.transportador_fecha,
        items: despachoActualizado.items,
        trazabilidad: despachoActualizado.trazabilidad
      }).eq('id', despachoId);

      for (const obj of updatedObjetos.filter(o => o.despacho_id === despachoId)) {
        await supabase.from('objetos_perdidos').update({
          estado: obj.estado,
          ubicacion_actual: obj.ubicacion_actual,
          trazabilidad: obj.trazabilidad
        }).eq('id', obj.id);
      }
    } catch (e) {
      console.warn('Error updating despacho transporte in Supabase:', e);
    }
  }

  return despachoActualizado;
}

// Office receiver confirms reception of despacho and items
export async function confirmarRecepcionDespacho(
  despachoId: string,
  receptor: Usuario,
  ubicacionOficina: string,
  verificaciones: Record<string, { verificado: boolean; obs: string }>
): Promise<DespachoObjetosPerdidos> {
  const now = new Date().toISOString();
  const despachos = await fetchDespachos();
  const index = despachos.findIndex(d => d.id === despachoId);

  if (index === -1) {
    throw new Error(`Despacho ${despachoId} no encontrado`);
  }

  const despacho = despachos[index];
  const itemsActualizados = despacho.items.map(item => {
    const v = verificaciones[item.objeto_id];
    return {
      ...item,
      verificado_recepcion: v ? v.verificado : true,
      obs_recepcion: v?.obs || ''
    };
  });

  const ubicacionTexto = ubicacionOficina.startsWith('UBICADO EN:') 
    ? ubicacionOficina 
    : `UBICADO EN: ${ubicacionOficina}`;

  const nuevoEvento: EventoTrazabilidad = {
    id: `TR-${Date.now()}-REC`,
    fecha: now,
    accion: 'RECEPCION_CONFIRMADA',
    usuario_id: receptor.id,
    usuario_nombre: receptor.nombre_apellido,
    usuario_rol: receptor.rol,
    detalle: `Despacho recibido en Administración por ${receptor.nombre_apellido}. ${ubicacionTexto}`
  };

  const despachoActualizado: DespachoObjetosPerdidos = {
    ...despacho,
    estado: 'Entregado',
    receptor_id: receptor.id,
    receptor_nombre: receptor.nombre_apellido,
    receptor_fecha: now,
    ubicacion_oficina: ubicacionTexto,
    items: itemsActualizados,
    trazabilidad: [...(despacho.trazabilidad || []), nuevoEvento]
  };

  despachos[index] = despachoActualizado;
  setLocalDespachos(despachos);

  // Update items state to 'EN ADMINISTRACION' and location to 'UBICADO EN: ...'
  const todosObjetos = await fetchObjetosPerdidos();
  const updatedObjetos = todosObjetos.map(obj => {
    if (obj.despacho_id === despachoId) {
      const v = verificaciones[obj.id];
      const itemTr: EventoTrazabilidad = {
        id: `TR-${Date.now()}-${obj.id}`,
        fecha: now,
        accion: 'RECEPCION_EN_ADMINISTRACION',
        usuario_id: receptor.id,
        usuario_nombre: receptor.nombre_apellido,
        usuario_rol: receptor.rol,
        detalle: `Recibido y almacenado en Administración por ${receptor.nombre_apellido}. ${ubicacionTexto}.${v?.obs ? ` Obs recepción: ${v.obs}` : ''}`
      };
      return {
        ...obj,
        estado: 'EN ADMINISTRACION' as const,
        ubicacion_actual: ubicacionTexto,
        trazabilidad: [...(obj.trazabilidad || []), itemTr]
      };
    }
    return obj;
  });
  setLocalObjetos(updatedObjetos);

  // Sync Supabase
  if (supabase) {
    try {
      await supabase.from('despachos_objetos_perdidos').update({
        estado: despachoActualizado.estado,
        receptor_id: despachoActualizado.receptor_id,
        receptor_nombre: despachoActualizado.receptor_nombre,
        receptor_fecha: despachoActualizado.receptor_fecha,
        ubicacion_oficina: despachoActualizado.ubicacion_oficina,
        items: despachoActualizado.items,
        trazabilidad: despachoActualizado.trazabilidad
      }).eq('id', despachoId);

      for (const obj of updatedObjetos.filter(o => o.despacho_id === despachoId)) {
        await supabase.from('objetos_perdidos').update({
          estado: obj.estado,
          ubicacion_actual: obj.ubicacion_actual,
          trazabilidad: obj.trazabilidad
        }).eq('id', obj.id);
      }
    } catch (e) {
      console.warn('Error updating despacho recepcion in Supabase:', e);
    }
  }

  return despachoActualizado;
}

// Acción: Entrega a Titular
export async function entregarATitular(
  objetoId: string,
  datos: DatosEntregaTitular,
  currentUser: Usuario
): Promise<ObjetoPerdido> {
  const now = new Date().toISOString();
  const objetos = await fetchObjetosPerdidos();
  const index = objetos.findIndex(o => o.id === objetoId);

  if (index === -1) throw new Error(`Objeto ${objetoId} no encontrado`);

  const obj = objetos[index];
  const evento: EventoTrazabilidad = {
    id: `TR-${Date.now()}-ENT`,
    fecha: now,
    accion: 'ENTREGA_A_TITULAR',
    usuario_id: currentUser.id,
    usuario_nombre: currentUser.nombre_apellido,
    usuario_rol: currentUser.rol,
    detalle: `Entregado al titular ${datos.nombre} ${datos.apellido} (DNI ${datos.dni}). Comprobante/Doc N° ${datos.numero_registro_documento}`
  };

  const updated: ObjetoPerdido = {
    ...obj,
    estado: 'Entregado a Titular',
    ubicacion_actual: `Entregado a: ${datos.nombre} ${datos.apellido} (DNI ${datos.dni})`,
    datos_entrega: datos,
    trazabilidad: [...(obj.trazabilidad || []), evento]
  };

  objetos[index] = updated;
  setLocalObjetos(objetos);

  if (supabase) {
    try {
      await supabase.from('objetos_perdidos').update({
        estado: updated.estado,
        ubicacion_actual: updated.ubicacion_actual,
        datos_entrega: updated.datos_entrega,
        trazabilidad: updated.trazabilidad
      }).eq('id', objetoId);
    } catch (e) {
      console.warn('Error in entregarATitular Supabase:', e);
    }
  }

  return updated;
}

// Acción: Cambio de Depósito / Ubicación
export async function cambiarDeposito(
  objetoId: string,
  nuevaUbicacion: string,
  currentUser: Usuario
): Promise<ObjetoPerdido> {
  const now = new Date().toISOString();
  const objetos = await fetchObjetosPerdidos();
  const index = objetos.findIndex(o => o.id === objetoId);

  if (index === -1) throw new Error(`Objeto ${objetoId} no encontrado`);

  const obj = objetos[index];
  const ubicacionTexto = nuevaUbicacion.startsWith('UBICADO EN:') 
    ? nuevaUbicacion 
    : `UBICADO EN: ${nuevaUbicacion}`;

  const evento: EventoTrazabilidad = {
    id: `TR-${Date.now()}-UBIC`,
    fecha: now,
    accion: 'CAMBIO_DEPOSITO',
    usuario_id: currentUser.id,
    usuario_nombre: currentUser.nombre_apellido,
    usuario_rol: currentUser.rol,
    detalle: `Cambio de depósito realizado por ${currentUser.nombre_apellido}. Anterior: "${obj.ubicacion_actual || 'N/A'}" -> Nueva: "${ubicacionTexto}"`
  };

  const updated: ObjetoPerdido = {
    ...obj,
    ubicacion_actual: ubicacionTexto,
    trazabilidad: [...(obj.trazabilidad || []), evento]
  };

  objetos[index] = updated;
  setLocalObjetos(objetos);

  if (supabase) {
    try {
      await supabase.from('objetos_perdidos').update({
        ubicacion_actual: updated.ubicacion_actual,
        trazabilidad: updated.trazabilidad
      }).eq('id', objetoId);
    } catch (e) {
      console.warn('Error in cambiarDeposito Supabase:', e);
    }
  }

  return updated;
}

// Acción: Baja masiva por Donación
export async function bajaPorDonacion(
  objetoIds: string[],
  datos: DatosDonacion,
  currentUser: Usuario
): Promise<ObjetoPerdido[]> {
  const now = new Date().toISOString();
  const objetos = await fetchObjetosPerdidos();
  const updatedItems: ObjetoPerdido[] = [];

  const updatedList = objetos.map(obj => {
    if (objetoIds.includes(obj.id)) {
      const evento: EventoTrazabilidad = {
        id: `TR-${Date.now()}-DON-${obj.id}`,
        fecha: now,
        accion: 'BAJA_POR_DONACION',
        usuario_id: currentUser.id,
        usuario_nombre: currentUser.nombre_apellido,
        usuario_rol: currentUser.rol,
        detalle: `Baja masiva por donación a "${datos.institucion}". Acta física N°: ${datos.numero_registro_donacion}. Operado por ${currentUser.nombre_apellido}`
      };

      const updated: ObjetoPerdido = {
        ...obj,
        estado: 'BAJA - DONACION',
        ubicacion_actual: `Donado a: ${datos.institucion} (Acta ${datos.numero_registro_donacion})`,
        datos_donacion: datos,
        trazabilidad: [...(obj.trazabilidad || []), evento]
      };
      updatedItems.push(updated);
      return updated;
    }
    return obj;
  });

  setLocalObjetos(updatedList);

  if (supabase) {
    try {
      for (const obj of updatedItems) {
        await supabase.from('objetos_perdidos').update({
          estado: obj.estado,
          ubicacion_actual: obj.ubicacion_actual,
          datos_donacion: obj.datos_donacion,
          trazabilidad: obj.trazabilidad
        }).eq('id', obj.id);
      }
    } catch (e) {
      console.warn('Error in bajaPorDonacion Supabase:', e);
    }
  }

  return updatedItems;
}

// Acción: Destrucción
export async function destruirObjeto(
  objetoId: string,
  datos: DatosDestruccion,
  currentUser: Usuario
): Promise<ObjetoPerdido> {
  const now = new Date().toISOString();
  const objetos = await fetchObjetosPerdidos();
  const index = objetos.findIndex(o => o.id === objetoId);

  if (index === -1) throw new Error(`Objeto ${objetoId} no encontrado`);

  const obj = objetos[index];
  const evento: EventoTrazabilidad = {
    id: `TR-${Date.now()}-DEST`,
    fecha: now,
    accion: 'DESTRUCCION',
    usuario_id: currentUser.id,
    usuario_nombre: currentUser.nombre_apellido,
    usuario_rol: currentUser.rol,
    detalle: `Baja y destrucción autorizada. Acta física N°: ${datos.numero_registro_destruccion}. Motivo: ${datos.motivo}. Operado por ${currentUser.nombre_apellido}`
  };

  const updated: ObjetoPerdido = {
    ...obj,
    estado: 'DESTRUIDO',
    ubicacion_actual: `Destruido según Acta N° ${datos.numero_registro_destruccion}`,
    datos_destruccion: datos,
    trazabilidad: [...(obj.trazabilidad || []), evento]
  };

  objetos[index] = updated;
  setLocalObjetos(objetos);

  if (supabase) {
    try {
      await supabase.from('objetos_perdidos').update({
        estado: updated.estado,
        ubicacion_actual: updated.ubicacion_actual,
        datos_destruccion: updated.datos_destruccion,
        trazabilidad: updated.trazabilidad
      }).eq('id', objetoId);
    } catch (e) {
      console.warn('Error in destruirObjeto Supabase:', e);
    }
  }

  return updated;
}

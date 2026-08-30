export type EstadoObjetoPerdido = 
  | 'Encontrado'
  | 'Enviado'
  | 'EN ADMINISTRACION'
  | 'Entregado a Titular'
  | 'BAJA - DONACION'
  | 'DESTRUIDO';

export type EstadoDespacho = 
  | 'Pendiente de Transporte'
  | 'En Tránsito'
  | 'Entregado';

export interface EventoTrazabilidad {
  id: string;
  fecha: string; // ISO string
  accion: string;
  usuario_id?: string;
  usuario_nombre: string;
  usuario_rol?: string;
  detalle: string;
  metadata?: Record<string, any>;
}

export interface DatosEntregaTitular {
  numero_registro_documento: string;
  nombre: string;
  apellido: string;
  dni: string;
  mail: string;
  celular: string;
  direccion: string;
  fecha_entrega: string;
  usuario_entrega: string;
}

export interface DatosDonacion {
  numero_registro_donacion: string;
  fecha_donacion: string;
  institucion: string;
  observaciones?: string;
  usuario_donacion: string;
}

export interface DatosDestruccion {
  numero_registro_destruccion: string;
  fecha_destruccion: string;
  motivo: string;
  usuario_destruccion: string;
}

export interface ObjetoPerdido {
  id: string;
  created_at: string;
  fecha_hallazgo: string; // YYYY-MM-DD
  numero_planilla: string;
  personal_hallazgo: string;
  unidad_interno: string;
  recorrido_turno: string;
  sector_hallazgo: string;
  descripcion: string;
  estado: EstadoObjetoPerdido;
  operador_garita_id: string;
  operador_garita_nombre: string;
  conductor_firmo: boolean;
  conductor_firma_fecha?: string;
  conductor_firma_usuario?: string;
  despacho_id?: string;
  ubicacion_actual?: string;
  datos_entrega?: DatosEntregaTitular;
  datos_donacion?: DatosDonacion;
  datos_destruccion?: DatosDestruccion;
  trazabilidad: EventoTrazabilidad[];
}

export interface ItemDespacho {
  objeto_id: string;
  descripcion: string;
  numero_planilla: string;
  verificado_transporte: boolean;
  obs_transporte?: string;
  verificado_recepcion: boolean;
  obs_recepcion?: string;
}

export interface DespachoObjetosPerdidos {
  id: string;
  created_at: string;
  fecha_envio: string; // YYYY-MM-DD
  numero_precinto: string;
  estado: EstadoDespacho;
  operador_despacha_id: string;
  operador_despacha_nombre: string;
  transportador_id?: string;
  transportador_nombre?: string;
  transportador_fecha?: string;
  receptor_id?: string;
  receptor_nombre?: string;
  receptor_fecha?: string;
  ubicacion_oficina?: string;
  items: ItemDespacho[];
  trazabilidad: EventoTrazabilidad[];
}

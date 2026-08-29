import Header from '../components/Header';
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { X, Search, Filter, Plus, Clipboard, Shield, UserCheck, Wrench, Trash2, Clock } from 'lucide-react';
import { getDefaultPermiso } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';

const TABS = [
  'Usuarios',
  'Roles',
  'Nómina Conductores',
  'Nómina Mecánicos',
  'Flota Activa',
  'Temporadas',
  'Turnos',
  'Feriados',
  'Etapas de Servicios',
  'Ajustes Generales'
];

const DISPLAY_TABS = [
  'Usuarios',
  'Roles',
  'Ajustes Generales'
];

const MOVED_TABS_OPERACIONES = [
  'Turnos',
  'Etapas de Servicios',
  'Nómina Conductores',
  'Temporadas',
  'Feriados'
];

const MOVED_TABS_MANTENIMIENTO = [
  'Nómina Mecánicos',
  'Flota Activa'
];

const PATHS_OPTIONS = [
  { label: 'Control Garita', value: '/garita' },
  { label: 'Objetos Perdidos', value: '/objetos-perdidos' },
  { label: 'Registrar Firma (Móvil)', value: '/registrar-firma' },
  { label: 'Diagramación', value: '/diagramacion' },
  { label: 'Servicios Turísticos', value: '/servicios-turisticos' },
  { label: 'Servicios Regulares', value: '/servicios' },
  { label: 'Mecánica Matutina', value: '/mecanica-matutina' },
  { label: 'Control Mecánico', value: '/control-mecanico' },
  { label: 'Mis Controles', value: '/mis-controles' },
  { label: 'Auxilios', value: '/auxilios' },
  { label: 'SGC Auxilios', value: '/sgc-auxilios' },
  { label: 'Checklist Salida', value: '/checklist-salida' },
  { label: 'Durante Viaje', value: '/durante-viaje' },
  { label: 'Después del Viaje', value: '/despues-viaje' },
  { label: 'Reportes', value: '/reportes' },
  { label: 'Configuración / ABM (General)', value: '/configuracion' },
  { label: 'Turnos', value: '/configuracion?tab=Turnos' },
  { label: 'Etapas', value: '/configuracion?tab=Etapas de Servicios' },
  { label: 'Nómina Conductores', value: '/configuracion?tab=Nómina Conductores' },
  { label: 'Temporadas', value: '/configuracion?tab=Temporadas' },
  { label: 'Feriados', value: '/configuracion?tab=Feriados' },
  { label: 'Nómina Mecánicos', value: '/configuracion?tab=Nómina Mecánicos' },
  { label: 'Flota Activa', value: '/configuracion?tab=Flota Activa' },
];

const TABLE_MAP: Record<string, string> = {
  'usuarios': 'usuarios',
  'nómina conductores': 'nomina_conductores',
  'nómina mecánicos': 'nomina_mecanicos',
  'flota activa': 'flota_activa',
  'temporadas': 'temporadas',
  'turnos': 'turnos',
  'feriados': 'feriados',
  'etapas de servicios': 'etapas_servicios'
};

const PHYSICAL_COLUMNS: Record<string, string[]> = {
  usuarios: ['id', 'usuario', 'contrasena', 'nombre_apellido', 'dni', 'rol', 'estado'],
  nomina_conductores: ['id_conductor', 'legajo', 'apellido_nombre', 'empresa', 'dni', 'licencia_conducir'],
  nomina_mecanicos: ['id_mecanico', 'legajo', 'apellido_nombre', 'empresa', 'dni'],
  flota_activa: ['id_unidad', 'grupo', 'unidad', 'patente', 'categoria', 'empresa', 'fecha_alta', 'ano_modelo', 'carroceria', 'modelo_carroceria', 'marca_motor', 'serie_motor', 'marca_chasis', 'serie_chasis', 'ejes', 'pisos', 'capacidad_tanque', 'tipo_combustible', 'urea', 'transmision', 'asientos'],
  temporadas: ['id_temporada', 'nombre', 'fecha_inicio', 'fecha_fin'],
  turnos: ['id_turno', 'cod_turno', 'grupo', 'frecuencia', 'turno', 'tipo_turno', 'salida', 'hora_presentacion', 'hora_salida_base', 'hora_inicio', 'hora_fin', 'hora_llegada_base', 'llegada', 'id_temporada', 'vueltas'],
  feriados: ['id_feriado', 'fecha', 'observaciones'],
  etapas_servicios: ['id', 'grupo', 'punto', 'latitud', 'longitud']
};

const SCHEMAS: Record<string, any[]> = {
  usuarios: [
    { name: 'usuario', label: 'Usuario', type: 'text', required: true, help: 'Formato: nombre.apellido o DNI' },
    { name: 'contrasena', label: 'Contraseña', type: 'password', required: true, help: 'Por defecto será 123456 si se blanquea' },
    { name: 'nombre_apellido', label: 'Nombre y Apellido', type: 'text', required: true, help: 'Ej. Juan Pérez' },
    { name: 'dni', label: 'DNI', type: 'text', help: 'Sin puntos' },
    { name: 'rol', label: 'Rol', type: 'select', options: ['Administrador', 'Administrativo', 'Diagramador', 'Garita', 'Planific-Mantenimiento', 'Mecanico', 'Conductor'] },
    { name: 'estado', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'] }
  ],
  nomina_conductores: [
    { name: 'legajo', label: 'Legajo', type: 'text', required: true, help: 'N° de Legajo interno' },
    { name: 'apellido_nombre', label: 'Apellido y Nombre', type: 'text', required: true },
    { name: 'empresa', label: 'Empresa', type: 'text', help: 'Empresa a la que pertenece' },
    { name: 'dni', label: 'DNI', type: 'text', help: 'Sin puntos. Se usará como Usuario/Contraseña.' },
    { name: 'licencia_conducir', label: 'Licencia de Conducir', type: 'text', help: 'N° de licencia' }
  ],
  nomina_mecanicos: [
    { name: 'legajo', label: 'Legajo', type: 'text', required: true, help: 'N° de Legajo interno' },
    { name: 'apellido_nombre', label: 'Apellido y Nombre', type: 'text', required: true },
    { name: 'empresa', label: 'Empresa', type: 'text', help: 'Empresa a la que pertenece' },
    { name: 'dni', label: 'DNI', type: 'text', help: 'Sin puntos. Se usará como Usuario/Contraseña.' }
  ],
  flota_activa: [
    { name: 'grupo', label: 'Grupo', type: 'text', help: 'Ej. Grupo 1' },
    { name: 'unidad', label: 'Unidad', type: 'text', required: true, help: 'Ej. 540-01' },
    { name: 'patente', label: 'Patente', type: 'text', required: true, help: 'Ej. AB 123 CD' },
    { name: 'categoria', label: 'Categoría', type: 'text', help: 'Ej. Urbano / Larga Distancia' },
    { name: 'empresa', label: 'Empresa', type: 'text', help: 'Ej. Antonio Buttini' },
    { name: 'fecha_alta', label: 'Fecha Alta', type: 'date' },
    { name: 'ano_modelo', label: 'Año Modelo', type: 'number', help: 'Ej. 2022' },
    { name: 'carroceria', label: 'Carrocería', type: 'text', help: 'Ej. Marcopolo' },
    { name: 'modelo_carroceria', label: 'Modelo Carrocería', type: 'text', help: 'Ej. Paradiso 1800 DD' },
    { name: 'marca_motor', label: 'Marca Motor', type: 'text', help: 'Ej. Mercedes-Benz' },
    { name: 'serie_motor', label: 'Serie Motor', type: 'text' },
    { name: 'marca_chasis', label: 'Marca Chasis', type: 'text', help: 'Ej. Scania / Volvo' },
    { name: 'serie_chasis', label: 'Serie Chasis', type: 'text' },
    { name: 'ejes', label: 'Ejes', type: 'number', help: 'Ej. 2, 3 o 4' },
    { name: 'pisos', label: 'Pisos', type: 'number', help: 'Ej. 1 o 2 (Doble Piso)' },
    { name: 'capacidad_tanque', label: 'Capacidad Tanque (Lts)', type: 'number', help: 'Capacidad en litros' },
    { name: 'tipo_combustible', label: 'Tipo Combustible', type: 'select', options: ['INFINIA', 'DIESEL 500'] },
    { name: 'urea', label: 'UREA', type: 'select', options: ['Sí', 'No'] },
    { name: 'transmision', label: 'Transmisión', type: 'select', options: ['Manual', 'Automática', 'Automatizada'] },
    { name: 'asientos', label: 'Asientos', type: 'number', help: 'Cantidad total de asientos' }
  ],
  temporadas: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true, help: 'Ej. Verano 2026' },
    { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date', required: true },
    { name: 'fecha_fin', label: 'Fecha Fin', type: 'date', required: true }
  ],
  turnos: [
    { name: 'cod_turno', label: 'Cód Turno', type: 'text', required: true, help: 'Ej. T-1024' },
    { name: 'temporada', label: 'Temporada', type: 'select', options: [], help: 'Seleccione la temporada correspondiente' },
    { name: 'grupo', label: 'Grupo', type: 'text' },
    { name: 'frecuencia', label: 'Frecuencia', type: 'text' },
    { name: 'turno', label: 'Turno', type: 'text' },
    { name: 'tipo_turno', label: 'Tipo', type: 'select', options: ['Urbano', 'Media', 'Larga'], help: 'Urbano, Media o Larga' },
    { name: 'salida', label: 'Salida', type: 'text', help: 'BASE u otro' },
    { name: 'hora_presentacion', label: 'Hora de Presentación', type: 'time', help: 'Ej. 07:15' },
    { name: 'hora_salida_base', label: 'Hora Salida de Base', type: 'time', help: 'Ej. 07:30' },
    { name: 'hora_inicio', label: 'Hora Inicio', type: 'time', required: true, help: 'Ej. 08:00' },
    { name: 'hora_fin', label: 'Hora Fin', type: 'time', required: true, help: 'Ej. 16:00' },
    { name: 'hora_llegada_base', label: 'Hora Llegada a Base', type: 'time', help: 'Ej. 16:30' },
    { name: 'llegada', label: 'Llegada', type: 'text', help: 'BASE u otro lugar' }
  ],
  feriados: [
    { name: 'fecha', label: 'Fecha', type: 'date', required: true },
    { name: 'observaciones', label: 'Observaciones', type: 'text', help: 'Motivo del feriado' }
  ],
  etapas_servicios: [
    { name: 'grupo', label: 'Grupo de Servicios / Línea', type: 'text', required: true, help: 'Ej: Grupo 100, Grupo 500, Línea 579' },
    { name: 'punto', label: 'Nombre del Punto / Etapa', type: 'text', required: true, help: 'Ej: Terminal Mendoza, Control San Rafael, Parada Luján' },
    { name: 'latitud', label: 'Latitud (GPS)', type: 'number', required: true, help: 'Ej: -34.6152' },
    { name: 'longitud', label: 'Longitud (GPS)', type: 'number', required: true, help: 'Ej: -68.3241' }
  ]
};

const COLUMN_ALIASES: Record<string, Record<string, string>> = {
  nomina_conductores: {
    'legajo': 'legajo', 'leg': 'legajo', 'nro': 'legajo', 'id': 'legajo', 'nro legajo': 'legajo', 'n° legajo': 'legajo',
    'apellido y nombre': 'apellido_nombre', 'apellido_nombre': 'apellido_nombre', 'nombre': 'apellido_nombre', 'nombre y apellido': 'apellido_nombre', 'conductor': 'apellido_nombre', 'chofer': 'apellido_nombre',
    'empresa': 'empresa', 'emp': 'empresa',
    'dni': 'dni', 'documento': 'dni', 'cuil': 'dni',
    'licencia': 'licencia_conducir', 'licencia_conducir': 'licencia_conducir', 'carnet': 'licencia_conducir'
  },
  nomina_mecanicos: {
    'legajo': 'legajo', 'leg': 'legajo', 'nro': 'legajo', 'id': 'legajo', 'nro legajo': 'legajo', 'n° legajo': 'legajo',
    'apellido y nombre': 'apellido_nombre', 'apellido_nombre': 'apellido_nombre', 'nombre': 'apellido_nombre', 'nombre y apellido': 'apellido_nombre', 'mecanico': 'apellido_nombre',
    'empresa': 'empresa', 'emp': 'empresa',
    'dni': 'dni', 'documento': 'dni', 'cuil': 'dni'
  },
  flota_activa: {
    'grupo': 'grupo',
    'unidad': 'unidad', 'coche': 'unidad', 'num': 'unidad', 'unid': 'unidad', 'nro': 'unidad', 'n° unidad': 'unidad',
    'patente': 'patente', 'dominio': 'patente',
    'categoria': 'categoria', 'categoría': 'categoria', 'cat': 'categoria',
    'empresa': 'empresa', 'emp': 'empresa',
    'fecha alta': 'fecha_alta', 'fecha_alta': 'fecha_alta', 'alta': 'fecha_alta',
    'ano modelo': 'ano_modelo', 'ano_modelo': 'ano_modelo', 'año modelo': 'ano_modelo', 'año_modelo': 'ano_modelo', 'modelo': 'ano_modelo',
    'carroceria': 'carroceria', 'carrocería': 'carroceria',
    'modelo carroceria': 'modelo_carroceria', 'modelo_carroceria': 'modelo_carroceria', 'modelo carrocería': 'modelo_carroceria',
    'marca motor': 'marca_motor', 'marca_motor': 'marca_motor',
    'serie motor': 'serie_motor', 'serie_motor': 'serie_motor',
    'marca chasis': 'marca_chasis', 'marca_chasis': 'marca_chasis',
    'serie chasis': 'serie_chasis', 'serie_chasis': 'serie_chasis',
    'ejes': 'ejes',
    'pisos': 'pisos',
    'capacidad tanque': 'capacidad_tanque', 'capacidad_tanque': 'capacidad_tanque', 'tanque': 'capacidad_tanque',
    'tipo combustible': 'tipo_combustible', 'tipo_combustible': 'tipo_combustible', 'combustible': 'tipo_combustible',
    'urea': 'urea',
    'transmision': 'transmision', 'transmisión': 'transmision',
    'asientos': 'asientos', 'capacidad': 'asientos'
  },
  usuarios: {
    'usuario': 'usuario', 'user': 'usuario',
    'contrasena': 'contrasena', 'password': 'contrasena', 'clave': 'contrasena',
    'nombre_apellido': 'nombre_apellido', 'nombre y apellido': 'nombre_apellido', 'nombre': 'nombre_apellido', 'apellido y nombre': 'nombre_apellido',
    'dni': 'dni', 'documento': 'dni',
    'rol': 'rol',
    'estado': 'estado'
  },
  temporadas: {
    'nombre': 'nombre', 'temporada': 'nombre',
    'fecha_inicio': 'fecha_inicio', 'inicio': 'fecha_inicio', 'desde': 'fecha_inicio',
    'fecha_fin': 'fecha_fin', 'fin': 'fecha_fin', 'hasta': 'fecha_fin'
  },
  turnos: {
    'cod_turno': 'cod_turno', 'codigo': 'cod_turno', 'cod': 'cod_turno', 'cod turno': 'cod_turno', 'cód turno': 'cod_turno', 'codigo turno': 'cod_turno', 'cód. turno': 'cod_turno',
    'temporada': 'temporada', 'temp': 'temporada',
    'grupo': 'grupo',
    'frecuencia': 'frecuencia',
    'turno': 'turno',
    'tipo_turno': 'tipo_turno', 'tipo': 'tipo_turno', 'tipo turno': 'tipo_turno', 'tipo de turno': 'tipo_turno',
    'salida': 'salida', 'servicio': 'salida',
    'hora_presentacion': 'hora_presentacion', 'hora presentacion': 'hora_presentacion', 'hora de presentacion': 'hora_presentacion', 'hora de presentación': 'hora_presentacion', 'hora presentación': 'hora_presentacion', 'presentacion': 'hora_presentacion', 'presentación': 'hora_presentacion', 'hs presentacion': 'hora_presentacion', 'hs presentación': 'hora_presentacion', 'hs. presentacion': 'hora_presentacion', 'hs. presentación': 'hora_presentacion',
    'hora_salida_base': 'hora_salida_base', 'hora salida de base': 'hora_salida_base', 'hora salida base': 'hora_salida_base', 'salida de base': 'hora_salida_base', 'salida base': 'hora_salida_base', 'hs salida base': 'hora_salida_base',
    'hora_inicio': 'hora_inicio', 'hora inicio': 'hora_inicio', 'inicio': 'hora_inicio', 'hs inicio': 'hora_inicio',
    'hora_fin': 'hora_fin', 'hora fin': 'hora_fin', 'fin': 'hora_fin', 'hs fin': 'hora_fin',
    'hora_llegada_base': 'hora_llegada_base', 'hora llegada a base': 'hora_llegada_base', 'hora llegada base': 'hora_llegada_base', 'llegada a base': 'hora_llegada_base', 'llegada base': 'hora_llegada_base', 'hs llegada base': 'hora_llegada_base',
    'llegada': 'llegada', 'queda fuera': 'llegada', 'queda_fuera (si / no)': 'llegada', 'queda fuera (si / no)': 'llegada', 'queda fuera (sí / no)': 'llegada', 'fuera': 'llegada'
  },
  feriados: {
    'fecha': 'fecha', 'dia': 'fecha',
    'observaciones': 'observaciones', 'motivo': 'observaciones', 'descripcion': 'observaciones'
  },
  etapas_servicios: {
    'grupo': 'grupo', 'grupo de servicios': 'grupo', 'linea': 'grupo', 'línea': 'grupo',
    'punto': 'punto', 'punto / etapa': 'punto', 'etapa': 'punto', 'nombre del punto': 'punto',
    'latitud': 'latitud', 'lat': 'latitud',
    'longitud': 'longitud', 'lng': 'longitud', 'lon': 'longitud'
  }
};

function cleanCell(cell: string) {
  if (!cell) return '';
  return cell.replace(/\u00A0/g, ' ').trim();
}

function normalizeKey(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function resolveColumnName(rawHeader: string, table: string, schema: any[]): string | null {
  const norm = normalizeKey(rawHeader);
  const aliases = COLUMN_ALIASES[table] || {};
  if (aliases[norm]) return aliases[norm];
  
  const schemaMatch = schema?.find(s => normalizeKey(s.name) === norm || normalizeKey(s.label) === norm);
  if (schemaMatch) return schemaMatch.name;

  return null;
}

function isInternalIdColumn(col: string): boolean {
  const c = col.toLowerCase();
  return c === 'id' || c === 'created_at' || c === 'id_conductor' || c === 'id_mecanico' || c === 'id_unidad' || c === 'id_turno' || c === 'id_feriado' || c === 'id_temporada' || c === 'id_usuario' || c.startsWith('id_');
}

// Get or set local extensions store
function getExtStore(table: string): Record<string, any> {
  try {
    const raw = localStorage.getItem(`ext_store_${table}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExtStore(table: string, store: Record<string, any>) {
  try {
    localStorage.setItem(`ext_store_${table}`, JSON.stringify(store));
  } catch (e) {
    console.error('Error saving ext store', e);
  }
}

function getRecordKey(row: any): string {
  return String(row.id_unidad || row.unidad || row.id_conductor || row.legajo || row.id_mecanico || row.id_turno || row.cod_turno || row.id_temporada || row.id || row.fecha || Math.random());
}

function splitPayload(table: string, fullData: any) {
  const allowedCols = PHYSICAL_COLUMNS[table] || [];
  const remotePayload: any = {};
  const extendedData: any = {};

  Object.entries(fullData).forEach(([k, v]) => {
    if (v === undefined || v === '') return;
    if (allowedCols.includes(k)) {
      remotePayload[k] = v;
    } else {
      extendedData[k] = v;
    }
  });

  return { remotePayload, extendedData };
}

function getTablePrimaryKey(table: string): string {
  switch (table) {
    case 'flota_activa': return 'id_unidad';
    case 'nomina_conductores': return 'id_conductor';
    case 'nomina_mecanicos': return 'id_mecanico';
    case 'usuarios': return 'id';
    case 'turnos': return 'id_turno';
    case 'temporadas': return 'id_temporada';
    case 'feriados': return 'id_feriado';
    default: return 'id';
  }
}

function findMatchingRow(table: string, payload: any, dbRows: any[]) {
  const norm = (val: any) => String(val || '').trim().toLowerCase();
  if (!dbRows || dbRows.length === 0) return null;

  if (table === 'flota_activa') {
    return dbRows.find(r => 
      (payload.patente && r.patente && norm(payload.patente) === norm(r.patente)) ||
      (payload.unidad && r.unidad && norm(payload.unidad) === norm(r.unidad))
    );
  }
  if (table === 'nomina_conductores' || table === 'nomina_mecanicos') {
    return dbRows.find(r => 
      (payload.legajo && r.legajo && norm(payload.legajo) === norm(r.legajo)) ||
      (payload.dni && r.dni && norm(payload.dni) === norm(r.dni))
    );
  }
  if (table === 'usuarios') {
    return dbRows.find(r => 
      (payload.usuario && r.usuario && norm(payload.usuario) === norm(r.usuario)) ||
      (payload.dni && r.dni && norm(payload.dni) === norm(r.dni))
    );
  }
  if (table === 'turnos') {
    return dbRows.find(r => payload.cod_turno && r.cod_turno && norm(payload.cod_turno) === norm(r.cod_turno));
  }
  if (table === 'temporadas') {
    return dbRows.find(r => payload.nombre && r.nombre && norm(payload.nombre) === norm(r.nombre));
  }
  if (table === 'feriados') {
    return dbRows.find(r => payload.fecha && r.fecha && norm(payload.fecha) === norm(r.fecha));
  }

  return null;
}

function parseImportText(text: string, table: string, schema: any[], overrideHeader: boolean | null) {
  const rawLines = text.split(/\r?\n/).filter(line => line.replace(/\u00A0/g, ' ').trim() !== '');
  if (rawLines.length === 0) return { inserts: [], columnNames: [], isHeaderDetected: false, totalRows: 0 };

  const rows = rawLines.map(line => {
    let cells = line.split('\t');
    if (cells.length === 1 && line.includes(';')) cells = line.split(';');
    return cells.map(cleanCell);
  });

  const firstRow = rows[0];
  const schemaFieldNames = schema ? schema.map(s => s.name) : [];

  let isHeader = false;
  if (overrideHeader !== null) {
    isHeader = overrideHeader;
  } else {
    const firstCell = firstRow[0] || '';
    const isFirstCellNumeric = /^\d+$/.test(firstCell);

    if (!isFirstCellNumeric) {
      const matchCount = firstRow.filter(cell => resolveColumnName(cell, table, schema) !== null).length;
      if (matchCount > 0) {
        isHeader = true;
      }
    }
  }

  const columnMap: (string | null)[] = [];
  let dataRows: string[][] = [];

  if (isHeader) {
    firstRow.forEach((cell) => {
      columnMap.push(resolveColumnName(cell, table, schema));
    });
    dataRows = rows.slice(1);
  } else {
    firstRow.forEach((_, idx) => {
      columnMap.push(schemaFieldNames[idx] || null);
    });
    dataRows = rows;
  }

  const inserts: any[] = [];
  dataRows.forEach(row => {
    const obj: any = {};
    row.forEach((cellVal, idx) => {
      const colName = columnMap[idx];
      if (colName && cellVal !== '') {
        obj[colName] = cellVal;
      }
    });
    if (Object.keys(obj).length > 0) {
      inserts.push(obj);
    }
  });

  const columnNames = columnMap.map((col, idx) => {
    if (!col) return `Columna ${idx + 1} (Ignorada)`;
    const s = schema?.find(item => item.name === col);
    return s ? `${s.label} (${col})` : col;
  });

  return {
    inserts,
    columnNames,
    isHeaderDetected: isHeader,
    totalRows: inserts.length
  };
}

export default function Configuracion() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => {
    const tabParam = searchParams.get('tab');
    if (!tabParam) return 'Usuarios';
    const found = TABS.find(t => 
      t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 
      tabParam.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );
    return found || 'Usuarios';
  }, [searchParams]);

  const setActiveTab = (tabName: string) => {
    setSearchParams({ tab: tabName });
  };

  const [data, setData] = useState<any[]>([]);
  const [temporadasList, setTemporadasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [rolesPermisos, setRolesPermisos] = useState<any[]>([]);
  const [forceHasHeader, setForceHasHeader] = useState<boolean | null>(null);
  
  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'todos' | 'sistema' | 'conductor' | 'mecanico'>('todos');
  const [seasonFilter, setSeasonFilter] = useState<string>('todas');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [serviciosRegulares, setServiciosRegulares] = useState<any[]>([]);

  const addMinutesToTime = (timeStr: string, mins: number): string => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    const hours = parseInt(hStr, 10) || 0;
    const minutes = parseInt(mStr, 10) || 0;
    let totalMins = hours * 60 + minutes + mins;
    totalMins = totalMins % (24 * 60);
    const nextH = Math.floor(totalMins / 60);
    const nextM = totalMins % 60;
    return `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`;
  };

  const updateTurnTimes = (nextVueltas: any[]) => {
    const updatedForm = { ...formData };
    if (nextVueltas.length > 0) {
      const firstVuelta = nextVueltas[0];
      const lastVuelta = nextVueltas[nextVueltas.length - 1];
      
      if (firstVuelta && firstVuelta.hora_salida) {
        updatedForm.hora_inicio = firstVuelta.hora_salida;
      }
      if (lastVuelta && lastVuelta.hora_llegada) {
        updatedForm.hora_fin = lastVuelta.hora_llegada;
      }
    }
    updatedForm.vueltas = nextVueltas;
    setFormData(updatedForm);
  };

  const handleAddVuelta = (index?: number) => {
    const nextVueltas = [...(formData.vueltas || [])];
    const newVuelta = {
      id: 'v-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      servicio_id: '',
      variante_num: 1,
      tiempo_marcha: 0,
      hora_salida: '',
      hora_llegada: ''
    };
    if (typeof index === 'number') {
      nextVueltas.splice(index + 1, 0, newVuelta);
    } else {
      nextVueltas.push(newVuelta);
    }
    updateTurnTimes(nextVueltas);
  };

  const handleRemoveVuelta = (index: number) => {
    const nextVueltas = (formData.vueltas || []).filter((_: any, idx: number) => idx !== index);
    updateTurnTimes(nextVueltas);
  };

  const handleVueltaChange = (index: number, updates: any) => {
    const nextVueltas = (formData.vueltas || []).map((v: any, idx: number) => {
      if (idx === index) {
        const merged = { ...v, ...updates };
        if (merged.hora_salida && merged.tiempo_marcha !== undefined) {
          merged.hora_llegada = addMinutesToTime(merged.hora_salida, merged.tiempo_marcha);
        } else {
          merged.hora_llegada = '';
        }
        return merged;
      }
      return v;
    });
    updateTurnTimes(nextVueltas);
  };

  const serviceOptions = useMemo(() => {
    const options: any[] = [];
    serviciosRegulares.forEach((srv: any) => {
      const tramos = srv.tramos || [];
      if (tramos.length === 0) return;
      const lastTramo = tramos[tramos.length - 1];
      
      // Variante 1 (always exists)
      options.push({
        id: `${srv.id}-v1`,
        servicio_id: srv.id,
        variante_num: 1,
        tiempo_marcha: lastTramo.tiempo1 || 0,
        label: `${srv.codigo} - ${srv.nombre} (${lastTramo.tiempo1 || 0} min)`
      });

      // Variante 2
      if (lastTramo.tiempo2 > 0) {
        options.push({
          id: `${srv.id}-v2`,
          servicio_id: srv.id,
          variante_num: 2,
          tiempo_marcha: lastTramo.tiempo2,
          label: `${srv.codigo} - ${srv.nombre} - Var 2 (${lastTramo.tiempo2} min)`
        });
      }

      // Variante 3
      if (lastTramo.tiempo3 > 0) {
        options.push({
          id: `${srv.id}-v3`,
          servicio_id: srv.id,
          variante_num: 3,
          tiempo_marcha: lastTramo.tiempo3,
          label: `${srv.codigo} - ${srv.nombre} - Var 3 (${lastTramo.tiempo3} min)`
        });
      }

      // Variante 4
      if (lastTramo.tiempo4 > 0) {
        options.push({
          id: `${srv.id}-v4`,
          servicio_id: srv.id,
          variante_num: 4,
          tiempo_marcha: lastTramo.tiempo4,
          label: `${srv.codigo} - ${srv.nombre} - Var 4 (${lastTramo.tiempo4} min)`
        });
      }

      // Variante 5
      if (lastTramo.tiempo5 > 0) {
        options.push({
          id: `${srv.id}-v5`,
          servicio_id: srv.id,
          variante_num: 5,
          tiempo_marcha: lastTramo.tiempo5,
          label: `${srv.codigo} - ${srv.nombre} - Var 5 (${lastTramo.tiempo5} min)`
        });
      }
    });
    return options;
  }, [serviciosRegulares]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ idField: string; id: string; recordRow?: any } | null>(null);
  
  // Reinforcement calendar states
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  // Settings state
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('app_logo') || '');
  const [empresaName, setEmpresaName] = useState(() => localStorage.getItem('app_name') || 'Transportes Buttini');
  const [rotationInterval, setRotationInterval] = useState(() => localStorage.getItem('board_rotation_interval') || '10');
  const [itemsPerPage, setItemsPerPage] = useState(() => localStorage.getItem('board_items_per_page') || '8');
  const [roleLandings, setRoleLandings] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('app_role_landing_pages') || '{}');
    } catch (e) {
      return {};
    }
  });

  const handleSaveLanding = (rol: string, val: string) => {
    const updated = { ...roleLandings, [rol]: val };
    setRoleLandings(updated);
    localStorage.setItem('app_role_landing_pages', JSON.stringify(updated));
  };

  const tableName = TABLE_MAP[activeTab.toLowerCase()];
  
  // Dynamic Schema for turnos to populate season options
  const currentSchema = useMemo(() => {
    const base = SCHEMAS[tableName];
    if (!base) return [];
    if (tableName === 'turnos') {
      const seasonNames = temporadasList.map(t => t.nombre).filter(Boolean);
      return base.map(f => {
        if (f.name === 'temporada') {
          return {
            ...f,
            type: 'select',
            options: seasonNames.length > 0 ? seasonNames : ['Verano 2026', 'Invierno 2026', 'Alta Temporada', 'Baja Temporada']
          };
        }
        return f;
      });
    }
    return base;
  }, [tableName, temporadasList]);

  // Load Seasons list once for select options
  useEffect(() => {
    async function loadSeasons() {
      const { data: res } = await supabase.from('temporadas').select('*');
      if (res && res.length > 0) {
        setTemporadasList(res);
      }
    }
    async function loadServiciosRegulares() {
      try {
        const { data, error } = await supabase
          .from('servicios_regulares')
          .select('*')
          .order('codigo', { ascending: true });
        if (error) throw error;
        if (data) {
          setServiciosRegulares(data);
        }
      } catch (err) {
        console.warn('Error fetching servicios_regulares, trying local fallback:', err);
        const localData = localStorage.getItem('app_servicios_regulares');
        if (localData) {
          setServiciosRegulares(JSON.parse(localData));
        }
      }
    }
    loadSeasons();
    loadServiciosRegulares();
  }, []);

  useEffect(() => {
    if (tableName) {
      fetchData();
      setIsPasting(false);
      setPasteText('');
      setSearchTerm('');
      setUserRoleFilter('todos');
      setSeasonFilter('todas');
      setForceHasHeader(null);
      setIsModalOpen(false);
    }
  }, [activeTab]);


  async function fetchData() {
    setLoading(true);
    if (activeTab === 'Roles') {
      const { data, error } = await supabase.from('roles_permisos').select('*');
      let loaded = [];
      if (!error && data && data.length > 0) {
        loaded = data;
        localStorage.setItem('app_roles_permisos', JSON.stringify(data));
      } else {
        const local = localStorage.getItem('app_roles_permisos');
        if (local) {
          loaded = JSON.parse(local);
        }
      }
      setRolesPermisos(loaded);
      setLoading(false);
      return;
    }
    let query = supabase.from(tableName).select('*');

    if (tableName === 'flota_activa') {
      query = query.order('unidad', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    const { data: result, error } = await query;
    
    const extStore = getExtStore(tableName);

    if (!error && result) {
      // Merge with extended local storage data
      const merged = result.map((row: any) => {
        const key = getRecordKey(row);
        const ext = extStore[key] || {};
        const combined = { ...row, ...ext };

        if (tableName === 'turnos') {
          if (!combined.temporada && combined.id_temporada) {
            const foundSeason = temporadasList.find(s => s.id_temporada === combined.id_temporada);
            if (foundSeason) combined.temporada = foundSeason.nombre;
          }
        }

        return combined;
      });
      setData(merged);
    } else {
      setData([]);
    }
    setLoading(false);
  }

  async function handleDelete(idField: string, id: string, recordRow?: any) {
    setDeleteConfirm({ idField, id, recordRow });
  }

  async function executeDelete() {
    if (!deleteConfirm) return;
    const { idField, id, recordRow } = deleteConfirm;
    setLoading(true);
    const { error } = await supabase.from(tableName).delete().eq(idField, id);
    setLoading(false);
    setDeleteConfirm(null);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      if (recordRow) {
        const extStore = getExtStore(tableName);
        const key = getRecordKey(recordRow);
        delete extStore[key];
        saveExtStore(tableName, extStore);
      }
      fetchData();
    }
  }

  function openModal(record?: any) {
    setEditingRecord(record || null);
    if (record) {
      let parsedVueltas = [];
      if (record.vueltas) {
        if (typeof record.vueltas === 'string') {
          try {
            parsedVueltas = JSON.parse(record.vueltas);
          } catch (e) {
            parsedVueltas = [];
          }
        } else if (Array.isArray(record.vueltas)) {
          parsedVueltas = record.vueltas;
        }
      }
      setFormData({ ...record, vueltas: parsedVueltas });
    } else {
      setFormData({ vueltas: [] });
    }
    setCalendarYear(new Date().getFullYear());
    setCalendarMonth(new Date().getMonth());
    setIsModalOpen(true);
  }

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    const fullData = { ...formData };

    // If turnos and season selected, link id_temporada if available
    if (tableName === 'turnos' && fullData.temporada) {
      const foundSeason = temporadasList.find(s => s.nombre === fullData.temporada);
      if (foundSeason) {
        fullData.id_temporada = foundSeason.id_temporada;
      }
    }

    const { remotePayload, extendedData } = splitPayload(tableName, fullData);

    const primaryKeyCols = PHYSICAL_COLUMNS[tableName] || Object.keys(data[0] || {});
    const primaryKey = primaryKeyCols[0] || 'id';

    let savedRow: any = null;
    let error = null;

    if (editingRecord && primaryKey) {
       const payloadWithoutPk = { ...remotePayload };
       delete payloadWithoutPk[primaryKey];
       const { data: updated, error: updateError } = await supabase
         .from(tableName)
         .update(payloadWithoutPk)
         .eq(primaryKey, editingRecord[primaryKey])
         .select();
       error = updateError;
       savedRow = updated ? updated[0] : null;
    } else {
       const { data: inserted, error: insertError } = await supabase
         .from(tableName)
         .insert([remotePayload])
         .select();
       error = insertError;
       savedRow = inserted ? inserted[0] : null;
       
       // Auto-create user for mechanics and drivers
       if (!error && (tableName === 'nomina_conductores' || tableName === 'nomina_mecanicos')) {
         const rol = tableName === 'nomina_conductores' ? 'Conductor' : 'Mecanico';
         const defaultUser = fullData.dni || fullData.legajo;
         await supabase.from('usuarios').insert([{
           usuario: defaultUser,
           contrasena: defaultUser || '123456',
           nombre_apellido: fullData.apellido_nombre,
           dni: fullData.dni,
           rol: rol,
           estado: 'Activo'
         }]);
       }
    }

    if (error) {
      setLoading(false);
      alert('Error al guardar: ' + error.message);
      return;
    }

    // Save extended attributes locally
    const targetRow = savedRow || { ...editingRecord, ...fullData };
    const key = getRecordKey(targetRow);
    const extStore = getExtStore(tableName);
    extStore[key] = { ...(extStore[key] || {}), ...extendedData, ...fullData };
    saveExtStore(tableName, extStore);

    setLoading(false);
    setIsModalOpen(false);
    fetchData();
  }


  function handleTogglePermiso(rol: string, pantalla: string, currentVal: boolean) {
    const newVal = !currentVal;
    let nextPerms: any[] = [];
    setRolesPermisos(prev => {
      const existing = prev.find(p => p.rol === rol && p.pantalla === pantalla);
      if (existing) {
        nextPerms = prev.map(p => (p.rol === rol && p.pantalla === pantalla) ? { ...p, acceso: newVal } : p);
      } else {
        nextPerms = [...prev, { rol, pantalla, acceso: newVal }];
      }
      localStorage.setItem('app_roles_permisos', JSON.stringify(nextPerms));
      return nextPerms;
    });
  }

  async function handleImportExcel() {
    if (!pasteText.trim()) return;
    
    const parsed = parseImportText(pasteText, tableName, currentSchema, forceHasHeader);
    if (parsed.inserts.length === 0) {
      alert('No se encontraron filas de datos válidas para importar.');
      return;
    }

    setLoading(true);

    // 1. Fetch current database state to check for existing records
    const { data: currentDbRows, error: fetchErr } = await supabase.from(tableName).select('*');
    if (fetchErr) {
      console.warn('Could not pre-fetch table state:', fetchErr.message);
    }

    const workingDbState = [...(currentDbRows || [])];
    const primaryKeyCol = getTablePrimaryKey(tableName);
    const extStore = getExtStore(tableName);

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (let idx = 0; idx < parsed.inserts.length; idx++) {
      const item = parsed.inserts[idx];
      if (tableName === 'turnos' && item.temporada) {
        const foundSeason = temporadasList.find(s => s.nombre === item.temporada);
        if (foundSeason) {
          item.id_temporada = foundSeason.id_temporada;
        }
      }

      const { remotePayload, extendedData } = splitPayload(tableName, item);
      const match = findMatchingRow(tableName, remotePayload, workingDbState);

      if (match && match[primaryKeyCol]) {
        const payloadWithoutPk = { ...remotePayload };
        delete payloadWithoutPk[primaryKeyCol];
        // UPDATE existing record
        const { data: updatedRows, error: updateError } = await supabase
          .from(tableName)
          .update(payloadWithoutPk)
          .eq(primaryKeyCol, match[primaryKeyCol])
          .select();

        if (!updateError && updatedRows && updatedRows.length > 0) {
          Object.assign(match, updatedRows[0]);
          const key = getRecordKey(updatedRows[0]);
          extStore[key] = { ...item, ...extendedData };
          updatedCount++;
        } else {
          console.error('Update error on row:', tableName, item, updateError);
          errorCount++;
        }
      } else {
        // INSERT new record
        const { data: insertedRows, error: insertError } = await supabase
          .from(tableName)
          .insert([remotePayload])
          .select();

        if (!insertError && insertedRows && insertedRows.length > 0) {
          const insertedRow = insertedRows[0];
          workingDbState.push(insertedRow);
          const key = getRecordKey(insertedRow);
          extStore[key] = { ...item, ...extendedData };
          createdCount++;
        } else {
          console.error('Insert error on row:', item, insertError);
          errorCount++;
        }
      }
    }

    saveExtStore(tableName, extStore);

    // Auto-create user accounts if drivers or mechanics
    if (tableName === 'nomina_conductores' || tableName === 'nomina_mecanicos') {
      const rol = tableName === 'nomina_conductores' ? 'Conductor' : 'Mecanico';
      const userInserts = parsed.inserts
        .map(item => {
          const defaultUser = item.dni || item.legajo;
          return {
            usuario: defaultUser,
            contrasena: defaultUser || '123456',
            nombre_apellido: item.apellido_nombre || defaultUser,
            dni: item.dni || item.legajo,
            rol: rol,
            estado: 'Activo'
          };
        })
        .filter(u => u.usuario);

      if (userInserts.length > 0) {
        await supabase.from('usuarios').upsert(userInserts, { onConflict: 'usuario', ignoreDuplicates: true });
      }
    }

    setLoading(false);
    
    let msg = `¡Importación finalizada! ${createdCount} registro(s) nuevo(s) creado(s)`;
    if (updatedCount > 0) msg += ` y ${updatedCount} actualizado(s)`;
    msg += `.`;
    if (errorCount > 0) msg += ` (${errorCount} filas tuvieron error y fueron omitidas).`;

    alert(msg);
    fetchData();
    setIsPasting(false);
    setPasteText('');
    setForceHasHeader(null);
  }

  // Derive display columns from currentSchema
  const columns = useMemo(() => {
    if (currentSchema && currentSchema.length > 0) {
      return currentSchema.map(s => s.name);
    }
    if (data.length > 0) {
      return Object.keys(data[0]).filter(k => !isInternalIdColumn(k));
    }
    return [];
  }, [currentSchema, data]);

  const primaryKeyCols = PHYSICAL_COLUMNS[tableName] || Object.keys(data[0] || {});
  const primaryKey = primaryKeyCols[0] || 'id';

  // Filter rows based on search term, role filter, and season filter
  const filteredData = useMemo(() => {
    return data.filter(row => {
      // 1. Role filter for Users tab
      if (tableName === 'usuarios') {
        const rol = (row.rol || '').toLowerCase();
        if (userRoleFilter === 'conductor' && rol !== 'conductor') return false;
        if (userRoleFilter === 'mecanico' && rol !== 'mecanico') return false;
        if (userRoleFilter === 'sistema' && (rol === 'conductor' || rol === 'mecanico')) return false;
      }

      // 2. Season filter for Turnos tab
      if (tableName === 'turnos' && seasonFilter !== 'todas') {
        const rowSeason = String(row.temporada || '').trim().toLowerCase();
        const filterSeason = String(seasonFilter).trim().toLowerCase();
        const seasonObj = temporadasList.find(s => String(s.nombre || '').trim().toLowerCase() === filterSeason || String(s.id_temporada) === filterSeason);
        const matchedName = seasonObj ? String(seasonObj.nombre || '').trim().toLowerCase() : filterSeason;
        const matchedId = seasonObj ? String(seasonObj.id_temporada) : '';

        const rowSeasonId = String(row.id_temporada || '');
        if (rowSeason !== matchedName && (matchedId ? rowSeasonId !== matchedId : true)) {
          return false;
        }
      }

      // 3. Text search across all fields
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return Object.entries(row).some(([key, val]) => {
        if (isInternalIdColumn(key)) return false;
        return String(val || '').toLowerCase().includes(term);
      });
    });
  }, [data, tableName, userRoleFilter, seasonFilter, temporadasList, searchTerm]);

  function renderCell(col: string, val: any) {
    if (val === null || val === undefined) return '-';
    if (col === 'contrasena') return '••••••••';
    return String(val);
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
         setLogoUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveAjustes = () => {
    localStorage.setItem('app_logo', logoUrl);
    localStorage.setItem('app_name', empresaName);
    localStorage.setItem('board_rotation_interval', rotationInterval);
    localStorage.setItem('board_items_per_page', itemsPerPage);
    alert('Ajustes guardados correctamente');
  };

  const handleResetPassword = async () => {
    if (!editingRecord || !primaryKey) return;
    setLoading(true);
    const { error } = await supabase.from(tableName).update({ contrasena: '123456' }).eq(primaryKey, editingRecord[primaryKey]);
    setLoading(false);
    if (error) alert('Error: ' + error.message);
    else {
      alert('Contraseña reseteada a "123456". Se pedirá cambio en el próximo inicio de sesión.');
      setIsModalOpen(false);
      fetchData();
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      if (activeTab === 'Roles') {
        const allRoles = ['Administrador', 'Administrativo', 'Diagramador', 'Garita', 'Planific-Mantenimiento', 'Mecanico', 'Conductor'];
        const allPantallas = ['Garita', 'Diagramacion', 'Servicios Turísticos', 'Servicios', 'Mecanica Matutina', 'Checklist Salida', 'Durante Viaje', 'Despues de Viaje', 'Control Mecanico', 'Mis Controles', 'Configuracion', 'Reportes - Generales', 'Reportes - Presentacion', 'Reportes - Mecanica', 'Reportes - Operaciones', 'Auxilios', 'SGC Auxilios'];

        const rowsToUpsert = [];
        for (const r of allRoles) {
          for (const p of allPantallas) {
            const rpRow = rolesPermisos.find(rp => rp.rol === r && rp.pantalla === p);
            const access = rpRow !== undefined ? Boolean(rpRow.acceso) : getDefaultPermiso(r, p);
            rowsToUpsert.push({
              rol: r,
              pantalla: p,
              acceso: access
            });
          }
        }

        const { error } = await supabase
          .from('roles_permisos')
          .upsert(rowsToUpsert, { onConflict: 'rol,pantalla' });

        if (error) {
          throw error;
        }

        localStorage.setItem('app_roles_permisos', JSON.stringify(rowsToUpsert));
        setRolesPermisos(rowsToUpsert);
        alert('Permisos guardados correctamente en la base de datos.');
      } else if (activeTab === 'Ajustes Generales') {
        saveAjustes();
      }
    } catch (err: any) {
      console.error('Error al guardar cambios:', err);
      alert('Error al guardar cambios: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const isMovedTab = MOVED_TABS_OPERACIONES.includes(activeTab) || MOVED_TABS_MANTENIMIENTO.includes(activeTab);
  const displayTitle = isMovedTab ? activeTab : "Configuración y ABM";
  const displaySubtitle = MOVED_TABS_OPERACIONES.includes(activeTab) 
    ? "Operaciones" 
    : MOVED_TABS_MANTENIMIENTO.includes(activeTab) 
      ? "Mantenimiento" 
      : "Administración";

  return (
    <>
      <Header title={displayTitle} subtitle={displaySubtitle}>
        {(activeTab === 'Roles' || activeTab === 'Ajustes Generales') && (
          <button 
            onClick={handleSaveChanges} 
            disabled={loading}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors cursor-pointer select-none disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        )}
      </Header>
      
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* SUBMENU BAR AT THE TOP (Beneath Header) */}
        {!isMovedTab && (
          <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0 shadow-2xs scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2 hidden md:inline">Módulos:</span>
            {DISPLAY_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab}</span>
              </button>
            ))}
          </div>
        )}

        {/* MAIN DATA / CONTENT AREA */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
             
             {/* Header of Content Box */}
             <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
               <div>
                 <h3 className="text-lg font-bold text-slate-800 capitalize flex items-center gap-2">
                   <span>{activeTab}</span>
                   {data.length > 0 && activeTab !== 'Ajustes Generales' && activeTab !== 'Roles' && (
                     <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                       {filteredData.length} {filteredData.length === 1 ? 'registro' : 'registros'}
                     </span>
                   )}
                 </h3>
                 <p className="text-xs text-slate-500 mt-0.5">Gestión y control de datos maestros para el sistema</p>
               </div>

               {activeTab !== 'Ajustes Generales' && activeTab !== 'Roles' && (
                 <div className="flex flex-wrap items-center gap-2.5">
                   <button 
                     onClick={() => setIsPasting(!isPasting)}
                     className="px-3 py-1.5 bg-amber-50 text-amber-900 text-xs font-bold rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors flex items-center space-x-1.5 shadow-2xs"
                   >
                     <Clipboard className="w-3.5 h-3.5 text-amber-700" />
                     <span>{isPasting ? 'Cancelar Pegado' : 'Pegar desde Excel'}</span>
                   </button>
                   <button 
                     onClick={() => openModal()}
                     className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1.5 shadow-xs"
                   >
                     <Plus className="w-3.5 h-3.5" />
                     <span>Agregar Nuevo</span>
                   </button>
                 </div>
               )}
             </div>

             {/* Search and Filters Bar */}
             {activeTab !== 'Ajustes Generales' && activeTab !== 'Roles' && (
               <div className="px-5 py-3 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
                 
                 {/* Text Search Filter */}
                 <div className="relative flex-1 max-w-md">
                   <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                   <input
                     type="text"
                     placeholder={`Buscar en ${activeTab}...`}
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                   />
                   {searchTerm && (
                     <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs">
                       ✕
                     </button>
                   )}
                 </div>

                 {/* Season Filter for "Turnos" */}
                 {activeTab === 'Turnos' && (
                   <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-xs font-medium">
                     <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 flex items-center gap-1">
                       <Filter className="w-3.5 h-3.5 text-blue-600" />
                       <span>Temporada:</span>
                     </span>
                     <select
                       value={seasonFilter}
                       onChange={(e) => setSeasonFilter(e.target.value)}
                       className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                     >
                       <option value="todas">Todas las Temporadas</option>
                       {Array.from(new Set([
                         ...temporadasList.map(t => t.nombre).filter(Boolean),
                         ...data.map(d => d.temporada).filter(Boolean)
                       ])).map((seasonName) => (
                         <option key={`cfg-season-${seasonName}`} value={seasonName}>
                           {seasonName}
                         </option>
                       ))}
                     </select>
                     {seasonFilter !== 'todas' && (
                       <button
                         onClick={() => setSeasonFilter('todas')}
                         className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-white rounded border border-slate-200 hover:bg-slate-50 transition-colors"
                       >
                         Limpiar
                       </button>
                     )}
                   </div>
                 )}

                 {/* Specific Role Filters for "Usuarios" */}
                 {activeTab === 'Usuarios' && (
                   <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
                     <span className="text-[10px] uppercase font-bold text-slate-400 px-2 flex items-center gap-1">
                       <Filter className="w-3 h-3" />
                       <span>Filtrar:</span>
                     </span>
                     <button
                       onClick={() => setUserRoleFilter('todos')}
                       className={`px-2.5 py-1 rounded-md transition-colors ${
                         userRoleFilter === 'todos' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                       }`}
                     >
                       Todos
                     </button>
                     <button
                       onClick={() => setUserRoleFilter('sistema')}
                       className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                         userRoleFilter === 'sistema' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                       }`}
                     >
                       <Shield className="w-3 h-3 text-blue-600" />
                       <span>Usuarios Sistema</span>
                     </button>
                     <button
                       onClick={() => setUserRoleFilter('conductor')}
                       className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                         userRoleFilter === 'conductor' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                       }`}
                     >
                       <UserCheck className="w-3 h-3 text-emerald-600" />
                       <span>Conductores</span>
                     </button>
                     <button
                       onClick={() => setUserRoleFilter('mecanico')}
                       className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                         userRoleFilter === 'mecanico' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                       }`}
                     >
                       <Wrench className="w-3 h-3 text-amber-600" />
                       <span>Mecánicos</span>
                     </button>
                   </div>
                 )}
               </div>
             )}
             
             {/* General Settings Tab */}
             
             {/* Roles Tab */}
             {activeTab === 'Roles' ? (
                <div className="p-8">
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs mb-8">
                    <div className="flex items-center space-x-2 mb-3">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pantallas por Defecto</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-6">Selecciona la pantalla que le aparecerá por defecto a cada rol de usuario al iniciar sesión.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {['Administrador', 'Administrativo', 'Diagramador', 'Garita', 'Planific-Mantenimiento', 'Mecanico', 'Conductor'].map(r => {
                        const currentVal = roleLandings[r] || '';
                        return (
                          <div key={r} className="flex flex-col space-y-1.5 bg-slate-50 border border-slate-100 rounded-lg p-3.5">
                            <span className="text-xs font-bold text-slate-700">{r}</span>
                            <select
                              value={currentVal}
                              onChange={(e) => handleSaveLanding(r, e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/25 cursor-pointer"
                            >
                              <option value="">Por defecto del sistema...</option>
                              {PATHS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 mb-4">Gestión de Permisos por Rol</h3>
                  <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="px-4 py-3">Rol</th>
                          <th className="px-4 py-3">Pantalla</th>
                          <th className="px-4 py-3 text-center">Acceso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {['Administrador', 'Administrativo', 'Diagramador', 'Garita', 'Planific-Mantenimiento', 'Mecanico', 'Conductor'].map(r => (
                          ['Garita', 'Objetos Perdidos', 'Registrar Firma', 'Diagramacion', 'Servicios Turísticos', 'Servicios', 'Mecanica Matutina', 'Checklist Salida', 'Durante Viaje', 'Despues de Viaje', 'Control Mecanico', 'Mis Controles', 'Configuracion', 'Reportes - Generales', 'Reportes - Presentacion', 'Reportes - Mecanica', 'Reportes - Operaciones', 'Auxilios', 'SGC Auxilios'].map(p => {
                            const key = `${r}_${p}`;
                            const rpRow = rolesPermisos.find(rp => rp.rol === r && rp.pantalla === p);
                            const hasAccess = rpRow !== undefined ? Boolean(rpRow.acceso) : getDefaultPermiso(r, p);
                            return (
                              <tr key={key} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-bold text-slate-700">{r}</td>
                                <td className="px-4 py-2 text-slate-600">{p}</td>
                                <td className="px-4 py-2 text-center">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-blue-600 rounded" 
                                    checked={hasAccess}
                                    onChange={() => handleTogglePermiso(r, p, hasAccess)}
                                  />
                                </td>
                              </tr>
                            );
                          })
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
             ) : activeTab === 'Ajustes Generales' ? (

                <div className="p-8 max-w-xl">
                  <label className="block text-sm font-bold text-slate-800 mb-2">Logo de la Empresa</label>
                  <div className="flex items-center space-x-4 mb-6">
                     <div className="w-24 h-24 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden">
                        {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-sm text-slate-400">Logo</span>}
                     </div>
                     <label htmlFor="logo-upload" className="cursor-pointer px-4 py-2 bg-white border border-slate-300 rounded text-sm font-bold hover:bg-slate-50 transition-colors">
                        Cambiar Imagen
                     </label>
                     <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </div>
                  
                  <label className="block text-sm font-bold text-slate-800 mb-2">Nombre de la Empresa</label>
                  <input type="text" value={empresaName} onChange={e => setEmpresaName(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none mb-6" />

                  <div className="mt-8 mb-6 border-t border-slate-200 pt-6">
                    <h4 className="text-md font-bold text-slate-800 mb-4">Ajustes de Cartel Público (Diagramación)</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-2">Intervalo de Rotación (segundos)</label>
                        <input type="number" min="1" value={rotationInterval} onChange={e => setRotationInterval(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none mb-4" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-2">Filas por página (Desktop)</label>
                        <input type="number" min="1" value={itemsPerPage} onChange={e => setItemsPerPage(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none mb-4" />
                      </div>
                    </div>
                  </div>
                  <button onClick={saveAjustes} className="px-6 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
                    Guardar Ajustes
                  </button>
                </div>
             ) : (
               <div className="p-0">
                 {/* Excel Paste Box */}
                 {isPasting && (
                   <div className="p-6 bg-slate-50 border-b border-slate-200">
                      <div className="mb-4 text-sm text-slate-600 bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                        <p className="font-bold text-slate-800 flex items-center gap-2">
                          <Clipboard className="w-4 h-4 text-blue-600" />
                          <span>Importación Inteligente desde Excel:</span>
                        </p>
                        <p className="text-xs text-slate-600">
                          Copie las celdas desde Excel (Ctrl+C) y péguelas aquí (Ctrl+V). Funciona con o sin encabezados de columnas.
                        </p>
                        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 border-t border-slate-100">
                          <span>Modo de lectura:</span>
                          <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                            <input 
                              type="radio" 
                              name="header_mode" 
                              checked={forceHasHeader === null} 
                              onChange={() => setForceHasHeader(null)}
                              className="text-blue-600" 
                            />
                            <span>Detección automática</span>
                          </label>
                          <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                            <input 
                              type="radio" 
                              name="header_mode" 
                              checked={forceHasHeader === false} 
                              onChange={() => setForceHasHeader(false)}
                              className="text-blue-600" 
                            />
                            <span>Sin encabezados (Datos directos)</span>
                          </label>
                          <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                            <input 
                              type="radio" 
                              name="header_mode" 
                              checked={forceHasHeader === true} 
                              onChange={() => setForceHasHeader(true)}
                              className="text-blue-600" 
                            />
                            <span>Con encabezados en 1° fila</span>
                          </label>
                        </div>
                      </div>

                      <textarea 
                         className="w-full h-36 border border-slate-300 rounded-lg p-3 text-sm focus:border-blue-500 font-mono focus:outline-none bg-white"
                         placeholder="Pegue aquí sus filas copiadas desde Excel..."
                         value={pasteText}
                         onChange={(e) => setPasteText(e.target.value)}
                      />

                      {/* Live Preview */}
                      {pasteText.trim() !== '' && (() => {
                        const preview = parseImportText(pasteText, tableName, currentSchema, forceHasHeader);
                        return (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-2">
                            <div className="flex flex-wrap justify-between items-center gap-2 font-bold">
                              <span>🔍 Vista previa de importación: {preview.totalRows} registro(s) detectado(s)</span>
                              <span className="text-[11px] bg-blue-200 px-2 py-0.5 rounded text-blue-800">
                                {preview.isHeaderDetected ? 'Primera fila usada como encabezados' : 'Mapeo posicional directo (sin encabezados)'}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold">Mapeo de columnas: </span>
                              {preview.columnNames.join('  ➔  ')}
                            </div>
                            {preview.inserts.length > 0 && (
                              <div className="bg-white p-2 rounded border border-blue-100 text-[11px] text-slate-700 font-mono overflow-x-auto">
                                <strong>Ejemplo Fila 1:</strong> {JSON.stringify(preview.inserts[0])}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="mt-4 flex justify-end space-x-3">
                         <button 
                           onClick={() => { setIsPasting(false); setPasteText(''); setForceHasHeader(null); }}
                           className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors"
                         >
                           Cancelar
                         </button>
                         <button 
                           onClick={handleImportExcel}
                           disabled={loading || !pasteText.trim()}
                           className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs disabled:opacity-50 transition-colors"
                         >
                           {loading ? 'Importando...' : 'Confirmar e Importar Datos'}
                         </button>
                      </div>
                   </div>
                 )}

                 {/* Table list */}
                 <div className="overflow-x-auto relative">
                   {loading && !isPasting ? (
                      <div className="p-12 text-center text-slate-500 font-medium text-xs">Cargando datos desde Supabase...</div>
                   ) : filteredData.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 font-medium">
                        <p className="text-3xl mb-2">📁</p>
                        <p className="text-sm font-semibold text-slate-700">No se encontraron registros</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {searchTerm ? 'Pruebe modificando su criterio de búsqueda o filtro.' : 'Utilice "Agregar Nuevo" o "Pegar desde Excel" para cargar datos.'}
                        </p>
                      </div>
                   ) : (
                     <table className="w-full text-left text-xs whitespace-nowrap">
                       <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                         <tr>
                           {columns.map(col => {
                             const schemaItem = currentSchema?.find(s => s.name === col);
                             const label = schemaItem ? schemaItem.label : col.replace(/_/g, ' ');
                             return (
                               <th key={col} className="px-5 py-3.5 border-b border-slate-200">
                                 {label}
                               </th>
                             );
                           })}
                           <th className="px-5 py-3.5 border-b border-slate-200 text-right sticky right-0 bg-slate-50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                             Acciones
                           </th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {filteredData.map((row, idx) => (
                           <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                             {columns.map(col => (
                               <td key={col} className="px-5 py-3 font-medium text-slate-700">
                                 {col === 'rol' ? (
                                   <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                     row[col] === 'Conductor' ? 'bg-emerald-100 text-emerald-800' :
                                     row[col] === 'Mecanico' ? 'bg-amber-100 text-amber-800' :
                                     'bg-blue-100 text-blue-800'
                                   }`}>
                                     {row[col]}
                                   </span>
                                 ) : col === 'estado' ? (
                                   <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                     row[col] === 'Activo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                                   }`}>
                                     {row[col]}
                                   </span>
                                 ) : (tableName === 'turnos' && col === 'cod_turno') ? (
                                   <div className="flex flex-col">
                                     <span className="font-bold">{row[col]}</span>
                                     {row.es_refuerzo && (
                                       <span className="inline-flex items-center px-1.5 py-0.5 mt-1 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 w-max">
                                         Refuerzo ({row.dias_refuerzo?.length || 0} d)
                                       </span>
                                     )}
                                   </div>
                                 ) : (
                                   renderCell(col, row[col])
                                 )}
                               </td>
                             ))}
                             <td className="px-5 py-3 text-right sticky right-0 bg-white shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)] border-b border-slate-100">
                               <button 
                                  onClick={() => openModal(row)}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-bold mr-3 transition-colors"
                               >
                                  Editar
                               </button>
                               <button 
                                  onClick={() => handleDelete(primaryKey, row[primaryKey], row)}
                                  className="text-red-600 hover:text-red-800 text-xs font-bold transition-colors"
                               >
                                  Eliminar
                               </button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   )}
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Modal ABM */}
      {isModalOpen && currentSchema && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
             <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
                <h3 className="text-base font-bold text-slate-800">
                  {editingRecord ? `Editar ${activeTab}` : `Nuevo Registro en ${activeTab}`}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
             </div>
             <div className="p-6 overflow-y-auto">
                <form id="abm-form" onSubmit={handleSaveForm} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentSchema.map(field => (
                    <div key={field.name} className={field.name === 'nombre_apellido' || field.name === 'apellido_nombre' || field.name === 'observaciones' ? 'md:col-span-2' : ''}>
                       <label className="block text-xs font-bold text-slate-700 mb-1">
                         {field.label} {field.required && <span className="text-red-500">*</span>}
                       </label>
                       {field.name === 'contrasena' && editingRecord ? (
                         <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                           <span className="text-xs font-mono text-slate-500">••••••••</span>
                           <button type="button" onClick={handleResetPassword} className="text-xs font-bold text-red-600 hover:underline">
                             Resetear a "123456"
                           </button>
                         </div>
                       ) : field.type === 'select' ? (
                         <select 
                           className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                           value={formData[field.name] || ''}
                           onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                           required={field.required}
                         >
                           <option value="">Seleccione...</option>
                           {field.options.map((opt: string) => (
                             <option key={opt} value={opt}>{opt}</option>
                           ))}
                         </select>
                       ) : (
                         <input
                           type={field.type}
                           className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                           value={formData[field.name] || ''}
                           onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                           required={field.required}
                           placeholder={field.help || ''}
                         />
                       )}
                       {field.help && field.name !== 'contrasena' && (
                         <p className="text-[10px] text-slate-400 mt-1">{field.help}</p>
                       )}
                       {field.help && field.name === 'contrasena' && !editingRecord && (
                         <p className="text-[10px] text-slate-400 mt-1">{field.help}</p>
                       )}
                    </div>
                  ))}

                  {tableName === 'turnos' && (
                    <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2">
                      <div className="flex items-center space-x-3 mb-4">
                        <input
                          id="es_refuerzo"
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          checked={!!formData.es_refuerzo}
                          onChange={e => {
                            const val = e.target.checked;
                            setFormData({
                              ...formData,
                              es_refuerzo: val,
                              dias_refuerzo: val ? (formData.dias_refuerzo || []) : []
                            });
                          }}
                        />
                        <label htmlFor="es_refuerzo" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                          ¿Es Turno de Refuerzo? <span className="text-[10px] font-normal text-slate-500">(Sólo se publicará en los días específicos seleccionados)</span>
                        </label>
                      </div>

                      {formData.es_refuerzo && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <p className="text-xs font-bold text-slate-700 mb-1">Calendario de Publicación</p>
                          <p className="text-[10px] text-slate-500 mb-4">Haga clic sobre los días para publicar o quitar este turno de refuerzo en la diagramación.</p>

                          {/* Calendar Controls */}
                          <div className="flex items-center justify-between mb-3 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => {
                                if (calendarMonth === 0) {
                                  setCalendarMonth(11);
                                  setCalendarYear(calendarYear - 1);
                                } else {
                                  setCalendarMonth(calendarMonth - 1);
                                }
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600 text-xs transition-colors font-bold"
                            >
                              &larr; Anterior
                            </button>
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                              {new Date(calendarYear, calendarMonth).toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (calendarMonth === 11) {
                                  setCalendarMonth(0);
                                  setCalendarYear(calendarYear + 1);
                                } else {
                                  setCalendarMonth(calendarMonth + 1);
                                }
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600 text-xs transition-colors font-bold"
                            >
                              Siguiente &rarr;
                            </button>
                          </div>

                          {/* Calendar Grid */}
                          <div className="grid grid-cols-7 gap-1.5 text-center mb-4">
                            {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(d => (
                              <div key={d} className="text-[10px] font-bold text-slate-400 py-1 uppercase">{d}</div>
                            ))}

                            {/* Blank spaces before start of month */}
                            {Array.from({ length: new Date(calendarYear, calendarMonth, 1).getDay() }).map((_, i) => (
                              <div key={`empty-${i}`} className="p-1"></div>
                            ))}

                            {/* Days of month */}
                            {Array.from({ length: new Date(calendarYear, calendarMonth + 1, 0).getDate() }).map((_, i) => {
                              const dayNum = i + 1;
                              const dateStr = `${calendarYear}-${(calendarMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                              const isSelected = (formData.dias_refuerzo || []).includes(dateStr);

                              return (
                                <button
                                  key={dayNum}
                                  type="button"
                                  onClick={() => {
                                    const currentDays = formData.dias_refuerzo || [];
                                    let nextDays = [];
                                    if (isSelected) {
                                      nextDays = currentDays.filter((d: string) => d !== dateStr);
                                    } else {
                                      nextDays = [...currentDays, dateStr];
                                    }
                                    setFormData({ ...formData, dias_refuerzo: nextDays });
                                  }}
                                  className={`p-2 text-xs font-bold rounded-md transition-all ${
                                    isSelected
                                      ? 'bg-blue-600 text-white shadow-xs font-black hover:bg-blue-700'
                                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {dayNum}
                                </button>
                              );
                            })}
                          </div>

                          {/* Quick selection or summary */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                                  const monthDays = Array.from({ length: totalDays }, (_, i) => {
                                    return `${calendarYear}-${(calendarMonth + 1).toString().padStart(2, '0')}-${(i + 1).toString().padStart(2, '0')}`;
                                  });
                                  const currentDays = formData.dias_refuerzo || [];
                                  const uniqueDays = Array.from(new Set([...currentDays, ...monthDays]));
                                  setFormData({ ...formData, dias_refuerzo: uniqueDays });
                                }}
                                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                              >
                                Seleccionar todo el mes
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                                  const monthDays = Array.from({ length: totalDays }, (_, i) => {
                                    return `${calendarYear}-${(calendarMonth + 1).toString().padStart(2, '0')}-${(i + 1).toString().padStart(2, '0')}`;
                                  });
                                  const currentDays = formData.dias_refuerzo || [];
                                  const nextDays = currentDays.filter((d: string) => !monthDays.includes(d));
                                  setFormData({ ...formData, dias_refuerzo: nextDays });
                                }}
                                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Limpiar este mes
                              </button>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/50 px-2.5 py-1 rounded-md">
                              Total: {(formData.dias_refuerzo || []).length} días elegidos
                            </span>
                          </div>

                          {/* Selected days chips */}
                          {(formData.dias_refuerzo || []).length > 0 && (
                            <div className="mt-3 border-t border-slate-200 pt-3">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Días Seleccionados:</p>
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-md">
                                {(formData.dias_refuerzo || []).sort().map((d: string) => {
                                  const [y, m, day] = d.split('-');
                                  return (
                                    <span key={d} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-100">
                                      {`${day}/${m}/${y}`}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextDays = (formData.dias_refuerzo || []).filter((x: string) => x !== d);
                                          setFormData({ ...formData, dias_refuerzo: nextDays });
                                        }}
                                        className="text-blue-400 hover:text-red-600 font-bold ml-1 text-xs"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sección Vueltas */}
                      <div className="mt-6 border-t border-slate-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">Vueltas del Turno</h4>
                            <p className="text-[10px] text-slate-500">
                              Agregue y ordene las vueltas. Los campos de Hora Inicio y Hora Fin se calcularán automáticamente.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddVuelta()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-[11px] font-bold transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Agregar Vuelta
                          </button>
                        </div>

                        {(!formData.vueltas || formData.vueltas.length === 0) ? (
                          <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-[11px] text-slate-500 font-medium">No hay vueltas cargadas en este turno.</p>
                            <button
                              type="button"
                              onClick={() => handleAddVuelta()}
                              className="mt-2 text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              Agregar la primera vuelta
                            </button>
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-3xs max-h-80 overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                                  <th className="py-2.5 px-3">Servicio / Variante</th>
                                  <th className="py-2.5 px-3 w-28">Salida</th>
                                  <th className="py-2.5 px-3 w-28">Llegada</th>
                                  <th className="py-2.5 px-3 w-20 text-center">Acciones</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {formData.vueltas.map((vuelta: any, idx: number) => (
                                  <tr key={vuelta.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-2 px-3 text-center text-xs font-bold text-slate-400">
                                      {idx + 1}
                                    </td>
                                    <td className="py-2 px-3">
                                      <select
                                        className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                                        value={vuelta.servicio_id ? `${vuelta.servicio_id}-v${vuelta.variante_num}` : ''}
                                        onChange={(e) => {
                                          const selected = serviceOptions.find(o => o.id === e.target.value);
                                          if (selected) {
                                            handleVueltaChange(idx, {
                                              servicio_id: selected.servicio_id,
                                              variante_num: selected.variante_num,
                                              tiempo_marcha: selected.tiempo_marcha
                                            });
                                          } else {
                                            handleVueltaChange(idx, {
                                              servicio_id: '',
                                              variante_num: 1,
                                              tiempo_marcha: 0
                                            });
                                          }
                                        }}
                                        required
                                      >
                                        <option value="">Seleccione servicio...</option>
                                        {serviceOptions.map((opt: any, idx) => (
                                          <option key={opt.id ? `opt-${opt.id}-${idx}` : idx} value={opt.id}>
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="time"
                                        className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                                        value={vuelta.hora_salida || ''}
                                        onChange={(e) => handleVueltaChange(idx, { hora_salida: e.target.value })}
                                        required
                                      />
                                    </td>
                                    <td className="py-2 px-3">
                                      <div className="bg-slate-50 border border-slate-200 text-slate-500 rounded-md px-2 py-1.5 text-xs font-mono font-bold text-center">
                                        {vuelta.hora_llegada || '--:--'}
                                      </div>
                                    </td>
                                    <td className="py-2 px-3">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleAddVuelta(idx)}
                                          className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100"
                                          title="Insertar vuelta abajo"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveVuelta(idx)}
                                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                                          title="Eliminar vuelta"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </form>
             </div>
             <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3 rounded-b-xl">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  form="abm-form"
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-xs"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
             </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">¿Confirmar eliminación?</h3>
              <p className="text-xs text-slate-500 mb-6">
                Esta acción es irreversible y eliminará de forma permanente el registro seleccionado de {activeTab}.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Confirmar y Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import Header from '../components/Header';
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { X, Search, Filter, Plus, Clipboard, Shield, UserCheck, Wrench } from 'lucide-react';

const TABS = [
  'Usuarios',
  'Roles',
  'Nómina Conductores',
  'Nómina Mecánicos',
  'Flota Activa',
  'Temporadas',
  'Turnos',
  'Feriados',
  'Ajustes Generales'
];

const TABLE_MAP: Record<string, string> = {
  'usuarios': 'usuarios',
  'nómina conductores': 'nomina_conductores',
  'nómina mecánicos': 'nomina_mecanicos',
  'flota activa': 'flota_activa',
  'temporadas': 'temporadas',
  'turnos': 'turnos',
  'feriados': 'feriados'
};

const PHYSICAL_COLUMNS: Record<string, string[]> = {
  usuarios: ['id', 'usuario', 'contrasena', 'nombre_apellido', 'dni', 'rol', 'estado'],
  nomina_conductores: ['id_conductor', 'legajo', 'apellido_nombre', 'empresa', 'dni', 'licencia_conducir'],
  nomina_mecanicos: ['id_mecanico', 'legajo', 'apellido_nombre', 'empresa', 'dni'],
  flota_activa: ['id_unidad', 'grupo', 'unidad', 'patente', 'categoria', 'empresa', 'fecha_alta', 'ano_modelo', 'carroceria', 'modelo_carroceria', 'marca_motor', 'serie_motor', 'marca_chasis', 'serie_chasis', 'ejes', 'pisos', 'capacidad_tanque', 'tipo_combustible', 'urea', 'transmision', 'asientos'],
  temporadas: ['id_temporada', 'nombre', 'fecha_inicio', 'fecha_fin'],
  turnos: ['id_turno', 'cod_turno', 'grupo', 'frecuencia', 'turno', 'tipo_turno', 'servicio', 'hora_presentacion', 'hora_salida_base', 'hora_inicio', 'hora_fin', 'hora_llegada_base', 'queda_fuera', 'id_temporada'],
  feriados: ['id_feriado', 'fecha', 'observaciones']
};

const SCHEMAS: Record<string, any[]> = {
  usuarios: [
    { name: 'usuario', label: 'Usuario', type: 'text', required: true, help: 'Formato: nombre.apellido o DNI' },
    { name: 'contrasena', label: 'Contraseña', type: 'password', required: true, help: 'Por defecto será 123456 si se blanquea' },
    { name: 'nombre_apellido', label: 'Nombre y Apellido', type: 'text', required: true, help: 'Ej. Juan Pérez' },
    { name: 'dni', label: 'DNI', type: 'text', help: 'Sin puntos' },
    { name: 'rol', label: 'Rol', type: 'select', options: ['Administrador', 'Diagramador', 'Garita', 'Planific-Mantenimiento', 'Mecanico', 'Conductor'] },
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
    { name: 'hora_presentacion', label: 'Hora de Presentación', type: 'time', help: 'Ej. 07:15' },
    { name: 'hora_salida_base', label: 'Hora Salida de Base', type: 'time', help: 'Ej. 07:30' },
    { name: 'hora_inicio', label: 'Hora Inicio', type: 'time', required: true, help: 'Ej. 08:00' },
    { name: 'hora_fin', label: 'Hora Fin', type: 'time', required: true, help: 'Ej. 16:00' },
    { name: 'hora_llegada_base', label: 'Hora Llegada a Base', type: 'time', help: 'Ej. 16:30' },
    { name: 'queda_fuera', label: 'Queda Fuera', type: 'select', options: ['No', 'Si', 'Sí'], help: 'Indica si queda fuera (Si / No)' }
  ],
  feriados: [
    { name: 'fecha', label: 'Fecha', type: 'date', required: true },
    { name: 'observaciones', label: 'Observaciones', type: 'text', help: 'Motivo del feriado' }
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
    'hora_presentacion': 'hora_presentacion', 'hora presentacion': 'hora_presentacion', 'hora de presentacion': 'hora_presentacion', 'hora de presentación': 'hora_presentacion', 'hora presentación': 'hora_presentacion', 'presentacion': 'hora_presentacion', 'presentación': 'hora_presentacion', 'hs presentacion': 'hora_presentacion', 'hs presentación': 'hora_presentacion', 'hs. presentacion': 'hora_presentacion', 'hs. presentación': 'hora_presentacion',
    'hora_salida_base': 'hora_salida_base', 'hora salida de base': 'hora_salida_base', 'hora salida base': 'hora_salida_base', 'salida de base': 'hora_salida_base', 'salida base': 'hora_salida_base', 'hs salida base': 'hora_salida_base',
    'hora_inicio': 'hora_inicio', 'hora inicio': 'hora_inicio', 'inicio': 'hora_inicio', 'hs inicio': 'hora_inicio',
    'hora_fin': 'hora_fin', 'hora fin': 'hora_fin', 'fin': 'hora_fin', 'hs fin': 'hora_fin',
    'hora_llegada_base': 'hora_llegada_base', 'hora llegada a base': 'hora_llegada_base', 'hora llegada base': 'hora_llegada_base', 'llegada a base': 'hora_llegada_base', 'llegada base': 'hora_llegada_base', 'hs llegada base': 'hora_llegada_base',
    'queda_fuera': 'queda_fuera', 'queda fuera': 'queda_fuera', 'queda_fuera (si / no)': 'queda_fuera', 'queda fuera (si / no)': 'queda_fuera', 'queda fuera (sí / no)': 'queda_fuera', 'fuera': 'queda_fuera'
  },
  feriados: {
    'fecha': 'fecha', 'dia': 'fecha',
    'observaciones': 'observaciones', 'motivo': 'observaciones', 'descripcion': 'observaciones'
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
  const [activeTab, setActiveTab] = useState('Usuarios');
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

  // Settings state
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('app_logo') || '');
  const [empresaName, setEmpresaName] = useState(() => localStorage.getItem('app_name') || 'Transportes Buttini');

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
    loadSeasons();
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
      const { data } = await supabase.from('roles_permisos').select('*');
      if (data) setRolesPermisos(data);
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
    if (!window.confirm('¿Eliminar este registro permanentemente?')) return;
    const { error } = await supabase.from(tableName).delete().eq(idField, id);
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
      setFormData({ ...record });
    } else {
      setFormData({});
    }
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


  async function handleTogglePermiso(rol: string, pantalla: string, currentVal: boolean) {
    const newVal = !currentVal;
    // update state optimistically
    setRolesPermisos(prev => {
      const existing = prev.find(p => p.rol === rol && p.pantalla === pantalla);
      if (existing) {
        return prev.map(p => p.id === existing.id ? { ...p, acceso: newVal } : p);
      } else {
        return [...prev, { rol, pantalla, acceso: newVal }];
      }
    });
    // upsert in db
    const { error } = await supabase.from('roles_permisos').upsert({ rol, pantalla, acceso: newVal }, { onConflict: 'rol,pantalla' });
    if (error) console.error(error);
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

  return (
    <>
      <Header title="Configuración y ABM" subtitle="Administrador">
        <button className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors">
          Guardar Cambios
        </button>
      </Header>
      
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* SUBMENU BAR AT THE TOP (Beneath Header) */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0 shadow-2xs scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2 hidden md:inline">Módulos:</span>
          {TABS.map((tab) => (
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
                        {['Administrador', 'Diagramador', 'Garita', 'Planific-Mantenimiento', 'Mecanico', 'Conductor'].map(r => (
                          ['Garita', 'Diagramacion', 'Mecanica Matutina', 'Checklist Salida', 'Durante Viaje', 'Despues de Viaje', 'Control Mecanico', 'Mis Controles', 'Configuracion', 'Reportes - Generales', 'Reportes - Presentacion', 'Reportes - Mecanica', 'Reportes - Operaciones'].map(p => {
                            const key = `${r}_${p}`;
                            const hasAccess = rolesPermisos.find(rp => rp.rol === r && rp.pantalla === p)?.acceso || false;
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
    </>
  );
}

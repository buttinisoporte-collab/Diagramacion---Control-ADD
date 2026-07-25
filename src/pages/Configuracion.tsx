import Header from '../components/Header';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

const TABS = ['Usuarios', 'Roles', 'Nómina Conductores', 'Nómina Mecánicos', 'Flota Activa', 'Temporadas', 'Turnos', 'Feriados', 'Ajustes Generales'];

const TABLE_MAP: Record<string, string> = {
  'usuarios': 'usuarios',
  'nómina conductores': 'nomina_conductores',
  'nómina mecánicos': 'nomina_mecanicos',
  'flota activa': 'flota_activa',
  'temporadas': 'temporadas',
  'turnos': 'turnos',
  'feriados': 'feriados'
};

const SCHEMAS: Record<string, any[]> = {
  usuarios: [
    { name: 'usuario', label: 'Usuario', type: 'text', required: true, help: 'Formato: nombre.apellido o DNI' },
    { name: 'contrasena', label: 'Contraseña', type: 'password', required: true, help: 'Por defecto será 123456 si se blanquea' },
    { name: 'nombre_apellido', label: 'Nombre y Apellido', type: 'text', required: true, help: 'Ej. Juan Perez' },
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
    { name: 'unidad', label: 'Unidad', type: 'text', required: true, help: 'Ej. 540-01' },
    { name: 'patente', label: 'Patente', type: 'text', required: true, help: 'Ej. AB 123 CD' },
    { name: 'empresa', label: 'Empresa', type: 'text' },
    { name: 'asientos', label: 'Asientos', type: 'number', help: 'Cantidad de asientos' }
  ],
  temporadas: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true, help: 'Ej. Verano 2026' },
    { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date', required: true },
    { name: 'fecha_fin', label: 'Fecha Fin', type: 'date', required: true }
  ],
  turnos: [
    { name: 'cod_turno', label: 'Cód Turno', type: 'text', required: true, help: 'Ej. T-1024' },
    { name: 'grupo', label: 'Grupo', type: 'text' },
    { name: 'frecuencia', label: 'Frecuencia', type: 'text' },
    { name: 'turno', label: 'Turno', type: 'text' },
    { name: 'tipo_turno', label: 'Tipo Turno', type: 'select', options: ['Urbano', 'Media', 'Larga'] },
    { name: 'servicio', label: 'Servicio', type: 'text' },
    { name: 'hora_inicio', label: 'Hora Inicio', type: 'time', required: true },
    { name: 'hora_fin', label: 'Hora Fin', type: 'time', required: true }
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
    'unidad': 'unidad', 'coche': 'unidad', 'num': 'unidad', 'unid': 'unidad', 'nro': 'unidad', 'n° unidad': 'unidad',
    'patente': 'patente', 'dominio': 'patente',
    'empresa': 'empresa',
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
    'cod_turno': 'cod_turno', 'codigo': 'cod_turno', 'cod': 'cod_turno',
    'grupo': 'grupo',
    'frecuencia': 'frecuencia',
    'turno': 'turno',
    'tipo_turno': 'tipo_turno', 'tipo': 'tipo_turno',
    'servicio': 'servicio',
    'hora_inicio': 'hora_inicio', 'inicio': 'hora_inicio',
    'hora_fin': 'hora_fin', 'fin': 'hora_fin'
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
    // Auto-detection:
    // If first cell of first row is numeric (e.g. "8", "14"), it's data!
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
    // Map strictly by position matching schema order
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
  const [loading, setLoading] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [forceHasHeader, setForceHasHeader] = useState<boolean | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Settings state
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('app_logo') || '');
  const [empresaName, setEmpresaName] = useState(() => localStorage.getItem('app_name') || 'Transportes Buttini');

  const tableName = TABLE_MAP[activeTab.toLowerCase()];
  const currentSchema = SCHEMAS[tableName];

  useEffect(() => {
    if (tableName) {
      fetchData();
      setIsPasting(false);
      setPasteText('');
      setForceHasHeader(null);
      setIsModalOpen(false);
    }
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    const { data: result, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: false });
    if (!error && result) {
      setData(result);
    } else {
      setData([]);
    }
    setLoading(false);
  }

  async function handleDelete(idField: string, id: string) {
    if (!window.confirm('¿Eliminar este registro permanentemente?')) return;
    const { error } = await supabase.from(tableName).delete().eq(idField, id);
    if (error) alert('Error: ' + error.message);
    else fetchData();
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
    
    // Remove empty fields
    const dataToSave = { ...formData };
    Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key] === '' || dataToSave[key] === undefined) {
        delete dataToSave[key];
      }
    });

    const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'created_at') : [];
    const primaryKey = columns.length > 0 ? columns[0] : (currentSchema ? 'id' : '');

    let error = null;
    if (editingRecord && primaryKey) {
       // Update
       const { error: updateError } = await supabase.from(tableName).update(dataToSave).eq(primaryKey, editingRecord[primaryKey]);
       error = updateError;
    } else {
       // Insert
       const { error: insertError } = await supabase.from(tableName).insert([dataToSave]);
       error = insertError;
       
       // Auto-create user for mechanics and drivers
       if (!error && (tableName === 'nomina_conductores' || tableName === 'nomina_mecanicos')) {
         const rol = tableName === 'nomina_conductores' ? 'Conductor' : 'Mecanico';
         const defaultUser = dataToSave.dni || dataToSave.legajo;
         await supabase.from('usuarios').insert([{
           usuario: defaultUser,
           contrasena: defaultUser, // Prompted to change on first login
           nombre_apellido: dataToSave.apellido_nombre,
           dni: dataToSave.dni,
           rol: rol,
           estado: 'Activo'
         }]);
       }
    }

    setLoading(false);
    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      setIsModalOpen(false);
      fetchData();
    }
  }

  async function handleImportExcel() {
    if (!pasteText.trim()) return;
    
    const parsed = parseImportText(pasteText, tableName, currentSchema, forceHasHeader);
    if (parsed.inserts.length === 0) {
      alert('No se encontraron filas de datos válidas para importar.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from(tableName).insert(parsed.inserts);
    
    if (error) {
      setLoading(false);
      alert('Error al importar: ' + error.message);
      return;
    }

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
    alert(`¡${parsed.inserts.length} registros importados correctamente!`);
    fetchData();
    setIsPasting(false);
    setPasteText('');
    setForceHasHeader(null);
  }

  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'created_at') : (currentSchema ? currentSchema.map(s => s.name) : []);
  const primaryKey = data.length > 0 ? Object.keys(data[0])[0] : (currentSchema ? 'id' : '');

  function renderCell(col: string, val: any) {
    if (val === null || val === undefined) return '-';
    if (col === 'contrasena') return '********';
    if (col.startsWith('id') && String(val).length > 8) return String(val).substring(0, 8) + '...';
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
        <button className="px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded">Guardar Cambios</button>
      </Header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sub-sidebar for settings */}
        <div className="w-64 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-3">Gestión de Datos</div>
            <nav className="space-y-1">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main settings content */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center">
               <h3 className="text-lg font-bold text-slate-800 capitalize">{activeTab}</h3>
               {activeTab !== 'Ajustes Generales' && activeTab !== 'Roles' && (
                 <div className="flex space-x-3">
                   <button 
                     onClick={() => setIsPasting(!isPasting)}
                     className="px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-bold rounded border border-amber-200 hover:bg-amber-200 transition-colors flex items-center space-x-2"
                   >
                     <span>📋</span>
                     <span>{isPasting ? 'Cancelar Pegado' : 'Pegar desde Excel'}</span>
                   </button>
                   <button 
                     onClick={() => openModal()}
                     className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors"
                   >
                     + Agregar Nuevo
                   </button>
                 </div>
               )}
             </div>
             
             {activeTab === 'Ajustes Generales' ? (
                <div className="p-8 max-w-xl">
                  <label className="block text-sm font-bold text-slate-800 mb-2">Logo de la Empresa</label>
                  <div className="flex items-center space-x-4 mb-6">
                     <div className="w-24 h-24 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden">
                        {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-sm text-slate-400">Logo</span>}
                     </div>
                     <label htmlFor="logo-upload" className="cursor-pointer px-4 py-2 bg-white border border-slate-300 rounded text-sm font-bold hover:bg-slate-50">
                        Cambiar Imagen
                     </label>
                     <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </div>
                  
                  <label className="block text-sm font-bold text-slate-800 mb-2">Nombre de la Empresa</label>
                  <input type="text" value={empresaName} onChange={e => setEmpresaName(e.target.value)} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none mb-6" />

                  <button onClick={saveAjustes} className="px-6 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700 transition-colors">
                    Guardar Ajustes
                  </button>
                </div>
             ) : activeTab === 'Roles' ? (
                <div className="p-8">
                  <h4 className="text-sm font-bold text-slate-800 mb-4">Niveles de Acceso por Rol</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { r: 'Administrador', desc: 'Acceso total a todas las pantallas, configuraciones y ABM.' },
                      { r: 'Diagramador', desc: 'Acceso a Diagramación de turnos, visualización de nómina y flota.' },
                      { r: 'Garita', desc: 'Acceso exclusivo a la pantalla de Control de Garita.' },
                      { r: 'Planific-Mantenimiento', desc: 'Acceso a reportes y diagramación de mecánicos matutinos.' },
                      { r: 'Mecanico', desc: 'Acceso a Control Mecánico, Mis Controles y checklist matutino.' },
                      { r: 'Conductor', desc: 'Acceso a Checklist de Salida, Durante Viaje y Después del Viaje (vía móvil).' }
                    ].map(role => (
                      <div key={role.r} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-start space-x-3">
                        <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{role.r}</p>
                          <p className="text-xs text-slate-500 mt-1">{role.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             ) : (
               <div className="p-0">
                 {isPasting && (
                   <div className="p-6 bg-slate-50 border-b border-slate-200">
                      <div className="mb-4 text-sm text-slate-600 bg-white p-4 rounded border border-slate-200 space-y-3">
                        <p className="font-bold text-slate-800 flex items-center gap-2">
                          <span>📋</span>
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
                         className="w-full h-36 border border-slate-300 rounded p-3 text-sm focus:border-blue-500 font-mono focus:outline-none bg-white"
                         placeholder="Pegue aquí sus filas copiadas desde Excel..."
                         value={pasteText}
                         onChange={(e) => setPasteText(e.target.value)}
                      />

                      {/* Live Preview */}
                      {pasteText.trim() !== '' && (() => {
                        const preview = parseImportText(pasteText, tableName, currentSchema, forceHasHeader);
                        return (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 space-y-2">
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
                           className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded hover:bg-slate-50 transition-colors"
                         >
                           Cancelar
                         </button>
                         <button 
                           onClick={handleImportExcel}
                           disabled={loading || !pasteText.trim()}
                           className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow disabled:opacity-50 transition-colors"
                         >
                           {loading ? 'Importando...' : 'Confirmar e Importar Datos'}
                         </button>
                      </div>
                   </div>
                 )}

                 <div className="overflow-x-auto relative">
                   {loading && !isPasting ? (
                      <div className="p-8 text-center text-slate-500 font-medium">Cargando datos desde Supabase...</div>
                   ) : data.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 font-medium">
                        <p className="text-4xl mb-3">📁</p>
                        <p>No hay registros en esta tabla.</p>
                        <p className="text-xs mt-1">Utilice "Pegar desde Excel" para cargar datos masivamente.</p>
                      </div>
                   ) : (
                     <table className="w-full text-left text-sm whitespace-nowrap">
                       <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                         <tr>
                           {columns.map(col => (
                             <th key={col} className="px-6 py-4 border-b border-slate-200">{col.replace(/_/g, ' ')}</th>
                           ))}
                           <th className="px-6 py-4 border-b border-slate-200 text-right sticky right-0 bg-slate-50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Acciones</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {data.map((row, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 transition-colors">
                             {columns.map(col => (
                               <td key={col} className="px-6 py-3 font-medium text-slate-700">
                                 {renderCell(col, row[col])}
                               </td>
                             ))}
                             <td className="px-6 py-3 text-right sticky right-0 bg-white shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)] border-b border-slate-100">
                               <button 
                                  onClick={() => openModal(row)}
                                  className="text-blue-600 hover:underline text-xs font-bold mr-3"
                               >
                                  Editar
                               </button>
                               <button 
                                  onClick={() => handleDelete(primaryKey, row[primaryKey])}
                                  className="text-red-600 hover:underline text-xs font-bold"
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
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
             <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">
                  {editingRecord ? `Editar ${activeTab}` : `Nuevo ${activeTab}`}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
             </div>
             <div className="p-6 overflow-y-auto">
                <form id="abm-form" onSubmit={handleSaveForm} className="space-y-4">
                  {currentSchema.map(field => (
                    <div key={field.name}>
                       <label className="block text-sm font-bold text-slate-700 mb-1">
                         {field.label} {field.required && <span className="text-red-500">*</span>}
                       </label>
                       {field.name === 'contrasena' && editingRecord ? (
                         <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-3 py-2">
                           <span className="text-sm font-mono text-slate-500">********</span>
                           <button type="button" onClick={handleResetPassword} className="text-xs font-bold text-red-600 hover:underline">
                             Resetear a "123456"
                           </button>
                         </div>
                       ) : field.type === 'select' ? (
                         <select 
                           className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
                           className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
             <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  form="abm-form"
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
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

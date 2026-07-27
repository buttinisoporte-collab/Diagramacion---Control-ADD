import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { 
  Calendar, 
  Clock, 
  Bus, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Search, 
  Copy, 
  Save, 
  Download, 
  Grid, 
  List, 
  RotateCcw, 
  ShieldAlert, 
  Info, 
  X, 
  UserPlus, 
  Layers,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';

interface Turno {
  id_turno?: string | number;
  cod_turno: string;
  grupo?: string;
  frecuencia?: string;
  turno?: string;
  tipo_turno?: string; // 'Urbano' | 'Media' | 'Larga'
  servicio?: string;
  hora_presentacion?: string;
  hora_salida_base?: string;
  hora_inicio: string;
  hora_fin: string;
  hora_llegada_base?: string;
  queda_fuera?: string;
  id_temporada?: string | number;
  temporada?: string;
}

interface Unidad {
  id_unidad?: string | number;
  unidad: string;
  patente?: string;
  empresa?: string;
  categoria?: string;
  asientos?: number;
}

interface Conductor {
  id_conductor?: string | number;
  legajo?: string;
  apellido_nombre: string;
  empresa?: string;
  dni?: string;
  licencia_conducir?: string;
}

interface Temporada {
  id_temporada?: string | number;
  nombre: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

interface Assignment {
  cod_turno: string;
  fecha: string;
  unidad: string;
  conductor_principal: string;
  conductor_secundario: string;
  observaciones: string;
  estado: 'Pendiente' | 'Completo';
}

interface ConflictInfo {
  hasUnitConflict: boolean;
  unitConflictingShift?: string;
  hasDriverConflict: boolean;
  driverConflictingShift?: string;
}

// Fallback Mock Data in case Supabase tables are empty
const DEFAULT_TEMPORADAS: Temporada[] = [
  { nombre: 'BAJA 2026', fecha_inicio: '2026-03-01', fecha_fin: '2026-06-30' },
  { nombre: 'INVIERNO 2026', fecha_inicio: '2026-07-01', fecha_fin: '2026-08-31' },
  { nombre: 'VERANO 2026', fecha_inicio: '2026-12-01', fecha_fin: '2027-02-28' },
];

const DEFAULT_TURNOS: Turno[] = [
  { cod_turno: 'U-101', grupo: 'Grupo 1', frecuencia: 'Lunes a Viernes', turno: 'Urbano Troncal Mañana', tipo_turno: 'Urbano', servicio: 'San Rafael - Centro', hora_presentacion: '05:45', hora_salida_base: '06:00', hora_inicio: '06:15', hora_fin: '14:15', hora_llegada_base: '14:30', queda_fuera: 'No', temporada: 'INVIERNO 2026' },
  { cod_turno: 'U-102', grupo: 'Grupo 1', frecuencia: 'Lunes a Viernes', turno: 'Urbano Troncal Tarde', tipo_turno: 'Urbano', servicio: 'San Rafael - Centro', hora_presentacion: '13:45', hora_salida_base: '14:00', hora_inicio: '14:15', hora_fin: '22:15', hora_llegada_base: '22:30', queda_fuera: 'No', temporada: 'INVIERNO 2026' },
  { cod_turno: 'M-201', grupo: 'Grupo 2', frecuencia: 'Lunes a Viernes', turno: 'Media Distancia Alvear', tipo_turno: 'Media', servicio: 'San Rafael - General Alvear', hora_presentacion: '06:30', hora_salida_base: '06:45', hora_inicio: '07:00', hora_fin: '15:00', hora_llegada_base: '15:20', queda_fuera: 'No', temporada: 'INVIERNO 2026' },
  { cod_turno: 'M-202', grupo: 'Grupo 2', frecuencia: 'Diario', turno: 'Media Distancia Malargüe', tipo_turno: 'Media', servicio: 'San Rafael - Malargüe', hora_presentacion: '07:00', hora_salida_base: '07:20', hora_inicio: '07:30', hora_fin: '17:30', hora_llegada_base: '18:00', queda_fuera: 'Sí', temporada: 'INVIERNO 2026' },
  { cod_turno: 'L-301', grupo: 'Grupo 3', frecuencia: 'Lunes a Sábado', turno: 'Larga Mendoza Expreso', tipo_turno: 'Larga', servicio: 'San Rafael - Mendoza Terminal', hora_presentacion: '04:30', hora_salida_base: '04:45', hora_inicio: '05:00', hora_fin: '19:00', hora_llegada_base: '19:30', queda_fuera: 'Sí', temporada: 'INVIERNO 2026' },
  { cod_turno: 'L-302', grupo: 'Grupo 3', frecuencia: 'Diario', turno: 'Larga Distancia Noche', tipo_turno: 'Larga', servicio: 'Mendoza - San Rafael Noite', hora_presentacion: '19:30', hora_salida_base: '19:45', hora_inicio: '20:00', hora_fin: '04:00', hora_llegada_base: '04:30', queda_fuera: 'Sí', temporada: 'INVIERNO 2026' },
];

const DEFAULT_FLOTA: Unidad[] = [
  { unidad: '540-01', patente: 'AB 123 CD', empresa: 'Antonio Buttini', categoria: 'Urbano', asientos: 45 },
  { unidad: '540-02', patente: 'AB 456 EF', empresa: 'Antonio Buttini', categoria: 'Urbano', asientos: 45 },
  { unidad: '540-03', patente: 'AC 789 GH', empresa: 'Antonio Buttini', categoria: 'Media Distancia', asientos: 52 },
  { unidad: '540-04', patente: 'AC 101 IJ', empresa: 'Antonio Buttini', categoria: 'Media Distancia', asientos: 52 },
  { unidad: '540-05', patente: 'AD 202 KL', empresa: 'Antonio Buttini', categoria: 'Larga Distancia', asientos: 60 },
  { unidad: '540-06', patente: 'AD 303 MN', empresa: 'Antonio Buttini', categoria: 'Larga Distancia', asientos: 60 },
];

const DEFAULT_CONDUCTORES: Conductor[] = [
  { legajo: '1001', apellido_nombre: 'Mendoza, Sebastian', dni: '32145678', licencia_conducir: 'A3-D2' },
  { legajo: '1002', apellido_nombre: 'Gomez, Facundo', dni: '34567890', licencia_conducir: 'A3-D2' },
  { legajo: '1003', apellido_nombre: 'Perez, Carlos Alberto', dni: '29876543', licencia_conducir: 'A3-D2' },
  { legajo: '1004', apellido_nombre: 'Fernandez, Martin', dni: '35123456', licencia_conducir: 'A3-D2' },
  { legajo: '1005', apellido_nombre: 'Ruiz, Gustavo Enrique', dni: '31987654', licencia_conducir: 'A3-D2' },
  { legajo: '1006', apellido_nombre: 'Alvarez, Juan Ramon', dni: '33456789', licencia_conducir: 'A3-D2' },
];

// Helper to convert HH:MM string to minutes since midnight
function timeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

// Get effective start & end time in minutes for overlap calculation
function getShiftInterval(turno: Turno): { start: number; end: number } | null {
  const startStr = turno.hora_presentacion || turno.hora_salida_base || turno.hora_inicio;
  const endStr = turno.hora_llegada_base || turno.hora_fin;

  const startMins = timeToMinutes(startStr);
  const endMins = timeToMinutes(endStr);

  if (startMins === null || endMins === null) return null;

  let effectiveEnd = endMins;
  // Handle overnight shift (e.g. 20:00 to 04:00 next day)
  if (effectiveEnd <= startMins) {
    effectiveEnd += 1440; // Add 24 hours
  }

  return { start: startMins, end: effectiveEnd };
}

export default function Diagramacion() {
  // Today's date YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('Todos');
  const [seasonFilter, setSeasonFilter] = useState<string>('Todas');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('Todos'); // 'Todos' | 'Incompletos' | 'Completos' | 'Conflictos'
  
  // Data state
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [flota, setFlota] = useState<Unidad[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  
  // Assignments map: Key = cod_turno
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  
  // Loading & status
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Copy modal state
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copySourceDate, setCopySourceDate] = useState<string>(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });

  // Load all master data (Turnos, Flota, Conductores, Temporadas)
  useEffect(() => {
    let isMounted = true;

    async function loadMasterData() {
      setIsLoading(true);
      try {
        // 1. Fetch Turnos
        let loadedTurnos: Turno[] = [];
        if (supabase) {
          const { data: turnosRes } = await supabase.from('turnos').select('*');
          if (turnosRes && turnosRes.length > 0) loadedTurnos = turnosRes;
        }
        if (loadedTurnos.length === 0) {
          const localTurnos = localStorage.getItem('ext_store_turnos');
          loadedTurnos = localTurnos ? JSON.parse(localTurnos) : DEFAULT_TURNOS;
        }

        // 2. Fetch Flota
        let loadedFlota: Unidad[] = [];
        if (supabase) {
          const { data: flotaRes } = await supabase.from('flota_activa').select('*');
          if (flotaRes && flotaRes.length > 0) loadedFlota = flotaRes;
        }
        if (loadedFlota.length === 0) {
          const localFlota = localStorage.getItem('ext_store_flota_activa');
          loadedFlota = localFlota ? JSON.parse(localFlota) : DEFAULT_FLOTA;
        }

        // 3. Fetch Conductores
        let loadedConductores: Conductor[] = [];
        if (supabase) {
          const { data: condRes } = await supabase.from('nomina_conductores').select('*');
          if (condRes && condRes.length > 0) loadedConductores = condRes;
        }
        if (loadedConductores.length === 0) {
          const localCond = localStorage.getItem('ext_store_nomina_conductores');
          loadedConductores = localCond ? JSON.parse(localCond) : DEFAULT_CONDUCTORES;
        }

        // 4. Fetch Temporadas
        let loadedTemporadas: Temporada[] = [];
        if (supabase) {
          const { data: tempRes } = await supabase.from('temporadas').select('*');
          if (tempRes && tempRes.length > 0) loadedTemporadas = tempRes;
        }
        if (loadedTemporadas.length === 0) {
          loadedTemporadas = DEFAULT_TEMPORADAS;
        }

        if (isMounted) {
          setTurnos(loadedTurnos);
          setFlota(loadedFlota);
          setConductores(loadedConductores);
          setTemporadas(loadedTemporadas);
        }
      } catch (err) {
        console.error('Error loading master data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMasterData();

    return () => { isMounted = false; };
  }, []);

  // Load Diagramación assignments whenever selectedDate changes
  useEffect(() => {
    let isMounted = true;

    async function loadAssignments() {
      if (!selectedDate) return;

      try {
        let loaded: Record<string, Assignment> = {};

        // 1. Try local storage first for quick response
        const localKey = `diagramacion_${selectedDate}`;
        const localData = localStorage.getItem(localKey);
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            if (Array.isArray(parsed)) {
              parsed.forEach((item: Assignment) => {
                if (item.cod_turno) loaded[item.cod_turno] = item;
              });
            } else if (typeof parsed === 'object') {
              loaded = parsed;
            }
          } catch (e) {
            console.error('Error parsing local diagramacion:', e);
          }
        }

        // 2. Try Supabase if available
        if (supabase) {
          const { data: dbRes, error } = await supabase
            .from('diagramaciones')
            .select('*')
            .eq('fecha', selectedDate);

          if (!error && dbRes && dbRes.length > 0) {
            const dbMap: Record<string, Assignment> = {};
            dbRes.forEach((row: any) => {
              dbMap[row.cod_turno] = {
                cod_turno: row.cod_turno,
                fecha: row.fecha || selectedDate,
                unidad: row.unidad || '',
                conductor_principal: row.conductor_principal || '',
                conductor_secundario: row.conductor_secundario || '',
                observaciones: row.observaciones || '',
                estado: (row.unidad && row.conductor_principal) ? 'Completo' : 'Pendiente'
              };
            });
            loaded = { ...loaded, ...dbMap };
          }
        }

        if (isMounted) {
          setAssignments(loaded);
        }
      } catch (err) {
        console.error('Error loading assignments for date:', selectedDate, err);
      }
    }

    loadAssignments();

    return () => { isMounted = false; };
  }, [selectedDate]);

  // Handle Toast Notifications
  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Update a single shift assignment field
  const handleAssignmentChange = (codTurno: string, field: keyof Assignment, value: string) => {
    setAssignments((prev) => {
      const existing = prev[codTurno] || {
        cod_turno: codTurno,
        fecha: selectedDate,
        unidad: '',
        conductor_principal: '',
        conductor_secundario: '',
        observaciones: '',
        estado: 'Pendiente'
      };

      const updated = {
        ...existing,
        [field]: value,
        fecha: selectedDate
      };

      // Determine state
      const isComplete = Boolean(updated.unidad && updated.conductor_principal);
      updated.estado = isComplete ? 'Completo' : 'Pendiente';

      return {
        ...prev,
        [codTurno]: updated
      };
    });
  };

  // Save Diagramación to Storage & Supabase
  const handleSaveDiagramacion = async () => {
    setIsSaving(true);
    try {
      const localKey = `diagramacion_${selectedDate}`;
      const assignmentList: Assignment[] = (Object.values(assignments) as Assignment[]).filter(
        a => a.unidad || a.conductor_principal || a.conductor_secundario || a.observaciones
      );

      // Save to LocalStorage
      localStorage.setItem(localKey, JSON.stringify(assignments));

      // Attempt save to Supabase if client exists
      if (supabase) {
        // Upsert list of non-empty assignments
        if (assignmentList.length > 0) {
          const rowsToUpsert = assignmentList.map(a => ({
            fecha: selectedDate,
            cod_turno: a.cod_turno,
            unidad: a.unidad,
            conductor_principal: a.conductor_principal,
            conductor_secundario: a.conductor_secundario,
            observaciones: a.observaciones,
            updated_at: new Date().toISOString()
          }));

          const { error } = await supabase
            .from('diagramaciones')
            .upsert(rowsToUpsert, { onConflict: 'fecha,cod_turno' });

          if (error) {
            console.warn('Supabase diagramaciones save fallback to local storage:', error.message);
          }
        }
      }

      showToast('success', `Diagramación del ${formatDateSpanish(selectedDate)} guardada correctamente.`);
    } catch (err: any) {
      console.error('Error saving diagramacion:', err);
      showToast('error', 'Ocurrió un error al guardar. Se conservaron los cambios localmente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Copy diagramación from another date
  const handleCopyFromDate = () => {
    if (!copySourceDate) return;
    const sourceKey = `diagramacion_${copySourceDate}`;
    const sourceData = localStorage.getItem(sourceKey);

    if (!sourceData) {
      showToast('info', `No se encontró diagramación guardada para el ${formatDateSpanish(copySourceDate)}.`);
      return;
    }

    try {
      const parsed = JSON.parse(sourceData);
      const newAssignments: Record<string, Assignment> = {};

      if (typeof parsed === 'object') {
        Object.entries(parsed).forEach(([cod, assign]: [string, any]) => {
          newAssignments[cod] = {
            ...assign,
            fecha: selectedDate
          };
        });
      }

      setAssignments(newAssignments);
      setIsCopyModalOpen(false);
      showToast('success', `Diagramación copiada exitosamente desde ${formatDateSpanish(copySourceDate)}.`);
    } catch (e) {
      showToast('error', 'Error al leer la diagramación de la fecha origen.');
    }
  };

  // Reset all assignments for the current date
  const handleClearAssignments = () => {
    if (window.confirm(`¿Está seguro de limpiar todas las asignaciones para el día ${formatDateSpanish(selectedDate)}?`)) {
      setAssignments({});
      localStorage.removeItem(`diagramacion_${selectedDate}`);
      showToast('info', 'Se han limpiado todas las asignaciones del día.');
    }
  };

  // Compute Conflicts (Overlaps in time for the same unit or driver)
  const conflictsMap = useMemo<Record<string, ConflictInfo>>(() => {
    const result: Record<string, ConflictInfo> = {};

    // First collect shift intervals for active turnos
    const activeIntervals: {
      cod_turno: string;
      interval: { start: number; end: number };
      unidad: string;
      condPrincipal: string;
      condSecundario: string;
    }[] = [];

    turnos.forEach((t) => {
      const assign = assignments[t.cod_turno];
      if (!assign) return;

      const interval = getShiftInterval(t);
      if (!interval) return;

      if (assign.unidad || assign.conductor_principal || assign.conductor_secundario) {
        activeIntervals.push({
          cod_turno: t.cod_turno,
          interval,
          unidad: assign.unidad ? assign.unidad.trim().toLowerCase() : '',
          condPrincipal: assign.conductor_principal ? assign.conductor_principal.trim().toLowerCase() : '',
          condSecundario: assign.conductor_secundario ? assign.conductor_secundario.trim().toLowerCase() : ''
        });
      }
    });

    // Check every pair for overlaps
    for (let i = 0; i < activeIntervals.length; i++) {
      for (let j = i + 1; j < activeIntervals.length; j++) {
        const a = activeIntervals[i];
        const b = activeIntervals[j];

        // Check if time intervals overlap
        const overlaps = a.interval.start < b.interval.end && a.interval.end > b.interval.start;

        if (overlaps) {
          // 1. Check unit overlap
          if (a.unidad && b.unidad && a.unidad === b.unidad) {
            if (!result[a.cod_turno]) result[a.cod_turno] = { hasUnitConflict: false, hasDriverConflict: false };
            if (!result[b.cod_turno]) result[b.cod_turno] = { hasUnitConflict: false, hasDriverConflict: false };

            result[a.cod_turno].hasUnitConflict = true;
            result[a.cod_turno].unitConflictingShift = b.cod_turno;

            result[b.cod_turno].hasUnitConflict = true;
            result[b.cod_turno].unitConflictingShift = a.cod_turno;
          }

          // 2. Check driver overlap (principal or secundario)
          const driversA = [a.condPrincipal, a.condSecundario].filter(Boolean);
          const driversB = [b.condPrincipal, b.condSecundario].filter(Boolean);

          const driverConflict = driversA.some(d => driversB.includes(d));

          if (driverConflict) {
            if (!result[a.cod_turno]) result[a.cod_turno] = { hasUnitConflict: false, hasDriverConflict: false };
            if (!result[b.cod_turno]) result[b.cod_turno] = { hasUnitConflict: false, hasDriverConflict: false };

            result[a.cod_turno].hasDriverConflict = true;
            result[a.cod_turno].driverConflictingShift = b.cod_turno;

            result[b.cod_turno].hasDriverConflict = true;
            result[b.cod_turno].driverConflictingShift = a.cod_turno;
          }
        }
      }
    }

    return result;
  }, [turnos, assignments]);

  // Filter turnos according to user selections
  const filteredTurnos = useMemo(() => {
    return turnos.filter((t) => {
      // 1. Tipo filter (Urbano, Media, Larga)
      if (tipoFilter !== 'Todos' && String(t.tipo_turno || '').toLowerCase() !== tipoFilter.toLowerCase()) {
        return false;
      }

      // 2. Season filter
      if (seasonFilter !== 'Todas') {
        const seasonName = String(t.temporada || '').toLowerCase();
        if (seasonName !== seasonFilter.toLowerCase()) return false;
      }

      // 3. Assignment status filter
      const assign = assignments[t.cod_turno];
      const isComplete = Boolean(assign?.unidad && assign?.conductor_principal);
      const conflict = conflictsMap[t.cod_turno];
      const hasConflict = Boolean(conflict?.hasUnitConflict || conflict?.hasDriverConflict);

      if (assignmentFilter === 'Incompletos' && isComplete) return false;
      if (assignmentFilter === 'Completos' && !isComplete) return false;
      if (assignmentFilter === 'Conflictos' && !hasConflict) return false;

      // 4. Text Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchCode = String(t.cod_turno || '').toLowerCase().includes(query);
        const matchService = String(t.servicio || '').toLowerCase().includes(query);
        const matchName = String(t.turno || '').toLowerCase().includes(query);
        const matchGroup = String(t.grupo || '').toLowerCase().includes(query);
        const matchUnit = assign?.unidad ? String(assign.unidad).toLowerCase().includes(query) : false;
        const matchDriver = assign?.conductor_principal ? String(assign.conductor_principal).toLowerCase().includes(query) : false;

        return matchCode || matchService || matchName || matchGroup || matchUnit || matchDriver;
      }

      return true;
    });
  }, [turnos, assignments, conflictsMap, tipoFilter, seasonFilter, assignmentFilter, searchTerm]);

  // Calculate Summary Metrics
  const metrics = useMemo(() => {
    const total = turnos.length;
    let completos = 0;
    let pendientes = 0;

    turnos.forEach((t) => {
      const a = assignments[t.cod_turno];
      if (a?.unidad && a?.conductor_principal) {
        completos++;
      } else {
        pendientes++;
      }
    });

    const conflictosCount = Object.keys(conflictsMap).length;

    return { total, completos, pendientes, conflictosCount };
  }, [turnos, assignments, conflictsMap]);

  // Helper date buttons
  const setDateOffset = (offsetDays: number) => {
    const curr = new Date(selectedDate + 'T12:00:00');
    curr.setDate(curr.getDate() + offsetDays);
    setSelectedDate(curr.toISOString().split('T')[0]);
  };

  // Spanish formatted date label
  function formatDateSpanish(dateStr: string) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return d.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Código Turno', 'Grupo', 'Tipo', 'Servicio', 'Presentación', 'Salida Base', 'Inicio', 'Fin', 'Llegada Base', 'Unidad Asignada', 'Conductor Principal', 'Conductor Secundario', 'Observaciones', 'Estado'];
    
    const rows = filteredTurnos.map(t => {
      const a = assignments[t.cod_turno] || {};
      return [
        `"${t.cod_turno || ''}"`,
        `"${t.grupo || ''}"`,
        `"${t.tipo_turno || ''}"`,
        `"${t.servicio || ''}"`,
        `"${t.hora_presentacion || ''}"`,
        `"${t.hora_salida_base || ''}"`,
        `"${t.hora_inicio || ''}"`,
        `"${t.hora_fin || ''}"`,
        `"${t.hora_llegada_base || ''}"`,
        `"${a.unidad || ''}"`,
        `"${a.conductor_principal || ''}"`,
        `"${a.conductor_secundario || ''}"`,
        `"${a.observaciones || ''}"`,
        `"${(a.unidad && a.conductor_principal) ? 'COMPLETO' : 'PENDIENTE'}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `diagramacion_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Header */}
      <Header title="Diagramación Operativa" subtitle="Asignación Diaria de Conductores y Unidades">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            title="Exportar a CSV / Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            title="Imprimir Sábana de Turnos"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            onClick={() => setIsCopyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 shadow-2xs transition-colors cursor-pointer"
            title="Copiar diagramación de otro día"
          >
            <Copy className="w-4 h-4" />
            <span>Copiar Diagramación</span>
          </button>

          <button
            onClick={handleSaveDiagramacion}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </Header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-xs font-bold text-white transition-all transform duration-300 ${
          toastMessage.type === 'success' ? 'bg-emerald-600' : toastMessage.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-4">
        {/* Top Control Bar: Date Selector & Metrics */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Date Picker & Quick Navigation */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center bg-slate-100 border border-slate-300 rounded-lg p-1 space-x-1">
              <button
                onClick={() => setDateOffset(-1)}
                className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 transition-colors"
                title="Día anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center px-2 space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => setDateOffset(1)}
                className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 transition-colors"
                title="Día siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick buttons */}
            <div className="flex items-center space-x-1 text-xs">
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className={`px-2.5 py-1 rounded-md border font-bold transition-colors ${
                  selectedDate === new Date().toISOString().split('T')[0]
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setDateOffset(1)}
                className="px-2.5 py-1 bg-white text-slate-700 border border-slate-200 rounded-md font-bold hover:bg-slate-50 transition-colors"
              >
                Mañana
              </button>
            </div>

            <span className="hidden lg:inline text-xs font-semibold text-slate-500 capitalize pl-2 border-l border-slate-200">
              {formatDateSpanish(selectedDate)}
            </span>
          </div>

          {/* Operational Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center justify-between gap-3">
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400">Total Turnos</span>
                <span className="text-base font-black text-slate-800 tracking-tight">{metrics.total}</span>
              </div>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>

            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center justify-between gap-3">
              <div>
                <span className="block text-[9px] uppercase font-bold text-emerald-600">Completos</span>
                <span className="text-base font-black text-emerald-700 tracking-tight">{metrics.completos}</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center justify-between gap-3">
              <div>
                <span className="block text-[9px] uppercase font-bold text-amber-600">Pendientes</span>
                <span className="text-base font-black text-amber-700 tracking-tight">{metrics.pendientes}</span>
              </div>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>

            <div className={`border px-3 py-1.5 rounded-lg flex items-center justify-between gap-3 transition-colors ${
              metrics.conflictosCount > 0 
                ? 'bg-red-50 border-red-300 animate-pulse' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className={`block text-[9px] uppercase font-bold ${metrics.conflictosCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                  Conflictos
                </span>
                <span className={`text-base font-black tracking-tight ${metrics.conflictosCount > 0 ? 'text-red-700' : 'text-slate-800'}`}>
                  {metrics.conflictosCount}
                </span>
              </div>
              <ShieldAlert className={`w-4 h-4 ${metrics.conflictosCount > 0 ? 'text-red-500' : 'text-slate-400'}`} />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Left: Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, servicio, unidad o conductor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Center: Dropdown Filters */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Tipo Filter */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 flex items-center gap-1">
                <Filter className="w-3 h-3 text-blue-600" />
                <span>Tipo:</span>
              </span>
              {['Todos', 'Urbano', 'Media', 'Larga'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTipoFilter(t)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    tipoFilter === t
                      ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Temporada Filter */}
            {temporadas.length > 0 && (
              <select
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="Todas">Todas las Temporadas</option>
                {temporadas.map((temp, idx) => (
                  <option key={`temp-${temp.id_temporada || temp.nombre}-${idx}`} value={temp.nombre}>
                    {temp.nombre}
                  </option>
                ))}
              </select>
            )}

            {/* Estado Asignación Filter */}
            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="Todos">Todos los Estados</option>
              <option value="Incompletos">Pendientes de Asignar</option>
              <option value="Completos">Completamente Asignados</option>
              <option value="Conflictos">Con Conflictos ⚠️</option>
            </select>
          </div>

          {/* Right: View mode toggle & Clear */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearAssignments}
              className="px-2.5 py-1 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Limpiar asignaciones de la fecha"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpiar Todo</span>
            </button>

            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista en Tarjetas"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista en Tabla"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content View: Grid or Table */}
        <div className="flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-semibold">Cargando turnos y maestras de flota y conductores...</p>
            </div>
          ) : filteredTurnos.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 max-w-md mx-auto my-8">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700 mb-1">No se encontraron turnos</h4>
              <p className="text-xs text-slate-500 mb-4">Pruebe ajustando los filtros de búsqueda, tipo o temporada.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTipoFilter('Todos');
                  setSeasonFilter('Todas');
                  setAssignmentFilter('Todos');
                }}
                className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID / CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
              {filteredTurnos.map((t) => {
                const assign = assignments[t.cod_turno] || {
                  cod_turno: t.cod_turno,
                  fecha: selectedDate,
                  unidad: '',
                  conductor_principal: '',
                  conductor_secundario: '',
                  observaciones: '',
                  estado: 'Pendiente'
                };

                const conflict = conflictsMap[t.cod_turno];
                const hasUnitConflict = Boolean(conflict?.hasUnitConflict);
                const hasDriverConflict = Boolean(conflict?.hasDriverConflict);
                const isComplete = Boolean(assign.unidad && assign.conductor_principal);

                return (
                  <div
                    key={t.cod_turno}
                    className={`bg-white rounded-xl border transition-all shadow-2xs ${
                      hasUnitConflict || hasDriverConflict
                        ? 'border-red-300 ring-2 ring-red-200 bg-red-50/10'
                        : isComplete
                        ? 'border-emerald-200 hover:border-emerald-300'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Card Top Banner */}
                    <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 rounded-t-xl">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-black text-slate-900 bg-white px-2 py-0.5 border border-slate-200 rounded shadow-2xs">
                          {t.cod_turno}
                        </span>
                        
                        {/* Tipo Badge */}
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                          t.tipo_turno === 'Urbano'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : t.tipo_turno === 'Media'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {t.tipo_turno || 'Urbano'}
                        </span>

                        {t.grupo && (
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {t.grupo}
                          </span>
                        )}
                      </div>

                      {/* Status Indicator */}
                      <div>
                        {hasUnitConflict || hasDriverConflict ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full animate-pulse">
                            <ShieldAlert className="w-3 h-3 text-red-600" />
                            <span>Superposición</span>
                          </span>
                        ) : isComplete ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Completo</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Incompleto</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      {/* Service / Description */}
                      <div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{t.turno || t.servicio || 'Servicio de Línea'}</p>
                        {t.servicio && t.turno && <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{t.servicio}</p>}
                      </div>

                      {/* Detailed Schedule Pill */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] font-medium text-slate-700 grid grid-cols-2 gap-y-1 gap-x-2">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Presentación:</span>
                          <span className="font-bold text-slate-900">{t.hora_presentacion || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <span>Salida Base:</span>
                          <span className="font-bold text-slate-900">{t.hora_salida_base || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <span>Inicio / Fin:</span>
                          <span className="font-bold text-slate-900">{t.hora_inicio} - {t.hora_fin}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <span>Llegada Base:</span>
                          <span className="font-bold text-slate-900">{t.hora_llegada_base || '-'}</span>
                        </div>
                      </div>

                      {/* Overlap warnings banner */}
                      {(hasUnitConflict || hasDriverConflict) && (
                        <div className="p-2 bg-red-100/70 border border-red-300 rounded-lg text-[11px] text-red-800 space-y-1">
                          {hasUnitConflict && (
                            <p className="flex items-center gap-1 font-bold">
                              ⚠️ Unidad superpuesta con turno {conflict.unitConflictingShift}
                            </p>
                          )}
                          {hasDriverConflict && (
                            <p className="flex items-center gap-1 font-bold">
                              ⚠️ Conductor superpuesto con turno {conflict.driverConflictingShift}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Selectors */}
                      <div className="space-y-2.5">
                        {/* Unidad Dropdown */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Bus className="w-3 h-3 text-slate-400" />
                              <span>Unidad / Coche</span>
                            </span>
                            {hasUnitConflict && <span className="text-red-600 font-bold">Conflicto</span>}
                          </label>
                          <select
                            value={assign.unidad || ''}
                            onChange={(e) => handleAssignmentChange(t.cod_turno, 'unidad', e.target.value)}
                            className={`w-full bg-white border rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                              hasUnitConflict
                                ? 'border-red-500 focus:ring-red-300 bg-red-50/50'
                                : assign.unidad
                                ? 'border-emerald-400 bg-emerald-50/20'
                                : 'border-slate-300 focus:ring-blue-200'
                            }`}
                          >
                            <option value="">-- Seleccionar Unidad --</option>
                            {flota.map((u, idx) => (
                              <option key={`u-${u.unidad}-${idx}`} value={u.unidad}>
                                {u.unidad} {u.patente ? `(${u.patente})` : ''} {u.categoria ? `- ${u.categoria}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Conductor Principal Dropdown */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-slate-400" />
                              <span>Conductor Principal</span>
                            </span>
                            {hasDriverConflict && <span className="text-red-600 font-bold">Conflicto</span>}
                          </label>
                          <select
                            value={assign.conductor_principal || ''}
                            onChange={(e) => handleAssignmentChange(t.cod_turno, 'conductor_principal', e.target.value)}
                            className={`w-full bg-white border rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                              hasDriverConflict
                                ? 'border-red-500 focus:ring-red-300 bg-red-50/50'
                                : assign.conductor_principal
                                ? 'border-emerald-400 bg-emerald-50/20'
                                : 'border-slate-300 focus:ring-blue-200'
                            }`}
                          >
                            <option value="">-- Seleccionar Conductor --</option>
                            {conductores.map((c, idx) => (
                              <option key={`cp-${c.legajo || c.apellido_nombre}-${idx}`} value={c.apellido_nombre}>
                                {c.apellido_nombre} {c.legajo ? `(Leg: ${c.legajo})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Conductor Secundario (Optional, ideal for Media / Larga) */}
                        {(t.tipo_turno === 'Media' || t.tipo_turno === 'Larga' || assign.conductor_secundario) && (
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                              <UserPlus className="w-3 h-3 text-slate-400" />
                              <span>Conductor Secundario / Relevo (Opcional)</span>
                            </label>
                            <select
                              value={assign.conductor_secundario || ''}
                              onChange={(e) => handleAssignmentChange(t.cod_turno, 'conductor_secundario', e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                            >
                              <option value="">-- Ninguno --</option>
                              {conductores.map((c, idx) => (
                                <option key={`cs-${c.legajo || c.apellido_nombre}-${idx}`} value={c.apellido_nombre}>
                                  {c.apellido_nombre} {c.legajo ? `(Leg: ${c.legajo})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Observaciones Input */}
                        <div>
                          <input
                            type="text"
                            placeholder="Observaciones o notas de turno..."
                            value={assign.observaciones || ''}
                            onChange={(e) => handleAssignmentChange(t.cod_turno, 'observaciones', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs mb-8">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-3">Tipo / Grupo</th>
                    <th className="py-3 px-3">Servicio</th>
                    <th className="py-3 px-3">Presentación</th>
                    <th className="py-3 px-3">Salida Base</th>
                    <th className="py-3 px-3">Inicio - Fin</th>
                    <th className="py-3 px-3">Llegada Base</th>
                    <th className="py-3 px-4 min-w-[170px]">Unidad</th>
                    <th className="py-3 px-4 min-w-[210px]">Conductor Principal</th>
                    <th className="py-3 px-4 min-w-[180px]">Conductor Secundario</th>
                    <th className="py-3 px-4 min-w-[160px]">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredTurnos.map((t) => {
                    const assign = assignments[t.cod_turno] || {
                      cod_turno: t.cod_turno,
                      fecha: selectedDate,
                      unidad: '',
                      conductor_principal: '',
                      conductor_secundario: '',
                      observaciones: '',
                      estado: 'Pendiente'
                    };

                    const conflict = conflictsMap[t.cod_turno];
                    const hasUnitConflict = Boolean(conflict?.hasUnitConflict);
                    const hasDriverConflict = Boolean(conflict?.hasDriverConflict);

                    return (
                      <tr
                        key={t.cod_turno}
                        className={`hover:bg-slate-50 transition-colors ${
                          hasUnitConflict || hasDriverConflict ? 'bg-red-50/30' : ''
                        }`}
                      >
                        {/* Code */}
                        <td className="py-2.5 px-4">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                            {t.cod_turno}
                          </span>
                        </td>

                        {/* Tipo */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                            t.tipo_turno === 'Urbano'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : t.tipo_turno === 'Media'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {t.tipo_turno || 'Urbano'}
                          </span>
                        </td>

                        {/* Servicio */}
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-800 block line-clamp-1">{t.turno || t.servicio || '-'}</span>
                          {t.servicio && <span className="text-[10px] text-slate-400 block">{t.servicio}</span>}
                        </td>

                        {/* Horarios */}
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{t.hora_presentacion || '-'}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{t.hora_salida_base || '-'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">{t.hora_inicio} - {t.hora_fin}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{t.hora_llegada_base || '-'}</td>

                        {/* Unidad Dropdown */}
                        <td className="py-2.5 px-4">
                          <select
                            value={assign.unidad || ''}
                            onChange={(e) => handleAssignmentChange(t.cod_turno, 'unidad', e.target.value)}
                            className={`w-full bg-white border rounded-lg px-2 py-1 text-xs font-bold focus:outline-none ${
                              hasUnitConflict
                                ? 'border-red-500 bg-red-50 text-red-900'
                                : assign.unidad
                                ? 'border-emerald-300 text-slate-800'
                                : 'border-slate-300 text-slate-500'
                            }`}
                          >
                            <option value="">-- Unidad --</option>
                            {flota.map((u, idx) => (
                              <option key={`tu-${u.unidad}-${idx}`} value={u.unidad}>
                                {u.unidad} {u.patente ? `(${u.patente})` : ''}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Conductor Principal Dropdown */}
                        <td className="py-2.5 px-4">
                          <select
                            value={assign.conductor_principal || ''}
                            onChange={(e) => handleAssignmentChange(t.cod_turno, 'conductor_principal', e.target.value)}
                            className={`w-full bg-white border rounded-lg px-2 py-1 text-xs font-bold focus:outline-none ${
                              hasDriverConflict
                                ? 'border-red-500 bg-red-50 text-red-900'
                                : assign.conductor_principal
                                ? 'border-emerald-300 text-slate-800'
                                : 'border-slate-300 text-slate-500'
                            }`}
                          >
                            <option value="">-- Conductor --</option>
                            {conductores.map((c, idx) => (
                              <option key={`tcp-${c.legajo || c.apellido_nombre}-${idx}`} value={c.apellido_nombre}>
                                {c.apellido_nombre} {c.legajo ? `(${c.legajo})` : ''}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Conductor Secundario */}
                        <td className="py-2.5 px-4">
                          <select
                            value={assign.conductor_secundario || ''}
                            onChange={(e) => handleAssignmentChange(t.cod_turno, 'conductor_secundario', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none"
                          >
                            <option value="">-- Opcional --</option>
                            {conductores.map((c, idx) => (
                              <option key={`tcs-${c.legajo || c.apellido_nombre}-${idx}`} value={c.apellido_nombre}>
                                {c.apellido_nombre}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Observaciones */}
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            placeholder="Notas..."
                            value={assign.observaciones || ''}
                            onChange={(e) => handleAssignmentChange(t.cod_turno, 'observaciones', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:bg-white focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Copy Diagramacion Modal */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Copy className="w-5 h-5 text-blue-600" />
                <h3>Copiar Diagramación Anterior</h3>
              </div>
              <button
                onClick={() => setIsCopyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Seleccione la fecha de origen desde la cual desea copiar las asignaciones de unidades y conductores hacia la fecha actual (<strong>{formatDateSpanish(selectedDate)}</strong>).
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Origen</label>
              <input
                type="date"
                value={copySourceDate}
                onChange={(e) => setCopySourceDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsCopyModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCopyFromDate}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar Asignaciones</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

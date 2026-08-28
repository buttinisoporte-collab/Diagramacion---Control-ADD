import Select from "react-select";
import { useState, useEffect, useMemo, useRef } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { 
  Upload,
  FileUp,
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
  FileSpreadsheet,
  Trash2
} from 'lucide-react';

interface Turno {
  id_turno?: string | number;
  cod_turno: string;
  grupo?: string;
  frecuencia?: string;
  turno?: string;
  tipo_turno?: string; // 'Urbano' | 'Media' | 'Larga'
  salida?: string;
  hora_presentacion?: string;
  hora_salida_base?: string;
  hora_inicio: string;
  hora_fin: string;
  hora_llegada_base?: string;
  llegada?: string;
  id_temporada?: string | number;
  temporada?: string;
  es_refuerzo?: boolean;
  dias_refuerzo?: string[];
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
  { cod_turno: 'U-101', grupo: 'Grupo 1', frecuencia: 'Lunes a Viernes', turno: 'Urbano Troncal Mañana', tipo_turno: 'Urbano', salida: 'BASE', hora_presentacion: '05:45', hora_salida_base: '06:00', hora_inicio: '06:15', hora_fin: '14:15', hora_llegada_base: '14:30', llegada: 'BASE', temporada: 'INVIERNO 2026' },
  { cod_turno: 'U-102', grupo: 'Grupo 1', frecuencia: 'Lunes a Viernes', turno: 'Urbano Troncal Tarde', tipo_turno: 'Urbano', salida: 'BASE', hora_presentacion: '13:45', hora_salida_base: '14:00', hora_inicio: '14:15', hora_fin: '22:15', hora_llegada_base: '22:30', llegada: 'BASE', temporada: 'INVIERNO 2026' },
  { cod_turno: 'M-201', grupo: 'Grupo 2', frecuencia: 'Lunes a Viernes', turno: 'Media Distancia Alvear', tipo_turno: 'Media', salida: 'BASE', hora_presentacion: '06:30', hora_salida_base: '06:45', hora_inicio: '07:00', hora_fin: '15:00', hora_llegada_base: '15:20', llegada: 'BASE', temporada: 'INVIERNO 2026' },
  { cod_turno: 'M-202', grupo: 'Grupo 2', frecuencia: 'Diario', turno: 'Media Distancia Malargüe', tipo_turno: 'Media', salida: 'BASE', hora_presentacion: '07:00', hora_salida_base: '07:20', hora_inicio: '07:30', hora_fin: '17:30', hora_llegada_base: '18:00', llegada: 'TERMINAL', temporada: 'INVIERNO 2026' },
  { cod_turno: 'L-301', grupo: 'Grupo 3', frecuencia: 'Lunes a Sábado', turno: 'Larga Mendoza Expreso', tipo_turno: 'Larga', salida: 'ETOM', hora_presentacion: '04:30', hora_salida_base: '04:45', hora_inicio: '05:00', hora_fin: '19:00', hora_llegada_base: '19:30', llegada: 'ETOM', temporada: 'INVIERNO 2026' },
  { cod_turno: 'L-302', grupo: 'Grupo 3', frecuencia: 'Diario', turno: 'Larga Distancia Noche', tipo_turno: 'Larga', salida: 'ETOM', hora_presentacion: '19:30', hora_salida_base: '19:45', hora_inicio: '20:00', hora_fin: '04:00', hora_llegada_base: '04:30', llegada: 'BASE', temporada: 'INVIERNO 2026' },
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
  const startStr = turno.hora_inicio;
  const endStr = turno.hora_fin;

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
  const [assignmentFilter, setAssignmentFilter] = useState<string>('Todos');
  const [grupoFilter, setGrupoFilter] = useState<string>('Todos los Grupos'); // 'Todos' | 'Incompletos' | 'Completos' | 'Conflictos'
  
  // Data state
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [flota, setFlota] = useState<Unidad[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [feriados, setFeriados] = useState<any[]>([]);
  
  // Assignments map: Key = cod_turno
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  
  // Loading & status
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Copy modal state
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [turnoToDelete, setTurnoToDelete] = useState<Turno | null>(null);
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
        
        // Helper to normalize shift codes for consistent comparison and deduplication
        const normCode = (val: any) => String(val || '').trim().toLowerCase();

        // Merge from localStorage ext_store_turnos for custom edits and fallbacks
        const localTurnosStr = localStorage.getItem('ext_store_turnos');
        if (localTurnosStr) {
          try {
            const parsed = JSON.parse(localTurnosStr);
            const localTurnosArr: Turno[] = Array.isArray(parsed) ? parsed : Object.values(parsed);
            
            localTurnosArr.forEach((localT: Turno) => {
              const localCode = normCode(localT.cod_turno);
              if (!localCode) return;
              const existingIdx = loadedTurnos.findIndex(t => normCode(t.cod_turno) === localCode);
              if (existingIdx >= 0) {
                loadedTurnos[existingIdx] = { 
                  ...loadedTurnos[existingIdx], 
                  ...localT, 
                  cod_turno: String(loadedTurnos[existingIdx].cod_turno || localT.cod_turno).trim() 
                };
              } else {
                loadedTurnos.push({
                  ...localT,
                  cod_turno: String(localT.cod_turno).trim()
                });
              }
            });
          } catch (e) {
            console.error('Error parsing local turnos:', e);
          }
        }

        if (loadedTurnos.length === 0) {
          loadedTurnos = DEFAULT_TURNOS;
        }

        // Deduplicate loadedTurnos by normalized cod_turno
        const seenTurnoCodes = new Set<string>();
        const uniqueTurnos: Turno[] = [];
        for (const t of loadedTurnos) {
          const codeKey = normCode(t.cod_turno);
          if (codeKey && !seenTurnoCodes.has(codeKey)) {
            seenTurnoCodes.add(codeKey);
            uniqueTurnos.push({
              ...t,
              cod_turno: String(t.cod_turno).trim()
            });
          }
        }
        loadedTurnos = uniqueTurnos;

        // Filter out any turnos that were marked as deleted locally
        const deletedStr = localStorage.getItem('deleted_turno_codes');
        if (deletedStr) {
          try {
            const deletedCodes: string[] = JSON.parse(deletedStr);
            if (Array.isArray(deletedCodes)) {
              const deletedSet = new Set(deletedCodes.map(c => normCode(c)));
              loadedTurnos = loadedTurnos.filter(t => !deletedSet.has(normCode(t.cod_turno)));
            }
          } catch (e) {
            console.error('Error parsing deleted codes:', e);
          }
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
        let loadedFeriados: any[] = [];
        if (supabase) {
          const { data: feriadosRes } = await supabase.from('feriados').select('*');
          if (feriadosRes) loadedFeriados = feriadosRes;
        }
        if (loadedFeriados.length === 0) {
          const localFeriados = localStorage.getItem('ext_store_feriados');
          loadedFeriados = localFeriados ? JSON.parse(localFeriados) : [];
        }
        setFeriados(loadedFeriados);
        
        let loadedTemporadas: Temporada[] = [];
        if (supabase) {
          const { data: tempRes } = await supabase.from('temporadas').select('*');
          if (tempRes && tempRes.length > 0) loadedTemporadas = tempRes;
        }
        if (loadedTemporadas.length === 0) {
          loadedTemporadas = DEFAULT_TEMPORADAS;
        }

        if (isMounted) {
          loadedTurnos.sort((a, b) => (a.cod_turno || '').localeCompare(b.cod_turno || '', undefined, { numeric: true }));
          setTurnos(loadedTurnos);
          setFlota(loadedFlota.sort((a, b) => (a.unidad || '').localeCompare(b.unidad || '')));
          setConductores(loadedConductores.sort((a, b) => (a.apellido_nombre || '').localeCompare(b.apellido_nombre || '')));
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

  const confirmDeleteTurno = (t: Turno) => {
    setTurnoToDelete(t);
  };

  const handleDeleteTurno = async () => {
    if (!turnoToDelete) return;

    try {
      const codToDelete = turnoToDelete.cod_turno;

      // 1. Delete from Supabase if available
      if (supabase) {
        // Delete assignment / diagramacion for this turno if any
        const { error: diagError } = await supabase
          .from('diagramaciones')
          .delete()
          .eq('cod_turno', codToDelete);
        if (diagError) {
          console.error('Error deleting diagramacion from Supabase:', diagError);
        }

        // Delete from turnos master table
        const { error: turnoError } = await supabase
          .from('turnos')
          .delete()
          .eq('cod_turno', codToDelete);
        if (turnoError) {
          console.error('Error deleting master turno from Supabase:', turnoError);
        }
      }

      // 2. Filter local React state
      setTurnos(prev => prev.filter(t => t.cod_turno !== codToDelete));

      // 3. Remove assignment from local assignments state
      setAssignments(prev => {
        const next = { ...prev };
        delete next[codToDelete];
        return next;
      });

      // 4. Update localStorage ext_store_turnos if it exists
      const localTurnosStr = localStorage.getItem('ext_store_turnos');
      if (localTurnosStr) {
        try {
          const parsed = JSON.parse(localTurnosStr);
          const localTurnosArr = Array.isArray(parsed) ? parsed : Object.values(parsed);
          const updated = localTurnosArr.filter((item: any) => item.cod_turno !== codToDelete);
          localStorage.setItem('ext_store_turnos', JSON.stringify(updated));
        } catch (e) {
          console.error('Error updating local turnos storage:', e);
        }
      }

      // 5. Update local diagramacion storage for current date too
      if (selectedDate) {
        const localKey = `diagramacion_${selectedDate}`;
        const localDiagStr = localStorage.getItem(localKey);
        if (localDiagStr) {
          try {
            const parsed = JSON.parse(localDiagStr);
            if (Array.isArray(parsed)) {
              const updated = parsed.filter((item: any) => item.cod_turno !== codToDelete);
              localStorage.setItem(localKey, JSON.stringify(updated));
            } else if (typeof parsed === 'object') {
              const updated = { ...parsed };
              delete updated[codToDelete];
              localStorage.setItem(localKey, JSON.stringify(updated));
            }
          } catch (e) {
            console.error('Error updating local day diagramation:', e);
          }
        }
      }

      // 6. Record deleted codes in local storage to prevent DEFAULT_TURNOS from showing them again
      const deletedStr = localStorage.getItem('deleted_turno_codes');
      const deletedCodes: string[] = deletedStr ? JSON.parse(deletedStr) : [];
      if (!deletedCodes.includes(codToDelete)) {
        deletedCodes.push(codToDelete);
        localStorage.setItem('deleted_turno_codes', JSON.stringify(deletedCodes));
      }

      setToastMessage({ type: 'success', text: `Turno ${codToDelete} eliminado correctamente.` });

    } catch (err) {
      console.error('Error processing deletion of turno:', err);
      setToastMessage({ type: 'error', text: 'Error al intentar eliminar el turno.' });
    } finally {
      setTurnoToDelete(null);
    }
  };

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
    // Overlap checking when assigning value
    if (value && (field === 'unidad' || field === 'conductor_principal' || field === 'conductor_secundario')) {
      const targetTurno = turnos.find(t => t.cod_turno === codTurno);
      if (targetTurno) {
        const targetInterval = getShiftInterval(targetTurno);
        if (targetInterval) {
          // Check all other assigned shifts for overlaps
          const activeIntervals: {cod_turno: string, interval: any, val: string}[] = [];
          turnos.forEach(t => {
            if (t.cod_turno === codTurno) return;
            const assign = assignments[t.cod_turno];
            if (!assign) return;
            if (field === 'unidad' && assign.unidad && assign.unidad === value) {
              const iv = getShiftInterval(t);
              if (iv) activeIntervals.push({cod_turno: t.cod_turno, interval: iv, val: assign.unidad});
            } else if ((field === 'conductor_principal' || field === 'conductor_secundario') && 
                      (assign.conductor_principal === value || assign.conductor_secundario === value)) {
              const iv = getShiftInterval(t);
              if (iv) activeIntervals.push({cod_turno: t.cod_turno, interval: iv, val: value});
            }
          });
          
          for (const a of activeIntervals) {
            const overlaps = targetInterval.start < a.interval.end && targetInterval.end > a.interval.start;
            if (overlaps) {
              const entityName = field === 'unidad' ? 'La unidad' : 'El conductor';
              alert(`${entityName} ${value} ya está asignado al turno ${a.cod_turno} que se superpone con este horario.`);
            }
          }
        }
      }
    }

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

      return { ...prev, [codTurno]: updated };
    });
  };

  // Save Diagramación to Storage & Supabase
  const handleSaveDiagramacion = async () => {
    setIsSaving(true);
    try {
      const localKey = `diagramacion_${selectedDate}`;
      const assignmentList: Assignment[] = Object.values(assignments) as Assignment[];

      // Save to LocalStorage
      localStorage.setItem(localKey, JSON.stringify(assignments));

      // Attempt save to Supabase if client exists
      if (supabase) {
        if (assignmentList.length > 0) {
          const rowsToUpsert = assignmentList.map(a => ({
            fecha: selectedDate,
            cod_turno: a.cod_turno,
            unidad: a.unidad || null,
            conductor_principal: a.conductor_principal || null,
            conductor_secundario: a.conductor_secundario || null,
            observaciones: a.observaciones || null,
            updated_at: new Date().toISOString()
          }));

          const { error: upsertError } = await supabase
            .from('diagramaciones')
            .upsert(rowsToUpsert, { onConflict: 'fecha,cod_turno' });

          if (upsertError) {
            console.warn('Supabase diagramaciones save fallback to local storage:', upsertError.message);
            throw upsertError;
          }

          // Clear those that are NOT in the assignmentList (e.g. they were removed/cleared)
          const codTurnos = assignmentList.map(a => a.cod_turno);
          await supabase
            .from('diagramaciones')
            .update({
              unidad: null,
              conductor_principal: null,
              conductor_secundario: null,
              observaciones: null
            })
            .eq('fecha', selectedDate)
            .not('cod_turno', 'in', `(${codTurnos.join(',')})`);
            
        } else {
          // If assignmentList is totally empty, clear all for this date
          const { error: clearError } = await supabase
            .from('diagramaciones')
            .update({
              unidad: null,
              conductor_principal: null,
              conductor_secundario: null,
              observaciones: null
            })
            .eq('fecha', selectedDate);
            
          if (clearError) {
            console.warn('Supabase diagramaciones clear fallback to local storage:', clearError.message);
            throw clearError;
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

  // Get turnos that actually run on the selected date (based on frequency and season)
  const turnosDeFecha = useMemo(() => {
    return turnos.filter((t) => {
      // 1. Season filter
      if (seasonFilter !== 'Todas') {
        const seasonName = String(t.temporada || '').toLowerCase();
        if (seasonName !== seasonFilter.toLowerCase()) return false;
      }

      // 2. Reinforcement shift logic
      if (t.es_refuerzo) {
        return (t.dias_refuerzo || []).includes(selectedDate);
      }

      // 3. Frecuencia filter
      const dateObj = new Date(selectedDate + "T12:00:00");
      const day = dateObj.getDay(); // 0 = Sunday
      const isHoliday = feriados.some(f => f.fecha === selectedDate);
      
      const f = String(t.frecuencia || '').toLowerCase().trim();
      let matchesFrec = false;
      if (!f) matchesFrec = true;
      else if (isHoliday) {
        if (f.includes('domingo') || f.includes('feriado')) matchesFrec = true;
      } else if (day === 0) {
        if (f.includes('domingo') || f.includes('feriado') || f.includes('fin de semana')) matchesFrec = true;
      } else if (day === 6) {
        if (f.includes('sabado') || f.includes('sábado') || f.includes('fin de semana') || f.includes('lunes a sabado') || f.includes('lunes a sábado')) matchesFrec = true;
      } else if (day >= 1 && day <= 5) {
        if (f.includes('habil') || f.includes('hábil') || f.includes('lunes a viernes') || f.includes('lunes a sabado') || f.includes('lunes a sábado')) matchesFrec = true;
      }
      
      // Siempre coinciden
      if (f.includes('diario') || f.includes('todos los d')) matchesFrec = true;
      
      return matchesFrec;
    });
  }, [turnos, selectedDate, feriados, seasonFilter]);

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

    turnosDeFecha.forEach((t) => {
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
  }, [turnosDeFecha, assignments]);

  // Filter turnos according to user selections
  const filteredTurnos = useMemo(() => {
    let filtered = turnosDeFecha.filter((t) => {
      // 1. Tipo filter (Urbano, Media, Larga)
      if (tipoFilter !== 'Todos' && String(t.tipo_turno || '').toLowerCase() !== tipoFilter.toLowerCase()) {
        return false;
      }

      // Filter by Grupo
      if (grupoFilter !== 'Todos los Grupos') {
        if (String(t.grupo || '').toLowerCase() !== grupoFilter.toLowerCase()) return false;
      }

      // 3. Assignment status filter
      const assign = assignments[t.cod_turno];
      const isAux = t.turno?.toLowerCase().includes('auxilio base') || t.turno?.toLowerCase().includes('auxilio en base') || t.turno?.toLowerCase() === 'aux base' || t.turno?.toLowerCase().includes('auxilio terminal') || t.turno?.toLowerCase().includes('auxilio en terminal') || t.turno?.toLowerCase() === 'aux term' || t.turno?.toLowerCase().includes('verificaci');
      const isComplete = isAux ? Boolean(assign?.unidad) : Boolean(assign?.unidad && assign?.conductor_principal);
      const conflict = conflictsMap[t.cod_turno];
      const hasConflict = Boolean(conflict?.hasUnitConflict || conflict?.hasDriverConflict);

      if (assignmentFilter === 'Incompletos' && isComplete) return false;
      if (assignmentFilter === 'Completos' && !isComplete) return false;
      if (assignmentFilter === 'Conflictos' && !hasConflict) return false;

      // 4. Text Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchCode = String(t.cod_turno || '').toLowerCase().includes(query);
        const matchService = String(t.salida || '').toLowerCase().includes(query);
        const matchName = String(t.turno || '').toLowerCase().includes(query);
        const matchGroup = String(t.grupo || '').toLowerCase().includes(query);
        const matchUnit = assign?.unidad ? String(assign.unidad).toLowerCase().includes(query) : false;
        const matchDriver = assign?.conductor_principal ? String(assign.conductor_principal).toLowerCase().includes(query) : false;

        return matchCode || matchService || matchName || matchGroup || matchUnit || matchDriver;
      }

      return true;
    });
    
    // Sort by cod_turno ascending
    filtered.sort((a, b) => {
      const codeA = String(a.cod_turno || '');
      const codeB = String(b.cod_turno || '');
      return codeA.localeCompare(codeB, undefined, { numeric: true });
    });
    
    // Ensure unique turnos by cod_turno in filtered list
    const seenFilteredCodes = new Set<string>();
    const uniqueFiltered = filtered.filter(t => {
      const k = String(t.cod_turno || '').trim().toLowerCase();
      if (!k || seenFilteredCodes.has(k)) return false;
      seenFilteredCodes.add(k);
      return true;
    });

    return uniqueFiltered;
  }, [turnosDeFecha, assignments, conflictsMap, tipoFilter, assignmentFilter, grupoFilter, searchTerm]);

  // Calculate Summary Metrics
  const metrics = useMemo(() => {
    const total = turnosDeFecha.length;
    let completos = 0;
    let pendientes = 0;

    turnosDeFecha.forEach((t) => {
      const a = assignments[t.cod_turno];
      if (a?.unidad && a?.conductor_principal) {
        completos++;
      } else {
        pendientes++;
      }
    });

    let conflictosCount = 0;
    turnosDeFecha.forEach((t) => {
      const conflict = conflictsMap[t.cod_turno];
      if (conflict?.hasUnitConflict || conflict?.hasDriverConflict) {
        conflictosCount++;
      }
    });

    return { total, completos, pendientes, conflictosCount };
  }, [turnosDeFecha, assignments, conflictsMap]);

  // Helper date buttons
  const setDateOffset = (offsetDays: number) => {
    const curr = new Date(selectedDate + 'T12:00:00');
    curr.setDate(curr.getDate() + offsetDays);
    setSelectedDate(curr.toISOString().split('T')[0]);
  };

  // Spanish formatted date label
  function formatTime(timeStr?: string | null) {
    if (!timeStr) return '-';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
  }

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

  // Ref for CSV upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download CSV Template Model
  const handleDownloadTemplate = () => {
    const headers = ['Código Turno', 'Unidad Asignada', 'Conductor Principal', '2do Conductor / Auxiliar', 'Observaciones'];
    const activeList = turnosDeFecha.length > 0 ? turnosDeFecha : turnos;
    
    const rows = activeList.map(t => {
      const a: any = assignments[t.cod_turno] || {};
      return [
        `"${t.cod_turno || ''}"`,
        `"${a.unidad || ''}"`,
        `"${a.conductor_principal || ''}"`,
        `"${a.conductor_secundario || ''}"`,
        `"${a.observaciones || ''}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `modelo_diagramacion_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('info', 'Modelo CSV descargado. Complete los datos y vuélvalo a cargar.');
  };

  // Upload CSV File and import assignments
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const rawLines = text.split(/\r\n|\n/);
        const validLines = rawLines.filter(l => l.trim().length > 0);
        if (validLines.length < 2) {
          showToast('error', 'El archivo CSV está vacío o no contiene datos válidos.');
          return;
        }

        // Determine separator (, or ;)
        const headerLine = validLines[0];
        const separator = (headerLine.includes(';') && !headerLine.includes(',')) || 
                          (headerLine.split(';').length > headerLine.split(',').length) ? ';' : ',';

        // Parse line respecting quotes
        const parseLine = (line: string): string[] => {
          const cells: string[] = [];
          let cur = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === separator && !inQuotes) {
              cells.push(cur.trim().replace(/^"|"$/g, '').trim());
              cur = '';
            } else {
              cur += char;
            }
          }
          cells.push(cur.trim().replace(/^"|"$/g, '').trim());
          return cells;
        };

        const headers = parseLine(headerLine).map(h => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        
        let colCode = headers.findIndex(h => h.includes('codigo') || h.includes('cod') || h.includes('turno'));
        let colUnit = headers.findIndex(h => h.includes('unidad') || h.includes('coche') || h.includes('bus'));
        let colDriver1 = headers.findIndex(h => (h.includes('conductor') && !h.includes('2') && !h.includes('secundario') && !h.includes('auxiliar')) || h.includes('chofer') || h.includes('principal'));
        let colDriver2 = headers.findIndex(h => h.includes('2') || h.includes('secundario') || h.includes('auxiliar'));
        let colObs = headers.findIndex(h => h.includes('observaci') || h.includes('nota') || h.includes('comentario'));

        if (colCode === -1) colCode = 0;

        let importCount = 0;
        const newAssignments = { ...assignments };

        for (let i = 1; i < validLines.length; i++) {
          const row = parseLine(validLines[i]);
          if (!row || row.length === 0) continue;

          const rawCode = row[colCode] || '';
          if (!rawCode) continue;

          // Find matching shift code
          const matchedTurno = turnos.find(t => t.cod_turno.trim().toLowerCase() === rawCode.trim().toLowerCase());
          const codeKey = matchedTurno ? matchedTurno.cod_turno : rawCode.trim().toUpperCase();

          const unitVal = colUnit !== -1 ? (row[colUnit] || '') : '';
          const driver1Val = colDriver1 !== -1 ? (row[colDriver1] || '') : '';
          const driver2Val = colDriver2 !== -1 ? (row[colDriver2] || '') : '';
          const obsVal = colObs !== -1 ? (row[colObs] || '') : '';

          // Match unit name with flota list
          let matchedUnit = unitVal;
          if (unitVal) {
            const foundU = flota.find(f => f.unidad.toLowerCase() === unitVal.toLowerCase() || (f.patente && f.patente.toLowerCase() === unitVal.toLowerCase()));
            if (foundU) matchedUnit = foundU.unidad;
          }

          // Match driver name with conductores list
          let matchedDriver1 = driver1Val;
          if (driver1Val) {
            const foundC1 = conductores.find(c => 
              c.apellido_nombre.toLowerCase() === driver1Val.toLowerCase() || 
              (c.legajo && c.legajo.toLowerCase() === driver1Val.toLowerCase()) ||
              c.apellido_nombre.toLowerCase().includes(driver1Val.toLowerCase())
            );
            if (foundC1) matchedDriver1 = foundC1.apellido_nombre;
          }

          let matchedDriver2 = driver2Val;
          if (driver2Val) {
            const foundC2 = conductores.find(c => 
              c.apellido_nombre.toLowerCase() === driver2Val.toLowerCase() || 
              (c.legajo && c.legajo.toLowerCase() === driver2Val.toLowerCase()) ||
              c.apellido_nombre.toLowerCase().includes(driver2Val.toLowerCase())
            );
            if (foundC2) matchedDriver2 = foundC2.apellido_nombre;
          }

          newAssignments[codeKey] = {
            cod_turno: codeKey,
            fecha: selectedDate,
            unidad: matchedUnit,
            conductor_principal: matchedDriver1,
            conductor_secundario: matchedDriver2,
            observaciones: obsVal,
            estado: (matchedUnit && matchedDriver1) ? 'Completo' : 'Pendiente'
          };

          importCount++;
        }

        setAssignments(newAssignments);
        showToast('success', `Se importaron ${importCount} asignaciones desde el CSV. Recuerde hacer clic en "Guardar Cambios".`);
      } catch (err) {
        console.error('Error al procesar CSV:', err);
        showToast('error', 'Error al procesar el archivo CSV. Verifique el formato.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Código Turno', 'Grupo', 'Tipo', 'Servicio', 'Presentación', 'Salida Base', 'Inicio', 'Fin', 'Llegada Base', 'Queda Fuera', 'Unidad Asignada', 'Conductor Principal', '2do Conductor / Auxiliar', 'Observaciones', 'Estado'];
    
    const rows = filteredTurnos.map(t => {
      const a = assignments[t.cod_turno] || {} as any;
      return [
        `"${t.cod_turno || ''}"`,
        `"${t.grupo || ''}"`,
        `"${t.tipo_turno || ''}"`,
        `"${t.salida || ''}"`,
        `"${formatTime(t.hora_presentacion)}"`,
        `"${formatTime(t.hora_salida_base)}"`,
        `"${formatTime(t.hora_inicio)}"`,
        `"${formatTime(t.hora_fin)}"`,
        `"${formatTime(t.hora_llegada_base)}"`,
        `"${t.llegada || ''}"`,
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
          
          {/* Hidden File Input for CSV Upload */}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".csv,.txt" 
            onChange={handleCSVUpload} 
            className="hidden" 
          />

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 shadow-2xs transition-colors cursor-pointer"
            title="Descargar modelo CSV para llenar e importar"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Modelo CSV</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 shadow-2xs transition-colors cursor-pointer"
            title="Cargar asignaciones desde un archivo CSV"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Cargar CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            title="Exportar a CSV / Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Exportar</span>
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
      <div className="flex-1 flex flex-col p-3 overflow-hidden space-y-2">
        {/* Top Control Bar: Date Selector & Metrics */}
        <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 border-slate-200">
          
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
        <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 border-slate-200">
          
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
              <div className="relative">
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
              </div>
            )}
            
            {/* Grupo Filter */}
            <div className="relative">
              <select
                value={grupoFilter}
                onChange={(e) => setGrupoFilter(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="Todos los Grupos">Todos los Grupos</option>
                {Array.from(new Set(turnos.map(t => t.grupo).filter(Boolean))).sort().map((g) => (
                  <option key={`grp-${g}`} value={g as string}>{g as string}</option>
                ))}
              </select>
            </div>

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
          </div>
        </div>

        {/* Content View: Grid or Table */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
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
          ) : (
            <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 shadow-2xs">
                  <tr>
                    <th className="py-3 px-4 rounded-tl-xl">Código</th>
                    <th className="py-3 px-3">Tipo / Grupo</th>
                    <th className="py-3 px-3 min-w-[200px]">Salida</th>
                    <th className="py-3 px-3">Presentación</th>
                    <th className="py-3 px-3">Salida Base</th>
                    <th className="py-3 px-3">Inicio - Fin</th>
                    <th className="py-3 px-3">Llegada Base</th>
                    <th className="py-3 px-3">Llegada</th>
                    <th className="py-3 px-4">Unidad</th>
                    <th className="py-3 px-4">Conductor Principal</th>
                    <th className="py-3 px-4">2do Conductor / Auxiliar</th>
                    <th className="py-3 px-4">Observaciones</th>
                    <th className="py-3 px-4 rounded-tr-xl text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredTurnos.map((t, idx) => {
                    const assign = assignments[t.cod_turno] || { unidad: '', conductor_principal: '', conductor_secundario: '', observaciones: '' };
                    const conflict = conflictsMap[t.cod_turno];
                    const hasUnitConflict = conflict?.hasUnitConflict;
                    const hasDriverConflict = conflict?.hasDriverConflict;
                    
                    return (
                      <tr key={t.id_turno ? `turno-${t.id_turno}-${t.cod_turno}` : `turno-${t.cod_turno}-${idx}`} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-2.5 px-4 font-bold text-slate-800">{t.cod_turno}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-1 items-start">
                            {t.tipo_turno && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${t.tipo_turno === 'Urbano' ? 'bg-blue-50 text-blue-700 border-blue-200' : t.tipo_turno === 'Media' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                {t.tipo_turno.toUpperCase()}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-medium">{t.grupo}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="text-xs font-bold text-slate-800 whitespace-normal line-clamp-2">{t.turno}</p>
                          <p className="text-[10px] text-slate-500 font-medium whitespace-normal">{t.temporada}</p>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{formatTime(t.hora_presentacion)}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{formatTime(t.hora_salida_base)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">{formatTime(t.hora_inicio)} - {formatTime(t.hora_fin)}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{formatTime(t.hora_llegada_base)}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-700 text-xs">{t.llegada || '-'}</td>
                        {/* Unidad Dropdown */}
                        <td className="py-2.5 px-4 min-w-[200px]">
                          
                          {(() => {
                            const isAux = t.turno?.toLowerCase().includes('auxilio base') || t.turno?.toLowerCase().includes('auxilio en base') || t.turno?.toLowerCase() === 'aux base' || t.turno?.toLowerCase().includes('auxilio terminal') || t.turno?.toLowerCase().includes('auxilio en terminal') || t.turno?.toLowerCase() === 'aux term' || t.turno?.toLowerCase().includes('verificaci');
                            const parsedValue = assign.unidad ? assign.unidad.split(',').map(u => u.trim()).filter(Boolean).map(u => ({ value: u, label: u })) : null;
                            const multiValue = parsedValue ? (isAux ? parsedValue : parsedValue[0]) : null;
                            
                            return (
                              <Select
                                isMulti={isAux}
                                value={multiValue}
                                onChange={(option: any) => {
                                  if (Array.isArray(option)) {
                                    handleAssignmentChange(t.cod_turno, 'unidad', option.map(o => o.value).join(', '));
                                  } else {
                                    handleAssignmentChange(t.cod_turno, 'unidad', option ? option.value : '');
                                  }
                                }}
                            options={flota.map(u => ({ value: u.unidad, label: `${u.unidad} ${u.patente ? '(' + u.patente + ')' : ''}` }))}
                            isClearable
                            placeholder="-- Unidad --"
                            menuPortalTarget={document.body}
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: '32px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                borderColor: hasUnitConflict ? '#ef4444' : assign.unidad ? '#6ee7b7' : '#cbd5e1',
                                backgroundColor: hasUnitConflict ? '#fef2f2' : 'white'
                              }),
                              menuPortal: base => ({ ...base, zIndex: 9999 }),
                              singleValue: (base) => ({ ...base, whiteSpace: 'normal' }),
                              option: (base) => ({ ...base, fontSize: '12px' })
                              }}
                            />
                            );
                          })()}
                        </td>
                        {/* Conductor Principal Dropdown */}
                        <td className="py-2.5 px-4 min-w-[280px]">
                          <Select
                            value={assign.conductor_principal ? { value: assign.conductor_principal, label: assign.conductor_principal } : null}
                            onChange={(option) => handleAssignmentChange(t.cod_turno, 'conductor_principal', option ? option.value : '')}
                            options={conductores.map(c => ({ value: c.apellido_nombre, label: `${c.apellido_nombre} ${c.legajo ? '(' + c.legajo + ')' : ''}` }))}
                            isClearable
                            placeholder="-- Conductor --"
                            menuPortalTarget={document.body}
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: '32px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                borderColor: hasDriverConflict ? '#ef4444' : assign.conductor_principal ? '#6ee7b7' : '#cbd5e1',
                                backgroundColor: hasDriverConflict ? '#fef2f2' : 'white'
                              }),
                              menuPortal: base => ({ ...base, zIndex: 9999 }),
                              singleValue: (base) => ({ ...base, whiteSpace: 'normal' }),
                              option: (base) => ({ ...base, fontSize: '12px' })
                            }}
                          />
                        </td>
                        {/* 2do Conductor / Auxiliar */}
                        <td className="py-2.5 px-4 min-w-[280px]">
                          <Select
                            value={assign.conductor_secundario ? { value: assign.conductor_secundario, label: assign.conductor_secundario } : null}
                            onChange={(option) => handleAssignmentChange(t.cod_turno, 'conductor_secundario', option ? option.value : '')}
                            options={conductores.map(c => ({ value: c.apellido_nombre, label: `${c.apellido_nombre} ${c.legajo ? '(' + c.legajo + ')' : ''}` }))}
                            isClearable
                            placeholder="-- Opcional --"
                            menuPortalTarget={document.body}
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: '32px',
                                fontSize: '12px',
                                borderColor: '#cbd5e1'
                              }),
                              menuPortal: base => ({ ...base, zIndex: 9999 }),
                              singleValue: (base) => ({ ...base, whiteSpace: 'normal' }),
                              option: (base) => ({ ...base, fontSize: '12px' })
                            }}
                          />
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
                        {/* Acciones */}
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => confirmDeleteTurno(t)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Eliminar Turno"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Delete Turno Confirmation Modal */}
      {turnoToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600 border-b border-slate-100 pb-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-base font-black uppercase tracking-wider">¡Atención! Eliminar Turno</h3>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Está por eliminar el turno <strong className="text-slate-900">{turnoToDelete.cod_turno}</strong> ({turnoToDelete.turno || turnoToDelete.salida || 'Servicio'}).
              </p>
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg font-bold leading-normal">
                ⚠️ Alerta: Esta acción eliminará permanentemente este turno de la base de datos y de la configuración de plantillas. Un turno eliminado <strong className="underline">no podrá ser cargado nuevamente</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setTurnoToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTurno}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Aceptar y Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

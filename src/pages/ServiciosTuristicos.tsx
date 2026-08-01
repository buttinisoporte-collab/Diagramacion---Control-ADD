import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import Select from 'react-select';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Bus, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  X, 
  Search, 
  AlertTriangle, 
  CheckCircle,
  CalendarCheck
} from 'lucide-react';

interface ServicioTuristico {
  id: string;
  fecha: string;
  destino: string;
  hora_salida: string;
  hora_regreso: string;
  unidad: string;
  conductor: string;
  empresa: string;
  observaciones?: string;
  created_at?: string;
}

interface SelectOption {
  value: string;
  label: string;
}

export default function ServiciosTuristicos() {
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [servicios, setServicios] = useState<ServicioTuristico[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Lists for dropdowns
  const [flotaList, setFlotaList] = useState<any[]>([]);
  const [conductoresList, setConductoresList] = useState<any[]>([]);
  const [diagramacionesList, setDiagramacionesList] = useState<any[]>([]);

  // Search & Filter state for the current day's list
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string>('');
  
  const [destino, setDestino] = useState<string>('');
  const [horaSalida, setHoraSalida] = useState<string>('');
  const [horaRegreso, setHoraRegreso] = useState<string>('');
  const [selectedUnidad, setSelectedUnidad] = useState<SelectOption | null>(null);
  const [selectedConductor, setSelectedConductor] = useState<SelectOption | null>(null);
  const [observaciones, setObservaciones] = useState<string>('');

  // Conflict / Overlap warning states
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Status message state
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Cloning dialog state
  const [isCloneModalOpen, setIsCloneModalOpen] = useState<boolean>(false);
  const [targetCloneDate, setTargetCloneDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // Default to tomorrow
  );

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadServicios();
  }, [fecha]);

  // Real-time conflict checking whenever form values change
  useEffect(() => {
    validateConflicts();
  }, [destino, horaSalida, horaRegreso, selectedUnidad, selectedConductor]);

  const showStatus = (type: 'success' | 'error' | 'warning', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const loadMasterData = async () => {
    try {
      // 1. Fleet
      let loadedFlota = [];
      if (supabase) {
        const { data } = await supabase.from('flota_activa').select('*');
        if (data && data.length > 0) loadedFlota = data;
      }
      if (loadedFlota.length === 0) {
        const local = localStorage.getItem('ext_store_flota_activa');
        if (local) loadedFlota = JSON.parse(local);
      }
      setFlotaList(loadedFlota);

      // 2. Drivers
      let loadedCond = [];
      if (supabase) {
        const { data } = await supabase.from('nomina_conductores').select('*');
        if (data && data.length > 0) loadedCond = data;
      }
      if (loadedCond.length === 0) {
        const local = localStorage.getItem('ext_store_nomina_conductores');
        if (local) loadedCond = JSON.parse(local);
      }
      setConductoresList(loadedCond);

      // 3. Regular Diagramations for overlap checking
      let loadedDiag = [];
      if (supabase) {
        const { data } = await supabase.from('diagramaciones').select('*');
        if (data && data.length > 0) loadedDiag = data;
      }
      if (loadedDiag.length === 0) {
        const local = localStorage.getItem('app_diagramaciones');
        if (local) loadedDiag = JSON.parse(local);
      }
      setDiagramacionesList(loadedDiag);

    } catch (e) {
      console.error('Error loading master data for Servicios Turísticos:', e);
    }
  };

  const loadServicios = async () => {
    setLoading(true);
    try {
      let loadedServicios: ServicioTuristico[] = [];
      if (supabase) {
        const { data, error } = await supabase
          .from('servicios_turisticos')
          .select('*')
          .eq('fecha', fecha)
          .order('hora_salida', { ascending: true });
        
        if (!error && data) {
          loadedServicios = data;
        }
      }

      // Merge with or fallback to LocalStorage
      const local = localStorage.getItem('app_servicios_turisticos');
      const allLocalList: ServicioTuristico[] = local ? JSON.parse(local) : [];
      const dayLocalList = allLocalList.filter(s => s.fecha === fecha);

      // Union by ID to avoid duplicates
      const mergedMap = new Map<string, ServicioTuristico>();
      loadedServicios.forEach(s => mergedMap.set(s.id, s));
      dayLocalList.forEach(s => {
        if (!mergedMap.has(s.id)) {
          mergedMap.set(s.id, s);
        }
      });

      const finalSorted = Array.from(mergedMap.values()).sort((a, b) => 
        a.hora_salida.localeCompare(b.hora_salida)
      );

      setServicios(finalSorted);
    } catch (e) {
      console.error('Error loading tourist services:', e);
      showStatus('error', 'Error al cargar los servicios.');
    } finally {
      setLoading(false);
    }
  };

  const validateConflicts = () => {
    if (!horaSalida || !horaRegreso) {
      setConflictWarning(null);
      return;
    }

    if (horaSalida >= horaRegreso) {
      setConflictWarning('La hora de salida debe ser anterior a la hora de regreso.');
      return;
    }

    const warnings: string[] = [];

    // 1. Check conflicts inside other tourist services of the same day
    const otherServices = servicios.filter(s => s.id !== currentId);
    
    if (selectedUnidad) {
      const unitConflict = otherServices.find(s => s.unidad === selectedUnidad.value);
      if (unitConflict) {
        warnings.push(`La unidad ${selectedUnidad.label} ya está asignada al servicio turístico con destino ${unitConflict.destino} (${unitConflict.hora_salida} - ${unitConflict.hora_regreso}) este día.`);
      }
    }

    if (selectedConductor) {
      const condConflict = otherServices.find(s => s.conductor === selectedConductor.value);
      if (condConflict) {
        warnings.push(`El conductor ${selectedConductor.label} ya está asignado al servicio turístico con destino ${condConflict.destino} (${condConflict.hora_salida} - ${condConflict.hora_regreso}) este día.`);
      }
    }

    // 2. Check conflicts with regular diagramations on the same day
    const dayDiagramations = diagramacionesList.filter(d => d.fecha === fecha);
    
    if (selectedUnidad) {
      const regularConflict = dayDiagramations.find(d => d.unidad === selectedUnidad.value);
      if (regularConflict) {
        warnings.push(`¡Alerta! La unidad ${selectedUnidad.label} ya está asignada en la Diagramación Regular al turno ${regularConflict.cod_turno} este día.`);
      }
    }

    if (selectedConductor) {
      const regularConflict = dayDiagramations.find(d => 
        d.conductor_principal === selectedConductor.value || d.conductor_secundario === selectedConductor.value
      );
      if (regularConflict) {
        warnings.push(`¡Alerta! El conductor ${selectedConductor.label} ya está asignado en la Diagramación Regular al turno ${regularConflict.cod_turno} este día.`);
      }
    }

    if (warnings.length > 0) {
      setConflictWarning(warnings.join(' '));
    } else {
      setConflictWarning(null);
    }
  };

  const handleOpenNewModal = () => {
    setIsEditing(false);
    setCurrentId('');
    setDestino('');
    setHoraSalida('');
    setHoraRegreso('');
    setSelectedUnidad(null);
    setSelectedConductor(null);
    setObservaciones('');
    setConflictWarning(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: ServicioTuristico) => {
    setIsEditing(true);
    setCurrentId(service.id);
    setDestino(service.destino);
    
    // Format TIME string (HH:MM:SS -> HH:MM)
    const formatTimeShort = (timeStr: string) => {
      if (!timeStr) return '';
      const parts = timeStr.split(':');
      return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr;
    };

    setHoraSalida(formatTimeShort(service.hora_salida));
    setHoraRegreso(formatTimeShort(service.hora_regreso));
    
    setSelectedUnidad(service.unidad ? { value: service.unidad, label: service.unidad } : null);
    setSelectedConductor(service.conductor ? { value: service.conductor, label: service.conductor } : null);
    setObservaciones(service.observaciones || '');
    setConflictWarning(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destino.trim()) {
      showStatus('error', 'El destino es obligatorio.');
      return;
    }
    if (!horaSalida || !horaRegreso) {
      showStatus('error', 'Las horas de salida y regreso son obligatorias.');
      return;
    }
    if (horaSalida >= horaRegreso) {
      showStatus('error', 'La hora de salida debe ser anterior a la hora de regreso.');
      return;
    }
    if (!selectedUnidad) {
      showStatus('error', 'Debe asignar una unidad.');
      return;
    }
    if (!selectedConductor) {
      showStatus('error', 'Debe asignar un conductor.');
      return;
    }

    setIsSaving(true);
    const payload: Omit<ServicioTuristico, 'id'> & { id?: string } = {
      fecha,
      destino: destino.trim(),
      hora_salida: `${horaSalida}:00`,
      hora_regreso: `${horaRegreso}:00`,
      unidad: selectedUnidad.value,
      conductor: selectedConductor.value,
      empresa: 'Italo Buttini',
      observaciones: observaciones.trim() || undefined
    };

    try {
      let savedRecord: ServicioTuristico | null = null;
      let success = false;

      if (supabase) {
        if (isEditing) {
          const { data, error } = await supabase
            .from('servicios_turisticos')
            .update(payload)
            .eq('id', currentId)
            .select()
            .maybeSingle();
          if (!error && data) {
            savedRecord = data;
            success = true;
          } else {
            console.warn('Supabase update failed, fallback to local storage:', error?.message);
          }
        } else {
          const { data, error } = await supabase
            .from('servicios_turisticos')
            .insert([payload])
            .select()
            .maybeSingle();
          if (!error && data) {
            savedRecord = data;
            success = true;
          } else {
            console.warn('Supabase insert failed, fallback to local storage:', error?.message);
          }
        }
      }

      // If remote Supabase write fails or doesn't resolve, generate fallback record
      if (!savedRecord) {
        savedRecord = {
          ...payload,
          id: isEditing ? currentId : `local_service_${Date.now()}`
        } as ServicioTuristico;
      }

      // Update LocalStorage for local persistence
      const local = localStorage.getItem('app_servicios_turisticos');
      let list: ServicioTuristico[] = local ? JSON.parse(local) : [];

      if (isEditing) {
        list = list.map(item => item.id === currentId ? savedRecord! : item);
      } else {
        list.unshift(savedRecord);
      }
      localStorage.setItem('app_servicios_turisticos', JSON.stringify(list));

      showStatus('success', isEditing ? 'Servicio turístico actualizado correctamente.' : 'Servicio turístico guardado correctamente.');
      setIsModalOpen(false);
      loadServicios();
    } catch (err: any) {
      console.error('Error saving tourist service:', err);
      showStatus('error', 'Ocurrió un error al guardar el servicio turístico.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este servicio turístico?')) return;

    try {
      let success = false;
      if (supabase) {
        const { error } = await supabase
          .from('servicios_turisticos')
          .delete()
          .eq('id', id);
        if (!error) success = true;
      }

      const local = localStorage.getItem('app_servicios_turisticos');
      if (local) {
        const list: ServicioTuristico[] = JSON.parse(local);
        const filtered = list.filter(item => item.id !== id);
        localStorage.setItem('app_servicios_turisticos', JSON.stringify(filtered));
      }

      showStatus('success', 'Servicio turístico eliminado correctamente.');
      loadServicios();
    } catch (err: any) {
      console.error('Error deleting tourist service:', err);
      showStatus('error', 'Ocurrió un error al eliminar el servicio.');
    }
  };

  // Clone/Copy Daily Services to another day
  const handleCloneDay = async () => {
    if (servicios.length === 0) {
      showStatus('warning', 'No hay servicios turísticos cargados este día para copiar.');
      return;
    }
    if (!targetCloneDate) {
      showStatus('error', 'Seleccione una fecha de destino válida.');
      return;
    }
    if (targetCloneDate === fecha) {
      showStatus('error', 'La fecha de destino no puede ser la misma fecha de origen.');
      return;
    }

    setLoading(true);
    setIsCloneModalOpen(false);

    try {
      const clonedServices: ServicioTuristico[] = [];
      
      for (const src of servicios) {
        const payload = {
          fecha: targetCloneDate,
          destino: src.destino,
          hora_salida: src.hora_salida,
          hora_regreso: src.hora_regreso,
          unidad: src.unidad,
          conductor: src.conductor,
          empresa: 'Italo Buttini',
          observaciones: src.observaciones
        };

        let savedRecord: ServicioTuristico | null = null;
        if (supabase) {
          const { data, error } = await supabase
            .from('servicios_turisticos')
            .insert([payload])
            .select()
            .maybeSingle();
          if (!error && data) {
            savedRecord = data;
          }
        }

        if (!savedRecord) {
          savedRecord = {
            ...payload,
            id: `local_service_clone_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
          } as ServicioTuristico;
        }
        clonedServices.push(savedRecord);
      }

      // Save to LocalStorage
      const local = localStorage.getItem('app_servicios_turisticos');
      const list: ServicioTuristico[] = local ? JSON.parse(local) : [];
      localStorage.setItem('app_servicios_turisticos', JSON.stringify([...clonedServices, ...list]));

      showStatus('success', `Se copiaron con éxito ${clonedServices.length} servicios para el día ${targetCloneDate}.`);
      
      // If user wants to switch view to the target clone date:
      if (confirm(`¿Desea ir a la fecha ${targetCloneDate} para ver los servicios copiados?`)) {
        setFecha(targetCloneDate);
      }
    } catch (err: any) {
      console.error('Error cloning services:', err);
      showStatus('error', 'Ocurrió un error al copiar los servicios turísticos.');
    } finally {
      setLoading(false);
    }
  };

  // Date controls helpers
  const changeDate = (days: number) => {
    const current = new Date(fecha + 'T12:00:00');
    current.setDate(current.getDate() + days);
    setFecha(current.toISOString().split('T')[0]);
  };

  const getWeekDayName = (dateStr: string) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const d = new Date(dateStr + 'T12:00:00');
    return days[d.getDay()];
  };

  // Dropdown list formatting
  const formattedFlotaOptions = flotaList.map(item => ({
    value: item.unidad,
    label: `${item.unidad} (${item.patente || 'Sin Patente'}) - ${item.empresa || 'S/D'}`
  }));

  const formattedConductorOptions = conductoresList.map(item => ({
    value: item.apellido_nombre,
    label: `${item.apellido_nombre} (${item.empresa || 'S/D'})`
  }));

  // Filtering list logic
  const filteredServicios = servicios.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      s.destino.toLowerCase().includes(term) ||
      s.conductor.toLowerCase().includes(term) ||
      s.unidad.toLowerCase().includes(term) ||
      (s.observaciones && s.observaciones.toLowerCase().includes(term))
    );
  });

  return (
    <>
      <Header 
        title="Servicios Turísticos" 
        subtitle="Carga y Diagramación Diaria de Viajes Especiales de Italo Buttini" 
      />

      <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-4">
        
        {/* Date Selector & Top actions toolbar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Day navigator */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => changeDate(-1)}
              className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              title="Día Anterior"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            
            <div className="flex flex-col items-center px-4 min-w-[200px]">
              <span className="text-sm font-bold text-slate-900 capitalize">
                {getWeekDayName(fecha)}
              </span>
              <input 
                type="date" 
                value={fecha} 
                onChange={e => setFecha(e.target.value)}
                className="text-xs font-semibold text-slate-500 border-none bg-transparent p-0 focus:ring-0 text-center cursor-pointer hover:text-blue-600"
              />
            </div>

            <button 
              onClick={() => changeDate(1)}
              className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              title="Día Siguiente"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
            
            <button 
              onClick={() => setFecha(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors ml-2"
            >
              Hoy
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsCloneModalOpen(true)}
              disabled={servicios.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              title="Copiar diagramación de este día a otra fecha"
            >
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Copiar Servicios a...</span>
            </button>

            <button
              onClick={handleOpenNewModal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Nuevo Servicio Turístico</span>
            </button>
          </div>
        </div>

        {/* Status Msg Alerts */}
        {statusMsg && (
          <div className={`p-4 rounded-lg text-sm font-medium border flex items-center gap-2 ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
            statusMsg.type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
            'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Content Panel */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col min-h-0">
          
          {/* List Search & Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-slate-600" />
                <span>Viajes Especiales Registrados ({filteredServicios.length})</span>
              </h4>
              <p className="text-xs text-slate-500">Salidas y retornos a la Base de la empresa Italo Buttini.</p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por destino, chofer, unidad..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
              />
            </div>
          </div>

          {/* List table or empty state */}
          <div className="flex-1 overflow-auto min-h-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-500">
                <span className="text-sm animate-pulse">Cargando servicios turísticos...</span>
              </div>
            ) : filteredServicios.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mb-2" />
                <h5 className="text-sm font-bold text-slate-700">No hay servicios turísticos</h5>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  {searchTerm ? 'Ningún servicio coincide con el término de búsqueda.' : 'No se han registrado servicios para esta fecha. Utilice el botón superior para agregar un viaje.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 z-10">
                  <tr>
                    <th className="py-3 px-4">Destino</th>
                    <th className="py-3 px-4">Horario</th>
                    <th className="py-3 px-4">Unidad</th>
                    <th className="py-3 px-4">Conductor</th>
                    <th className="py-3 px-4">Empresa</th>
                    <th className="py-3 px-4">Observaciones</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredServicios.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-950 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{s.destino}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.hora_salida.substring(0, 5)} - {s.hora_regreso.substring(0, 5)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Bus className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.unidad}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.conductor}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {s.empresa || 'Italo Buttini'}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-500" title={s.observaciones}>
                        {s.observaciones || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(s)}
                            className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Creation / Edition Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {isEditing ? 'Editar Servicio Turístico' : 'Nuevo Servicio Turístico'}
                </h4>
                <p className="text-[11px] text-slate-500">Completa la asignación del viaje para el día {fecha}.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto max-h-[80vh] text-xs">
              
              {/* Target Date Header display only */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-slate-700 font-bold mb-1">Fecha de Operación</label>
                  <div className="p-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-700 font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fecha} ({getWeekDayName(fecha)})</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-slate-700 font-bold mb-1">Empresa Prestadora</label>
                  <div className="p-2 border border-slate-200 bg-slate-50 rounded-lg text-blue-700 font-bold">
                    Italo Buttini
                  </div>
                </div>
              </div>

              {/* Destino */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Destino Turístico</label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Villa 25 de Mayo, Valle Grande, Cañón del Atuel..."
                    value={destino}
                    onChange={e => setDestino(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Schedule */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-slate-700 font-bold mb-1">Hora Salida (Base)</label>
                  <input
                    type="time"
                    required
                    value={horaSalida}
                    onChange={e => setHoraSalida(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-slate-700 font-bold mb-1">Hora Regreso (Base)</label>
                  <input
                    type="time"
                    required
                    value={horaRegreso}
                    onChange={e => setHoraRegreso(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Unidad (React-select) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Unidad / Coche Asignado</label>
                <Select
                  options={formattedFlotaOptions}
                  value={selectedUnidad}
                  onChange={setSelectedUnidad}
                  placeholder="Buscar y seleccionar unidad de la flota..."
                  isClearable
                  noOptionsMessage={() => "No se encontraron coches"}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '0.5rem',
                      borderColor: '#cbd5e1',
                      padding: '1px'
                    })
                  }}
                />
              </div>

              {/* Conductor (React-select) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Conductor Asignado</label>
                <Select
                  options={formattedConductorOptions}
                  value={selectedConductor}
                  onChange={setSelectedConductor}
                  placeholder="Buscar y seleccionar conductor de nómina..."
                  isClearable
                  noOptionsMessage={() => "No se encontraron conductores"}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '0.5rem',
                      borderColor: '#cbd5e1',
                      padding: '1px'
                    })
                  }}
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Observaciones / Notas de Viaje (Opcional)</label>
                <textarea
                  placeholder="Instrucciones especiales, paradas, cantidad de pasajeros..."
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none h-16 resize-none"
                />
              </div>

              {/* Conflict alerts inside form */}
              {conflictWarning && (
                <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-[10px] font-medium leading-relaxed">{conflictWarning}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Servicio'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Copy/Clone Day Modal */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col">
            
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copiar Servicios Turísticos</span>
              </h4>
              <button 
                onClick={() => setIsCloneModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <p className="text-slate-500 leading-relaxed">
                Vas a copiar los <strong>{servicios.length}</strong> servicios turísticos del día <strong>{fecha}</strong> a otra fecha. Ideal para viajes que se repiten en días consecutivos.
              </p>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Fecha Destino</label>
                <input
                  type="date"
                  required
                  value={targetCloneDate}
                  onChange={e => setTargetCloneDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCloneModalOpen(false)}
                  className="px-3 py-1.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCloneDay}
                  className="px-4 py-1.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-bold flex items-center gap-1"
                >
                  Copiar Todo
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

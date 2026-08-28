import { supabase } from './supabase';

export interface PersonalOption {
  value: string;
  label: string;
  tipo: 'Conductor' | 'Mecánico' | 'Personal';
  legajo?: string;
}

export interface FlotaOption {
  value: string;
  label: string;
  dominio?: string;
}

export interface TurnoOption {
  value: string;
  label: string;
  codigo?: string;
}

export async function fetchPersonalConcatenado(): Promise<PersonalOption[]> {
  const list: PersonalOption[] = [];

  // 1. Conductores
  try {
    let conds: any[] = [];
    if (supabase) {
      const { data } = await supabase.from('nomina_conductores').select('apellido_nombre, legajo');
      if (data && data.length > 0) conds = data;
    }
    if (conds.length === 0) {
      const local = localStorage.getItem('ext_store_nomina_conductores');
      if (local) conds = Object.values(JSON.parse(local));
    }
    conds.forEach((c: any) => {
      const name = c.apellido_nombre || c.nombre || '';
      if (name) {
        list.push({
          value: name,
          label: `${name} (Conductor${c.legajo ? ` - Leg. ${c.legajo}` : ''})`,
          tipo: 'Conductor',
          legajo: c.legajo
        });
      }
    });
  } catch (e) {
    console.warn('Error fetching nomina_conductores:', e);
  }

  // 2. Mecánicos
  try {
    let mecs: any[] = [];
    if (supabase) {
      const { data } = await supabase.from('nomina_mecanicos').select('apellido_nombre, legajo');
      if (data && data.length > 0) mecs = data;
    }
    if (mecs.length === 0) {
      const local = localStorage.getItem('ext_store_nomina_mecanicos');
      if (local) mecs = Object.values(JSON.parse(local));
    }
    mecs.forEach((m: any) => {
      const name = m.apellido_nombre || m.nombre || '';
      if (name) {
        list.push({
          value: name,
          label: `${name} (Mecánico${m.legajo ? ` - Leg. ${m.legajo}` : ''})`,
          tipo: 'Mecánico',
          legajo: m.legajo
        });
      }
    });
  } catch (e) {
    console.warn('Error fetching nomina_mecanicos:', e);
  }

  // Fallback defaults if empty
  if (list.length === 0) {
    return [
      { value: 'Perez, Juan', label: 'Perez, Juan (Conductor)', tipo: 'Conductor' },
      { value: 'Gomez, Carlos', label: 'Gomez, Carlos (Conductor)', tipo: 'Conductor' },
      { value: 'Rodriguez, Martin', label: 'Rodriguez, Martin (Mecánico)', tipo: 'Mecánico' }
    ];
  }

  // Sort alphabetically
  return list.sort((a, b) => a.value.localeCompare(b.value));
}

export async function fetchFlotaActiva(): Promise<FlotaOption[]> {
  const list: FlotaOption[] = [];

  try {
    let flota: any[] = [];
    if (supabase) {
      const { data } = await supabase.from('flota_activa').select('unidad, dominio, interno');
      if (data && data.length > 0) flota = data;
    }
    if (flota.length === 0) {
      const local = localStorage.getItem('ext_store_flota_activa');
      if (local) flota = Object.values(JSON.parse(local));
    }
    flota.forEach((f: any) => {
      const interno = f.unidad || f.interno || '';
      if (interno) {
        list.push({
          value: String(interno),
          label: `Interno ${interno}${f.dominio ? ` (${f.dominio})` : ''}`,
          dominio: f.dominio
        });
      }
    });
  } catch (e) {
    console.warn('Error fetching flota_activa:', e);
  }

  if (list.length === 0) {
    return [
      { value: '101', label: 'Interno 101' },
      { value: '102', label: 'Interno 102' },
      { value: '103', label: 'Interno 103' },
      { value: '104', label: 'Interno 104' },
      { value: '105', label: 'Interno 105' }
    ];
  }

  return list.sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }));
}

export async function fetchTurnosActivos(): Promise<TurnoOption[]> {
  const list: TurnoOption[] = [];

  try {
    let turnos: any[] = [];
    if (supabase) {
      const { data } = await supabase.from('turnos').select('cod_turno, cabecera_salida, cabecera_llegada');
      if (data && data.length > 0) turnos = data;
    }
    if (turnos.length === 0) {
      const local = localStorage.getItem('ext_store_turnos');
      if (local) turnos = Object.values(JSON.parse(local));
    }
    turnos.forEach((t: any) => {
      const cod = t.cod_turno || t.codigo || '';
      if (cod) {
        const route = t.cabecera_salida && t.cabecera_llegada ? ` (${t.cabecera_salida} - ${t.cabecera_llegada})` : '';
        list.push({
          value: cod,
          label: `${cod}${route}`,
          codigo: cod
        });
      }
    });
  } catch (e) {
    console.warn('Error fetching turnos:', e);
  }

  if (list.length === 0) {
    return [
      { value: 'TURNO-A1', label: 'Turno A1 (Mendoza - San Rafael)' },
      { value: 'TURNO-B2', label: 'Turno B2 (San Rafael - Mendoza)' },
      { value: 'TURNO-C3', label: 'Turno C3 (Mendoza - Alvear)' },
      { value: 'TURISMO-ESP', label: 'Servicio Turístico Especial' }
    ];
  }

  return list;
}

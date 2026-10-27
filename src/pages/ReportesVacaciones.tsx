import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { 
  FileSpreadsheet, 
  Search, 
  Calendar,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export default function ReportesVacaciones() {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [mesFiltro, setMesFiltro] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    if (!supabase) return;

    try {
      // Finanzas solo liquida lo que ya fue confirmado y archivado (o que ya está liquidado)
      const { data, error } = await supabase
        .from('vacaciones_solicitudes')
        .select('*')
        .in('estado', ['Archivado', 'Liquidado'])
        .order('fecha_inicio', { ascending: true });

      if (error) throw error;
      setSolicitudes(data || []);
    } catch (err) {
      console.error("Error al cargar datos para Finanzas", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarLiquidado = async (id: string) => {
    try {
      if (supabase) {
        await supabase.from('vacaciones_solicitudes').update({ estado: 'Liquidado' }).eq('id', id);
      }
      cargarDatos();
    } catch (e) {
      console.error("Error liquidando", e);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Legajo', 'Nombre y Apellido', 'Sector', 'Fecha Inicio', 'Fecha Fin', 'Dias Tomados', 'Estado'];
    const rows = solicitudesFiltradas.map(s => [
      s.legajo,
      `"${s.apellido_nombre}"`,
      `"${s.sector}"`,
      s.fecha_inicio,
      s.fecha_fin,
      s.cantidad_dias,
      s.estado
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Novedades_Vacaciones_Liquidacion_${mesFiltro}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrar por el mes que toca la vacación
  // (Si una vacación cruza dos meses, la mostramos si toca el mes seleccionado)
  const solicitudesFiltradas = solicitudes.filter(s => {
    const inicioStr = s.fecha_inicio.substring(0, 7); // YYYY-MM
    const finStr = s.fecha_fin.substring(0, 7);
    return inicioStr === mesFiltro || finStr === mesFiltro;
  });

  return (
    <div className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden">
      <Header title="Reporte Liquidación Vacaciones" subtitle="Administración y Finanzas" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Panel Superior y Filtros */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Novedades para Liquidación</h2>
                <p className="text-xs text-slate-500">Exporte el listado de vacaciones gozadas en el mes para el cálculo de haberes.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input 
                  type="month" 
                  value={mesFiltro}
                  onChange={(e) => setMesFiltro(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-1.5 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleExportCSV}
                disabled={solicitudesFiltradas.length === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar a Excel (CSV)</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Cargando reporte...</div>
              ) : solicitudesFiltradas.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Search className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold">No hay vacaciones archivadas para liquidar en el mes seleccionado.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Colaborador</th>
                      <th className="px-4 py-3">Sector</th>
                      <th className="px-4 py-3">Período de Goce</th>
                      <th className="px-4 py-3 text-center">Cant. Días</th>
                      <th className="px-4 py-3">Estado Liquidación</th>
                      <th className="px-4 py-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {solicitudesFiltradas.map(sol => (
                      <tr key={sol.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800 block">{sol.apellido_nombre}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">Legajo: {sol.legajo}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{sol.sector}</td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-700">
                          {new Date(sol.fecha_inicio).toLocaleDateString('es-AR')} - {new Date(sol.fecha_fin).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-black text-sm text-slate-800">{sol.cantidad_dias}</span>
                        </td>
                        <td className="px-4 py-3">
                          {sol.estado === 'Liquidado' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Liquidado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                              Pendiente Liquidación
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {sol.estado !== 'Liquidado' && (
                            <button
                              onClick={() => handleMarcarLiquidado(sol.id)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-bold transition-colors"
                            >
                              Marcar Liquidado
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
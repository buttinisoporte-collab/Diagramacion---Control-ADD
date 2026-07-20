import Header from '../components/Header';

export default function DespuesViaje() {
  return (
    <>
      <Header title="Después del Viaje" subtitle="Parte de Novedades Llegada" />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-4">PARTE DE NOVEDADES</h3>
            <ul className="space-y-4 text-slate-300">
              <li className="flex items-start">
                <span className="text-blue-400 mr-3 mt-1">■</span>
                <span>Debe <strong>CARGAR EN EL SISTEMA LA SOLICITUD DE ORDEN DE TRABAJO PARA MANTENIMIENTO</strong>, detallando todo lo observado en la unidad.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-3 mt-1">■</span>
                <span>Cerrar sistema sube / Micronauta en base.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-3 mt-1">■</span>
                <span>No cortar energía de la unidad.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 text-center">
            <h4 className="text-lg font-bold text-slate-800 mb-4">¿Registró alguna falla o novedad en su unidad durante el viaje?</h4>
            <p className="text-sm text-slate-500 mb-6">Si encontró fallas de mecánica ligera o requiere reparaciones, por favor ingrese al sistema de mantenimiento.</p>
            <button 
              onClick={() => window.open('http://buttini.sgm.lym.com.ar/Account/Login', '_blank')}
              className="px-8 py-4 text-lg font-bold bg-red-600 hover:bg-red-700 text-white rounded shadow-lg transition-colors w-full md:w-auto"
            >
              NOVEDADES DE LA UNIDAD - SOLICITUD OT
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

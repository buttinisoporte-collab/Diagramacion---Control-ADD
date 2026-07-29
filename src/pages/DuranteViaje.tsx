import Header from '../components/Header';
import { DiagramacionConductorGuard } from '../components/DiagramacionConductorGuard';

export default function DuranteViaje() {
  return (
    <DiagramacionConductorGuard>
    <>
      <Header title="Durante el Viaje" subtitle="Guía de Fallas en Ruta" />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-lg text-center shadow-lg">
            <h3 className="text-xl font-bold mb-2">IDENTIFICACIÓN Y RESOLUCIÓN DE PROBLEMAS</h3>
            <p className="text-sm text-slate-300">
              Esta guía le ayudará a identificar, transmitir y plasmar problemas de mecánica ligera en la solicitud de O.T.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8">
            <div className="space-y-6">
              <div className="border-l-4 border-amber-500 pl-4">
                <h4 className="font-bold text-slate-800">Alarmas Sonoras - visuales</h4>
                <div className="mt-2 text-sm text-slate-600 space-y-2">
                  <p><strong>Aceite</strong>: <span className="text-green-600">Verde: Siga circulando</span> | <span className="text-red-600 font-bold">Rojo: Detenga la unidad</span></p>
                  <p><strong>Agua</strong>: <span className="text-blue-600">Azul: Siga circulando</span> | <span className="text-green-600">Verde: Estado óptimo</span> | <span className="text-red-600 font-bold">Roja: Detenga la unidad</span></p>
                  <p><strong>Aire</strong>: Presión de aire para cierre de puertas, frenos y suspensión. Manómetro: Superar los 6 a 8 kg. Luz testigo apagada. Chicharra: Detenga la unidad.</p>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 border border-red-200 rounded text-center">
                <p className="text-red-700 font-bold text-sm uppercase tracking-wider mb-2">Ante cualquier situación que implique la detención del servicio o no permita su continuidad:</p>
                <p className="text-sm text-red-900">1. Llamar a Inspectores para continuación del servicio.</p>
                <p className="text-sm text-red-900 mb-4">2. Llamar a Responsable de Mantenimiento para reparación mecánica.</p>
                
                <button 
                  onClick={() => window.open('http://buttini.sgm.lym.com.ar/Account/Login', '_blank')}
                  className="px-6 py-3 font-bold bg-red-600 hover:bg-red-700 text-white rounded shadow-lg transition-colors"
                >
                  CARGA SOLICITUD O.T.
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
    </DiagramacionConductorGuard>
  );
}

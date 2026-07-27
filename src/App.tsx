/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider } from './context/SidebarContext';
import Sidebar from './components/Sidebar';
import ControlGarita from './pages/ControlGarita';
import Diagramacion from './pages/Diagramacion';
import MecanicaMatutina from './pages/MecanicaMatutina';
import ChecklistSalida from './pages/ChecklistSalida';
import DuranteViaje from './pages/DuranteViaje';
import DespuesViaje from './pages/DespuesViaje';
import ControlMecanico from './pages/ControlMecanico';
import MisControles from './pages/MisControles';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';

export default function App() {
  return (
    <Router>
      <SidebarProvider>
        <div className="flex h-full w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            <Routes>
              <Route path="/" element={<Navigate to="/garita" replace />} />
              <Route path="/garita" element={<ControlGarita />} />
              <Route path="/diagramacion" element={<Diagramacion />} />
              <Route path="/mecanica-matutina" element={<MecanicaMatutina />} />
              <Route path="/checklist-salida" element={<ChecklistSalida />} />
              <Route path="/durante-viaje" element={<DuranteViaje />} />
              <Route path="/despues-viaje" element={<DespuesViaje />} />
              <Route path="/control-mecanico" element={<ControlMecanico />} />
              <Route path="/mis-controles" element={<MisControles />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/configuracion" element={<Configuracion />} />
            </Routes>
          </main>
        </div>
      </SidebarProvider>
    </Router>
  );
}

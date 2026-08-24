/**
 * Primary React Application Root Component (Technical Blueprint Theme)
 * -------------------------------------------------------------------
 * Serves as the top-level SPA router container.
 * Integrates AuthProvider context and main page layout shell.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { RateSimulatorPage } from './pages/RateSimulatorPage';
import { ZoneManagementPage } from './pages/ZoneManagementPage';
import { OrderManagementPage } from './pages/OrderManagementPage';
import { AgentDutyConsolePage } from './pages/AgentDutyConsolePage';
import { PublicTrackingPage } from './pages/PublicTrackingPage';
import { LandingPage } from './pages/LandingPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/orders" element={<OrderManagementPage />} />
            <Route path="/simulator" element={<RateSimulatorPage />} />
            <Route path="/zones" element={<ZoneManagementPage />} />
            <Route path="/agent-dashboard" element={<AgentDutyConsolePage />} />
            <Route path="/track-search" element={<PublicTrackingPage />} />
            <Route path="/track/:trackingId" element={<PublicTrackingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

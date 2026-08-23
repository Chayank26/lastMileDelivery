/**
 * Primary React Application Root Component (Technical Blueprint Theme)
 * -------------------------------------------------------------------
 * Serves as the top-level SPA router container.
 * Integrates AuthProvider context and main page layout shell.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ShieldCheck, Cpu, Server, ArrowRight } from 'lucide-react';
import { RateSimulatorPage } from './pages/RateSimulatorPage';
import { ZoneManagementPage } from './pages/ZoneManagementPage';
import { OrderManagementPage } from './pages/OrderManagementPage';
import { AgentDutyConsolePage } from './pages/AgentDutyConsolePage';
import { PublicTrackingPage } from './pages/PublicTrackingPage';
import { Link } from 'react-router-dom';

// Baseline Welcome Dashboard View
function DashboardHome() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      
      {/* System Status Banner */}
      <div className="bg-white border-2 border-black neo-shadow p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-[#0052FF] border border-black animate-ping" />
            <h2 className="text-xl font-extrabold text-black uppercase tracking-tight font-mono">
              LOGISTICS CONTROL DASHBOARD [001-A]
            </h2>
          </div>
          <p className="text-xs text-zinc-600 mt-1 font-mono font-bold">
            USER: <span className="text-black uppercase">{user ? user.name : 'GUEST / PUBLIC'}</span> &bull; ROLE: <span className="text-[#0052FF] uppercase font-extrabold">{user ? user.role : 'VISITOR'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-[#0052FF] text-white border-2 border-black text-xs font-mono font-extrabold uppercase neo-shadow-sm">
            SYSTEM: ACTIVE
          </span>
          <span className="px-3 py-1 bg-black text-white border-2 border-black text-xs font-mono font-extrabold uppercase neo-shadow-sm">
            ZONE: NCR-MAIN
          </span>
        </div>
      </div>

      {/* Feature Navigation Blueprint Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white border-2 border-black neo-shadow flex flex-col justify-between overflow-hidden">
          <div className="bg-black text-white px-4 py-2 font-mono font-bold text-xs uppercase flex justify-between items-center">
            <span>MODULE // 01</span>
            <Cpu className="w-4 h-4 text-[#0052FF]" />
          </div>
          <div className="p-5 space-y-3">
            <h3 className="font-extrabold text-base uppercase text-black font-mono">RATE ENGINE SIMULATOR</h3>
            <p className="text-xs text-zinc-600 font-mono leading-relaxed">
              Volumetric billing ((L × W × H) / 5000), dynamic GeoJSON zone tier surcharges, and B2B vs B2C rate cards.
            </p>
          </div>
          <div className="p-4 border-t-2 border-black bg-zinc-50">
            <Link
              to="/simulator"
              className="w-full py-2 bg-[#0052FF] hover:bg-[#0042D0] text-white font-mono font-bold text-xs uppercase border-2 border-black neo-shadow-sm flex items-center justify-center gap-2 transition"
            >
              <span>Launch Sandbox</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="bg-white border-2 border-black neo-shadow flex flex-col justify-between overflow-hidden">
          <div className="bg-black text-white px-4 py-2 font-mono font-bold text-xs uppercase flex justify-between items-center">
            <span>MODULE // 02</span>
            <Server className="w-4 h-4 text-[#0052FF]" />
          </div>
          <div className="p-5 space-y-3">
            <h3 className="font-extrabold text-base uppercase text-black font-mono">DISPATCH & AUTO-ASSIGN</h3>
            <p className="text-xs text-zinc-600 font-mono leading-relaxed">
              Greedy Haversine nearest-neighbor solver with agent concurrency limits and MongoDB ACID row locking.
            </p>
          </div>
          <div className="p-4 border-t-2 border-black bg-zinc-50">
            <Link
              to="/orders"
              className="w-full py-2 bg-black hover:bg-zinc-800 text-white font-mono font-bold text-xs uppercase border-2 border-black neo-shadow-sm flex items-center justify-center gap-2 transition"
            >
              <span>Open Dispatch</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="bg-white border-2 border-black neo-shadow flex flex-col justify-between overflow-hidden">
          <div className="bg-black text-white px-4 py-2 font-mono font-bold text-xs uppercase flex justify-between items-center">
            <span>MODULE // 03</span>
            <ShieldCheck className="w-4 h-4 text-[#0052FF]" />
          </div>
          <div className="p-5 space-y-3">
            <h3 className="font-extrabold text-base uppercase text-black font-mono">EVENT AUDIT LEDGER</h3>
            <p className="text-xs text-zinc-600 font-mono leading-relaxed">
              Event-sourced audit logs capturing payload snapshots, actor IDs, IP addresses, and cryptographic timestamps.
            </p>
          </div>
          <div className="p-4 border-t-2 border-black bg-zinc-50">
            <Link
              to="/track-search"
              className="w-full py-2 bg-white hover:bg-zinc-100 text-black font-mono font-bold text-xs uppercase border-2 border-black neo-shadow-sm flex items-center justify-center gap-2 transition"
            >
              <span>Track & Audit</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
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

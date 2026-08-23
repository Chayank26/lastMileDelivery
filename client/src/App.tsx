/**
 * Primary React Application Root Component
 * -----------------------------------------
 * Serves as the top-level SPA router container.
 * Integrates AuthProvider context and main page layout shell.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ShieldCheck, Cpu, Server } from 'lucide-react';
import { RateSimulatorPage } from './pages/RateSimulatorPage';
import { ZoneManagementPage } from './pages/ZoneManagementPage';

// Baseline Welcome Dashboard View
function DashboardHome() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-[#121215] border border-zinc-800 rounded-xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Welcome back, {user ? user.name : 'Guest'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Last-Mile Delivery Management Platform &bull; Role: <span className="text-indigo-400 font-mono font-medium">{user ? user.role : 'Public Visitor'}</span>
          </p>
        </div>
        <div className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-mono">
          System Operational
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-[#121215] border border-zinc-800 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
            <Cpu className="w-4 h-4" />
            <span>Rate Calculation Engine</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Volumetric billing ((L × B × H) / 5000), dynamic GeoJSON zone matching, and B2B/B2C rate card lookup.
          </p>
        </div>

        <div className="p-5 bg-[#121215] border border-zinc-800 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
            <Server className="w-4 h-4" />
            <span>ACID Agent Assignment</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Greedy Haversine nearest-neighbor solver with agent concurrency limits and MongoDB row locking.
          </p>
        </div>

        <div className="p-5 bg-[#121215] border border-zinc-800 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-purple-400 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Immutable Event Ledger</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Event-sourced audit logs capturing payload snapshots, actor IDs, IP addresses, and cryptographic timestamps.
          </p>
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
            <Route path="/orders" element={<DashboardHome />} />
            <Route path="/simulator" element={<RateSimulatorPage />} />
            <Route path="/zones" element={<ZoneManagementPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

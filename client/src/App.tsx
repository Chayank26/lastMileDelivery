/**
 * Primary React Application Root Component
 * -----------------------------------------
 * Serves as the high-level layout container.
 * Displays temporary Phase 1 architecture initialization status card.
 */

import React, { useEffect, useState } from 'react';
import { Package, ShieldCheck, Cpu, Server } from 'lucide-react';

export default function App() {
  const [apiStatus, setApiStatus] = useState<{ status: string; version: string } | null>(null);

  useEffect(() => {
    // Ping baseline backend healthcheck route
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setApiStatus(data))
      .catch(() => setApiStatus(null));
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-[#121215] border border-zinc-800 rounded-xl p-8 shadow-2xl space-y-6">
        
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white">Last-Mile Delivery Tracker</h1>
              <p className="text-xs text-zinc-400">Unthinkable Solutions Assignment</p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Phase 1 Active
          </span>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
            <div className="flex items-center space-x-2 text-indigo-400 font-medium text-xs">
              <Cpu className="w-4 h-4" />
              <span>Rate Engine</span>
            </div>
            <p className="text-xs text-zinc-400">Volumetric & Intra/Inter-Zone</p>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
            <div className="flex items-center space-x-2 text-emerald-400 font-medium text-xs">
              <Server className="w-4 h-4" />
              <span>ACID Concurrency</span>
            </div>
            <p className="text-xs text-zinc-400">Nearest-Neighbor Assignment</p>
          </div>
        </div>

        {/* System Diagnostics Status */}
        <div className="p-4 bg-zinc-900/80 border border-zinc-800/80 rounded-lg flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400">Backend API Health:</span>
          <span className="text-zinc-200">
            {apiStatus ? `Status: ${apiStatus.status} (Uptime: ${Math.round(apiStatus as any || 0)}s)` : 'Checking Connection...'}
          </span>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-zinc-500">
            Phase 1 Monorepo Architecture initialized with Living Documentation System.
          </p>
        </div>
      </div>
    </div>
  );
}

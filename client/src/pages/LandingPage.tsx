/**
 * System Overview Landing Page (Technical Blueprint Neo-Brutalist Theme)
 * -----------------------------------------------------------------------
 * Informs visitors and evaluators of all features, services, algorithms, and capabilities
 * available on the Last-Mile Delivery Management Platform.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Calculator, MapPin, Truck, ShieldCheck, Sparkles, 
  Server, ArrowRight, Layers, RefreshCw, Zap, Code, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { role, demoLogin } = useAuth();

  return (
    <div className="space-y-8 font-mono">
      
      {/* Hero Blueprint Banner */}
      <div className="bg-white border-2 border-black neo-shadow-lg p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b-2 border-black">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-[#0052FF] border border-black animate-ping" />
              <span className="text-xs font-extrabold text-[#0052FF] uppercase tracking-widest">
                SYSTEM CORE &bull; RELEASE v2.0.4
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight leading-tight">
              LAST-MILE LOGISTICS & DISPATCH PLATFORM
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 font-bold max-w-2xl leading-relaxed">
              OPERATIONAL CONTROL CENTER FOR DYNAMIC VOLUMETRIC PRICING, GEOJSON SPATIAL ZONING, ACID NEAREST-NEIGHBOR AGENT AUTO-ASSIGNMENT, AND AGENTIC AI ADDRESS RESOLUTION.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              to="/orders"
              className="px-5 py-3 bg-[#0052FF] hover:bg-[#0042D0] text-white border-2 border-black neo-shadow font-extrabold text-xs uppercase flex items-center justify-center gap-2 transition"
            >
              <Package className="w-4 h-4" />
              <span>DISPATCH COMMAND</span>
            </Link>

            <Link
              to="/simulator"
              className="px-5 py-3 bg-black hover:bg-zinc-800 text-white border-2 border-black neo-shadow font-extrabold text-xs uppercase flex items-center justify-center gap-2 transition"
            >
              <Calculator className="w-4 h-4 text-[#0052FF]" />
              <span>RATE SIMULATOR</span>
            </Link>
          </div>
        </div>

        {/* System Active Status Badges Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
          <div className="p-3 bg-zinc-100 border-2 border-black flex items-center justify-between">
            <span className="text-zinc-500 uppercase">ACTIVE ROLE</span>
            <span className="text-black font-extrabold uppercase">{role || 'GUEST'}</span>
          </div>

          <div className="p-3 bg-zinc-100 border-2 border-black flex items-center justify-between">
            <span className="text-zinc-500 uppercase">WEBSOCKETS</span>
            <span className="text-[#0052FF] font-extrabold uppercase">SOCKET.IO CONNECTED</span>
          </div>

          <div className="p-3 bg-zinc-100 border-2 border-black flex items-center justify-between">
            <span className="text-zinc-500 uppercase">AI ENGINE</span>
            <span className="text-emerald-700 font-extrabold uppercase">GEMINI 1.5 FLASH</span>
          </div>

          <div className="p-3 bg-zinc-100 border-2 border-black flex items-center justify-between">
            <span className="text-zinc-500 uppercase">MAP ENGINE</span>
            <span className="text-black font-extrabold uppercase">TURF.JS / LEAFLET</span>
          </div>
        </div>
      </div>

      {/* Feature Capabilities Grid Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-[#0052FF]" />
          <h2 className="text-lg font-extrabold text-black uppercase tracking-tight">
            CORE PLATFORM CAPABILITIES & SYSTEM MODULES
          </h2>
        </div>
        <span className="text-xs bg-black text-white px-3 py-1 border border-black font-bold uppercase">
          9 ENGINE MODULES
        </span>
      </div>

      {/* 9 Core Capability Blueprint Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Module 1: Rate Engine */}
        <div className="bg-white border-2 border-black neo-shadow flex flex-col justify-between overflow-hidden">
          <div>
            <div className="bg-black text-white px-4 py-2 font-bold text-xs uppercase flex justify-between items-center">
              <span>MODULE // 01</span>
              <Calculator className="w-4 h-4 text-[#0052FF]" />
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-extrabold text-base text-black uppercase">PURE RATE CALCULATION ENGINE</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-bold">
                Volumetric weight billing <code className="bg-zinc-200 text-black px-1 py-0.5 border border-black text-[10px]">(L×W×H)/5000</code>, billable weight selection <code className="bg-zinc-200 text-black px-1 py-0.5 border border-black text-[10px]">max(actual, volumetric)</code>, intra-zone vs. inter-zone cross-tier rates, B2B/B2C card lookups, and percentage COD collection surcharges.
              </p>
            </div>
          </div>
          <div className="p-4 border-t-2 border-black bg-zinc-50">
            <Link
              to="/simulator"
              className="w-full py-2 bg-[#0052FF] hover:bg-[#0042D0] text-white font-bold text-xs uppercase border-2 border-black neo-shadow-sm flex items-center justify-center gap-1.5 transition"
            >
              <span>Test Rate Engine</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Module 2: GeoJSON Zone Engine */}
        <div className="bg-white border-2 border-black neo-shadow flex flex-col justify-between overflow-hidden">
          <div>
            <div className="bg-black text-white px-4 py-2 font-bold text-xs uppercase flex justify-between items-center">
              <span>MODULE // 02</span>
              <MapPin className="w-4 h-4 text-[#0052FF]" />
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-extrabold text-base text-black uppercase">GEOJSON SPATIAL ZONING ENGINE</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-bold">
                Turf.js point-in-polygon coordinate zone detection, interactive Leaflet polygon map visualizer, 1-click standard NCR zone seeding (Gurgaon, Delhi, Noida), and raw GeoJSON coordinate editor modal.
              </p>
            </div>
          </div>
          <div className="p-4 border-t-2 border-black bg-zinc-50">
            <Link
              to="/zones"
              className="w-full py-2 bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase border-2 border-black neo-shadow-sm flex items-center justify-center gap-1.5 transition"
            >
              <span>Manage Spatial Zones</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Module 3: Agentic AI Address Parser */}
        <div className="bg-white border-2 border-black neo-shadow flex flex-col justify-between overflow-hidden">
          <div>
            <div className="bg-black text-white px-4 py-2 font-bold text-xs uppercase flex justify-between items-center">
              <span>MODULE // 03</span>
              <Sparkles className="w-4 h-4 text-[#0052FF]" />
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-extrabold text-base text-black uppercase">AGENTIC AI ADDRESS RESOLUTION</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-bold">
                Integrates Google Gemini 1.5 Flash LLM to parse unstructured Indian text addresses, extract 6-digit pincodes, cities, landmarks, infer B2B vs. B2C client types, with regex heuristic fallback when API keys are omitted.
              </p>
            </div>
          </div>
          <div className="p-4 border-t-2 border-black bg-zinc-50">
            <Link
              to="/orders"
              className="w-full py-2 bg-white hover:bg-zinc-100 text-black font-bold text-xs uppercase border-2 border-black neo-shadow-sm flex items-center justify-center gap-1.5 transition"
            >
              <span>Try AI Auto-Fill Modal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Module 4: ACID Auto-Assignment Solver */}
        <div className="bg-white border-2 border-black neo-shadow flex flex-col justify-between overflow-hidden">
          <div>
            <div className="bg-black text-white px-4 py-2 font-bold text-xs uppercase flex justify-between items-center">
              <span>MODULE // 04</span>
              <Server className="w-4 h-4 text-[#0052FF]" />
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-extrabold text-base text-black uppercase">ACID NEAREST-NEIGHBOR SOLVER</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-bold">
                Greedy Haversine distance solver that assigns nearest active driver, enforces driver capacity limits <code className="bg-zinc-200 text-black px-1 py-0.5 border border-black text-[10px]">maxConcurrentOrders</code>, and locks MongoDB document rows using ACID transactions.
              </p>
            </div>
          </div>
          <div className="p-4 border-t-2 border-black bg-zinc-50">
            <Link
              to="/orders"
              className="w-full py-2 bg-[#0052FF] hover:bg-[#0042D0] text-white font-bold text-xs uppercase border-2 border-black neo-shadow-sm flex items-center justify-center gap-1.5 transition"
            >
              <span>Run Auto-Assignment</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Module 5: Directed Graph State Machine & Driver Duty Console */}
        <div className="bg-white border-2 border-black neo-shadow flex flex-col justify-between overflow-hidden">
          <div>
            <div className="bg-black text-white px-4 py-2 font-bold text-xs uppercase flex justify-between items-center">
              <span>MODULE // 05</span>
              <Truck className="w-4 h-4 text-[#0052FF]" />
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-extrabold text-base text-black uppercase">DRIVER DUTY & STATE MACHINE</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-bold">
                Enforces directed graph state rules <code className="bg-zinc-200 text-black px-1 py-0.5 border border-black text-[10px]">CREATED ➔ PICKED_UP ➔ IN_TRANSIT ➔ OUT_FOR_DELIVERY ➔ DELIVERED / FAILED</code>. Includes mobile driver duty console for status and GPS location streaming.
              </p>
            </div>
          </div>
          <div className="p-4 border-t-2 border-black bg-zinc-50">
            <Link
              to="/agent-dashboard"
              className="w-full py-2 bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase border-2 border-black neo-shadow-sm flex items-center justify-center gap-1.5 transition"
            >
              <span>Launch Driver Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Module 6: Smart Reschedule Engine */}
        <div className="bg-white border-2 border-black neo-shadow flex flex-col justify-between overflow-hidden">
          <div>
            <div className="bg-black text-white px-4 py-2 font-bold text-xs uppercase flex justify-between items-center">
              <span>MODULE // 06</span>
              <RefreshCw className="w-4 h-4 text-[#0052FF]" />
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-extrabold text-base text-black uppercase">TARGETED FAILURE RESCHEDULE</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-bold">
                Captures diagnostic failure codes (<code className="bg-zinc-200 text-black px-1 py-0.5 border border-black text-[10px]">INCORRECT_ADDRESS</code>, <code className="bg-zinc-200 text-black px-1 py-0.5 border border-black text-[10px]">CUSTOMER_UNAVAILABLE</code>), allows customer date/address correction, dynamically re-calculates pricing, and re-queues shipment.
              </p>
            </div>
          </div>
          <div className="p-4 border-t-2 border-black bg-zinc-50">
            <Link
              to="/track-search"
              className="w-full py-2 bg-white hover:bg-zinc-100 text-black font-bold text-xs uppercase border-2 border-black neo-shadow-sm flex items-center justify-center gap-1.5 transition"
            >
              <span>Test Reschedule Flow</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Module 7: Socket.io Real-Time Stream */}
        <div className="bg-white border-2 border-black neo-shadow flex flex-col justify-between overflow-hidden">
          <div>
            <div className="bg-black text-white px-4 py-2 font-bold text-xs uppercase flex justify-between items-center">
              <span>MODULE // 07</span>
              <Zap className="w-4 h-4 text-[#0052FF]" />
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-extrabold text-base text-black uppercase">SOCKET.IO WEBSOCKETS STREAM</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-bold">
                Sub-second room channel subscriptions (<code className="bg-zinc-200 text-black px-1 py-0.5 border border-black text-[10px]">order:id</code>, <code className="bg-zinc-200 text-black px-1 py-0.5 border border-black text-[10px]">admin</code>, <code className="bg-zinc-200 text-black px-1 py-0.5 border border-black text-[10px]">agent:id</code>) broadcasting live shipment events, driver map coordinates, and auto-refreshing admin tables.
              </p>
            </div>
          </div>
          <div className="p-4 border-t-2 border-black bg-zinc-50">
            <Link
              to="/orders"
              className="w-full py-2 bg-[#0052FF] hover:bg-[#0042D0] text-white font-bold text-xs uppercase border-2 border-black neo-shadow-sm flex items-center justify-center gap-1.5 transition"
            >
              <span>View Dispatch Stream</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Module 8: Public Live Tracking & Immutable Ledger */}
        <div className="bg-white border-2 border-black neo-shadow flex flex-col justify-between overflow-hidden">
          <div>
            <div className="bg-black text-white px-4 py-2 font-bold text-xs uppercase flex justify-between items-center">
              <span>MODULE // 08</span>
              <ShieldCheck className="w-4 h-4 text-[#0052FF]" />
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-extrabold text-base text-black uppercase">PUBLIC TRACKING & AUDIT LEDGER</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-bold">
                Unauthenticated public tracking by tracking code (<code className="bg-zinc-200 text-black px-1 py-0.5 border border-black text-[10px]">DEL-XXXXXX-X</code>) with 5-stage progress steppers, Leaflet route maps, and immutable event-sourced audit logs.
              </p>
            </div>
          </div>
          <div className="p-4 border-t-2 border-black bg-zinc-50">
            <Link
              to="/track-search"
              className="w-full py-2 bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase border-2 border-black neo-shadow-sm flex items-center justify-center gap-1.5 transition"
            >
              <span>Track Public Shipment</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Module 9: Evaluator Demo Role Dock */}
        <div className="bg-white border-2 border-black neo-shadow flex flex-col justify-between overflow-hidden">
          <div>
            <div className="bg-black text-white px-4 py-2 font-bold text-xs uppercase flex justify-between items-center">
              <span>MODULE // 09</span>
              <UserCheck className="w-4 h-4 text-[#0052FF]" />
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-extrabold text-base text-black uppercase">EVALUATOR DEMO ROLE SWITCHER</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-bold">
                Persistent bottom dock enabling zero-friction 1-click role switching between Admin Dispatcher, Delivery Driver (Karan), and B2B Commercial Customer (Apex Logistics).
              </p>
            </div>
          </div>
          <div className="p-4 border-t-2 border-black bg-zinc-50">
            <button
              onClick={() => demoLogin('ADMIN')}
              className="w-full py-2 bg-white hover:bg-zinc-100 text-black font-bold text-xs uppercase border-2 border-black neo-shadow-sm flex items-center justify-center gap-1.5 transition"
            >
              <span>Switch to Admin Role</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 4-Step Technical Workflow Section */}
      <div className="bg-white border-2 border-black neo-shadow p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-[#0052FF]" />
            <h2 className="text-base sm:text-lg font-extrabold text-black uppercase tracking-tight">
              END-TO-END TECHNICAL LOGISTICS WORKFLOW
            </h2>
          </div>
          <span className="text-xs bg-[#0052FF] text-white px-3 py-1 border border-black font-bold uppercase neo-shadow-sm">
            4 EXECUTION STEPS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 bg-zinc-50 border-2 border-black space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-black text-[#0052FF] text-sm">STEP 01</span>
              <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold">SIMULATE</span>
            </div>
            <div className="font-extrabold text-black uppercase">CREATE & CALCULATE</div>
            <p className="text-zinc-600 text-[11px] font-bold leading-relaxed">
              Input parcel dimensions & weight. AI resolves address & matches GeoJSON polygon zone. Rate Engine computes volumetric charge.
            </p>
          </div>

          <div className="p-4 bg-zinc-50 border-2 border-black space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-black text-[#0052FF] text-sm">STEP 02</span>
              <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold">ASSIGN</span>
            </div>
            <div className="font-extrabold text-black uppercase">ACID AUTO-DISPATCH</div>
            <p className="text-zinc-600 text-[11px] font-bold leading-relaxed">
              Greedy Haversine solver finds closest available driver. Enforces capacity limits and locks MongoDB document rows.
            </p>
          </div>

          <div className="p-4 bg-zinc-50 border-2 border-black space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-black text-[#0052FF] text-sm">STEP 03</span>
              <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold">TELEMETRY</span>
            </div>
            <div className="font-extrabold text-black uppercase">DRIVER DUTY STREAM</div>
            <p className="text-zinc-600 text-[11px] font-bold leading-relaxed">
              Driver accepts shipment on mobile duty console. Broadcasts live GPS coordinates & advances status lifecycle graph.
            </p>
          </div>

          <div className="p-4 bg-zinc-50 border-2 border-black space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-black text-[#0052FF] text-sm">STEP 04</span>
              <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold">AUDIT</span>
            </div>
            <div className="font-extrabold text-black uppercase">TRACK & RESCHEDULE</div>
            <p className="text-zinc-600 text-[11px] font-bold leading-relaxed">
              Public tracking page displays live Leaflet route map & immutable audit log table. Enables 1-click failure rescheduling.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

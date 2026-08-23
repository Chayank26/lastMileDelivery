/**
 * Admin Zone Management & GeoJSON Polygon Editor Page
 * ----------------------------------------------------
 * Allows Admins to view active delivery zones on an interactive Leaflet map,
 * seed standard NCR sample zones with 1 click, toggle zone status, and upload/paste new GeoJSON polygons.
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, RefreshCw, Layers, ShieldAlert, CheckCircle2, Code } from 'lucide-react';
import { zoneApi } from '../services/api';
import { ZoneMapVisualizer, IMapZone } from '../components/ZoneMapVisualizer';
import { useAuth } from '../context/AuthContext';

export const ZoneManagementPage: React.FC = () => {
  const { role } = useAuth();
  const [zones, setZones] = useState<IMapZone[]>([]);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // GeoJSON Modal Creation States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newZoneName, setNewZoneName] = useState<string>('');
  const [newZoneCode, setNewZoneCode] = useState<string>('');
  const [newZoneTier, setNewZoneTier] = useState<string>('Tier-1 Core');
  const [newBaseSurgePct, setNewBaseSurgePct] = useState<number>(0);
  const [newColorHex, setNewColorHex] = useState<string>('#6366f1');
  const [rawCoordinatesInput, setRawCoordinatesInput] = useState<string>('');

  const fetchZones = async () => {
    setError(null);
    try {
      const response = await zoneApi.getAll();
      setZones(response.data.zones || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch zones list.');
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleSeedZones = async () => {
    setIsSeeding(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await zoneApi.seedSamples();
      setSuccessMsg(response.data.message || 'Standard NCR delivery zones seeded successfully!');
      await fetchZones();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to seed sample zones.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    try {
      // Parse raw coordinates string: [[[77.0, 28.4], [77.1, 28.4], ...]]
      const parsedCoordinates = JSON.parse(rawCoordinatesInput);

      const payload = {
        name: newZoneName,
        code: newZoneCode.toUpperCase(),
        tier: newZoneTier,
        baseSurgePercentage: Number(newBaseSurgePct),
        colorHex: newColorHex,
        boundary: {
          type: 'Polygon',
          coordinates: parsedCoordinates,
        },
      };

      await zoneApi.create(payload);
      setSuccessMsg(`Zone '${newZoneName}' created successfully!`);
      setIsModalOpen(false);
      
      // Reset form
      setNewZoneName('');
      setNewZoneCode('');
      setRawCoordinatesInput('');

      await fetchZones();
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || 'Invalid GeoJSON coordinates JSON format.');
    }
  };

  const samplePolygonJson = `[
  [
    [77.0100, 28.4500],
    [77.0600, 28.4500],
    [77.0600, 28.5000],
    [77.0100, 28.5000],
    [77.0100, 28.4500]
  ]
]`;

  if (role !== 'ADMIN') {
    return (
      <div className="p-8 text-center bg-[#121215] border border-red-500/30 rounded-xl space-y-3">
        <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Access Forbidden</h2>
        <p className="text-xs text-zinc-400">Zone Management and Spatial Editing requires ADMIN role privileges.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Zone Management & Spatial Polygons</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configure GeoJSON delivery boundaries, pricing tiers, and spatial surge multipliers.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSeedZones}
            disabled={isSeeding}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>Seed NCR Zones</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Zone</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Interactive Map Visualizer */}
      <div className="bg-[#121215] border border-zinc-800 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            Spatial Polygon Layer Overlay
          </span>
          <span className="font-mono">{zones.length} Zones Active</span>
        </div>

        <ZoneMapVisualizer zones={zones} height="360px" />
      </div>

      {/* Zones Data Table */}
      <div className="bg-[#121215] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Registered Delivery Zones</h2>
          <span className="text-xs text-zinc-500 font-mono">GeoJSON Polygons</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/80 text-zinc-400 font-mono uppercase text-[10px] border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3">Zone Code</th>
                <th className="px-5 py-3">Zone Name</th>
                <th className="px-5 py-3">Tier</th>
                <th className="px-5 py-3">Base Surge %</th>
                <th className="px-5 py-3">Polygon Color</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {zones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                    No delivery zones configured yet. Click 'Seed NCR Zones' above to populate default test data.
                  </td>
                </tr>
              ) : (
                zones.map((z: any) => (
                  <tr key={z._id} className="hover:bg-zinc-900/40 transition">
                    <td className="px-5 py-3 font-mono font-semibold text-indigo-400">{z.code}</td>
                    <td className="px-5 py-3 font-medium text-white">{z.name}</td>
                    <td className="px-5 py-3 text-zinc-400">{z.tier || 'Standard'}</td>
                    <td className="px-5 py-3 font-mono text-emerald-400">+{z.baseSurgePercentage || 0}%</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: z.colorHex || '#6366f1' }}></span>
                        <span className="font-mono text-zinc-400">{z.colorHex || '#6366f1'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Zone GeoJSON Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-400" />
                Add New GeoJSON Zone
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateZone} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Zone Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. West Delhi Core"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Zone Code (Unique)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ZONE_DELHI_WEST"
                    value={newZoneCode}
                    onChange={(e) => setNewZoneCode(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Tier</label>
                  <input
                    type="text"
                    value={newZoneTier}
                    onChange={(e) => setNewZoneTier(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Base Surge %</label>
                  <input
                    type="number"
                    value={newBaseSurgePct}
                    onChange={(e) => setNewBaseSurgePct(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Map Color</label>
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer p-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 flex justify-between">
                  <span>Polygon Coordinates JSON [[[lng, lat], ...]]</span>
                  <span className="text-indigo-400 font-mono text-[10px]">Leaflet / Turf Format</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder={samplePolygonJson}
                  value={rawCoordinatesInput}
                  onChange={(e) => setRawCoordinatesInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-emerald-400 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20"
                >
                  Save & Render Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

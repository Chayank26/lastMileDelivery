/**
 * Admin Zone Management & GeoJSON Polygon Editor Page (Technical Blueprint Theme)
 * -------------------------------------------------------------------------------
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
  const [newColorHex, setNewColorHex] = useState<string>('#0052FF');
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
      <div className="p-8 text-center bg-white border-2 border-black neo-shadow space-y-3 font-mono">
        <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
        <h2 className="text-lg font-extrabold text-black uppercase">ACCESS RESTRICTED</h2>
        <p className="text-xs text-zinc-600 font-bold">Zone Management and Spatial Editing requires ADMIN role privileges.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-mono">
      
      {/* Header Bar */}
      <div className="bg-white border-2 border-black neo-shadow p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-[#0052FF]" />
            <h1 className="text-xl font-extrabold text-black uppercase tracking-tight font-mono">
              ZONE MANAGEMENT & SPATIAL POLYGONS [GEO-01]
            </h1>
          </div>
          <p className="text-xs text-zinc-600 font-bold mt-1">
            CONFIGURE GEOJSON BOUNDARIES &bull; TIER MULTIPLIERS &bull; SPATIAL OVERLAYS
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSeedZones}
            disabled={isSeeding}
            className="px-3.5 py-2 bg-white hover:bg-zinc-100 text-black border-2 border-black text-xs font-bold uppercase transition neo-shadow-sm flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>SEED NCR ZONES</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-[#0052FF] hover:bg-[#0042D0] text-white border-2 border-black text-xs font-bold uppercase transition neo-shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>ADD NEW ZONE</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-100 border-2 border-black text-red-700 text-xs font-bold neo-shadow-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-100 border-2 border-black text-emerald-800 text-xs font-bold neo-shadow-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Interactive Map Visualizer Card */}
      <div className="bg-white border-2 border-black neo-shadow p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-black font-extrabold uppercase px-1">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#0052FF]" />
            SPATIAL POLYGON LAYER OVERLAY
          </span>
          <span className="bg-[#0052FF] text-white px-2 py-0.5 border border-black">{zones.length} ZONES REGISTERED</span>
        </div>

        <ZoneMapVisualizer zones={zones} height="360px" />
      </div>

      {/* Zones Data Table Card */}
      <div className="bg-white border-2 border-black neo-shadow overflow-hidden">
        <div className="bg-black text-white px-5 py-3 flex items-center justify-between font-mono font-bold text-xs uppercase">
          <span>REGISTERED DELIVERY ZONES LEDGER</span>
          <span>GEOJSON POLYGONS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-100 text-black uppercase font-bold text-[11px] border-b-2 border-black">
              <tr>
                <th className="px-5 py-3">ZONE CODE</th>
                <th className="px-5 py-3">ZONE NAME</th>
                <th className="px-5 py-3">TIER</th>
                <th className="px-5 py-3">SURGE %</th>
                <th className="px-5 py-3">MAP COLOR</th>
                <th className="px-5 py-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y border-b-2 border-black divide-zinc-200">
              {zones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-zinc-500 font-bold">
                    No delivery zones configured yet. Click 'SEED NCR ZONES' above to populate default test data.
                  </td>
                </tr>
              ) : (
                zones.map((z: any) => (
                  <tr key={z._id} className="hover:bg-zinc-50 transition">
                    <td className="px-5 py-3 font-bold text-[#0052FF]">{z.code}</td>
                    <td className="px-5 py-3 font-extrabold text-black">{z.name}</td>
                    <td className="px-5 py-3 text-zinc-600 font-bold">{z.tier || 'Standard'}</td>
                    <td className="px-5 py-3 font-bold text-emerald-700">+{z.baseSurgePercentage || 0}%</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 border border-black" style={{ backgroundColor: z.colorHex || '#0052FF' }}></span>
                        <span className="font-bold text-black">{z.colorHex || '#0052FF'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 font-bold bg-[#0052FF] text-white border border-black text-[10px]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white border-2 border-black neo-shadow-lg max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto font-mono">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <h3 className="text-sm font-extrabold text-black uppercase flex items-center gap-2">
                <Code className="w-5 h-5 text-[#0052FF]" />
                ADD NEW GEOJSON ZONE POLYGON
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-black font-bold p-1 hover:bg-zinc-100 border border-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateZone} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-700 font-bold block mb-1">ZONE NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. West Delhi Core"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2 font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
                  />
                </div>

                <div>
                  <label className="text-zinc-700 font-bold block mb-1">ZONE CODE (UNIQUE)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ZONE_DELHI_WEST"
                    value={newZoneCode}
                    onChange={(e) => setNewZoneCode(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2 font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-700 font-bold block mb-1">TIER</label>
                  <input
                    type="text"
                    value={newZoneTier}
                    onChange={(e) => setNewZoneTier(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2 font-bold text-black"
                  />
                </div>

                <div>
                  <label className="text-zinc-700 font-bold block mb-1">SURGE %</label>
                  <input
                    type="number"
                    value={newBaseSurgePct}
                    onChange={(e) => setNewBaseSurgePct(Number(e.target.value))}
                    className="w-full bg-white border-2 border-black p-2 font-bold text-black"
                  />
                </div>

                <div>
                  <label className="text-zinc-700 font-bold block mb-1">MAP COLOR</label>
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-full h-9 bg-white border-2 border-black p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-700 font-bold block mb-1 flex justify-between">
                  <span>POLYGON COORDINATES JSON</span>
                  <span className="text-[#0052FF]">LEAFLET / TURF FORMAT</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder={samplePolygonJson}
                  value={rawCoordinatesInput}
                  onChange={(e) => setRawCoordinatesInput(e.target.value)}
                  className="w-full bg-zinc-900 border-2 border-black p-3 text-emerald-400 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-zinc-100 text-black border-2 border-black font-bold text-xs uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0052FF] hover:bg-[#0042D0] text-white border-2 border-black font-bold text-xs uppercase neo-shadow-sm"
                >
                  SAVE & RENDER ZONE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

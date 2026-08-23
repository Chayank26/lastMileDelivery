/**
 * Rate Sandbox & Pricing Simulator Page
 * --------------------------------------
 * Interactive playground allowing users to adjust parcel dimensions, weights,
 * order types, COD parameters, and map pin locations to test live rate engine calculations.
 */

import React, { useState, useEffect } from 'react';
import { Calculator, ShieldAlert, Sparkles, Scale, Layers } from 'lucide-react';
import { rateApi, zoneApi } from '../services/api';
import { ZoneMapVisualizer, IMapZone } from '../components/ZoneMapVisualizer';

export const RateSimulatorPage: React.FC = () => {
  // Dimension & Weight Input States
  const [lengthCm, setLengthCm] = useState<number>(30);
  const [widthCm, setWidthCm] = useState<number>(20);
  const [heightCm, setHeightCm] = useState<number>(15);
  const [actualWeightKg, setActualWeightKg] = useState<number>(3.5);
  
  // Order Attributes
  const [orderType, setOrderType] = useState<'B2C' | 'B2B'>('B2C');
  const [paymentType, setPaymentType] = useState<'PREPAID' | 'COD'>('PREPAID');
  const [codAmount, setCodAmount] = useState<number>(0);

  // Coordinate Selection & Map States
  const [pickupCoords, setPickupCoords] = useState<[number, number]>([77.0266, 28.4595]); // South Gurgaon
  const [dropCoords, setDropCoords] = useState<[number, number]>([77.0800, 28.4700]); // Cyber City
  const [activeSelectionMode, setActiveSelectionMode] = useState<'pickup' | 'drop' | null>(null);
  const [zones, setZones] = useState<IMapZone[]>([]);

  // Simulation Result State
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch active zones for map rendering
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await zoneApi.getAll();
        setZones(response.data.zones || []);
      } catch (err) {
        console.warn('Failed to load map zones:', err);
      }
    };
    fetchZones();
  }, []);

  // Trigger Rate Simulation Call whenever inputs or coordinates change
  const runSimulation = async () => {
    setError(null);
    try {
      const payload = {
        dimensions: { lengthCm, widthCm, heightCm },
        actualWeightKg,
        orderType,
        paymentType,
        codAmount: paymentType === 'COD' ? codAmount : 0,
        pickupCoords,
        dropCoords,
      };

      const response = await rateApi.simulate(payload);
      setSimulationResult(response.data.priceBreakdown);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to calculate rate simulation.');
    }
  };

  useEffect(() => {
    runSimulation();
  }, [lengthCm, widthCm, heightCm, actualWeightKg, orderType, paymentType, codAmount, pickupCoords, dropCoords]);

  const handleMapSelectLocation = (type: 'pickup' | 'drop', coords: [number, number]) => {
    if (type === 'pickup') {
      setPickupCoords(coords);
    } else {
      setDropCoords(coords);
    }
    setActiveSelectionMode(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <Calculator className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Pricing Sandbox & Rate Engine Simulator</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Simulate volumetric pricing, GeoJSON zone surcharges, and COD handling fees in real-time.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-lg">
            Live Rate Matrix
          </span>
        </div>
      </div>

      {/* Main Dual-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Input Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Parcel Volumetric Inputs Card */}
          <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-400" />
                Parcel Dimensions & Weight
              </span>
              <span className="text-xs text-zinc-400 font-mono">Formula: (L × W × H) / 5000</span>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-zinc-400 flex justify-between">
                  <span>Length (cm)</span>
                  <span className="text-white font-mono">{lengthCm} cm</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Number(e.target.value))}
                  className="w-full mt-2 accent-indigo-500 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 flex justify-between">
                  <span>Width (cm)</span>
                  <span className="text-white font-mono">{widthCm} cm</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={widthCm}
                  onChange={(e) => setWidthCm(Number(e.target.value))}
                  className="w-full mt-2 accent-indigo-500 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 flex justify-between">
                  <span>Height (cm)</span>
                  <span className="text-white font-mono">{heightCm} cm</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full mt-2 accent-indigo-500 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Actual Weight Slider */}
            <div className="pt-2">
              <label className="text-xs text-zinc-400 flex justify-between">
                <span>Actual Package Weight (kg)</span>
                <span className="text-white font-mono font-semibold">{actualWeightKg} kg</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="50"
                step="0.5"
                value={actualWeightKg}
                onChange={(e) => setActualWeightKg(Number(e.target.value))}
                className="w-full mt-2 accent-emerald-500 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Order Attribute Configuration */}
          <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
            <span className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-zinc-800/80">
              <Layers className="w-4 h-4 text-purple-400" />
              Order Type & Payment Terms
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Order Type Selection */}
              <div>
                <label className="text-xs text-zinc-400 block mb-2">Order Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrderType('B2C')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                      orderType === 'B2C'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    B2C Delivery
                  </button>
                  <button
                    onClick={() => setOrderType('B2B')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                      orderType === 'B2B'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    B2B Commercial
                  </button>
                </div>
              </div>

              {/* Payment Type Selection */}
              <div>
                <label className="text-xs text-zinc-400 block mb-2">Payment Terms</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentType('PREPAID')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                      paymentType === 'PREPAID'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    PREPAID
                  </button>
                  <button
                    onClick={() => setPaymentType('COD')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                      paymentType === 'COD'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    COD Cash
                  </button>
                </div>
              </div>
            </div>

            {/* COD Collectable Amount Input */}
            {paymentType === 'COD' && (
              <div className="pt-2">
                <label className="text-xs text-zinc-400 block mb-1">COD Cash Amount to Collect (₹)</label>
                <input
                  type="number"
                  value={codAmount}
                  onChange={(e) => setCodAmount(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  placeholder="e.g. 1500"
                />
              </div>
            )}
          </div>

          {/* Interactive Map Visualizer & Pin Buttons */}
          <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-semibold text-white">Spatial GeoJSON Pin Selection</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveSelectionMode('pickup')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono border transition ${
                    activeSelectionMode === 'pickup'
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                  }`}
                >
                  📍 Pin Pickup
                </button>
                <button
                  onClick={() => setActiveSelectionMode('drop')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono border transition ${
                    activeSelectionMode === 'drop'
                      ? 'bg-red-600 border-red-400 text-white'
                      : 'bg-red-950/40 border-red-500/30 text-red-400 hover:bg-red-900/40'
                  }`}
                >
                  📍 Pin Drop
                </button>
              </div>
            </div>

            <ZoneMapVisualizer
              zones={zones}
              pickupCoords={pickupCoords}
              dropCoords={dropCoords}
              activeSelectionMode={activeSelectionMode}
              onSelectLocation={handleMapSelectLocation}
              height="280px"
            />
          </div>
        </div>

        {/* Right Column: Real-Time Price Breakdown Result Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#121215] border border-indigo-500/30 rounded-xl p-6 shadow-2xl space-y-6 sticky top-24">
            
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono">Calculated Total Charge</span>
                <div className="text-3xl font-black text-white mt-1">
                  ₹{simulationResult ? simulationResult.totalCharge : 0}
                </div>
              </div>
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Charge Line Items */}
            {simulationResult && (
              <div className="space-y-3 text-xs">
                
                {/* Weight Comparison */}
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg space-y-1">
                  <div className="flex justify-between text-zinc-400">
                    <span>Volumetric Weight:</span>
                    <span className="font-mono text-white">{simulationResult.volumetricWeightKg} kg</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Actual Weight:</span>
                    <span className="font-mono text-white">{simulationResult.actualWeightKg} kg</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-zinc-800 text-emerald-400">
                    <span>Chargeable Weight:</span>
                    <span className="font-mono">{simulationResult.chargeableWeightKg} kg</span>
                  </div>
                </div>

                {/* Pricing Line Items */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-zinc-300">
                    <span>Base Fare Charge:</span>
                    <span className="font-mono text-white">₹{simulationResult.baseCharge}</span>
                  </div>

                  <div className="flex justify-between text-zinc-300">
                    <span>Volumetric Weight Surge:</span>
                    <span className="font-mono text-white">₹{simulationResult.weightSurgeCharge}</span>
                  </div>

                  <div className="flex justify-between text-zinc-300">
                    <span>Zone Tier Surcharge:</span>
                    <span className="font-mono text-white">₹{simulationResult.zoneSurcharge}</span>
                  </div>

                  <div className="flex justify-between text-zinc-300">
                    <span>Order Category Surcharge:</span>
                    <span className="font-mono text-white">₹{simulationResult.orderTypeSurge}</span>
                  </div>

                  {paymentType === 'COD' && (
                    <div className="flex justify-between text-amber-400">
                      <span>COD Handling Fee (2%):</span>
                      <span className="font-mono">₹{simulationResult.codSurcharge}</span>
                    </div>
                  )}
                </div>

                {/* Financial Margin Snapshot */}
                <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-lg pt-3 space-y-1 font-mono">
                  <div className="flex justify-between text-zinc-400">
                    <span>Estimated Cost:</span>
                    <span>₹{simulationResult.estimatedCost}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Estimated Margin:</span>
                    <span>₹{simulationResult.estimatedMargin} ({simulationResult.marginPercentage}%)</span>
                  </div>
                </div>

              </div>
            )}

            <div className="text-[11px] text-zinc-500 text-center font-mono">
              Pure Functional Pure Rate Engine Execution &bull; Ephemeral Sandbox Override
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

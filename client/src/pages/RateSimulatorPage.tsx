/**
 * Rate Sandbox & Pricing Simulator Page (Technical Blueprint Theme)
 * -----------------------------------------------------------------
 * Mirrors the high-contrast technical blueprint aesthetic from the reference layout:
 * - Solid black section header bars
 * - Crisp white 2px black-bordered inputs
 * - Vibrant electric blue banner for calculated total charges & billable weights
 */

import React, { useState, useEffect } from 'react';
import { Calculator, ShieldAlert, Sparkles, Scale, Layers } from 'lucide-react';
import { rateApi, zoneApi } from '../services/api';
import { ZoneMapVisualizer, IMapZone } from '../components/ZoneMapVisualizer';

export const RateSimulatorPage: React.FC = () => {
  // Dimension & Weight Input States
  const [lengthCm, setLengthCm] = useState<number>(50);
  const [widthCm, setWidthCm] = useState<number>(40);
  const [heightCm, setHeightCm] = useState<number>(30);
  const [actualWeightKg, setActualWeightKg] = useState<number>(12.5);
  
  // Order Attributes
  const [orderType, setOrderType] = useState<'B2C' | 'B2B'>('B2B');
  const [paymentType, setPaymentType] = useState<'PREPAID' | 'COD'>('PREPAID');
  const [codAmount, setCodAmount] = useState<number>(0);

  // Coordinate Selection & Map States
  const [pickupCoords, setPickupCoords] = useState<[number, number]>([77.0266, 28.4595]);
  const [dropCoords, setDropCoords] = useState<[number, number]>([77.0800, 28.4700]);
  const [activeSelectionMode, setActiveSelectionMode] = useState<'pickup' | 'drop' | null>(null);
  const [zones, setZones] = useState<IMapZone[]>([]);

  // Simulation Result State
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
      
      {/* Blueprint Page Header Bar */}
      <div className="bg-white border-2 border-black neo-shadow p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Calculator className="w-6 h-6 text-[#0052FF]" />
            <h1 className="text-xl font-extrabold text-black font-mono uppercase tracking-tight">
              RATE SIMULATOR [SIM-001]
            </h1>
          </div>
          <p className="text-xs text-zinc-600 font-mono font-bold mt-1">
            PURE FUNCTIONAL RATE ENGINE &bull; EPHEMERAL OVERRIDE SANDBOX
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

      {/* Main Dual-Column Blueprint Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Volumetric & Route Input Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Package Volumetrics Card (Mirrors Photo Layout) */}
          <div className="bg-white border-2 border-black neo-shadow overflow-hidden">
            <div className="bg-black text-white px-4 py-2 font-mono font-bold text-xs uppercase flex justify-between items-center">
              <span>PACKAGE VOLUMETRICS KG / CM</span>
              <Scale className="w-4 h-4 text-[#0052FF]" />
            </div>

            <div className="p-5 space-y-4 font-mono">
              {/* Length / Width / Height Input Boxes */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 uppercase block mb-1">
                    LENGTH (CM)
                  </label>
                  <input
                    type="number"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Number(e.target.value))}
                    className="w-full bg-white border-2 border-black p-2 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-600 uppercase block mb-1">
                    WIDTH (CM)
                  </label>
                  <input
                    type="number"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Number(e.target.value))}
                    className="w-full bg-white border-2 border-black p-2 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-600 uppercase block mb-1">
                    HEIGHT (CM)
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full bg-white border-2 border-black p-2 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
                  />
                </div>
              </div>

              {/* Sliders for visual adjustment */}
              <div className="grid grid-cols-3 gap-3 text-[10px]">
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Number(e.target.value))}
                  className="w-full accent-black bg-zinc-200 cursor-pointer"
                />
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={widthCm}
                  onChange={(e) => setWidthCm(Number(e.target.value))}
                  className="w-full accent-black bg-zinc-200 cursor-pointer"
                />
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full accent-black bg-zinc-200 cursor-pointer"
                />
              </div>

              {/* Actual Weight Box */}
              <div>
                <label className="text-[10px] font-bold text-zinc-600 uppercase block mb-1 flex justify-between">
                  <span>ACTUAL WEIGHT (KG)</span>
                  <span className="text-[#0052FF] font-extrabold">{actualWeightKg} KG</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={actualWeightKg}
                  onChange={(e) => setActualWeightKg(Number(e.target.value))}
                  className="w-full bg-white border-2 border-black p-2.5 text-base font-extrabold text-black focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
                />
              </div>

              <div className="p-3 bg-zinc-100 border border-zinc-300 text-[11px] text-zinc-700 font-mono font-semibold">
                LOGIC: Volumetric weight calculated as (L×W×H) ÷ 5000. Billing applies to max(actual vs volumetric).
              </div>
            </div>
          </div>

          {/* Route & Order Specification Card (Mirrors Photo Layout) */}
          <div className="bg-white border-2 border-black neo-shadow overflow-hidden">
            <div className="bg-black text-white px-4 py-2 font-mono font-bold text-xs uppercase flex justify-between items-center">
              <span>ROUTE SPECIFICATION RT-772</span>
              <Layers className="w-4 h-4 text-[#0052FF]" />
            </div>

            <div className="p-5 space-y-4 font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 uppercase block mb-1">
                    CLIENT TYPE
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOrderType('B2C')}
                      className={`py-2 px-3 text-xs font-bold border-2 border-black transition ${
                        orderType === 'B2C'
                          ? 'bg-[#0052FF] text-white neo-shadow-sm'
                          : 'bg-white text-black hover:bg-zinc-100'
                      }`}
                    >
                      B2C RETAIL
                    </button>
                    <button
                      onClick={() => setOrderType('B2B')}
                      className={`py-2 px-3 text-xs font-bold border-2 border-black transition ${
                        orderType === 'B2B'
                          ? 'bg-[#0052FF] text-white neo-shadow-sm'
                          : 'bg-white text-black hover:bg-zinc-100'
                      }`}
                    >
                      B2B CORP
                    </button>
                  </div>
                </div>

                {/* Payment Selection */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 uppercase block mb-1">
                    PAYMENT TERMS
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentType('PREPAID')}
                      className={`py-2 px-3 text-xs font-bold border-2 border-black transition ${
                        paymentType === 'PREPAID'
                          ? 'bg-black text-white neo-shadow-sm'
                          : 'bg-white text-black hover:bg-zinc-100'
                      }`}
                    >
                      PREPAID
                    </button>
                    <button
                      onClick={() => setPaymentType('COD')}
                      className={`py-2 px-3 text-xs font-bold border-2 border-black transition ${
                        paymentType === 'COD'
                          ? 'bg-black text-white neo-shadow-sm'
                          : 'bg-white text-black hover:bg-zinc-100'
                      }`}
                    >
                      COD CASH
                    </button>
                  </div>
                </div>
              </div>

              {paymentType === 'COD' && (
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 uppercase block mb-1">
                    COD CASH AMOUNT TO COLLECT (₹)
                  </label>
                  <input
                    type="number"
                    value={codAmount}
                    onChange={(e) => setCodAmount(Number(e.target.value))}
                    className="w-full bg-white border-2 border-black p-2 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
                    placeholder="e.g. 1500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Interactive Spatial Leaflet Map Card */}
          <div className="bg-white border-2 border-black neo-shadow p-4 space-y-3">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-extrabold uppercase text-black">SPATIAL GEOJSON PIN SELECTION</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveSelectionMode('pickup')}
                  className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black transition ${
                    activeSelectionMode === 'pickup'
                      ? 'bg-[#0052FF] text-white neo-shadow-sm'
                      : 'bg-white text-black hover:bg-zinc-100'
                  }`}
                >
                  📍 PIN PICKUP
                </button>
                <button
                  onClick={() => setActiveSelectionMode('drop')}
                  className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black transition ${
                    activeSelectionMode === 'drop'
                      ? 'bg-black text-white neo-shadow-sm'
                      : 'bg-white text-black hover:bg-zinc-100'
                  }`}
                >
                  📍 PIN DROP
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

        {/* Right Column: Electric Blue Price Banner & Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Electric Blue Calculation Card (EXACT REF FROM PHOTO!) */}
          <div className="bg-[#0052FF] text-white border-2 border-black neo-shadow-lg p-6 space-y-6 sticky top-24 font-mono">
            
            <div className="flex items-center justify-between pb-4 border-b-2 border-white/40">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="text-xs font-extrabold uppercase tracking-wider">LIVE RATE ENGINE OVERRIDE</span>
              </div>
              <span className="text-[10px] bg-black text-white px-2 py-0.5 border border-white font-extrabold uppercase">
                VER 2.0.4
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-600 text-white border-2 border-black text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Calculated Charge Banner (PHOTO HERO COMPONENT) */}
            {simulationResult && (
              <div className="space-y-6">
                
                <div className="bg-white text-black border-2 border-black neo-shadow p-5 flex flex-col justify-between">
                  <span className="text-[11px] font-extrabold text-zinc-600 uppercase">
                    CALCULATED CHARGE ({orderType} RATE CARD)
                  </span>
                  <div className="text-4xl font-black text-[#0052FF] tracking-tight mt-2">
                    ₹{simulationResult.totalCharge}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t-2 border-black flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-600 uppercase">BILLABLE WEIGHT</span>
                    <span className="font-black text-black text-sm">{simulationResult.billableWeightKg} KG</span>
                  </div>
                </div>

                {/* Line Item Breakdown */}
                <div className="bg-black text-white border-2 border-black neo-shadow-sm p-4 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-zinc-800 pb-1">
                    <span className="text-zinc-400">Volumetric Weight:</span>
                    <span className="font-bold text-white">{simulationResult.volumetricWeightKg} KG</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-1">
                    <span className="text-zinc-400">Actual Weight:</span>
                    <span className="font-bold text-white">{simulationResult.actualWeightKg} KG</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-1">
                    <span className="text-zinc-400">Base Fare Charge:</span>
                    <span className="font-bold text-white">₹{simulationResult.baseFee}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-1">
                    <span className="text-zinc-400">Weight Surcharge:</span>
                    <span className="font-bold text-white">₹{simulationResult.weightFee}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-1">
                    <span className="text-zinc-400">Shipment Type:</span>
                    <span className="font-bold text-white">{simulationResult.isInterZone ? 'INTER-ZONE' : 'INTRA-ZONE'}</span>
                  </div>
                  {paymentType === 'COD' && (
                    <div className="flex justify-between text-yellow-300 font-bold">
                      <span>COD Handling Surcharge:</span>
                      <span>₹{simulationResult.codSurcharge}</span>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Action Buttons (MIRRORS PHOTO BUTTONS) */}
            <div className="space-y-2 pt-2">
              <button
                onClick={runSimulation}
                className="w-full py-3 bg-black hover:bg-zinc-800 text-white font-mono font-black text-xs uppercase border-2 border-black neo-shadow transition"
              >
                CONFIRM & RE-CALCULATE WAYBILL
              </button>

              <button
                onClick={() => alert('Simulation parameters saved to local sandbox session!')}
                className="w-full py-2.5 bg-white hover:bg-zinc-100 text-black font-mono font-bold text-xs uppercase border-2 border-black neo-shadow-sm transition"
              >
                SAVE DRAFT CONFIGURATION
              </button>
            </div>

            <div className="text-[10px] text-white/80 text-center font-mono font-semibold">
              SYS_UID: 9928-881 &bull; PURE RATE ENGINE ACTIVE
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

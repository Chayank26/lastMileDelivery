/**
 * Order Management & Admin Dispatch Command Center Page (Technical Blueprint Theme)
 * -------------------------------------------------------------------------------
 * Central dispatch overview featuring Socket.io real-time updates, Agentic AI address parsing,
 * and high-contrast neo-brutalist dispatch tables.
 */

import React, { useState, useEffect } from 'react';
import { Package, Plus, Sparkles, RefreshCw, UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { orderApi, agentApi, aiApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const OrderManagementPage: React.FC = () => {
  const { role } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal Creation States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [unstructuredAddressInput, setUnstructuredAddressInput] = useState<string>('');
  const [isAiParsing, setIsAiParsing] = useState<boolean>(false);

  // Order Creation Form State
  const [pickupStreet, setPickupStreet] = useState<string>('Sector 44, Gurgaon');
  const [pickupCity, setPickupCity] = useState<string>('Gurgaon');
  const [pickupPincode, setPickupPincode] = useState<string>('122003');
  const [pickupCoords] = useState<[number, number]>([77.0800, 28.4500]);

  const [dropStreet, setDropStreet] = useState<string>('Cyber City, Gurgaon');
  const [dropCity, setDropCity] = useState<string>('Gurgaon');
  const [dropPincode, setDropPincode] = useState<string>('122002');
  const [dropCoords] = useState<[number, number]>([77.0850, 28.4900]);

  const [lengthCm, setLengthCm] = useState<number>(30);
  const [widthCm, setWidthCm] = useState<number>(20);
  const [heightCm, setHeightCm] = useState<number>(15);
  const [actualWeightKg, setActualWeightKg] = useState<number>(2.5);
  const [orderType, setOrderType] = useState<'B2C' | 'B2B'>('B2C');
  const [paymentType, setPaymentType] = useState<'PREPAID' | 'COD'>('PREPAID');
  const [codAmount] = useState<number>(0);

  // Manual Assignment Modal State
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  // Reschedule Modal State
  const [reschedulingOrderId, setReschedulingOrderId] = useState<string | null>(null);
  const [rescheduledDate, setRescheduledDate] = useState<string>('');
  const [rescheduleNotes, setRescheduleNotes] = useState<string>('');

  const fetchOrdersAndAgents = async () => {
    setError(null);
    try {
      const orderRes = await orderApi.getAll();
      setOrders(orderRes.data.orders || []);

      if (role === 'ADMIN') {
        const agentRes = await agentApi.getAll();
        setAgents(agentRes.data.agents || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dispatch data.');
    }
  };

  useEffect(() => {
    fetchOrdersAndAgents();

    const socket = io('/', { transports: ['websocket', 'polling'] });
    socket.emit('subscribe:admin');

    socket.on('order:created', () => fetchOrdersAndAgents());
    socket.on('order:assigned', () => fetchOrdersAndAgents());
    socket.on('order:status_updated', () => fetchOrdersAndAgents());

    return () => {
      socket.disconnect();
    };
  }, [role]);

  const handleAiParseAddress = async () => {
    if (!unstructuredAddressInput.trim()) return;
    setIsAiParsing(true);
    setError(null);
    try {
      const response = await aiApi.parseAddress(unstructuredAddressInput.trim());
      const res = response.data.result;
      if (res) {
        setDropStreet(res.street || dropStreet);
        setDropCity(res.city || dropCity);
        setDropPincode(res.pincode || dropPincode);
        if (res.inferredOrderType) {
          setOrderType(res.inferredOrderType);
        }
        setSuccessMsg(`AI Parsed Drop Address (${res.parsedVia})! Matched Zone: ${res.matchedZone?.name || 'NCR Core'}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'AI Address Parser error.');
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      const payload = {
        dimensions: { lengthCm, widthCm, heightCm },
        actualWeightKg,
        orderType,
        paymentType,
        codAmount: paymentType === 'COD' ? codAmount : 0,
        pickupAddress: {
          street: pickupStreet,
          city: pickupCity,
          pincode: pickupPincode,
          location: { coordinates: pickupCoords },
        },
        dropAddress: {
          street: dropStreet,
          city: dropCity,
          pincode: dropPincode,
          location: { coordinates: dropCoords },
        },
      };

      const response = await orderApi.create(payload);
      setSuccessMsg(`Order created successfully! Tracking ID: ${response.data.trackingId}`);
      setIsCreateModalOpen(false);
      await fetchOrdersAndAgents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create shipment order.');
    }
  };

  const handleAutoAssign = async (orderId: string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await orderApi.autoAssign(orderId);
      setSuccessMsg(response.data.message || 'Auto-assignment completed successfully!');
      await fetchOrdersAndAgents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Auto-assignment failed.');
    }
  };

  const handleManualAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningOrderId || !selectedAgentId) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await orderApi.manualAssign(assigningOrderId, selectedAgentId);
      setSuccessMsg('Agent manually assigned successfully!');
      setAssigningOrderId(null);
      await fetchOrdersAndAgents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Manual assignment failed.');
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingOrderId || !rescheduledDate) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await orderApi.reschedule(reschedulingOrderId, {
        rescheduledDate,
        notes: rescheduleNotes,
      });
      setSuccessMsg('Shipment rescheduled successfully and queued for re-assignment!');
      setReschedulingOrderId(null);
      await fetchOrdersAndAgents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reschedule failed.');
    }
  };

  return (
    <div className="space-y-6 font-mono">
      
      {/* Header Bar */}
      <div className="bg-white border-2 border-black neo-shadow p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-[#0052FF]" />
            <h1 className="text-xl font-extrabold text-black uppercase tracking-tight">
              DISPATCH COMMAND CENTER [OPS-01]
            </h1>
          </div>
          <p className="text-xs text-zinc-600 font-bold mt-1">
            REAL-TIME SOCKET.IO DISPATCH STREAM &bull; ROLE: <span className="text-[#0052FF] font-extrabold">{role || 'PUBLIC'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOrdersAndAgents}
            className="px-3.5 py-2 bg-white hover:bg-zinc-100 text-black border-2 border-black text-xs font-bold uppercase transition neo-shadow-sm flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>REFRESH STREAM</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-[#0052FF] hover:bg-[#0042D0] text-white border-2 border-black text-xs font-bold uppercase transition neo-shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>NEW SHIPMENT ORDER</span>
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

      {/* Orders Table Card */}
      <div className="bg-white border-2 border-black neo-shadow overflow-hidden">
        <div className="bg-black text-white px-5 py-3 flex items-center justify-between font-mono font-bold text-xs uppercase">
          <span>ACTIVE SYSTEM SHIPMENTS</span>
          <span>{orders.length} TOTAL SHIPMENTS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-100 text-black uppercase font-bold text-[11px] border-b-2 border-black">
              <tr>
                <th className="px-5 py-3">TRACKING ID</th>
                <th className="px-5 py-3">CUSTOMER</th>
                <th className="px-5 py-3">TYPE</th>
                <th className="px-5 py-3">CHARGE</th>
                <th className="px-5 py-3">STATUS</th>
                <th className="px-5 py-3">ASSIGNED AGENT</th>
                <th className="px-5 py-3 text-right">DISPATCH ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 border-b-2 border-black">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-zinc-500 font-bold">
                    No shipments found. Click 'NEW SHIPMENT ORDER' to create an order or run rate simulations.
                  </td>
                </tr>
              ) : (
                orders.map((o: any) => (
                  <tr key={o._id} className="hover:bg-zinc-50 transition">
                    <td className="px-5 py-3 font-bold text-[#0052FF]">
                      <Link to={`/track-search?code=${o.trackingId}`} className="hover:underline">
                        #{o.trackingId}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-extrabold text-black">{o.customer?.name || 'Customer'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 font-bold border border-black text-[10px] ${
                        o.orderType === 'B2B' ? 'bg-[#0052FF] text-white' : 'bg-black text-white'
                      }`}>
                        {o.orderType}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-extrabold text-black">
                      ₹{o.priceBreakdown?.totalCharge || 0}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 font-bold border-2 border-black text-[10px] neo-shadow-sm ${
                        o.status === 'DELIVERED'
                          ? 'bg-emerald-400 text-black'
                          : o.status === 'FAILED'
                          ? 'bg-red-500 text-white'
                          : o.status === 'OUT_FOR_DELIVERY'
                          ? 'bg-[#0052FF] text-white'
                          : 'bg-zinc-200 text-black'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-700 font-bold">
                      {o.assignedAgent ? o.assignedAgent.name : <span className="text-zinc-400">UNASSIGNED</span>}
                    </td>
                    <td className="px-5 py-3 text-right space-x-2">
                      {role === 'ADMIN' && !o.assignedAgent && o.status !== 'DELIVERED' && (
                        <>
                          <button
                            onClick={() => handleAutoAssign(o._id)}
                            className="px-2.5 py-1 bg-[#0052FF] hover:bg-[#0042D0] text-white border-2 border-black text-[10px] font-bold uppercase neo-shadow-sm transition"
                          >
                            ⚡ AUTO-ASSIGN
                          </button>
                          <button
                            onClick={() => setAssigningOrderId(o._id)}
                            className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-black border-2 border-black text-[10px] font-bold uppercase transition"
                          >
                            MANUAL ASSIGN
                          </button>
                        </>
                      )}

                      {o.status === 'FAILED' && (
                        <button
                          onClick={() => setReschedulingOrderId(o._id)}
                          className="px-2.5 py-1 bg-black hover:bg-zinc-800 text-white border-2 border-black text-[10px] font-bold uppercase neo-shadow-sm transition"
                        >
                          📅 RESCHEDULE
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Shipment Order Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
          <div className="bg-white border-2 border-black neo-shadow-lg max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <h3 className="text-sm font-extrabold text-black uppercase flex items-center gap-2">
                <Package className="w-5 h-5 text-[#0052FF]" />
                CREATE NEW LOGISTICS SHIPMENT ORDER
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-black font-bold p-1 border border-black hover:bg-zinc-100">✕</button>
            </div>

            {/* Agentic AI Unstructured Address Auto-Parse Box */}
            <div className="p-4 bg-zinc-100 border-2 border-black neo-shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0052FF] flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-4 h-4 text-[#0052FF] animate-pulse" />
                  AGENTIC AI ADDRESS PARSING (GEMINI 1.5 FLASH)
                </span>
                <span className="text-[10px] text-zinc-500 font-bold">UNSTRUCTURED INDIAN TEXT</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Opposite Apollo Pharmacy near Green Park metro, Delhi 110016"
                  value={unstructuredAddressInput}
                  onChange={(e) => setUnstructuredAddressInput(e.target.value)}
                  className="flex-1 bg-white border-2 border-black p-2 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
                />
                <button
                  type="button"
                  onClick={handleAiParseAddress}
                  disabled={isAiParsing}
                  className="px-3.5 py-2 bg-[#0052FF] hover:bg-[#0042D0] text-white border-2 border-black text-xs font-bold uppercase transition shrink-0 flex items-center gap-1 neo-shadow-sm"
                >
                  {isAiParsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'AI AUTO-FILL'}
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pickup Address */}
                <div className="p-3 bg-zinc-50 border-2 border-black space-y-2">
                  <span className="font-bold text-black block uppercase">PICKUP ADDRESS (ORIGIN)</span>
                  <input
                    type="text"
                    required
                    placeholder="Street Address"
                    value={pickupStreet}
                    onChange={(e) => setPickupStreet(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2 font-bold text-black"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={pickupCity}
                      onChange={(e) => setPickupCity(e.target.value)}
                      className="bg-white border-2 border-black p-2 font-bold text-black"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Pincode"
                      value={pickupPincode}
                      onChange={(e) => setPickupPincode(e.target.value)}
                      className="bg-white border-2 border-black p-2 font-bold text-black"
                    />
                  </div>
                </div>

                {/* Drop Address */}
                <div className="p-3 bg-zinc-50 border-2 border-black space-y-2">
                  <span className="font-bold text-black block uppercase">DROP ADDRESS (DESTINATION)</span>
                  <input
                    type="text"
                    required
                    placeholder="Street Address"
                    value={dropStreet}
                    onChange={(e) => setDropStreet(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2 font-bold text-black"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={dropCity}
                      onChange={(e) => setDropCity(e.target.value)}
                      className="bg-white border-2 border-black p-2 font-bold text-black"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Pincode"
                      value={dropPincode}
                      onChange={(e) => setDropPincode(e.target.value)}
                      className="bg-white border-2 border-black p-2 font-bold text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Dimensions & Weight */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-zinc-600 font-bold block mb-1">LENGTH (CM)</label>
                  <input
                    type="number"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Number(e.target.value))}
                    className="w-full bg-white border-2 border-black p-2 font-bold text-black"
                  />
                </div>
                <div>
                  <label className="text-zinc-600 font-bold block mb-1">WIDTH (CM)</label>
                  <input
                    type="number"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Number(e.target.value))}
                    className="w-full bg-white border-2 border-black p-2 font-bold text-black"
                  />
                </div>
                <div>
                  <label className="text-zinc-600 font-bold block mb-1">HEIGHT (CM)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full bg-white border-2 border-black p-2 font-bold text-black"
                  />
                </div>
                <div>
                  <label className="text-zinc-600 font-bold block mb-1">WEIGHT (KG)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={actualWeightKg}
                    onChange={(e) => setActualWeightKg(Number(e.target.value))}
                    className="w-full bg-white border-2 border-black p-2 font-bold text-black"
                  />
                </div>
              </div>

              {/* Order Type & Payment Terms */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-600 font-bold block mb-1">ORDER CATEGORY</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as any)}
                    className="w-full bg-white border-2 border-black p-2 font-extrabold text-black"
                  >
                    <option value="B2C">B2C RETAIL</option>
                    <option value="B2B">B2B COMMERCIAL</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-600 font-bold block mb-1">PAYMENT METHOD</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full bg-white border-2 border-black p-2 font-extrabold text-black"
                  >
                    <option value="PREPAID">PREPAID</option>
                    <option value="COD">COD CASH</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-zinc-100 text-black border-2 border-black font-bold text-xs uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0052FF] hover:bg-[#0042D0] text-white border-2 border-black font-bold text-xs uppercase neo-shadow-sm"
                >
                  CONFIRM & GENERATE WAYBILL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Agent Assignment Modal */}
      {assigningOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
          <div className="bg-white border-2 border-black neo-shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <h3 className="text-sm font-extrabold text-black uppercase flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#0052FF]" />
                MANUAL AGENT DISPATCH ASSIGNMENT
              </h3>
              <button onClick={() => setAssigningOrderId(null)} className="text-black font-bold p-1 border border-black">✕</button>
            </div>

            <form onSubmit={handleManualAssignSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-600 font-bold block mb-1">SELECT DELIVERY AGENT</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  required
                  className="w-full bg-white border-2 border-black p-2 font-bold text-black"
                >
                  <option value="">-- SELECT ACTIVE DELIVERY AGENT --</option>
                  {agents.map((a: any) => (
                    <option key={a._id} value={a.user?._id}>
                      {a.user?.name} ({a.status} &bull; ACTIVE: {a.currentActiveOrderCount}/{a.maxConcurrentOrders})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setAssigningOrderId(null)}
                  className="px-4 py-2 bg-white hover:bg-zinc-100 text-black border-2 border-black font-bold text-xs uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0052FF] hover:bg-[#0042D0] text-white border-2 border-black font-bold text-xs uppercase neo-shadow-sm"
                >
                  ASSIGN AGENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
          <div className="bg-white border-2 border-black neo-shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <h3 className="text-sm font-extrabold text-black uppercase flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-black" />
                RESCHEDULE FAILED SHIPMENT
              </h3>
              <button onClick={() => setReschedulingOrderId(null)} className="text-black font-bold p-1 border border-black">✕</button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-600 font-bold block mb-1">NEW DELIVERY DATE</label>
                <input
                  type="date"
                  required
                  value={rescheduledDate}
                  onChange={(e) => setRescheduledDate(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2 font-bold text-black"
                />
              </div>

              <div>
                <label className="text-zinc-600 font-bold block mb-1">RESCHEDULE INSTRUCTIONS / NOTES</label>
                <textarea
                  rows={3}
                  placeholder="Gate pass instructions or address corrections..."
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  className="w-full bg-white border-2 border-black p-3 font-bold text-black"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setReschedulingOrderId(null)}
                  className="px-4 py-2 bg-white hover:bg-zinc-100 text-black border-2 border-black font-bold text-xs uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0052FF] hover:bg-[#0042D0] text-white border-2 border-black font-bold text-xs uppercase neo-shadow-sm"
                >
                  COMMIT RESCHEDULE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

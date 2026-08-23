/**
 * Order Management & Admin Dispatch Command Center Page
 * -----------------------------------------------------
 * Central dispatch overview allowing Admins & Customers to create shipments,
 * trigger Agentic AI address parsing, execute auto-assignments, update order status,
 * reschedule failed deliveries, and view real-time Socket.io dispatch streams.
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
  const [dropCoords, setDropCoords] = useState<[number, number]>([77.0850, 28.4900]);

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

    // Socket.io Real-Time WebSockets Listener
    const socket = io('/', { transports: ['websocket', 'polling'] });
    socket.emit('subscribe:admin');

    socket.on('order:created', () => fetchOrdersAndAgents());
    socket.on('order:assigned', () => fetchOrdersAndAgents());
    socket.on('order:status_updated', () => fetchOrdersAndAgents());

    return () => {
      socket.disconnect();
    };
  }, [role]);

  // Agentic AI Unstructured Address Auto-Parse Handler
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
        if (res.coordinates) {
          setDropCoords(res.coordinates);
        }
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
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Order Management & Dispatch Center</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time Socket.io event stream &bull; Role: <span className="text-indigo-400 font-mono font-medium">{role || 'Public'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOrdersAndAgents}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Dispatch</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Shipment Order</span>
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

      {/* Orders Table Card */}
      <div className="bg-[#121215] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Active System Shipments</h2>
          <span className="text-xs text-zinc-500 font-mono">{orders.length} Total Shipments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/80 text-zinc-400 font-mono uppercase text-[10px] border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3">Tracking ID</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Charge</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Assigned Agent</th>
                <th className="px-5 py-3 text-right">Dispatch Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-zinc-500">
                    No shipments found. Click 'New Shipment Order' to create an order or run rate simulations.
                  </td>
                </tr>
              ) : (
                orders.map((o: any) => (
                  <tr key={o._id} className="hover:bg-zinc-900/40 transition">
                    <td className="px-5 py-3 font-mono font-bold text-indigo-400">
                      <Link to={`/track-search?code=${o.trackingId}`} className="hover:underline">
                        #{o.trackingId}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-medium text-white">{o.customer?.name || 'Customer'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        o.orderType === 'B2B' ? 'bg-purple-500/10 text-purple-400' : 'bg-indigo-500/10 text-indigo-400'
                      }`}>
                        {o.orderType}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-emerald-400">
                      ₹{o.priceBreakdown?.totalCharge || 0}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border ${
                        o.status === 'DELIVERED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : o.status === 'FAILED'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : o.status === 'OUT_FOR_DELIVERY'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-400 font-medium">
                      {o.assignedAgent ? o.assignedAgent.name : <span className="text-zinc-600 font-mono">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3 text-right space-x-2">
                      {role === 'ADMIN' && !o.assignedAgent && o.status !== 'DELIVERED' && (
                        <>
                          <button
                            onClick={() => handleAutoAssign(o._id)}
                            className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded text-[11px] font-semibold transition"
                          >
                            ⚡ Auto-Assign
                          </button>
                          <button
                            onClick={() => setAssigningOrderId(o._id)}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-semibold transition"
                          >
                            Manual Assign
                          </button>
                        </>
                      )}

                      {o.status === 'FAILED' && (
                        <button
                          onClick={() => setReschedulingOrderId(o._id)}
                          className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded text-[11px] font-semibold transition"
                        >
                          📅 Reschedule
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

      {/* New Shipment Order Creation Modal (with Agentic AI Address Auto-Parse) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                Create New Logistics Shipment Order
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            {/* Agentic AI Unstructured Address Auto-Parse Box */}
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  Agentic AI Address Parsing (Gemini 1.5 Flash)
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Unstructured Indian Text</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Opposite Apollo Pharmacy near Green Park metro, Delhi 110016"
                  value={unstructuredAddressInput}
                  onChange={(e) => setUnstructuredAddressInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAiParseAddress}
                  disabled={isAiParsing}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1"
                >
                  {isAiParsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'AI Auto-Fill'}
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pickup Address */}
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-2">
                  <span className="font-bold text-zinc-300">Pickup Address</span>
                  <input
                    type="text"
                    required
                    placeholder="Street Address"
                    value={pickupStreet}
                    onChange={(e) => setPickupStreet(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={pickupCity}
                      onChange={(e) => setPickupCity(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Pincode"
                      value={pickupPincode}
                      onChange={(e) => setPickupPincode(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                {/* Drop Address */}
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-2">
                  <span className="font-bold text-zinc-300">Drop Address</span>
                  <input
                    type="text"
                    required
                    placeholder="Street Address"
                    value={dropStreet}
                    onChange={(e) => setDropStreet(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={dropCity}
                      onChange={(e) => setDropCity(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Pincode"
                      value={dropPincode}
                      onChange={(e) => setDropPincode(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Dimensions & Weight */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1">Length (cm)</label>
                  <input
                    type="number"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Width (cm)</label>
                  <input
                    type="number"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={actualWeightKg}
                    onChange={(e) => setActualWeightKg(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              {/* Order Type & Payment Terms */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1">Order Category</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-semibold"
                  >
                    <option value="B2C">B2C Delivery</option>
                    <option value="B2B">B2B Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Payment Method</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-semibold"
                  >
                    <option value="PREPAID">PREPAID</option>
                    <option value="COD">COD Cash</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-lg shadow-indigo-600/20"
                >
                  Confirm & Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Agent Assignment Modal */}
      {assigningOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                Manual Agent Dispatch Assignment
              </h3>
              <button onClick={() => setAssigningOrderId(null)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleManualAssignSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Select Delivery Agent</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white font-medium"
                >
                  <option value="">-- Select Active Delivery Agent --</option>
                  {agents.map((a: any) => (
                    <option key={a._id} value={a.user?._id}>
                      {a.user?.name} ({a.status} &bull; Active: {a.currentActiveOrderCount}/{a.maxConcurrentOrders})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAssigningOrderId(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Assign Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                Reschedule Failed Shipment
              </h3>
              <button onClick={() => setReschedulingOrderId(null)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">New Delivery Date</label>
                <input
                  type="date"
                  required
                  value={rescheduledDate}
                  onChange={(e) => setRescheduledDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Reschedule Instructions / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Gate pass instructions or address corrections..."
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setReschedulingOrderId(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
                >
                  Commit Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

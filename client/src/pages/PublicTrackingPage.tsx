/**
 * Public Live Order Tracking & Event Audit Timeline Page
 * --------------------------------------------------------
 * Enables public customers to track shipments by tracking ID without login.
 * Subscribes to real-time Socket.io order channels (`order:${id}`), renders Leaflet route map,
 * progress stepper timeline, immutable event audit log table, and targeted failure reschedule workflows.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, Truck, CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import { io } from 'socket.io-client';
import { orderApi } from '../services/api';
import { ZoneMapVisualizer } from '../components/ZoneMapVisualizer';

export const PublicTrackingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { trackingId: pathTrackingId } = useParams();
  const navigate = useNavigate();

  const [inputTrackingId, setInputTrackingId] = useState<string>(
    pathTrackingId || searchParams.get('code') || ''
  );
  
  const [orderData, setOrderData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reschedule Form States (for FAILED orders)
  const [rescheduledDate, setRescheduledDate] = useState<string>('');
  const [updatedStreet, setUpdatedStreet] = useState<string>('');
  const [updatedPincode, setUpdatedPincode] = useState<string>('');
  const [updatedLng, setUpdatedLng] = useState<number>(77.0800);
  const [updatedLat, setUpdatedLat] = useState<number>(28.4700);
  const [switchPaymentToPrepaid, setSwitchPaymentToPrepaid] = useState<boolean>(false);
  const [rescheduleNotes, setRescheduleNotes] = useState<string>('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState<boolean>(false);

  const fetchTrackingDetails = async (targetCode: string) => {
    if (!targetCode.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await orderApi.trackByCode(targetCode.trim().toUpperCase());
      setOrderData(response.data.order);
      setAuditLogs(response.data.auditLogs || []);

      // Populate default reschedule address values if failed
      if (response.data.order?.dropAddress) {
        setUpdatedStreet(response.data.order.dropAddress.street || '');
        setUpdatedPincode(response.data.order.dropAddress.pincode || '');
        if (response.data.order.dropAddress.location?.coordinates) {
          setUpdatedLng(response.data.order.dropAddress.location.coordinates[0]);
          setUpdatedLat(response.data.order.dropAddress.location.coordinates[1]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tracking ID not found. Please check code.');
      setOrderData(null);
      setAuditLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const code = pathTrackingId || searchParams.get('code');
    if (code) {
      setInputTrackingId(code);
      fetchTrackingDetails(code);
    }
  }, [pathTrackingId, searchParams]);

  // Real-Time Socket.io Room Subscription for Order Live Updates
  useEffect(() => {
    if (!orderData?._id) return;

    const socket = io('/', { transports: ['websocket', 'polling'] });
    socket.emit('subscribe:order', orderData._id);

    socket.on('order:status_updated', () => {
      fetchTrackingDetails(orderData.trackingId);
    });

    socket.on('order:assigned', () => {
      fetchTrackingDetails(orderData.trackingId);
    });

    return () => {
      socket.emit('unsubscribe:order', orderData._id);
      socket.disconnect();
    };
  }, [orderData?._id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputTrackingId.trim()) {
      navigate(`/track-search?code=${inputTrackingId.trim().toUpperCase()}`);
    }
  };

  const handleCustomerRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderData?._id || !rescheduledDate) return;
    setIsSubmittingReschedule(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: any = {
        rescheduledDate,
        switchPaymentToPrepaid,
        notes: rescheduleNotes,
      };

      // Include updated drop address if modified
      if (updatedStreet && updatedLng && updatedLat) {
        payload.updatedDropAddress = {
          street: updatedStreet,
          city: orderData.dropAddress?.city || 'Gurgaon',
          pincode: updatedPincode || orderData.dropAddress?.pincode,
          location: { coordinates: [updatedLng, updatedLat] },
        };
      }

      await orderApi.reschedule(orderData._id, payload);
      setSuccessMsg('Delivery successfully rescheduled! Your shipment is re-queued with an agent.');
      await fetchTrackingDetails(orderData.trackingId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit reschedule request.');
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  const getStepStatusClass = (stepName: string) => {
    const statusOrder = ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    if (!orderData) return 'bg-zinc-800 text-zinc-500';
    
    if (orderData.status === 'FAILED') {
      return 'bg-red-500/20 text-red-400 border-red-500/40';
    }

    const currentIndex = statusOrder.indexOf(orderData.status);
    const stepIndex = statusOrder.indexOf(stepName);

    if (stepIndex <= currentIndex && currentIndex !== -1) {
      return 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30';
    }
    return 'bg-zinc-800 text-zinc-500 border border-zinc-700';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Tracking Search Hero Bar */}
      <div className="bg-[#121215] border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="w-6 h-6 text-indigo-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">Public Live Delivery Tracking Timeline</h1>
        </div>
        <p className="text-xs text-zinc-400">
          Enter your 10-character tracking ID code (e.g. <span className="font-mono text-indigo-400">DEL-984201-X</span>) to view live agent coordinates and audit history.
        </p>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Tracking ID (e.g. DEL-XXXXXX-X)"
            value={inputTrackingId}
            onChange={(e) => setInputTrackingId(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shrink-0 shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Track Order</span>
          </button>
        </form>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {orderData && (
        <div className="space-y-6">
          
          {/* Order Details Header Card */}
          <div className="bg-[#121215] border border-zinc-800 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <span className="text-xs text-zinc-500 font-mono">TRACKING CODE</span>
                <div className="text-2xl font-black text-white font-mono mt-0.5">#{orderData.trackingId}</div>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  orderData.status === 'DELIVERED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : orderData.status === 'FAILED'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                }`}>
                  STATUS: {orderData.status}
                </span>

                <span className="px-3 py-1 bg-zinc-800 text-zinc-300 font-mono text-xs rounded-full border border-zinc-700">
                  ₹{orderData.priceBreakdown?.totalCharge || 0} ({orderData.paymentType})
                </span>
              </div>
            </div>

            {/* Stepper Progress Bar Timeline */}
            <div className="space-y-2">
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider font-mono">Shipment Lifecycle Progression</span>
              <div className="grid grid-cols-5 gap-2 pt-2">
                {['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((step, idx) => (
                  <div key={step} className="flex flex-col items-center text-center space-y-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition ${getStepStatusClass(step)}`}>
                      {idx + 1}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono font-medium truncate w-full">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Driver Details */}
            {orderData.assignedAgent && (
              <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Assigned Driver: {orderData.assignedAgent.name}</div>
                    <div className="text-zinc-400 font-mono text-[11px]">Phone: {orderData.assignedAgent.phone || 'Contact via Dispatch'}</div>
                  </div>
                </div>
                <span className="text-emerald-400 font-mono text-[11px] font-semibold">Active Delivery Agent</span>
              </div>
            )}
          </div>

          {/* Interactive Route Map */}
          <div className="bg-[#121215] border border-zinc-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-400" />
                Live Spatial Map Route & Coordinates
              </span>
              <span className="font-mono text-indigo-400">Socket.io Channel Connected</span>
            </div>

            <ZoneMapVisualizer
              pickupCoords={orderData.pickupAddress?.location?.coordinates}
              dropCoords={orderData.dropAddress?.location?.coordinates}
              agentCoords={orderData.assignedAgent?.currentLocation?.coordinates}
              height="320px"
            />
          </div>

          {/* Targeted Failure Diagnostic Reschedule Card (for FAILED orders) */}
          {orderData.status === 'FAILED' && (
            <div className="bg-[#121215] border border-red-500/40 rounded-xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-sm pb-2 border-b border-red-500/20">
                <AlertTriangle className="w-5 h-5" />
                <span>Delivery Attempt Unsuccessful &bull; Reason: {orderData.failureReasonCode || 'UNSPECIFIED'}</span>
              </div>

              <p className="text-xs text-zinc-400">
                We were unable to deliver your package during the last attempt. Please select a new date below or update your drop address to re-queue delivery.
              </p>

              <form onSubmit={handleCustomerRescheduleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-300 block mb-1">New Delivery Date</label>
                    <input
                      type="date"
                      required
                      value={rescheduledDate}
                      onChange={(e) => setRescheduledDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>

                  {orderData.paymentType === 'COD' && (
                    <div className="flex items-center pt-5">
                      <label className="flex items-center space-x-2 text-amber-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={switchPaymentToPrepaid}
                          onChange={(e) => setSwitchPaymentToPrepaid(e.target.checked)}
                          className="accent-amber-500 rounded"
                        />
                        <span>Switch Payment from COD to PREPAID (Zero COD Fee)</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Optional Drop Address Correction */}
                {orderData.failureReasonCode === 'INCORRECT_ADDRESS' && (
                  <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
                    <span className="font-bold text-white block">Correct Drop Address Details</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-zinc-400 block mb-1">Street Address</label>
                        <input
                          type="text"
                          value={updatedStreet}
                          onChange={(e) => setUpdatedStreet(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-400 block mb-1">Pincode</label>
                        <input
                          type="text"
                          value={updatedPincode}
                          onChange={(e) => setUpdatedPincode(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-400 block mb-1">Longitude / Latitude</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            step="0.0001"
                            value={updatedLng}
                            onChange={(e) => setUpdatedLng(Number(e.target.value))}
                            className="w-1/2 bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-white font-mono"
                          />
                          <input
                            type="number"
                            step="0.0001"
                            value={updatedLat}
                            onChange={(e) => setUpdatedLat(Number(e.target.value))}
                            className="w-1/2 bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-zinc-300 block mb-1">Delivery Access Notes / Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="Gate pass instructions, landmark, or contact numbers..."
                    value={rescheduleNotes}
                    onChange={(e) => setRescheduleNotes(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReschedule}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition shadow-lg shadow-amber-600/20"
                >
                  {isSubmittingReschedule ? 'Re-queueing Shipment...' : '📅 Commit Reschedule & Re-assign Agent'}
                </button>
              </form>
            </div>
          )}

          {/* Immutable Event Audit Log Ledger Table */}
          <div className="bg-[#121215] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Immutable Event Audit Log History
              </h2>
              <span className="text-xs text-zinc-500 font-mono">{auditLogs.length} Audit Entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-900/80 text-zinc-400 font-mono uppercase text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">Action Event</th>
                    <th className="px-5 py-3">Actor Role</th>
                    <th className="px-5 py-3">Status Transition</th>
                    <th className="px-5 py-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-zinc-500">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log: any) => (
                      <tr key={log._id} className="hover:bg-zinc-900/40 transition">
                        <td className="px-5 py-3 font-mono text-zinc-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 font-mono font-bold text-indigo-400">
                          {log.action}
                        </td>
                        <td className="px-5 py-3 font-mono text-zinc-300">
                          {log.actorRole}
                        </td>
                        <td className="px-5 py-3 font-mono text-emerald-400">
                          {log.previousStatus ? `${log.previousStatus} ➔ ${log.newStatus}` : log.newStatus}
                        </td>
                        <td className="px-5 py-3 font-mono text-zinc-500">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

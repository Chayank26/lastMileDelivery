/**
 * Public Live Order Tracking & Event Audit Timeline Page (Technical Blueprint Theme)
 * ----------------------------------------------------------------------------------
 * Enables public customers to track shipments by tracking ID without login.
 * Subscribes to real-time Socket.io channels, renders Leaflet route map, progress stepper,
 * immutable event audit log table, and targeted failure reschedule forms.
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

  useEffect(() => {
    if (!orderData?._id) return;

    const socket = io('/', { transports: ['websocket', 'polling'] });
    socket.emit('subscribe:order', orderData._id);

    socket.on('order:status_updated', () => fetchTrackingDetails(orderData.trackingId));
    socket.on('order:assigned', () => fetchTrackingDetails(orderData.trackingId));

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
    if (!orderData) return 'bg-zinc-200 text-zinc-500 border-2 border-black';
    
    if (orderData.status === 'FAILED') {
      return 'bg-red-600 text-white font-bold border-2 border-black';
    }

    const currentIndex = statusOrder.indexOf(orderData.status);
    const stepIndex = statusOrder.indexOf(stepName);

    if (stepIndex <= currentIndex && currentIndex !== -1) {
      return 'bg-[#0052FF] text-white font-extrabold border-2 border-black neo-shadow-sm';
    }
    return 'bg-zinc-100 text-zinc-500 border-2 border-black';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono">
      
      {/* Tracking Search Hero Bar */}
      <div className="bg-white border-2 border-black neo-shadow p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="w-6 h-6 text-[#0052FF]" />
          <h1 className="text-xl font-extrabold text-black uppercase tracking-tight">
            PUBLIC LIVE DELIVERY TRACKING TIMELINE [TIMELINE-01]
          </h1>
        </div>
        <p className="text-xs text-zinc-600 font-bold">
          ENTER YOUR 10-CHARACTER TRACKING ID CODE (e.g. <span className="text-[#0052FF] font-extrabold">DEL-984201-X</span>) TO VIEW LIVE AGENT COORDINATES AND IMMUTABLE AUDIT LOGS.
        </p>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Tracking ID (e.g. DEL-XXXXXX-X)"
            value={inputTrackingId}
            onChange={(e) => setInputTrackingId(e.target.value)}
            className="flex-1 bg-white border-2 border-black p-2.5 text-sm text-black font-extrabold uppercase focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-[#0052FF] hover:bg-[#0042D0] text-white border-2 border-black text-xs font-extrabold uppercase transition shrink-0 neo-shadow-sm flex items-center gap-1.5"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>TRACK SHIPMENT</span>
          </button>
        </form>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-100 border-2 border-black text-red-700 text-xs font-bold neo-shadow-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-100 border-2 border-black text-emerald-800 text-xs font-bold neo-shadow-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {orderData && (
        <div className="space-y-6">
          
          {/* Order Details Header Card */}
          <div className="bg-white border-2 border-black neo-shadow p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
              <div>
                <span className="text-xs text-zinc-500 font-bold uppercase">TRACKING CODE</span>
                <div className="text-2xl font-black text-black mt-0.5">#{orderData.trackingId}</div>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 text-xs font-extrabold border-2 border-black uppercase neo-shadow-sm ${
                  orderData.status === 'DELIVERED'
                    ? 'bg-emerald-400 text-black'
                    : orderData.status === 'FAILED'
                    ? 'bg-red-600 text-white'
                    : 'bg-[#0052FF] text-white'
                }`}>
                  STATUS: {orderData.status}
                </span>

                <span className="px-3 py-1 bg-black text-white font-extrabold text-xs border-2 border-black">
                  ₹{orderData.priceBreakdown?.totalCharge || 0} ({orderData.paymentType})
                </span>
              </div>
            </div>

            {/* Stepper Progress Bar Timeline */}
            <div className="space-y-2">
              <span className="text-xs text-zinc-600 font-extrabold uppercase tracking-wider">SHIPMENT LIFECYCLE PROGRESSION</span>
              <div className="grid grid-cols-5 gap-2 pt-2">
                {['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((step, idx) => (
                  <div key={step} className="flex flex-col items-center text-center space-y-1.5">
                    <div className={`w-9 h-9 flex items-center justify-center text-xs font-extrabold transition ${getStepStatusClass(step)}`}>
                      {idx + 1}
                    </div>
                    <span className="text-[10px] text-black font-extrabold truncate w-full">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Driver Details */}
            {orderData.assignedAgent && (
              <div className="p-4 bg-zinc-100 border-2 border-black flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#0052FF] text-white border border-black">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-black">ASSIGNED DRIVER: {orderData.assignedAgent.name}</div>
                    <div className="text-zinc-600 text-[11px] font-bold">PHONE: {orderData.assignedAgent.phone || 'Contact via Dispatch'}</div>
                  </div>
                </div>
                <span className="text-emerald-700 font-extrabold text-[11px]">ACTIVE DELIVERY AGENT</span>
              </div>
            )}
          </div>

          {/* Interactive Route Map */}
          <div className="bg-white border-2 border-black neo-shadow p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-black font-bold px-1">
              <span className="flex items-center gap-1.5 font-extrabold uppercase">
                <MapPin className="w-4 h-4 text-[#0052FF]" />
                LIVE SPATIAL MAP ROUTE & COORDINATES
              </span>
              <span className="bg-[#0052FF] text-white px-2 py-0.5 border border-black font-bold uppercase">SOCKET.IO CONNECTED</span>
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
            <div className="bg-red-50 border-2 border-black neo-shadow p-6 space-y-4">
              <div className="flex items-center space-x-2 text-red-700 font-extrabold text-sm pb-2 border-b-2 border-black">
                <AlertTriangle className="w-5 h-5" />
                <span>DELIVERY ATTEMPT UNSUCCESSFUL &bull; REASON: {orderData.failureReasonCode || 'UNSPECIFIED'}</span>
              </div>

              <p className="text-xs text-zinc-700 font-bold">
                WE WERE UNABLE TO DELIVER YOUR PACKAGE DURING THE LAST ATTEMPT. PLEASE SELECT A NEW DATE BELOW OR UPDATE DROP ADDRESS TO RE-QUEUE DELIVERY.
              </p>

              <form onSubmit={handleCustomerRescheduleSubmit} className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-black font-bold block mb-1">NEW DELIVERY DATE</label>
                    <input
                      type="date"
                      required
                      value={rescheduledDate}
                      onChange={(e) => setRescheduledDate(e.target.value)}
                      className="w-full bg-white border-2 border-black p-2 font-bold text-black"
                    />
                  </div>

                  {orderData.paymentType === 'COD' && (
                    <div className="flex items-center pt-5">
                      <label className="flex items-center space-x-2 text-black font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={switchPaymentToPrepaid}
                          onChange={(e) => setSwitchPaymentToPrepaid(e.target.checked)}
                          className="accent-black w-4 h-4 border-2 border-black"
                        />
                        <span>SWITCH PAYMENT FROM COD TO PREPAID (ZERO COD FEE)</span>
                      </label>
                    </div>
                  )}
                </div>

                {orderData.failureReasonCode === 'INCORRECT_ADDRESS' && (
                  <div className="p-4 bg-white border-2 border-black space-y-3">
                    <span className="font-extrabold text-black block uppercase">CORRECT DROP ADDRESS DETAILS</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-zinc-600 block mb-1">STREET ADDRESS</label>
                        <input
                          type="text"
                          value={updatedStreet}
                          onChange={(e) => setUpdatedStreet(e.target.value)}
                          className="w-full bg-white border-2 border-black p-2 font-bold text-black"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-600 block mb-1">PINCODE</label>
                        <input
                          type="text"
                          value={updatedPincode}
                          onChange={(e) => setUpdatedPincode(e.target.value)}
                          className="w-full bg-white border-2 border-black p-2 font-bold text-black"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-600 block mb-1">LONGITUDE / LATITUDE</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            step="0.0001"
                            value={updatedLng}
                            onChange={(e) => setUpdatedLng(Number(e.target.value))}
                            className="w-1/2 bg-white border-2 border-black p-2 font-bold text-black"
                          />
                          <input
                            type="number"
                            step="0.0001"
                            value={updatedLat}
                            onChange={(e) => setUpdatedLat(Number(e.target.value))}
                            className="w-1/2 bg-white border-2 border-black p-2 font-bold text-black"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-black font-bold block mb-1">DELIVERY ACCESS NOTES / INSTRUCTIONS</label>
                  <textarea
                    rows={2}
                    placeholder="Gate pass instructions, landmark, or contact numbers..."
                    value={rescheduleNotes}
                    onChange={(e) => setRescheduleNotes(e.target.value)}
                    className="w-full bg-white border-2 border-black p-3 font-bold text-black"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReschedule}
                  className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white font-extrabold text-xs uppercase border-2 border-black neo-shadow transition"
                >
                  {isSubmittingReschedule ? 'Re-queueing Shipment...' : '📅 COMMIT RESCHEDULE & RE-ASSIGN AGENT'}
                </button>
              </form>
            </div>
          )}

          {/* Immutable Event Audit Log Ledger Table */}
          <div className="bg-white border-2 border-black neo-shadow overflow-hidden">
            <div className="bg-black text-white px-5 py-3 border-b-2 border-black flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0052FF]" />
                IMMUTABLE EVENT AUDIT LOG HISTORY
              </h2>
              <span className="text-xs text-zinc-400 font-bold">{auditLogs.length} AUDIT ENTRIES</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-100 text-black uppercase font-bold text-[11px] border-b-2 border-black">
                  <tr>
                    <th className="px-5 py-3">TIMESTAMP</th>
                    <th className="px-5 py-3">ACTION EVENT</th>
                    <th className="px-5 py-3">ACTOR ROLE</th>
                    <th className="px-5 py-3">STATUS TRANSITION</th>
                    <th className="px-5 py-3">IP ADDRESS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 border-b-2 border-black">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-zinc-500 font-bold">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log: any) => (
                      <tr key={log._id} className="hover:bg-zinc-50 transition">
                        <td className="px-5 py-3 font-bold text-zinc-600">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 font-extrabold text-[#0052FF]">
                          {log.action}
                        </td>
                        <td className="px-5 py-3 font-bold text-black">
                          {log.actorRole}
                        </td>
                        <td className="px-5 py-3 font-bold text-emerald-700">
                          {log.previousStatus ? `${log.previousStatus} ➔ ${log.newStatus}` : log.newStatus}
                        </td>
                        <td className="px-5 py-3 font-bold text-zinc-500">
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

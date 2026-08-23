/**
 * Delivery Agent Duty Console & Driver Dashboard Page (Technical Blueprint Theme)
 * ---------------------------------------------------------------------------------
 * Mobile-responsive duty dashboard for delivery drivers with high-contrast sharp borders,
 * live telemetry broadcasting, and failure diagnostic modals.
 */

import React, { useState, useEffect } from 'react';
import { Truck, Navigation, CheckCircle2, AlertTriangle, ShieldAlert, Package } from 'lucide-react';
import { orderApi, agentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AgentDutyConsolePage: React.FC = () => {
  const { user, role } = useAuth();
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [agentStatus, setAgentStatus] = useState<string>('IDLE');
  const [longitude, setLongitude] = useState<number>(77.0800);
  const [latitude, setLatitude] = useState<number>(28.4595);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Failure Modal State
  const [failedOrderId, setFailedOrderId] = useState<string | null>(null);
  const [failureReasonCode, setFailureReasonCode] = useState<string>('CUSTOMER_UNAVAILABLE');
  const [failureNotes, setFailureNotes] = useState<string>('');

  const fetchAgentDutyData = async () => {
    setError(null);
    try {
      const response = await orderApi.getAll();
      const allOrders = response.data.orders || [];
      
      const myOrders = allOrders.filter(
        (o: any) => o.assignedAgent && o.assignedAgent._id === user?.id
      );
      setAssignedOrders(myOrders);

      const agentRes = await agentApi.getAll();
      const meProfile = agentRes.data.agents?.find((a: any) => a.user?._id === user?.id);
      if (meProfile) {
        setAgentStatus(meProfile.status || 'IDLE');
        if (meProfile.currentLocation?.coordinates) {
          setLongitude(meProfile.currentLocation.coordinates[0]);
          setLatitude(meProfile.currentLocation.coordinates[1]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch agent duty data.');
    }
  };

  useEffect(() => {
    if (user && role === 'AGENT') {
      fetchAgentDutyData();
    }
  }, [user, role]);

  const handleUpdateStatusAndLocation = async (newStatus?: string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const targetStatus = newStatus || agentStatus;
      await agentApi.updateStatus({
        longitude,
        latitude,
        status: targetStatus,
      });
      setAgentStatus(targetStatus);
      setSuccessMsg('Agent location and duty status broadcasted successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update agent status.');
    }
  };

  const handleTransitionOrderStatus = async (orderId: string, nextStatus: string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      await orderApi.updateStatus(orderId, { status: nextStatus });
      setSuccessMsg(`Order transitioned to '${nextStatus}' successfully!`);
      await fetchAgentDutyData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  const handleReportDeliveryFailure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failedOrderId) return;
    setError(null);
    setSuccessMsg(null);

    try {
      await orderApi.updateStatus(failedOrderId, {
        status: 'FAILED',
        failureReasonCode,
        notes: failureNotes,
      });
      setSuccessMsg(`Delivery attempt marked FAILED (${failureReasonCode}). Customer notified for reschedule.`);
      setFailedOrderId(null);
      setFailureNotes('');
      await fetchAgentDutyData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to report delivery failure.');
    }
  };

  if (role !== 'AGENT') {
    return (
      <div className="p-8 text-center bg-white border-2 border-black neo-shadow space-y-3 font-mono">
        <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
        <h2 className="text-lg font-extrabold text-black uppercase">AGENT CONSOLE ACCESS ONLY</h2>
        <p className="text-xs text-zinc-600 font-bold">Please switch to an AGENT role using the demo bar below to view this duty console.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-mono">
      
      {/* Header Bar */}
      <div className="bg-white border-2 border-black neo-shadow p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Truck className="w-6 h-6 text-[#0052FF]" />
            <h1 className="text-xl font-extrabold text-black uppercase tracking-tight">
              DELIVERY AGENT DUTY CONSOLE [DRIVER-01]
            </h1>
          </div>
          <p className="text-xs text-zinc-600 font-bold mt-1">
            DRIVER: <span className="text-black uppercase">{user?.name}</span> &bull; PHONE: <span className="text-black font-extrabold">{user?.phone}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-[#0052FF] text-white border-2 border-black text-xs font-mono font-extrabold uppercase neo-shadow-sm">
            STATUS: {agentStatus}
          </span>
        </div>
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

      {/* Driver Location & Duty Control Card */}
      <div className="bg-white border-2 border-black neo-shadow overflow-hidden">
        <div className="bg-black text-white px-4 py-2 text-xs font-bold uppercase flex justify-between items-center">
          <span>GPS POSITION & DUTY STATUS TELEMETRY</span>
          <Navigation className="w-4 h-4 text-[#0052FF]" />
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
            <div>
              <label className="text-zinc-600 block mb-1">LONGITUDE</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                className="w-full bg-white border-2 border-black p-2 font-bold text-black"
              />
            </div>

            <div>
              <label className="text-zinc-600 block mb-1">LATITUDE</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="w-full bg-white border-2 border-black p-2 font-bold text-black"
              />
            </div>

            <div>
              <label className="text-zinc-600 block mb-1">DUTY STATUS</label>
              <select
                value={agentStatus}
                onChange={(e) => {
                  setAgentStatus(e.target.value);
                  handleUpdateStatusAndLocation(e.target.value);
                }}
                className="w-full bg-white border-2 border-black p-2 font-extrabold text-black"
              >
                <option value="IDLE">IDLE (AVAILABLE)</option>
                <option value="EN_ROUTE_PICKUP">EN_ROUTE_PICKUP</option>
                <option value="IN_TRANSIT">IN_TRANSIT</option>
                <option value="MAX_CAPACITY">MAX_CAPACITY (LOCKED)</option>
                <option value="OFF_DUTY">OFF_DUTY</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => handleUpdateStatusAndLocation()}
            className="w-full py-2.5 bg-[#0052FF] hover:bg-[#0042D0] text-white border-2 border-black font-extrabold text-xs uppercase neo-shadow-sm transition"
          >
            📡 BROADCAST CURRENT LOCATION COORDINATES TO ADMIN DISPATCH
          </button>
        </div>
      </div>

      {/* Active Assigned Shipments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between font-mono">
          <h2 className="text-sm font-extrabold text-black uppercase flex items-center gap-2">
            <Package className="w-4 h-4 text-[#0052FF]" />
            ASSIGNED DELIVERY SHIPMENTS ({assignedOrders.length})
          </h2>
          <button
            onClick={fetchAgentDutyData}
            className="text-xs font-bold text-[#0052FF] hover:underline uppercase"
          >
            REFRESH DUTY LIST
          </button>
        </div>

        {assignedOrders.length === 0 ? (
          <div className="p-8 text-center bg-white border-2 border-black neo-shadow text-zinc-500 font-bold text-xs uppercase">
            No active shipments currently assigned. Click 'Auto-Assign' on the Orders page or wait for Admin dispatch.
          </div>
        ) : (
          assignedOrders.map((order: any) => (
            <div key={order._id} className="bg-white border-2 border-black neo-shadow overflow-hidden p-5 space-y-4 font-mono">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b-2 border-black">
                <div>
                  <span className="text-xs text-[#0052FF] font-extrabold">#{order.trackingId}</span>
                  <div className="text-sm font-black text-black mt-0.5 uppercase">
                    CUSTOMER: {order.customer?.name || 'Assigned Customer'}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 text-[10px] font-extrabold bg-black text-white border border-black uppercase">
                    {order.status}
                  </span>
                  <span className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-400 text-black border border-black uppercase">
                    ₹{order.priceBreakdown?.totalCharge || 0}
                  </span>
                </div>
              </div>

              {/* Delivery Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-zinc-50 border-2 border-black space-y-1">
                  <div className="text-zinc-500 font-bold text-[10px] uppercase">PICKUP ADDRESS (ORIGIN)</div>
                  <div className="text-black font-bold">{order.pickupAddress?.street}, {order.pickupAddress?.city}</div>
                  <div className="text-zinc-600 font-bold text-[10px]">PINCODE: {order.pickupAddress?.pincode}</div>
                </div>

                <div className="p-3 bg-zinc-50 border-2 border-black space-y-1">
                  <div className="text-zinc-500 font-bold text-[10px] uppercase">DROP ADDRESS (DESTINATION)</div>
                  <div className="text-black font-bold">{order.dropAddress?.street}, {order.dropAddress?.city}</div>
                  <div className="text-zinc-600 font-bold text-[10px]">PINCODE: {order.dropAddress?.pincode}</div>
                  {order.dropAddress?.landmark && (
                    <div className="text-[#0052FF] font-bold text-[10px]">LANDMARK: {order.dropAddress.landmark}</div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Status Lifecycle Transitions */}
              <div className="pt-2 border-t-2 border-black flex flex-wrap items-center gap-2">
                {order.status === 'CREATED' && (
                  <button
                    onClick={() => handleTransitionOrderStatus(order._id, 'PICKED_UP')}
                    className="px-3 py-1.5 bg-[#0052FF] hover:bg-[#0042D0] text-white border-2 border-black text-xs font-bold uppercase neo-shadow-sm transition"
                  >
                    📦 MARK PACKAGE PICKED UP
                  </button>
                )}

                {order.status === 'PICKED_UP' && (
                  <button
                    onClick={() => handleTransitionOrderStatus(order._id, 'IN_TRANSIT')}
                    className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white border-2 border-black text-xs font-bold uppercase neo-shadow-sm transition"
                  >
                    🚚 MARK IN-TRANSIT
                  </button>
                )}

                {['PICKED_UP', 'IN_TRANSIT'].includes(order.status) && (
                  <button
                    onClick={() => handleTransitionOrderStatus(order._id, 'OUT_FOR_DELIVERY')}
                    className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white border-2 border-black text-xs font-bold uppercase neo-shadow-sm transition"
                  >
                    🛵 MARK OUT FOR DELIVERY
                  </button>
                )}

                {order.status === 'OUT_FOR_DELIVERY' && (
                  <>
                    <button
                      onClick={() => handleTransitionOrderStatus(order._id, 'DELIVERED')}
                      className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black border-2 border-black text-xs font-extrabold uppercase neo-shadow-sm transition"
                    >
                      🎉 MARK PACKAGE DELIVERED
                    </button>

                    <button
                      onClick={() => setFailedOrderId(order._id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white border-2 border-black text-xs font-bold uppercase neo-shadow-sm transition"
                    >
                      ⚠️ REPORT DELIVERY FAILURE
                    </button>
                  </>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* Failure Reporting Modal */}
      {failedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
          <div className="bg-white border-2 border-black neo-shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <h3 className="text-sm font-extrabold text-black uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                REPORT DELIVERY FAILURE DIAGNOSTICS
              </h3>
              <button onClick={() => setFailedOrderId(null)} className="text-black font-bold p-1 border border-black">✕</button>
            </div>

            <form onSubmit={handleReportDeliveryFailure} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-600 font-bold block mb-1">SELECT FAILURE REASON CODE</label>
                <select
                  value={failureReasonCode}
                  onChange={(e) => setFailureReasonCode(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2 font-extrabold text-black"
                >
                  <option value="CUSTOMER_UNAVAILABLE">CUSTOMER_UNAVAILABLE (DOORBELL UNANSWERED)</option>
                  <option value="INCORRECT_ADDRESS">INCORRECT_ADDRESS (WRONG STREET / PINCODE)</option>
                  <option value="CASH_UNAVAILABLE_COD">CASH_UNAVAILABLE_COD (REFUSED / INSUFFICIENT CASH)</option>
                  <option value="ACCESS_RESTRICTED">ACCESS_RESTRICTED (SECURITY GATE / NO PASS)</option>
                  <option value="OTHER">OTHER (VEHICLE BREAKDOWN / WEATHER)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-600 font-bold block mb-1">DRIVER NOTES / OBSERVATIONS</label>
                <textarea
                  rows={3}
                  placeholder="Provide brief diagnostic notes for customer reschedule..."
                  value={failureNotes}
                  onChange={(e) => setFailureNotes(e.target.value)}
                  className="w-full bg-white border-2 border-black p-3 font-bold text-black"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setFailedOrderId(null)}
                  className="px-4 py-2 bg-white hover:bg-zinc-100 text-black border-2 border-black font-bold text-xs uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white border-2 border-black font-bold text-xs uppercase neo-shadow-sm"
                >
                  COMMIT DELIVERY FAILURE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

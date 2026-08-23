/**
 * Delivery Agent Duty Console & Driver Dashboard Page
 * ----------------------------------------------------
 * Mobile-responsive duty dashboard for delivery drivers.
 * Allows updating active duty status (IDLE, EN_ROUTE_PICKUP, IN_TRANSIT, OFF_DUTY),
 * streaming live GPS coordinates, and marking shipment status transitions (PICKED_UP, OUT_FOR_DELIVERY, DELIVERED, FAILED).
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
      // Fetch orders assigned to current agent
      const response = await orderApi.getAll();
      const allOrders = response.data.orders || [];
      
      // Filter for orders assigned to this agent or active orders
      const myOrders = allOrders.filter(
        (o: any) => o.assignedAgent && o.assignedAgent._id === user?.id
      );
      setAssignedOrders(myOrders);

      // Fetch agent profiles
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
      <div className="p-8 text-center bg-[#121215] border border-amber-500/30 rounded-xl space-y-3">
        <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Agent Console Access Only</h2>
        <p className="text-xs text-zinc-400">Please switch to an AGENT role using the demo bar below to view this duty console.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <Truck className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Delivery Agent Duty Console</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Driver: <span className="text-white font-medium">{user?.name}</span> &bull; Phone: <span className="font-mono text-zinc-300">{user?.phone}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono rounded-lg">
            Duty Status: {agentStatus}
          </span>
        </div>
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

      {/* Driver Location & Duty Control Card */}
      <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-amber-400" />
            GPS Position & Duty Status Controls
          </span>
          <span className="text-xs text-zinc-500 font-mono">Live WebSockets Telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={longitude}
              onChange={(e) => setLongitude(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={latitude}
              onChange={(e) => setLatitude(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Duty Status</label>
            <select
              value={agentStatus}
              onChange={(e) => {
                setAgentStatus(e.target.value);
                handleUpdateStatusAndLocation(e.target.value);
              }}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-amber-400 font-semibold"
            >
              <option value="IDLE">IDLE (Available)</option>
              <option value="EN_ROUTE_PICKUP">EN_ROUTE_PICKUP</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="MAX_CAPACITY">MAX_CAPACITY (Locked)</option>
              <option value="OFF_DUTY">OFF_DUTY</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => handleUpdateStatusAndLocation()}
          className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-amber-600/20"
        >
          📡 Broadcast Current Location Coordinates to Admin Dispatch
        </button>
      </div>

      {/* Active Assigned Shipments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-400" />
            Assigned Delivery Shipments ({assignedOrders.length})
          </h2>
          <button
            onClick={fetchAgentDutyData}
            className="text-xs text-indigo-400 hover:underline"
          >
            Refresh Duty List
          </button>
        </div>

        {assignedOrders.length === 0 ? (
          <div className="p-8 text-center bg-[#121215] border border-zinc-800 rounded-xl text-zinc-500 text-xs">
            No active shipments currently assigned. Click 'Auto-Assign' on the Orders page or wait for Admin dispatch.
          </div>
        ) : (
          assignedOrders.map((order: any) => (
            <div key={order._id} className="bg-[#121215] border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                <div>
                  <span className="text-xs font-mono text-indigo-400 font-bold">#{order.trackingId}</span>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    Customer: {order.customer?.name || 'Assigned Customer'}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 text-[10px] font-mono font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {order.status}
                  </span>
                  <span className="px-2.5 py-1 text-[10px] font-mono font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ₹{order.priceBreakdown?.totalCharge || 0}
                  </span>
                </div>
              </div>

              {/* Delivery Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                  <div className="text-zinc-500 font-mono font-semibold text-[10px]">PICKUP ADDRESS</div>
                  <div className="text-zinc-200">{order.pickupAddress?.street}, {order.pickupAddress?.city}</div>
                  <div className="text-zinc-400 font-mono text-[10px]">Pincode: {order.pickupAddress?.pincode}</div>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                  <div className="text-zinc-500 font-mono font-semibold text-[10px]">DROP ADDRESS</div>
                  <div className="text-zinc-200">{order.dropAddress?.street}, {order.dropAddress?.city}</div>
                  <div className="text-zinc-400 font-mono text-[10px]">Pincode: {order.dropAddress?.pincode}</div>
                  {order.dropAddress?.landmark && (
                    <div className="text-amber-400 text-[10px]">Landmark: {order.dropAddress.landmark}</div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Status Lifecycle Transitions */}
              <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center gap-2">
                {order.status === 'CREATED' && (
                  <button
                    onClick={() => handleTransitionOrderStatus(order._id, 'PICKED_UP')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    📦 Mark Package Picked Up
                  </button>
                )}

                {order.status === 'PICKED_UP' && (
                  <button
                    onClick={() => handleTransitionOrderStatus(order._id, 'IN_TRANSIT')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    🚚 Mark In-Transit
                  </button>
                )}

                {['PICKED_UP', 'IN_TRANSIT'].includes(order.status) && (
                  <button
                    onClick={() => handleTransitionOrderStatus(order._id, 'OUT_FOR_DELIVERY')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    🛵 Mark Out for Delivery
                  </button>
                )}

                {order.status === 'OUT_FOR_DELIVERY' && (
                  <>
                    <button
                      onClick={() => handleTransitionOrderStatus(order._id, 'DELIVERED')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                      🎉 Mark Package Delivered
                    </button>

                    <button
                      onClick={() => setFailedOrderId(order._id)}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 rounded-lg text-xs font-semibold transition"
                    >
                      ⚠️ Report Delivery Failure
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Report Delivery Failure Diagnostics
              </h3>
              <button onClick={() => setFailedOrderId(null)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleReportDeliveryFailure} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Select Failure Reason Code</label>
                <select
                  value={failureReasonCode}
                  onChange={(e) => setFailureReasonCode(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-red-400 font-semibold"
                >
                  <option value="CUSTOMER_UNAVAILABLE">CUSTOMER_UNAVAILABLE (Doorbell Unanswered)</option>
                  <option value="INCORRECT_ADDRESS">INCORRECT_ADDRESS (Wrong Street / Pincode)</option>
                  <option value="CASH_UNAVAILABLE_COD">CASH_UNAVAILABLE_COD (Refused / Insufficient COD Cash)</option>
                  <option value="ACCESS_RESTRICTED">ACCESS_RESTRICTED (Security Gate / No Pass)</option>
                  <option value="OTHER">OTHER (Vehicle Breakdown / Adverse Weather)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Driver Notes / Observations</label>
                <textarea
                  rows={3}
                  placeholder="Provide brief diagnostic notes for customer reschedule..."
                  value={failureNotes}
                  onChange={(e) => setFailureNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setFailedOrderId(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold"
                >
                  Commit Delivery Failure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

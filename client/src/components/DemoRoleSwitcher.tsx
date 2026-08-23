/**
 * Persistent Evaluator Demo Role Switcher Bottom Dock
 * ---------------------------------------------------
 * Floating bottom bar allowing evaluators to switch between Admin, Agent,
 * and Customer roles with 1-click execution for rapid evaluation.
 */

import React, { useState } from 'react';
import { ShieldCheck, Truck, Building, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useAuth, RoleType } from '../context/AuthContext';

export const DemoRoleSwitcher: React.FC = () => {
  const { role, demoLogin, isLoading } = useAuth();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const handleRoleSwitch = async (targetRole: RoleType) => {
    if (role === targetRole) return;
    try {
      await demoLogin(targetRole);
    } catch (error) {
      console.error('❌ Failed to switch demo role:', error);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] sm:w-auto">
      <div className="bg-[#121215]/95 border border-indigo-500/30 rounded-2xl shadow-2xl backdrop-blur-xl p-3 space-y-2">
        
        {/* Dock Header & Collapse Toggle */}
        <div className="flex items-center justify-between px-2 text-xs">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="font-semibold text-white tracking-wide">Evaluator Demo Switcher</span>
            <span className="hidden sm:inline-block text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full font-mono">
              Current: {role || 'GUEST'}
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-zinc-400 hover:text-white p-1 rounded-md transition"
            title={isExpanded ? 'Minimize Switcher' : 'Expand Switcher'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Expandable Role Selection Buttons */}
        {isExpanded && (
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800/60">
            {/* Admin Switch Button */}
            <button
              onClick={() => handleRoleSwitch('ADMIN')}
              disabled={isLoading}
              className={`p-2.5 rounded-xl text-left border transition flex flex-col justify-between ${
                role === 'ADMIN'
                  ? 'bg-purple-600/20 border-purple-500/50 text-white ring-1 ring-purple-500/30'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <ShieldCheck className={`w-4 h-4 ${role === 'ADMIN' ? 'text-purple-400' : 'text-zinc-500'}`} />
                {role === 'ADMIN' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>}
              </div>
              <div className="mt-2">
                <div className="font-semibold text-xs text-white">Admin</div>
                <div className="text-[10px] text-zinc-400 truncate">Superuser Dispatch</div>
              </div>
            </button>

            {/* Delivery Agent Switch Button */}
            <button
              onClick={() => handleRoleSwitch('AGENT')}
              disabled={isLoading}
              className={`p-2.5 rounded-xl text-left border transition flex flex-col justify-between ${
                role === 'AGENT'
                  ? 'bg-amber-600/20 border-amber-500/50 text-white ring-1 ring-amber-500/30'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Truck className={`w-4 h-4 ${role === 'AGENT' ? 'text-amber-400' : 'text-zinc-500'}`} />
                {role === 'AGENT' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>}
              </div>
              <div className="mt-2">
                <div className="font-semibold text-xs text-white">Karan (Agent)</div>
                <div className="text-[10px] text-zinc-400 truncate">South Gurgaon</div>
              </div>
            </button>

            {/* B2B Customer Switch Button */}
            <button
              onClick={() => handleRoleSwitch('CUSTOMER')}
              disabled={isLoading}
              className={`p-2.5 rounded-xl text-left border transition flex flex-col justify-between ${
                role === 'CUSTOMER'
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-white ring-1 ring-indigo-500/30'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Building className={`w-4 h-4 ${role === 'CUSTOMER' ? 'text-indigo-400' : 'text-zinc-500'}`} />
                {role === 'CUSTOMER' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>}
              </div>
              <div className="mt-2">
                <div className="font-semibold text-xs text-white">Apex Logistics</div>
                <div className="text-[10px] text-zinc-400 truncate">B2B Customer</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Persistent Evaluator Demo Role Switcher Bottom Dock (Technical Blueprint Theme)
 * -------------------------------------------------------------------------------
 * Floating bottom dock with high-contrast sharp black borders and electric blue active badges.
 */

import React, { useState } from 'react';
import { ShieldCheck, Truck, Building, ChevronDown, ChevronUp } from 'lucide-react';
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
      <div className="bg-white border-2 border-black neo-shadow-lg p-3 space-y-2">
        
        {/* Dock Header & Collapse Toggle */}
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-[#0052FF] border border-black animate-pulse" />
            <span className="font-mono font-extrabold text-black uppercase tracking-wider">EVALUATOR DEMO SWITCHER</span>
            <span className="hidden sm:inline-block text-[10px] bg-black text-white px-2 py-0.5 font-mono font-bold uppercase">
              ROLE: {role || 'GUEST'}
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-black hover:bg-zinc-100 p-1 border border-black transition"
            title={isExpanded ? 'Minimize Switcher' : 'Expand Switcher'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Expandable Role Selection Buttons */}
        {isExpanded && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t-2 border-black">
            {/* Admin Switch Button */}
            <button
              onClick={() => handleRoleSwitch('ADMIN')}
              disabled={isLoading}
              className={`p-2 text-left border-2 border-black transition-all flex flex-col justify-between ${
                role === 'ADMIN'
                  ? 'bg-black text-white neo-shadow-sm font-mono'
                  : 'bg-white text-black hover:bg-zinc-100 neo-shadow-sm font-mono'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <ShieldCheck className={`w-4 h-4 ${role === 'ADMIN' ? 'text-white' : 'text-black'}`} />
                {role === 'ADMIN' && <span className="w-2 h-2 bg-[#0052FF] border border-white"></span>}
              </div>
              <div className="mt-1.5">
                <div className="font-extrabold text-xs uppercase">ADMIN</div>
                <div className="text-[9px] opacity-80 uppercase tracking-tighter">DISPATCH SYSTEM</div>
              </div>
            </button>

            {/* Delivery Agent Switch Button */}
            <button
              onClick={() => handleRoleSwitch('AGENT')}
              disabled={isLoading}
              className={`p-2 text-left border-2 border-black transition-all flex flex-col justify-between ${
                role === 'AGENT'
                  ? 'bg-[#0052FF] text-white neo-shadow-sm font-mono'
                  : 'bg-white text-black hover:bg-zinc-100 neo-shadow-sm font-mono'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Truck className={`w-4 h-4 ${role === 'AGENT' ? 'text-white' : 'text-black'}`} />
                {role === 'AGENT' && <span className="w-2 h-2 bg-white border border-black"></span>}
              </div>
              <div className="mt-1.5">
                <div className="font-extrabold text-xs uppercase">KARAN (AGENT)</div>
                <div className="text-[9px] opacity-80 uppercase tracking-tighter">SOUTH GURGAON</div>
              </div>
            </button>

            {/* B2B Customer Switch Button */}
            <button
              onClick={() => handleRoleSwitch('CUSTOMER')}
              disabled={isLoading}
              className={`p-2 text-left border-2 border-black transition-all flex flex-col justify-between ${
                role === 'CUSTOMER'
                  ? 'bg-[#0052FF] text-white neo-shadow-sm font-mono'
                  : 'bg-white text-black hover:bg-zinc-100 neo-shadow-sm font-mono'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Building className={`w-4 h-4 ${role === 'CUSTOMER' ? 'text-white' : 'text-black'}`} />
                {role === 'CUSTOMER' && <span className="w-2 h-2 bg-white border border-black"></span>}
              </div>
              <div className="mt-1.5">
                <div className="font-extrabold text-xs uppercase">APEX LOGISTICS</div>
                <div className="text-[9px] opacity-80 uppercase tracking-tighter">B2B CUSTOMER</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

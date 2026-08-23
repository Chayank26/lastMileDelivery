/**
 * Application Navigation Bar Component (Neo-Brutalist Technical Blueprint Theme)
 * -----------------------------------------------------------------------------
 * Displays branding header, electric blue icon block, active role status badges,
 * and sharp navigation tabs.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Truck, LogOut, MapPin, Calculator, Search, Grid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'ADMIN':
        return 'bg-black text-white border-2 border-black';
      case 'AGENT':
        return 'bg-[#0052FF] text-white border-2 border-black';
      case 'CUSTOMER':
        return 'bg-zinc-200 text-black border-2 border-black';
      default:
        return 'bg-white text-black border-2 border-black';
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b-2 border-black sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Identifier */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-[#0052FF] text-white border-2 border-black neo-shadow-sm transition-transform group-hover:-translate-y-0.5">
                <Grid className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-wider text-black text-base uppercase leading-none">
                  LAST-MILE LOGISTICS
                </span>
                <span className="text-[10px] text-zinc-500 font-mono font-bold tracking-widest uppercase mt-0.5">
                  SYSTEM CORE v2.0.4
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to="/orders"
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-black transition ${
                isActive('/orders')
                  ? 'bg-black text-white neo-shadow-sm'
                  : 'bg-white text-black hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                <span>Orders Dispatch</span>
              </div>
            </Link>

            <Link
              to="/track-search"
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-black transition ${
                isActive('/track-search')
                  ? 'bg-black text-white neo-shadow-sm'
                  : 'bg-white text-black hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>Live Tracking</span>
              </div>
            </Link>

            {role === 'ADMIN' && (
              <>
                <Link
                  to="/zones"
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-black transition ${
                    isActive('/zones')
                      ? 'bg-black text-white neo-shadow-sm'
                      : 'bg-white text-black hover:bg-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Zone Map</span>
                  </div>
                </Link>

                <Link
                  to="/simulator"
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-black transition ${
                    isActive('/simulator')
                      ? 'bg-black text-white neo-shadow-sm'
                      : 'bg-white text-black hover:bg-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Rate Sandbox</span>
                  </div>
                </Link>
              </>
            )}

            {role === 'AGENT' && (
              <Link
                to="/agent-dashboard"
                className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-black transition ${
                  isActive('/agent-dashboard')
                    ? 'bg-black text-white neo-shadow-sm'
                    : 'bg-white text-black hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Agent Duty</span>
                </div>
              </Link>
            )}
          </div>

          {/* User Profile & Demo Switcher Badge */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className={`px-2.5 py-1 text-xs font-mono font-extrabold uppercase neo-shadow-sm ${getRoleBadgeColor()}`}>
                  {user.role}
                </span>

                <div className="hidden sm:flex flex-col text-right text-xs">
                  <span className="text-black font-bold uppercase font-mono">{user.name}</span>
                  <span className="text-zinc-500 font-mono text-[10px]">{user.email}</span>
                </div>

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 bg-white border-2 border-black text-black hover:bg-black hover:text-white transition neo-shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-mono font-bold uppercase bg-[#0052FF] text-white border-2 border-black neo-shadow-sm hover:bg-[#0042D0] transition"
              >
                LOGIN / DEMO
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

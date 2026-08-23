/**
 * Application Navigation Bar Component
 * ------------------------------------
 * Displays branding header, active role badge, user profile options,
 * and navigation links tailored to the user's role.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Truck, LogOut, MapPin, Calculator, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'AGENT':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CUSTOMER':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-[#121215] border-b border-zinc-800/80 sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Identifier */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-400 group-hover:bg-indigo-600/30 transition">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold tracking-tight text-white text-base">Unthinkable Delivery</span>
                <span className="hidden sm:inline-block ml-2 text-xs text-zinc-500 font-mono">Last-Mile OS</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/orders"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                isActive('/orders')
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Orders</span>
            </Link>

            <Link
              to="/track-search"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                isActive('/track-search')
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Live Tracking</span>
            </Link>

            {role === 'ADMIN' && (
              <>
                <Link
                  to="/zones"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    isActive('/zones')
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Zones Map</span>
                </Link>

                <Link
                  to="/simulator"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    isActive('/simulator')
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Rate Sandbox</span>
                </Link>
              </>
            )}

            {role === 'AGENT' && (
              <Link
                to="/agent-dashboard"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  isActive('/agent-dashboard')
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Agent Duty</span>
              </Link>
            )}
          </div>

          {/* User Profile & Demo Switcher Badge */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className={`px-2.5 py-1 text-xs font-mono border rounded-full font-medium ${getRoleBadgeColor()}`}>
                  {user.role}
                </span>

                <div className="hidden sm:flex flex-col text-right text-xs">
                  <span className="text-zinc-200 font-medium">{user.name}</span>
                  <span className="text-zinc-500 text-[10px]">{user.email}</span>
                </div>

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
              >
                Login / Demo
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

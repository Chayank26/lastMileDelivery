/**
 * Global Main Application Layout Component (Technical Blueprint Theme)
 * ---------------------------------------------------------------------
 * Wraps page routes with dot grid background canvas and technical frame structure.
 */

import React from 'react';
import { Navbar } from './Navbar';
import { DemoRoleSwitcher } from './DemoRoleSwitcher';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#f4f4f6] bg-grid-pattern text-black flex flex-col font-sans antialiased selection:bg-[#0052FF] selection:text-white pb-28">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <DemoRoleSwitcher />
    </div>
  );
};

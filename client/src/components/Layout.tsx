/**
 * Global Main Application Layout Component
 * -----------------------------------------
 * Wraps page routes with the persistent Navbar header and background container.
 */

import React from 'react';
import { Navbar } from './Navbar';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white pb-20">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

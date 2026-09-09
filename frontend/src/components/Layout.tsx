import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#0F172A] p-8">
        {children}
      </main>
    </div>
  );
}

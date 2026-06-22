import React, { useState } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav onMenu={() => setSidebarOpen((s) => !s)} />

      <div className="flex">
        {/* Sidebar: hidden on small, toggled via button */}
        <div className={`hidden sm:block`}>
          <Sidebar />
        </div>

        {/* Mobile drawer */}
        {sidebarOpen ? (
          <div className="fixed inset-0 z-40 flex">
            <div
              className="w-64 shrink-0 border-r border-border bg-surface p-4"
              role="dialog"
              aria-modal="true"
            >
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
            <div className="flex-1" onClick={() => setSidebarOpen(false)} />
          </div>
        ) : null}

        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

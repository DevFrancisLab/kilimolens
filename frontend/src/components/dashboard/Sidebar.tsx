import React from "react";
import { Link } from "@tanstack/react-router";
import * as lucidePkg from "lucide-react";
const lucide = (lucidePkg as any).default ?? lucidePkg;
const { Home, FilePlus, Users, Cpu, Database, Globe, BarChart2, Settings, Zap } = lucide;
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: Home },
  { label: "New Assessment", to: "/dashboard/new-assessment", icon: FilePlus },
  { label: "Applications", to: "/dashboard/applications", icon: Zap },
  { label: "Farmer Profiles", to: "/dashboard/farmers", icon: Users },
  { label: "AI Assessments", to: "/dashboard/ai-assessments", icon: Cpu },
  { label: "Knowledge Graph", to: "/dashboard/knowledge-graph", icon: Database },
  { label: "Climate Insights", to: "/dashboard/climate-insights", icon: Globe },
  { label: "Reports", to: "/dashboard/reports", icon: BarChart2 },
  { label: "Settings", to: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({ className = "", onNavigate }: { className?: string; onNavigate?: () => void }) {
  return (
    <aside
      className={`w-64 shrink-0 border-r border-border bg-surface p-4 ${className}`}
      aria-label="Sidebar"
    >
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg gradient-brand text-primary-foreground shadow-card">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12h18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">KilimoLens</div>
          <div className="text-xs text-muted-foreground">Loan Officer</div>
        </div>
      </div>

      <div className="mt-4 px-2">
        {navItems.map((n) => {
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              className="group mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-foreground"
              onClick={() => onNavigate?.()}
            >
              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto px-2 pt-6">
        <div className="flex items-center gap-3 rounded-md border border-border bg-card p-2">
          <Avatar>
            <AvatarImage src="/assets/avatar-placeholder.png" />
            <AvatarFallback>LO</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">Asha N.</div>
            <div className="text-xs text-muted-foreground">Loan Officer</div>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <a href="/dashboard/profile">Profile</a>
          </Button>
        </div>
      </div>
    </aside>
  );
}

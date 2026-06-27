"use client";

import React from "react";
import { Link } from "@tanstack/react-router";
import {
  Grid,
  PlusSquare,
  FileText,
  Users,
  Cpu,
  Share2,
  CloudRain,
  FileChartLine,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { useAuth, type AuthRole } from "@/lib/auth";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Grid;
  badge?: string;
  roles: AuthRole[];
};

// Each item declares which roles may see it, so different users get different menus.
const ALL: AuthRole[] = ["loan_officer", "analyst", "admin"];

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: Grid, roles: ALL },
  { to: "/dashboard/assistant", label: "Ask KilimoLens", icon: Sparkles, roles: ALL },
  { to: "/dashboard/new-assessment", label: "New Assessment", icon: PlusSquare, roles: ["loan_officer", "admin"] },
  { to: "/dashboard/applications", label: "Applications", icon: FileText, badge: "8", roles: ["loan_officer", "admin"] },
  { to: "/dashboard/farmer-profiles", label: "Farmer Profiles", icon: Users, roles: ALL },
  { to: "/dashboard/ai-assessments", label: "AI Assessments", icon: Cpu, roles: ALL },
  { to: "/dashboard/knowledge-graph", label: "Knowledge Graph", icon: Share2, roles: ["analyst", "admin"] },
  { to: "/dashboard/climate-insights", label: "Climate Insights", icon: CloudRain, roles: ["analyst", "admin"] },
  { to: "/dashboard/reports", label: "Reports", icon: FileChartLine, roles: ["analyst", "admin"] },
  { to: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

export default function SidebarItems() {
  const { user } = useAuth();
  const role = user?.role;
  const items = role ? NAV.filter((item) => item.roles.includes(role)) : [];

  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton asChild>
              <Link to={item.to} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}

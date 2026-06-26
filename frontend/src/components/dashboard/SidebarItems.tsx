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
} from "lucide-react";
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

export default function SidebarItems() {
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link to="/dashboard" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link to="/dashboard/new-assessment" className="flex items-center gap-2">
            <PlusSquare className="h-4 w-4" />
            <span>New Assessment</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link to="/dashboard/applications" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Applications</span>
            <SidebarMenuBadge>8</SidebarMenuBadge>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link to="/dashboard/farmer-profiles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Farmer Profiles</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link to="/dashboard/ai-assessments" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            <span>AI Assessments</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link to="/dashboard/knowledge-graph" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            <span>Knowledge Graph</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link to="/dashboard/climate-insights" className="flex items-center gap-2">
            <CloudRain className="h-4 w-4" />
            <span>Climate Insights</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link to="/dashboard/reports" className="flex items-center gap-2">
            <FileChartLine className="h-4 w-4" />
            <span>Reports</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link to="/dashboard/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent as SIDEBAR_CONTENT,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import TopNav from "./TopNav";
import SidebarItems from "./SidebarItems";
import { useAuth } from "@/lib/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      navigate({ to: "/login" });
    }
  }, [mounted, user, navigate]);

  if (!mounted || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 py-10 text-center">
        <div className="max-w-md rounded-3xl border border-border bg-card p-10 shadow-soft">
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const isSettingsRoute = location.pathname === "/dashboard/settings";
  const unauthorizedSettings = isSettingsRoute && user.role !== "admin";

  return (
    <SidebarProvider className="min-h-screen">
      <div className="flex h-screen w-full">
        <Sidebar variant="sidebar" collapsible="icon">
          <div className="flex h-full flex-1 flex-col bg-sidebar p-2">
            <SidebarHeader>
              <div className="flex items-center justify-between px-1">
                <Link to="/dashboard" className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg gradient-brand text-primary-foreground shadow-card">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 12h18M3 6h18M3 18h18" />
                    </svg>
                  </div>
                  <span className="hidden truncate text-sm font-semibold text-foreground md:block">
                    {user.role === "admin" ? "Admin Console" : user.role === "analyst" ? "Analyst Workspace" : "Loan Officer"}
                  </span>
                </Link>
                <SidebarTrigger />
              </div>
            </SidebarHeader>

            <SIDEBAR_CONTENT className="mt-2 flex-1">
              <SidebarMenu>
                <SidebarItems />
              </SidebarMenu>
            </SIDEBAR_CONTENT>

            <SidebarSeparator />
            <SidebarFooter>
              <div className="flex items-center gap-2 px-2">
                <Avatar>
                  <AvatarImage src="/assets/avatar.jpg" alt="Profile" />
                  <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="hidden flex-1 flex-col truncate md:flex">
                  <span className="text-sm font-medium text-foreground">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.organization}</span>
                </div>
              </div>
              <div className="mt-3 px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    logout();
                    navigate({ to: "/login" });
                  }}
                >
                  Log out
                </Button>
              </div>
            </SidebarFooter>
          </div>
        </Sidebar>

        <SidebarInset className="flex-1">
          <div className="flex h-full flex-col">
            <TopNav />
            <main className="h-full overflow-auto p-6">
              {unauthorizedSettings ? (
                <div className="rounded-3xl border border-border bg-card p-8 text-center">
                  <h1 className="text-2xl font-semibold text-foreground">Access denied</h1>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Your role does not have permission to view this settings page.
                  </p>
                  <Button className="mt-6" onClick={() => navigate({ to: "/dashboard" })}>
                    Return to dashboard
                  </Button>
                </div>
              ) : (
                children
              )}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

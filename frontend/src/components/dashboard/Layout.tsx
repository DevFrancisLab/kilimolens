"use client";

import React from "react";
import { Link } from "@tanstack/react-router";
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
import TopNav from "./TopNav";
import SidebarItems from "./SidebarItems";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
                    Loan Officer
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
                  <AvatarImage src="/assets/avatar.jpg" alt="Loan officer" />
                  <AvatarFallback>LO</AvatarFallback>
                </Avatar>
                <div className="hidden flex-col truncate md:flex">
                  <span className="text-sm font-medium text-foreground">Asha Mwangi</span>
                  <span className="text-xs text-muted-foreground">Loan Officer</span>
                </div>
              </div>
            </SidebarFooter>
          </div>
        </Sidebar>

        <SidebarInset className="flex-1">
          <div className="flex h-full flex-col">
            <TopNav />
            <main className="h-full overflow-auto p-6">{children}</main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

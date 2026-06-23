"use client";

import React from "react";
import { Search, Bell, SunMoon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden md:block w-[260px]">
              <Input placeholder="Search farmers, applications, assessments..." />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <Search />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <SunMoon />
            </Button>

            <div className="flex items-center gap-2">
              <div className="hidden text-right md:block">
                <div className="text-sm font-medium text-foreground">Asha Mwangi</div>
                <div className="text-xs text-muted-foreground">Kilimo Sacco</div>
              </div>
              <Avatar>
                <AvatarImage src="/assets/avatar.jpg" alt="Profile" />
                <AvatarFallback>AM</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

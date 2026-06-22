import React from "react";
import * as lucidePkg from "lucide-react";
const lucide = (lucidePkg as any).default ?? lucidePkg;
const { Search, Bell } = lucide;
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export default function TopNav({ onMenu }: { onMenu?: () => void }) {
  return (
    <div className="flex h-14 items-center justify-between gap-4 border-b border-border bg-background/60 px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onMenu?.()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-transparent text-foreground hover:bg-accent"
          aria-label="Toggle sidebar"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <div className="relative hidden sm:flex items-center rounded-md bg-card px-3 py-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search assessments, farmers, apps..."
            className="ml-2 w-72 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="hidden sm:block">
          <Avatar>
            <AvatarImage src="/assets/avatar-placeholder.png" />
            <AvatarFallback>LO</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}

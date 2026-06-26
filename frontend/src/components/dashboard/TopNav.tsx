"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Bell, Sun, Moon, User, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth, getRoleLabel } from "@/lib/auth";
import { listAssessments, type AssessmentSummary } from "@/lib/api";
import { formatDate, statusClasses } from "@/lib/format";

const THEME_KEY = "kilimolens_theme";
const SEEN_KEY = "kilimolens_notifications_seen";

/* ------------------------------- theme ------------------------------- */
function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(THEME_KEY)) as
      | "light"
      | "dark"
      | null;
    const initial =
      stored || (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = () => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return { theme, toggle };
}

/* ----------------------------- top nav ------------------------------ */
export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const [data, setData] = useState<AssessmentSummary[]>([]);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [unseen, setUnseen] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load recent assessments once — drives both search and notifications.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const items = await listAssessments(200);
        if (!active) return;
        setData(items);
        const seen = Number(localStorage.getItem(SEEN_KEY) || 0);
        setUnseen(items.filter((i) => new Date(i.createdAt).getTime() > seen).length);
      } catch {
        /* backend down — leave empty */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Close search results on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const seen = new Set<string>();
    const out: AssessmentSummary[] = [];
    for (const a of data) {
      if (seen.has(a.farmerId)) continue;
      if (`${a.farmerName} ${a.county} ${a.purpose}`.toLowerCase().includes(q)) {
        seen.add(a.farmerId);
        out.push(a);
      }
      if (out.length >= 6) break;
    }
    return out;
  }, [query, data]);

  const notifications = useMemo(() => data.slice(0, 8), [data]);

  function markNotificationsSeen() {
    try {
      localStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setUnseen(0);
  }

  function goToFarmer(farmerId: string) {
    setQuery("");
    setSearchOpen(false);
    navigate({ to: "/dashboard/farmer-profiles", search: { id: farmerId } as any });
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (results.length) goToFarmer(results[0].farmerId);
  }

  const initials = (user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div ref={searchRef} className="relative flex-1 max-w-md">
            <form onSubmit={submitSearch} className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search farmers, applications, assessments…"
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary"
              />
            </form>

            {searchOpen && query.trim() && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
                {results.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">No matches for “{query}”.</div>
                ) : (
                  results.map((r) => (
                    <button
                      key={r.farmerId}
                      onClick={() => goToFarmer(r.farmerId)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-muted/50"
                    >
                      <div>
                        <div className="font-medium text-foreground">{r.farmerName}</div>
                        <div className="text-xs text-muted-foreground">{r.county || "—"} · {r.purpose || "assessment"}</div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusClasses(r.status)}`}>{r.status}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            {/* Notifications */}
            <DropdownMenu onOpenChange={(open) => open && markNotificationsSeen()}>
              <DropdownMenuTrigger asChild>
                <button
                  title="Notifications"
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {unseen > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                      {unseen > 9 ? "9+" : unseen}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Recent activity</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">No activity yet.</div>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => goToFarmer(n.farmerId)}
                      className="flex flex-col items-start gap-0.5"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-medium">{n.farmerName}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${statusClasses(n.status)}`}>{n.status}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Assessed {n.readiness}% readiness · {formatDate(n.createdAt)}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/applications" })}>
                  View all applications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-muted/50">
                  <div className="hidden text-right md:block">
                    <div className="text-sm font-medium text-foreground">{user?.name || "User"}</div>
                    <div className="text-xs text-muted-foreground">{user?.organization || ""}</div>
                  </div>
                  <Avatar>
                    <AvatarImage src="/assets/avatar.jpg" alt={user?.name || "Profile"} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {user ? getRoleLabel(user.role) : ""} · {user?.organization}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/farmer-profiles" })}>
                  <User className="mr-2 h-4 w-4" /> Farmer profiles
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/settings" })}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate({ to: "/login" });
                  }}
                  className="text-rose-600 focus:text-rose-600"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

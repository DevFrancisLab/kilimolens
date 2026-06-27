"use client";

import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Inbox,
  FileText,
  CheckCircle2,
  TrendingUp,
  Users,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getStats,
  listAssessments,
  type DashboardStats,
  type AssessmentSummary,
} from "@/lib/api";
import { formatKES, formatDateShort, statusClasses } from "@/lib/format";

function KPI({ icon: Icon, title, metric, sub }: any) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-1 hover:shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-semibold text-foreground">{metric}</div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      </div>
    </div>
  );
}

export default function Overview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [s, a] = await Promise.all([getStats(), listAssessments(8)]);
        if (!active) return;
        setStats(s);
        setRecent(a);
      } catch (e: any) {
        if (active) setError(e?.message || "Could not reach the backend.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview and quick actions for loan officers.</p>
        </div>
        <Link to="/dashboard/new-assessment">
          <Button>New Assessment</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading live data…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
          {error} Make sure the KilimoLens backend is running.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KPI icon={Inbox} title="Total Assessments" metric={stats!.totalAssessments} sub="all time" />
            <KPI icon={FileText} title="Under Review" metric={stats!.pending} sub="awaiting decision" />
            <KPI icon={CheckCircle2} title="Approved" metric={stats!.approved} sub={`${stats!.approvalRate}% approval rate`} />
            <KPI icon={TrendingUp} title="Avg Credit Readiness" metric={`${stats!.avgReadiness}%`} sub={`avg confidence ${stats!.avgConfidence}%`} />
            <KPI icon={Users} title="Farmers Assessed" metric={stats!.totalFarmers} sub="unique farmers" />
            <KPI icon={ShieldCheck} title="Approved Loan Value" metric={formatKES(stats!.approvedLoanValue)} sub="disbursable" />
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Recent Loan Applications</h2>
              <Link to="/dashboard/applications" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No assessments yet. <Link to="/dashboard/new-assessment" className="text-primary hover:underline">Run your first assessment</Link>.
              </div>
            ) : (
              <div className="mt-4 overflow-auto rounded-2xl border border-border bg-card">
                <table className="w-full min-w-200 table-auto">
                  <thead>
                    <tr className="text-left text-xs uppercase text-muted-foreground">
                      <th className="px-4 py-3">Farmer</th>
                      <th className="px-4 py-3">County</th>
                      <th className="px-4 py-3">Loan Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Credit Readiness</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((row) => (
                      <tr key={row.id} className="border-t border-border hover:bg-background/40 transition-colors">
                        <td className="px-4 py-3">
                          <Link to="/dashboard/farmer-profiles" search={{ id: row.farmerId } as any} className="font-medium text-foreground hover:text-primary">
                            {row.farmerName}
                          </Link>
                          <div className="text-xs text-muted-foreground">{row.purpose || "—"}</div>
                        </td>
                        <td className="px-4 py-3">{row.county || "—"}</td>
                        <td className="px-4 py-3">{formatKES(row.loanAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusClasses(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-36">
                            <div className="h-2 w-full rounded-full bg-muted/30">
                              <div style={{ width: `${row.readiness}%` }} className="h-2 rounded-full bg-primary" />
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">{row.readiness}%</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(row.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

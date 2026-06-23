"use client";

import React from "react";
import {
  Inbox,
  FileText,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function KPI({ icon: Icon, title, metric, trend }: any) {
  const positive = trend?.value >= 0;
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-1 hover:shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold text-foreground">{metric}</div>
          <div className="text-xs text-muted-foreground mt-1">{trend?.label}</div>
        </div>
        {trend ? (
          <div className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${positive ? "text-green-500" : "text-red-500"}`}>
            {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const MOCK_APPLICATIONS = [
  {
    id: "A-1001",
    farmer: "Grace Njoroge",
    county: "Embu",
    amount: 12000,
    status: "Pending",
    readiness: 72,
    recommendation: "Assess",
  },
  {
    id: "A-1002",
    farmer: "Joseph Ouma",
    county: "Kisumu",
    amount: 45000,
    status: "Under Review",
    readiness: 58,
    recommendation: "Adjust",
  },
  {
    id: "A-1003",
    farmer: "Amina Yusuf",
    county: "Mombasa",
    amount: 8000,
    status: "Approved",
    readiness: 88,
    recommendation: "Approve",
  },
  {
    id: "A-1004",
    farmer: "Peter Mwangi",
    county: "Nakuru",
    amount: 23000,
    status: "Pending",
    readiness: 45,
    recommendation: "Decline",
  },
  {
    id: "A-1005",
    farmer: "Mercy Kiplagat",
    county: "Uasin Gishu",
    amount: 15000,
    status: "Under Review",
    readiness: 67,
    recommendation: "Assess",
  },
];

function Currency({ value }: { value: number }) {
  return <span>KES {value.toLocaleString("en-KE")}</span>;
}

export default function Overview() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview and quick actions for loan officers.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPI icon={Inbox} title="Pending Applications" metric={MOCK_APPLICATIONS.filter((a) => a.status === "Pending").length} trend={{ value: 4, label: "since yesterday" }} />
        <KPI icon={FileText} title="Applications Under Review" metric={MOCK_APPLICATIONS.filter((a) => a.status === "Under Review").length} trend={{ value: -2, label: "week" }} />
        <KPI icon={CheckCircle2} title="Loans Approved Today" metric={MOCK_APPLICATIONS.filter((a) => a.status === "Approved").length} trend={{ value: 12, label: "today" }} />
        <KPI icon={TrendingUp} title="Average Finance Readiness" metric={`${Math.round(MOCK_APPLICATIONS.reduce((s, a) => s + a.readiness, 0) / MOCK_APPLICATIONS.length)}%`} trend={{ value: 3, label: "30d avg" }} />
        <KPI icon={AlertTriangle} title="High Climate Risk Farmers" metric={5} trend={{ value: 1, label: "30d" }} />
        <KPI icon={ShieldCheck} title="Portfolio Health" metric="Good" trend={{ value: 2, label: "QoQ" }} />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Loan Applications</h2>
          <div className="text-sm text-muted-foreground">Showing latest {MOCK_APPLICATIONS.length}</div>
        </div>

        <div className="mt-4 overflow-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[800px] table-auto">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Farmer</th>
                <th className="px-4 py-3">County</th>
                <th className="px-4 py-3">Loan Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Finance Readiness</th>
                <th className="px-4 py-3">Recommendation</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_APPLICATIONS.map((row) => (
                <tr key={row.id} className="border-t border-border hover:bg-background/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{row.farmer}</div>
                    <div className="text-xs text-muted-foreground">{row.id}</div>
                  </td>
                  <td className="px-4 py-3">{row.county}</td>
                  <td className="px-4 py-3"><Currency value={row.amount} /></td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${row.status === "Approved" ? "bg-green-500/10 text-green-500" : row.status === "Under Review" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"}`}>
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
                  <td className="px-4 py-3">{row.recommendation}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">View</Button>
                      <Button variant="outline" size="sm">Assess</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

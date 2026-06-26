import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, FileChartLine, Download, Printer, FileText, Landmark, MapPin } from "lucide-react";

import DashboardLayout from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import {
  getStats,
  listAssessments,
  type DashboardStats,
  type AssessmentSummary,
} from "@/lib/api";
import { formatKES, formatDate, statusClasses } from "@/lib/format";

type ReportType = "portfolio" | "assessments" | "approved";

const REPORTS: { id: ReportType; title: string; desc: string; icon: typeof FileText }[] = [
  { id: "portfolio", title: "Portfolio Summary", desc: "Headline KPIs, status mix and county breakdown.", icon: Landmark },
  { id: "assessments", title: "All Assessments", desc: "Every farmer assessment with scores and status.", icon: FileText },
  { id: "approved", title: "Approved Loans", desc: "Approved applications and disbursable value.", icon: MapPin },
];

function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}

function download(filename: string, content: string, type = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function todayStamp(): string {
  // Avoids importing date libs; safe in the browser at click time.
  return new Date().toISOString().slice(0, 10);
}

function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [items, setItems] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [type, setType] = useState<ReportType>("portfolio");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [s, a] = await Promise.all([getStats(), listAssessments(500)]);
        if (!active) return;
        setStats(s);
        setItems(a);
      } catch (e: any) {
        if (active) setError(e?.message || "Could not load report data.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const approved = useMemo(() => items.filter((i) => i.status === "Approved"), [items]);

  function exportCsv() {
    if (!stats) return;
    if (type === "portfolio") {
      const rows: (string | number)[][] = [
        ["KilimoLens Portfolio Summary", todayStamp()],
        [],
        ["Metric", "Value"],
        ["Total assessments", stats.totalAssessments],
        ["Farmers assessed", stats.totalFarmers],
        ["Approved", stats.approved],
        ["Under review", stats.pending],
        ["Declined", stats.declined],
        ["Approval rate (%)", stats.approvalRate],
        ["Average credit readiness (%)", stats.avgReadiness],
        ["Average confidence (%)", stats.avgConfidence],
        ["Approved loan value (KES)", stats.approvedLoanValue],
        [],
        ["County", "Assessments"],
        ...stats.byCounty.map((c) => [c.county, c.count] as (string | number)[]),
      ];
      download(`kilimolens-portfolio-${todayStamp()}.csv`, toCsv(rows));
    } else {
      const source = type === "approved" ? approved : items;
      const rows: (string | number)[][] = [
        ["Farmer", "County", "Loan Amount (KES)", "Readiness (%)", "Confidence (%)", "Recommendation", "Status", "Date"],
        ...source.map((i) => [
          i.farmerName,
          i.county || "",
          Math.round(i.loanAmount || 0),
          i.readiness,
          i.confidence,
          i.recommendation,
          i.status,
          i.createdAt,
        ]),
      ];
      download(`kilimolens-${type}-${todayStamp()}.csv`, toCsv(rows));
    }
  }

  function printReport() {
    window.print();
  }

  const activeMeta = REPORTS.find((r) => r.id === type)!;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <FileChartLine className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Reports</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Exportable reports for portfolios and assessments.</p>
        </div>
        {!loading && !error && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={printReport}>
              <Printer className="mr-1 h-4 w-4" /> Print / PDF
            </Button>
            <Button onClick={exportCsv}>
              <Download className="mr-1 h-4 w-4" /> Export CSV
            </Button>
          </div>
        )}
      </div>

      {/* Report type picker */}
      {!loading && !error && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3 print:hidden">
          {REPORTS.map((r) => {
            const Icon = r.icon;
            const active = type === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setType(r.id)}
                className={`rounded-2xl border p-4 text-left transition ${active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border bg-card hover:border-primary/40"}`}
              >
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${active ? "gradient-brand text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-3 text-sm font-semibold text-foreground">{r.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{r.desc}</div>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading report data…
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">{error}</div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 print:border-0 print:p-0">
          {/* Report header (prints) */}
          <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
            <div>
              <div className="text-lg font-semibold text-foreground">KilimoLens · {activeMeta.title}</div>
              <div className="text-xs text-muted-foreground">Generated {formatDate(new Date().toISOString())}</div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              {stats!.totalAssessments} assessments · {stats!.totalFarmers} farmers
            </div>
          </div>

          {type === "portfolio" ? (
            <PortfolioReport stats={stats!} />
          ) : (
            <TableReport rows={type === "approved" ? approved : items} showAmount />
          )}
        </div>
      )}
    </div>
  );
}

function PortfolioReport({ stats }: { stats: DashboardStats }) {
  const cells = [
    { label: "Total Assessments", value: stats.totalAssessments },
    { label: "Farmers Assessed", value: stats.totalFarmers },
    { label: "Approved", value: stats.approved },
    { label: "Under Review", value: stats.pending },
    { label: "Declined", value: stats.declined },
    { label: "Approval Rate", value: `${stats.approvalRate}%` },
    { label: "Avg Credit Readiness", value: `${stats.avgReadiness}%` },
    { label: "Avg Confidence", value: `${stats.avgConfidence}%` },
    { label: "Approved Loan Value", value: formatKES(stats.approvedLoanValue) },
  ];
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {cells.map((c) => (
          <div key={c.label} className="rounded-xl border border-border p-4">
            <div className="text-xs text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{c.value}</div>
          </div>
        ))}
      </div>

      <h3 className="mt-6 text-sm font-semibold text-foreground">Assessments by County</h3>
      <table className="mt-2 w-full table-auto text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <th className="py-2">County</th>
            <th className="py-2">Assessments</th>
          </tr>
        </thead>
        <tbody>
          {stats.byCounty.map((c) => (
            <tr key={c.county} className="border-b border-border/60 last:border-0">
              <td className="py-2">{c.county}</td>
              <td className="py-2">{c.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableReport({ rows, showAmount }: { rows: AssessmentSummary[]; showAmount?: boolean }) {
  if (rows.length === 0)
    return <div className="py-8 text-center text-sm text-muted-foreground">No records for this report.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-200 table-auto text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <th className="py-2 pr-4">Farmer</th>
            <th className="py-2 pr-4">County</th>
            {showAmount && <th className="py-2 pr-4">Amount</th>}
            <th className="py-2 pr-4">Readiness</th>
            <th className="py-2 pr-4">Recommendation</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/60 last:border-0">
              <td className="py-2 pr-4 font-medium text-foreground">{r.farmerName}</td>
              <td className="py-2 pr-4">{r.county || "—"}</td>
              {showAmount && <td className="py-2 pr-4">{formatKES(r.loanAmount)}</td>}
              <td className="py-2 pr-4">{r.readiness}%</td>
              <td className="py-2 pr-4">{r.recommendation}</td>
              <td className="py-2 pr-4">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusClasses(r.status)}`}>
                  {r.status}
                </span>
              </td>
              <td className="py-2 text-muted-foreground">{formatDate(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/reports")({
  component: () => (
    <DashboardLayout>
      <ReportsPage />
    </DashboardLayout>
  ),
});

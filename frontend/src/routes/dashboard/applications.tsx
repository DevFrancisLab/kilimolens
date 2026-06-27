import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, ArrowRight } from "lucide-react";

import DashboardLayout from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { listAssessments, type AssessmentSummary } from "@/lib/api";
import { formatKES, formatDate, statusClasses } from "@/lib/format";

const STATUSES = ["All", "Pending Assessment", "Approved", "Under Review", "Declined"];

function ApplicationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listAssessments(200);
        if (active) setItems(data);
      } catch (e: any) {
        if (active) setError(e?.message || "Could not load applications.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return items.filter((a) => {
      if (status !== "All" && a.status !== status) return false;
      if (query && !`${a.farmerName} ${a.county} ${a.purpose}`.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [items, status, query]);

  const pendingCount = useMemo(
    () => items.filter((a) => a.status === "Pending Assessment").length,
    [items],
  );

  // Clicking a row: a USSD application pending assessment opens the assessment
  // form prefilled with the captured details; anything else opens the profile.
  function openRow(row: AssessmentSummary) {
    if (row.status === "Pending Assessment") {
      navigate({ to: "/dashboard/new-assessment", search: { application: row.id } });
    } else {
      navigate({ to: "/dashboard/farmer-profiles", search: { id: row.farmerId } as any });
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Applications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All farmer loan applications and their lending status.
            {pendingCount > 0 && (
              <>
                {" "}
                <span className="font-medium text-indigo-600">
                  {pendingCount} pending assessment
                </span>{" "}
                from USSD.
              </>
            )}
          </p>
        </div>
        <Link to="/dashboard/new-assessment">
          <Button>New Assessment</Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-60">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by farmer, county or purpose"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${status === s ? "gradient-brand text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:border-primary/40"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading applications…
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No applications match. <Link to="/dashboard/new-assessment" className="text-primary hover:underline">Create one</Link>.
        </div>
      ) : (
        <div className="mt-6 overflow-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-225 table-auto">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Farmer</th>
                <th className="px-4 py-3">County</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Readiness</th>
                <th className="px-4 py-3">Recommendation</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const pending = row.status === "Pending Assessment";
                return (
                  <tr
                    key={row.id}
                    onClick={() => openRow(row)}
                    className={`cursor-pointer border-t border-border transition-colors hover:bg-background/40 ${pending ? "bg-indigo-50/40" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {row.farmerName || (pending ? "Awaiting site visit" : "Unknown")}
                      </div>
                      <div className="text-xs text-muted-foreground">{row.purpose || "—"}</div>
                    </td>
                    <td className="px-4 py-3">{row.county || "—"}</td>
                    <td className="px-4 py-3">{formatKES(row.loanAmount)}</td>
                    <td className="px-4 py-3">
                      {row.readiness == null ? (
                        <span className="text-xs text-muted-foreground">Not assessed</span>
                      ) : (
                        <div className="w-32">
                          <div className="h-2 w-full rounded-full bg-muted/30">
                            <div style={{ width: `${row.readiness}%` }} className="h-2 rounded-full bg-primary" />
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{row.readiness}%</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{row.recommendation || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusClasses(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openRow(row);
                        }}
                        className={
                          pending
                            ? "inline-flex items-center gap-1 rounded-lg gradient-brand px-3 py-1.5 text-xs font-medium text-primary-foreground"
                            : "text-xs text-primary hover:underline"
                        }
                      >
                        {pending ? (
                          <>
                            Assess <ArrowRight className="h-3 w-3" />
                          </>
                        ) : (
                          "View"
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/dashboard/applications")({
  component: () => <DashboardLayout>{<ApplicationsPage />}</DashboardLayout>,
});

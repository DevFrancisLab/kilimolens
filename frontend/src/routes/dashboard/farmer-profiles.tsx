import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Users, ArrowLeft, MapPin, ShieldCheck, CloudRain, Share2 } from "lucide-react";

import DashboardLayout from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import {
  listFarmers,
  getFarmer,
  type AssessmentSummary,
  type FarmerDetail,
} from "@/lib/api";
import { formatKES, formatDate, statusClasses, readinessClasses } from "@/lib/format";

/* ----------------------------- Farmer list ----------------------------- */
function FarmerList() {
  const [items, setItems] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listFarmers();
        if (active) setItems(data);
      } catch (e: any) {
        if (active) setError(e?.message || "Could not load farmers.");
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
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-semibold text-foreground">Farmer Profiles</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Every farmer assessed, with their latest credit readiness.</p>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading farmers…
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">{error}</div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No farmers yet. <Link to="/dashboard/new-assessment" className="text-primary hover:underline">Assess a farmer</Link>.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <Link
              key={f.farmerId}
              to="/dashboard/farmer-profiles"
              search={{ id: f.farmerId } as any}
              className="rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-1 hover:shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500 text-white">
                  {(f.farmerName || "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">{f.farmerName || "Unknown Farmer"}</div>
                  <div className="text-xs text-muted-foreground">{f.county || "—"}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  {f.readiness == null ? (
                    <div className="text-2xl font-semibold text-muted-foreground">—</div>
                  ) : (
                    <div className={`text-2xl font-semibold ${readinessClasses(f.readiness)}`}>{f.readiness}%</div>
                  )}
                  <div className="text-xs text-muted-foreground">credit readiness</div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusClasses(f.status)}`}>
                  {f.status}
                </span>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {f.assessmentCount} assessment{f.assessmentCount === 1 ? "" : "s"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Farmer detail ---------------------------- */
function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value || "—"}</div>
    </div>
  );
}

function FarmerDetailView({ id }: { id: string }) {
  const navigate = useNavigate();
  const [data, setData] = useState<FarmerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const d = await getFarmer(id);
        if (active) setData(d);
      } catch (e: any) {
        if (active) setError(e?.message || "Could not load this farmer.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading)
    return (
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
        </div>
      </div>
    );

  if (error || !data)
    return (
      <div className="mx-auto max-w-7xl">
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/farmer-profiles" })}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
          {error || "Farmer not found."}
        </div>
      </div>
    );

  const p: any = data.profile || {};
  const personal = p.personal || {};
  const farm = p.farm || {};
  const finance = p.finance || {};
  const community = p.community || {};
  const channel = p.channel || {};
  const result: any = data.latest || {};
  // A fully-scored assessment has model drivers; a USSD/pending application (or a
  // legacy thin record) does not — render those gracefully instead of crashing.
  const scored = result.creditReadinessScore != null && Array.isArray(result.drivers);
  const appId = data.summary?.id;

  return (
    <div className="mx-auto max-w-7xl">
      <button
        onClick={() => navigate({ to: "/dashboard/farmer-profiles" })}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All farmers
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{personal.fullName || "Unknown Farmer"}</h2>
          <div className="text-sm text-muted-foreground">
            <MapPin className="mr-1 inline h-3.5 w-3.5" />
            {personal.village ? `${personal.village}, ` : ""}{personal.county || "—"} · {personal.phone || "no phone"}
          </div>
        </div>
        {scored ? (
          <Link to="/dashboard/new-assessment"><Button>Re-assess</Button></Link>
        ) : appId ? (
          <Link to="/dashboard/new-assessment" search={{ application: appId } as any}>
            <Button>Complete assessment</Button>
          </Link>
        ) : null}
      </div>

      {/* Pending banner for unassessed (e.g. USSD) applications */}
      {!scored && (
        <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-sm text-indigo-900">
          <div className="font-medium">This application is pending assessment.</div>
          <p className="mt-1 text-indigo-800/80">
            {channel.source === "USSD" ? "Submitted via USSD" : "Submitted"}
            {channel.preferredLanguage ? ` · preferred language: ${channel.preferredLanguage}` : ""}
            {Array.isArray(channel.requestedCategories) && channel.requestedCategories.length
              ? ` · requested: ${channel.requestedCategories.join(", ")}`
              : ""}
            . Open it to complete the captured details and run the assessment.
          </p>
          {appId && (
            <Link
              to="/dashboard/new-assessment"
              search={{ application: appId } as any}
              className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:underline"
            >
              Complete assessment →
            </Link>
          )}
        </div>
      )}

      {/* Score hero */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-linear-to-r from-emerald-500 to-sky-500 p-5 text-white">
          <div className="text-sm font-medium">Credit Readiness</div>
          <div className="mt-2 text-3xl font-bold">
            {result.creditReadinessScore != null ? `${result.creditReadinessScore}%` : "—"}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm text-muted-foreground">Confidence</div>
          <div className="mt-2 text-3xl font-bold text-foreground">
            {result.confidenceScore != null ? `${result.confidenceScore}%` : "—"}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm text-muted-foreground">{scored ? "Recommendation" : "Status"}</div>
          <div className="mt-2 text-2xl font-semibold text-foreground">
            {result.recommendation || data.summary?.status || "Pending"}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm text-muted-foreground">Loan Requested</div>
          <div className="mt-2 text-2xl font-semibold text-foreground">{formatKES(Number(personal.loanAmountRequested) || 0)}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Drivers — only when scored */}
          {scored && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">Why this score (model drivers)</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.drivers.map((d: any) => (
                  <span
                    key={d.feature}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${d.direction === "positive" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                  >
                    {d.direction === "positive" ? "▲" : "▼"} {d.label}: {d.value}
                  </span>
                ))}
              </div>
              {result.explanation?.summary && (
                <p className="mt-3 text-sm text-muted-foreground">{result.explanation.summary}</p>
              )}
            </div>
          )}

          {/* Profile data — always available */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-base font-semibold text-foreground">Personal & Farm</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Field label="National ID" value={personal.nationalId} />
              <Field label="Gender" value={personal.gender} />
              <Field label="County" value={personal.county} />
              <Field label="Farm area" value={farm.areaHa ? `${farm.areaHa} ha` : ""} />
              <Field label="Main crops" value={farm.mainCrops} />
              <Field label="Irrigation" value={farm.irrigation} />
            </div>
            <h3 className="mt-6 text-base font-semibold text-foreground">Financial & Community</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Field label="Repayment history" value={finance.repaymentHistory} />
              <Field label="Savings" value={finance.savings ? formatKES(Number(finance.savings)) : ""} />
              <Field label="Monthly income" value={finance.averageMonthlyIncome ? formatKES(Number(finance.averageMonthlyIncome)) : ""} />
              <Field label="Mobile money" value={finance.mobileMoneyActivity} />
              <Field label="Cooperative" value={community.cooperativeMembership || community.cooperative} />
              <Field label="Preferred language" value={channel.preferredLanguage} />
            </div>
          </div>

          {/* Assessment history */}
          {Array.isArray(data.history) && data.history.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">Assessment History</h3>
              <div className="mt-3 space-y-2">
                {data.history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between border-b border-border/60 pb-2 text-sm last:border-0">
                    <span className="text-muted-foreground">{formatDate(h.createdAt)}</span>
                    <span className="font-medium">{h.readiness != null ? `${h.readiness}% readiness` : "Not assessed"}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusClasses(h.status)}`}>{h.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: scores, climate, graph — only when present */}
        <div className="space-y-6">
          {scored && result.dimensionScores && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Dimension Scores</h3>
              <div className="mt-3 space-y-2">
                {Object.entries(result.dimensionScores).map(([k, v]) => (
                  <div key={k}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize text-muted-foreground">{k.replace(/([A-Z])/g, " $1")}</span>
                      <span className="font-medium text-foreground">{v as number}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-muted/30">
                      <div style={{ width: `${v}%` }} className="h-1.5 rounded-full bg-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.climate && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><CloudRain className="h-4 w-4 text-sky-500" /> Climate</h3>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Rainfall</span><span>{result.climate.rainfallMmYr} mm/yr</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Avg temp</span><span>{result.climate.avgTempC} °C</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Drought risk</span><span>{result.climate.droughtRiskPct}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Soil</span><span>{result.climate.soilSuitability}</span></div>
                <div className="mt-1 text-xs text-muted-foreground">Source: {result.climate.source}</div>
              </div>
            </div>
          )}

          {result.graphFeatures && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><Share2 className="h-4 w-4 text-primary" /> Knowledge Graph</h3>
              <p className="mt-2 text-sm text-muted-foreground">Cooperative network strength {result.graphFeatures.cooperativeNetworkStrength} · peer repayment {result.graphFeatures.peerRepaymentScore}</p>
              <Link to="/dashboard/knowledge-graph" search={{ id } as any} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                Open in graph explorer →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FarmerProfilesPage() {
  const { id } = Route.useSearch();
  return id ? <FarmerDetailView id={id} /> : <FarmerList />;
}

export const Route = createFileRoute("/dashboard/farmer-profiles")({
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: () => (
    <DashboardLayout>
      <FarmerProfilesPage />
    </DashboardLayout>
  ),
});

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Cpu, ChevronDown } from "lucide-react";

import DashboardLayout from "@/components/dashboard/Layout";
import {
  listAssessments,
  getAssessment,
  type AssessmentSummary,
  type AssessmentResult,
} from "@/lib/api";
import { formatDate, statusClasses, readinessClasses } from "@/lib/format";

function ScoreRing({ score }: { score: number }) {
  return (
    <svg className="h-16 w-16 shrink-0" viewBox="0 0 36 36">
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
      <path
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none"
        stroke={score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#f43f5e"}
        strokeWidth="3"
        strokeDasharray={`${score}, 100`}
      />
      <text x="18" y="21" fontSize="9" textAnchor="middle" className="fill-foreground font-semibold">{score}</text>
    </svg>
  );
}

function AssessmentCard({ item }: { item: AssessmentSummary }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !detail) {
      setLoading(true);
      try {
        const d = await getAssessment(item.id);
        setDetail(d.result);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-4">
        <ScoreRing score={item.readiness} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-foreground">{item.farmerName}</div>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusClasses(item.status)}`}>
              {item.status}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {item.county || "—"} · Confidence {item.confidence}% · {formatDate(item.createdAt)}
          </div>
          <div className="mt-1 text-sm">
            Recommendation: <span className={`font-medium ${readinessClasses(item.readiness)}`}>{item.recommendation}</span>
          </div>
        </div>
      </div>

      <button onClick={toggle} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        Explainability <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 border-t border-border pt-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading drivers…</div>
          ) : detail ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top model drivers (SHAP)</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detail.drivers.map((d) => (
                    <span
                      key={d.feature}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${d.direction === "positive" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                      title={`impact ${d.impact >= 0 ? "+" : ""}${d.impact}`}
                    >
                      {d.direction === "positive" ? "▲" : "▼"} {d.label}: {d.value}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{detail.explanation.summary}</p>
              <div className="text-xs text-muted-foreground">
                Model {detail.modelVersion} · Graph features: {detail.graphFeatures.source} · Explanation: {detail.explanation.source}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function AIAssessmentsPage() {
  const [items, setItems] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listAssessments(100);
        if (active) setItems(data);
      } catch (e: any) {
        if (active) setError(e?.message || "Could not load assessments.");
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
        <Cpu className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-semibold text-foreground">AI Assessments</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Every model-scored assessment with its explainable AI drivers.
      </p>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading assessments…
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">{error}</div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No assessments yet. <Link to="/dashboard/new-assessment" className="text-primary hover:underline">Run one</Link>.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <AssessmentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/dashboard/ai-assessments")({
  component: () => <DashboardLayout>{<AIAssessmentsPage />}</DashboardLayout>,
});

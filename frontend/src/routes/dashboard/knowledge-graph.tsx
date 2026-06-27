import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Share2 } from "lucide-react";

import DashboardLayout from "@/components/dashboard/Layout";
import {
  listFarmers,
  getFarmerGraph,
  type AssessmentSummary,
  type GraphData,
} from "@/lib/api";

const NODE_COLORS: Record<string, string> = {
  Farmer: "#6366f1",
  County: "#0ea5e9",
  Cooperative: "#10b981",
  Sacco: "#f59e0b",
  Crop: "#84cc16",
  default: "#94a3b8",
};

function GraphView({ graph }: { graph: GraphData }) {
  const W = 720;
  const H = 460;
  const cx = W / 2;
  const cy = H / 2;
  const r = 165;

  const layout = useMemo(() => {
    const farmer = graph.nodes.find((n) => n.label === "Farmer");
    const others = graph.nodes.filter((n) => n.label !== "Farmer");
    const positions: Record<string, { x: number; y: number }> = {};
    if (farmer) positions[farmer.id] = { x: cx, y: cy };
    others.forEach((n, i) => {
      const angle = (i / Math.max(1, others.length)) * Math.PI * 2 - Math.PI / 2;
      positions[n.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
    return positions;
  }, [graph]);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-3xl">
        {graph.edges.map((e, i) => {
          const a = layout[e.source];
          const b = layout[e.target];
          if (!a || !b) return null;
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#cbd5e1" strokeWidth={1.5} />
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} fontSize="9" textAnchor="middle" className="fill-muted-foreground">
                {e.rel}
              </text>
            </g>
          );
        })}
        {graph.nodes.map((n) => {
          const pos = layout[n.id];
          if (!pos) return null;
          const isFarmer = n.label === "Farmer";
          const color = NODE_COLORS[n.label] || NODE_COLORS.default;
          return (
            <g key={n.id}>
              <circle cx={pos.x} cy={pos.y} r={isFarmer ? 34 : 26} fill={color} opacity={0.95} />
              <text x={pos.x} y={pos.y - (isFarmer ? 2 : 1)} fontSize="9" textAnchor="middle" className="fill-white font-semibold">
                {n.label}
              </text>
              <text x={pos.x} y={pos.y + 10} fontSize="8" textAnchor="middle" className="fill-white">
                {(n.name || "").slice(0, 14)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function KnowledgeGraphPage() {
  const { id } = Route.useSearch();
  const [farmers, setFarmers] = useState<AssessmentSummary[]>([]);
  const [selected, setSelected] = useState<string>(id || "");
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await listFarmers();
        if (!active) return;
        setFarmers(list);
        if (!selected && list.length) setSelected(list[0].farmerId);
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

  useEffect(() => {
    if (!selected) return;
    let active = true;
    (async () => {
      try {
        const g = await getFarmerGraph(selected);
        if (active) setGraph(g);
      } catch (e: any) {
        if (active) setError(e?.message || "Could not load graph.");
      }
    })();
    return () => {
      active = false;
    };
  }, [selected]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-semibold text-foreground">Knowledge Graph</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Relationships between farmers, cooperatives, SACCOs, counties and crops.
      </p>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">{error}</div>
      ) : farmers.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No farmers in the graph yet. Run an assessment first.
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-3">
            <label className="text-sm text-muted-foreground">Farmer</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {farmers.map((f) => (
                <option key={f.farmerId} value={f.farmerId}>
                  {f.farmerName} — {f.county || "—"}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            {graph ? (
              graph.nodes.length ? (
                <GraphView graph={graph} />
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">No relationships recorded for this farmer.</div>
              )
            ) : (
              <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading graph…
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
              {Object.entries(NODE_COLORS)
                .filter(([k]) => k !== "default")
                .map(([k, c]) => (
                  <span key={k} className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full" style={{ background: c }} /> {k}
                  </span>
                ))}
              {graph && <span className="ml-auto">Source: {graph.source}</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute("/dashboard/knowledge-graph")({
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: () => (
    <DashboardLayout>
      <KnowledgeGraphPage />
    </DashboardLayout>
  ),
});

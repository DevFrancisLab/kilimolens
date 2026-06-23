import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";

function KnowledgeGraph() {
  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="text-lg font-semibold text-foreground">Knowledge Graph</h2>
      <p className="mt-2 text-sm text-muted-foreground">Explore relationships between farmers, cooperatives and risk drivers.</p>
      <div className="mt-4 rounded-2xl border border-border bg-card p-6">Graph explorer (UI only)</div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/knowledge-graph")({
  component: () => <DashboardLayout>{<KnowledgeGraph />}</DashboardLayout>,
});

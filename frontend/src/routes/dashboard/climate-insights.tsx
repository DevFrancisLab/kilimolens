import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";

function ClimateInsights() {
  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="text-lg font-semibold text-foreground">Climate Insights</h2>
      <p className="mt-2 text-sm text-muted-foreground">Seasonal outlooks, rainfall trends and risk maps.</p>
      <div className="mt-4 rounded-2xl border border-border bg-card p-6">Climate dashboards (UI only)</div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/climate-insights")({
  component: () => <DashboardLayout>{<ClimateInsights />}</DashboardLayout>,
});

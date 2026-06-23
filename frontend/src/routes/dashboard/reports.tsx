import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";

function Reports() {
  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="text-lg font-semibold text-foreground">Reports</h2>
      <p className="mt-2 text-sm text-muted-foreground">Exportable reports for portfolios and assessments.</p>
      <div className="mt-4 rounded-2xl border border-border bg-card p-6">Report builder (UI only)</div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/reports")({
  component: () => <DashboardLayout>{<Reports />}</DashboardLayout>,
});

import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";

function Applications() {
  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="text-lg font-semibold text-foreground">Applications</h2>
      <p className="mt-2 text-sm text-muted-foreground">List of loan applications and statuses.</p>
      <div className="mt-4 rounded-2xl border border-border bg-card p-6">Applications table (UI only)</div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/applications")({
  component: () => <DashboardLayout>{<Applications />}</DashboardLayout>,
});

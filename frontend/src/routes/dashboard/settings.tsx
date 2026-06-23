import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";

function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-lg font-semibold text-foreground">Settings</h2>
      <p className="mt-2 text-sm text-muted-foreground">Manage profile, preferences and integrations.</p>
      <div className="mt-4 rounded-2xl border border-border bg-card p-6">Settings UI (UI only)</div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/settings")({
  component: () => <DashboardLayout>{<SettingsPage />}</DashboardLayout>,
});

import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";

function AIAssessments() {
  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="text-lg font-semibold text-foreground">AI Assessments</h2>
      <p className="mt-2 text-sm text-muted-foreground">Model-driven assessments and explainability details.</p>
      <div className="mt-4 rounded-2xl border border-border bg-card p-6">AI assessment list (UI only)</div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/ai-assessments")({
  component: () => <DashboardLayout>{<AIAssessments />}</DashboardLayout>,
});

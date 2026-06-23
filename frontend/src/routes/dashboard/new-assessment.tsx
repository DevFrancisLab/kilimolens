import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";
import NewAssessmentWizard from "@/components/dashboard/NewAssessmentWizard";

export const Route = createFileRoute("/dashboard/new-assessment")({
  component: () => <DashboardLayout>{<NewAssessmentWizard />}</DashboardLayout>,
});

import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";
import NewAssessmentWizard from "@/components/dashboard/NewAssessmentWizard";

type NewAssessmentSearch = { application?: string };

function NewAssessmentPage() {
  const { application } = Route.useSearch();
  return (
    <DashboardLayout>
      <NewAssessmentWizard applicationId={application} />
    </DashboardLayout>
  );
}

export const Route = createFileRoute("/dashboard/new-assessment")({
  validateSearch: (search: Record<string, unknown>): NewAssessmentSearch => ({
    application: typeof search.application === "string" ? search.application : undefined,
  }),
  component: NewAssessmentPage,
});

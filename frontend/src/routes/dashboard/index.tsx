import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";
import Overview from "@/components/dashboard/Overview";

export const Route = createFileRoute("/dashboard/")({
  component: () => <DashboardLayout>{<Overview />}</DashboardLayout>,
});

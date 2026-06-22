import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowUpRight, Users, FilePlus, FileText } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — KilimoLens" }] }),
  component: Dashboard,
});

function KPI({ title, value, desc }: { title: string; value: React.ReactNode; desc?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{value}</CardTitle>
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      {desc ? <CardContent>{desc}</CardContent> : null}
    </Card>
  );
}

function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Loan Officer Dashboard</h1>
          <div className="flex items-center gap-2">
            <a href="/dashboard/new-assessment" className="inline-flex items-center gap-2 rounded-md gradient-brand px-3 py-2 text-sm font-semibold text-primary-foreground">
              <FilePlus className="h-4 w-4" /> New Assessment
            </a>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <KPI title="Active Applications" value={<span className="text-2xl font-bold">128</span>} />
          <KPI title="Farmers Indexed" value={<span className="text-2xl font-bold">1,240</span>} />
          <KPI title="Avg Decision Time" value={<span className="text-2xl font-bold">2.3h</span>} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>Latest loan applications received</CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">Updated just now</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                    <div>
                      <div className="text-sm font-medium">Applicant #{1000 + n}</div>
                      <div className="text-xs text-muted-foreground">Maize — 4 acres — Cooperative A</div>
                    </div>
                    <div className="text-sm text-muted-foreground">Review</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Farmer Profiles</CardTitle>
                <CardDescription>Recent profiles added to the system</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {["Asha N.", "Kamau K.", "Mwangi M."].map((f) => (
                  <li key={f} className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">👩🏽‍🌾</div>
                      <div>
                        <div className="text-sm font-medium">{f}</div>
                        <div className="text-xs text-muted-foreground">Farmer profile</div>
                      </div>
                    </div>
                    <a className="text-sm text-primary">View</a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}

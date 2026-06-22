import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  ArrowUpRight,
  Users,
  FilePlus,
  FileText,
  Activity,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Heart,
  Percent,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — KilimoLens" }] }),
  component: Dashboard,
});

function KPI({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ComponentType<any>;
  trend?: { value: string; up?: boolean };
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{title}</div>
                <div className="mt-1 text-2xl font-semibold">{value}</div>
              </div>
            </div>
          </div>

          {trend ? (
            <div
              className={`flex items-center gap-2 rounded-md px-3 py-1 text-sm font-medium ${
                trend.up ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
              }`}
            >
              <span className="inline-flex items-center">
                {trend.up ? <TrendingUp className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </span>
              <span>{trend.value}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
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

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="transform transition-transform hover:-translate-y-1">
            <KPI title="Pending Applications" value={<span>42</span>} icon={FileText} trend={{ value: "+8%", up: true }} />
          </div>

          <div className="transform transition-transform hover:-translate-y-1">
            <KPI title="Applications Under Review" value={<span>19</span>} icon={Activity} trend={{ value: "-4%", up: false }} />
          </div>

          <div className="transform transition-transform hover:-translate-y-1">
            <KPI title="Loans Approved Today" value={<span>7</span>} icon={CheckCircle2} trend={{ value: "+35%", up: true }} />
          </div>

          <div className="transform transition-transform hover:-translate-y-1">
            <KPI title="Average Finance Readiness" value={<span>72%</span>} icon={Percent} trend={{ value: "+2%", up: true }} />
          </div>

          <div className="transform transition-transform hover:-translate-y-1">
            <KPI title="High Climate Risk Farmers" value={<span>56</span>} icon={AlertTriangle} trend={{ value: "+12%", up: false }} />
          </div>

          <div className="transform transition-transform hover:-translate-y-1">
            <KPI title="Portfolio Health" value={<span>Good</span>} icon={Heart} trend={{ value: "+1%", up: true }} />
          </div>
        </section>

        {/* Recent Applications Table */}
        <section>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Loan Applications</CardTitle>
                  <CardDescription>Latest applications and recommendations</CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">Updated moments ago</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="px-4 py-3">Farmer</th>
                      <th className="px-4 py-3">County</th>
                      <th className="px-4 py-3">Loan Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Finance Readiness</th>
                      <th className="px-4 py-3">Recommendation</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      {
                        farmer: "Asha N.",
                        county: "Kiambu",
                        amount: "KES 120,000",
                        status: "Under review",
                        readiness: "68%",
                        rec: "Conditional approval",
                      },
                      {
                        farmer: "Kamau K.",
                        county: "Nakuru",
                        amount: "KES 80,000",
                        status: "Pending",
                        readiness: "55%",
                        rec: "Request more docs",
                      },
                      {
                        farmer: "Mwangi M.",
                        county: "Embu",
                        amount: "KES 200,000",
                        status: "Approved",
                        readiness: "85%",
                        rec: "Approve",
                      },
                      {
                        farmer: "Fatima S.",
                        county: "Kilifi",
                        amount: "KES 45,000",
                        status: "Under review",
                        readiness: "49%",
                        rec: "Decline",
                      },
                    ].map((r) => (
                      <tr key={r.farmer} className="bg-background">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium">{r.farmer}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{r.county}</td>
                        <td className="px-4 py-3 text-sm">{r.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.status === "Approved" ? "bg-green-600/10 text-green-600" : r.status === "Pending" ? "bg-yellow-600/10 text-yellow-600" : "bg-blue-600/10 text-blue-600"
                          }`}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">{r.readiness}</td>
                        <td className="px-4 py-3 text-sm">{r.rec}</td>
                        <td className="px-4 py-3 text-sm">
                          <a className="text-sm text-primary mr-3">View</a>
                          <a className="text-sm text-muted-foreground">Notes</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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

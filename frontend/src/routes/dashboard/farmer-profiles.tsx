import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Sprout, CloudRain, Users, Activity, FileBarChart, Building2, Layers } from "lucide-react";

function FarmerProfilePage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Load a draft assessment as mock profile when available
    try {
      const raw = localStorage.getItem("assessment_draft");
      if (raw) {
        setProfile(JSON.parse(raw));
        return;
      }
    } catch (e) {
      // ignore
    }

    // fallback mock
    setProfile({
      personal: {
        fullName: "Jane Njoroge",
        nationalId: "12345678",
        phone: "+254700111222",
        county: "Embu",
        village: "Kibugu",
      },
      farm: { farmName: "Kibugu Farm", areaHa: "2.5", mainCrops: "Maize, Beans" },
      finance: { previousLoans: "Yes", repaymentHistory: "Good", savings: "KSh 12,000" },
      community: { cooperative: "Yes", saccoMembership: "Kenya SACCO" },
      climate: { cropDiversification: "Moderate", droughtResistantCrops: "Some" },
    });
  }, []);

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{profile.personal.fullName}</h2>
          <div className="text-sm text-muted-foreground">Farmer profile • {profile.farm.farmName}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => alert('Export profile (UI-only)')}>Export</Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/new-assessment'}>Assess</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {/* Left column: summary */}
        <div className="space-y-4">
          <Card>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar>
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-500 text-white">{(profile.personal.fullName || 'F').slice(0,1)}</div>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{profile.personal.fullName}</div>
                  <div className="text-xs text-muted-foreground">{profile.personal.phone}</div>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <div className="text-xs text-muted-foreground">Location</div>
                <div className="text-sm">{profile.personal.village}, {profile.personal.county}</div>

                <div className="text-xs text-muted-foreground mt-2">Farm area</div>
                <div className="text-sm">{profile.farm.areaHa} ha</div>

                <div className="text-xs text-muted-foreground mt-2">Primary crops</div>
                <div className="text-sm">{profile.farm.mainCrops}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <li className="text-sm"><strong>2024-06-12:</strong> Joined cooperative</li>
                <li className="text-sm"><strong>2023-11-01:</strong> Took a working capital loan (KSh 50,000)</li>
                <li className="text-sm"><strong>2022-04-20:</strong> Attended climate-smart training</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Knowledge Graph</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded bg-muted px-3 py-1 text-sm">SACCO: {profile.community.saccoMembership || '—'}</span>
                <span className="inline-flex items-center gap-2 rounded bg-muted px-3 py-1 text-sm">Cooperative: {profile.community.cooperative}</span>
                <span className="inline-flex items-center gap-2 rounded bg-muted px-3 py-1 text-sm">Climate: {profile.climate.cropDiversification}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: detailed sections spanning 2 cols */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Full name</div>
                  <div className="text-sm">{profile.personal.fullName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">National ID</div>
                  <div className="text-sm">{profile.personal.nationalId}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div className="text-sm">{profile.personal.phone}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">County</div>
                  <div className="text-sm">{profile.personal.county}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Farm History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">Farm name: <strong>{profile.farm.farmName}</strong></div>
              <div className="text-sm mt-1">Area: <strong>{profile.farm.areaHa} ha</strong></div>
              <div className="text-sm mt-1">Main crops: <strong>{profile.farm.mainCrops}</strong></div>
              <div className="mt-3 text-xs text-muted-foreground">History: cultivated maize and beans for 5+ years; occasional intercropping.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loan History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>2023 — Working capital — KSh 50,000 — Repaid</div>
                <div>2021 — Input loan — KSh 20,000 — Repaid</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assessment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>2024-06-01 — Assessment (Finance readiness 78%)</div>
                <div>2023-10-15 — Assessment (Finance readiness 65%)</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Climate History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <CloudRain className="h-5 w-5 text-sky-500" />
                  <div>
                    <div className="text-sm">Average rainfall: <strong>420 mm/yr</strong></div>
                    <div className="text-xs text-muted-foreground">Last 5 years (mock)</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-rose-500" />
                  <div>
                    <div className="text-sm">Drought events: <strong>2 in last 5 years</strong></div>
                    <div className="text-xs text-muted-foreground">(mock)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>2024-06-12:</strong> Cooperative enrollment</div>
                <div><strong>2023-11-01:</strong> Loan disbursed</div>
                <div><strong>2022-04-20:</strong> Climate training</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/farmer-profiles")({
  component: () => <DashboardLayout>{<FarmerProfilePage />}</DashboardLayout>,
});

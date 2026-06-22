import React, { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Save, X } from "lucide-react";

export const Route = createFileRoute("/dashboard/new-assessment")({
  head: () => ({ meta: [{ title: "New Assessment — KilimoLens" }] }),
  component: NewAssessment,
});

type FormState = {
  personal: {
    name: string;
    phone: string;
    idNumber: string;
  };
  farm: {
    county: string;
    village: string;
    hectares: string;
    mainCrop: string;
  };
  finance: {
    previousLoans: string;
    repaymentHistory: string;
    avgIncomePerSeason: string;
  };
  community: {
    cooperative: string;
    references: string;
    verified: boolean;
  };
  climate: {
    irrigation: string;
    soilType: string;
    droughtHistory: string;
  };
};

const emptyForm: FormState = {
  personal: { name: "", phone: "", idNumber: "" },
  farm: { county: "", village: "", hectares: "", mainCrop: "" },
  finance: { previousLoans: "No", repaymentHistory: "Good", avgIncomePerSeason: "0" },
  community: { cooperative: "", references: "", verified: false },
  climate: { irrigation: "None", soilType: "Loam", droughtHistory: "None" },
};

function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="mb-4 flex items-center gap-4 overflow-auto">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
              i === current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}
          </div>
          <div className={`whitespace-nowrap text-sm ${i === current ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {s}
          </div>
        </div>
      ))}
    </div>
  );
}

function FormCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {desc ? <CardDescription>{desc}</CardDescription> : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function NewAssessment() {
  const steps = useMemo(
    () => [
      "Personal Information",
      "Farm Information",
      "Financial Behaviour",
      "Community & Verification",
      "Climate & Farming Practices",
      "Review Assessment",
      "AI Assessment Results",
    ],
    [],
  );

  const [current, setCurrent] = useState(0);
  const [form, setForm] = useState<FormState>(() => {
    try {
      const raw = localStorage.getItem("newAssessmentDraft");
      return raw ? (JSON.parse(raw) as FormState) : emptyForm;
    } catch {
      return emptyForm;
    }
  });

  function update<T extends keyof FormState>(section: T, patch: Partial<FormState[T]>) {
    setForm((f) => ({ ...f, [section]: { ...f[section], ...patch } }));
  }

  function next() {
    setCurrent((c) => Math.min(c + 1, steps.length - 1));
  }
  function back() {
    setCurrent((c) => Math.max(c - 1, 0));
  }

  function saveDraft() {
    try {
      localStorage.setItem("newAssessmentDraft", JSON.stringify(form));
      // lightweight feedback
      // eslint-disable-next-line no-console
      console.log("Draft saved");
    } catch (e) {
      console.error(e);
    }
  }

  function cancel() {
    // simply navigate back to dashboard. The route uses Link to keep SPA behavior.
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">New Assessment</h1>
        </header>

        <Stepper steps={steps} current={current} />

        {/* Step area */}
        <div>
          {current === 0 && (
            <FormCard title="Personal Information" desc="Basic farmer and applicant details.">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input value={form.personal.name} onChange={(e) => update("personal", { name: e.target.value })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.personal.phone} onChange={(e) => update("personal", { phone: e.target.value })} />
                </div>
                <div>
                  <Label>ID Number</Label>
                  <Input value={form.personal.idNumber} onChange={(e) => update("personal", { idNumber: e.target.value })} />
                </div>
              </div>
            </FormCard>
          )}

          {current === 1 && (
            <FormCard title="Farm Information" desc="Location and production details.">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>County</Label>
                  <Input value={form.farm.county} onChange={(e) => update("farm", { county: e.target.value })} />
                </div>
                <div>
                  <Label>Village</Label>
                  <Input value={form.farm.village} onChange={(e) => update("farm", { village: e.target.value })} />
                </div>
                <div>
                  <Label>Hectares</Label>
                  <Input value={form.farm.hectares} onChange={(e) => update("farm", { hectares: e.target.value })} />
                </div>
                <div>
                  <Label>Main crop</Label>
                  <Input value={form.farm.mainCrop} onChange={(e) => update("farm", { mainCrop: e.target.value })} />
                </div>
              </div>
            </FormCard>
          )}

          {current === 2 && (
            <FormCard title="Financial Behaviour" desc="Understand past loans and repayment behaviour.">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Previous loans</Label>
                  <Input value={form.finance.previousLoans} onChange={(e) => update("finance", { previousLoans: e.target.value })} />
                </div>
                <div>
                  <Label>Repayment history</Label>
                  <Input value={form.finance.repaymentHistory} onChange={(e) => update("finance", { repaymentHistory: e.target.value })} />
                </div>
                <div>
                  <Label>Avg income per season</Label>
                  <Input value={form.finance.avgIncomePerSeason} onChange={(e) => update("finance", { avgIncomePerSeason: e.target.value })} />
                </div>
              </div>
            </FormCard>
          )}

          {current === 3 && (
            <FormCard title="Community & Verification" desc="Cooperative memberships and references.">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Cooperative</Label>
                  <Input value={form.community.cooperative} onChange={(e) => update("community", { cooperative: e.target.value })} />
                </div>
                <div>
                  <Label>References</Label>
                  <Input value={form.community.references} onChange={(e) => update("community", { references: e.target.value })} />
                </div>
                <div>
                  <Label>Verified</Label>
                  <div className="mt-2">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={form.community.verified} onChange={(e) => update("community", { verified: e.target.checked })} />
                      <span className="text-sm text-muted-foreground">Onsite verification available</span>
                    </label>
                  </div>
                </div>
              </div>
            </FormCard>
          )}

          {current === 4 && (
            <FormCard title="Climate & Farming Practices" desc="Irrigation, soil and historical climate exposure.">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Irrigation</Label>
                  <Input value={form.climate.irrigation} onChange={(e) => update("climate", { irrigation: e.target.value })} />
                </div>
                <div>
                  <Label>Soil type</Label>
                  <Input value={form.climate.soilType} onChange={(e) => update("climate", { soilType: e.target.value })} />
                </div>
                <div>
                  <Label>Drought history</Label>
                  <Input value={form.climate.droughtHistory} onChange={(e) => update("climate", { droughtHistory: e.target.value })} />
                </div>
              </div>
            </FormCard>
          )}

          {current === 5 && (
            <FormCard title="Review Assessment" desc="Review all entered information before submission.">
              <div className="space-y-3">
                <pre className="rounded-md bg-background p-3 text-sm">{JSON.stringify(form, null, 2)}</pre>
              </div>
            </FormCard>
          )}

          {current === 6 && (
            <FormCard title="AI Assessment Results" desc="Mocked AI results based on submitted data.">
              <div className="space-y-4">
                <div className="rounded-md border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Resilience Score</div>
                      <div className="text-2xl font-semibold">68 / 100</div>
                    </div>
                    <div className="text-sm text-muted-foreground">Confidence: 82%</div>
                  </div>
                </div>

                <div className="rounded-md border border-border bg-card p-4">
                  <div className="text-sm font-medium">Suggested Recommendation</div>
                  <div className="mt-2">Conditional approval — recommended monitoring and climate adaptation support.</div>
                </div>
              </div>
            </FormCard>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={back} disabled={current === 0}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button variant="default" onClick={next}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={saveDraft}>
              <Save className="h-4 w-4" /> Save Draft
            </Button>
            <Link to="/dashboard" className="inline-block">
              <Button variant="ghost">
                <X className="h-4 w-4" /> Cancel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

import React, { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Save, X } from "lucide-react";

export const Route = createFileRoute("/dashboard/new-assessment")({
  head: () => ({ meta: [{ title: "New Assessment — KilimoLens" }] }),
  component: NewAssessment,
});

type FormState = {
  personal: {
    fullName: string;
    nationalId: string;
    phone: string;
    gender: string;
    age: string;
    county: string;
    subCounty: string;
    ward: string;
    village: string;
    gps: string;
    loanAmount: string;
    loanPurpose: string;
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
  personal: {
    fullName: "",
    nationalId: "",
    phone: "",
    gender: "",
    age: "",
    county: "",
    subCounty: "",
    ward: "",
    village: "",
    gps: "",
    loanAmount: "",
    loanPurpose: "",
  },
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

  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({});

  function update<T extends keyof FormState>(section: T, patch: Partial<FormState[T]>) {
    setForm((f) => ({ ...f, [section]: { ...f[section], ...patch } }));
  }

  function next() {
    // run step-specific validation
    if (current === 0) {
      const errs = validatePersonal(form.personal);
      setPersonalErrors(errs);
      if (Object.keys(errs).length > 0) return; // prevent advancing
    }
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

  function validatePersonal(p: FormState["personal"]) {
    const e: Record<string, string> = {};
    if (!p.fullName || p.fullName.trim().length < 3) e.fullName = "Enter full name";
    if (!p.nationalId || !/^[0-9A-Za-z-]{4,}$/.test(p.nationalId)) e.nationalId = "Enter a valid ID";
    if (!p.phone || !/^\+?[0-9\s-]{6,}$/.test(p.phone)) e.phone = "Enter a valid phone number";
    if (!p.gender) e.gender = "Select gender";
    if (!p.age || Number.isNaN(Number(p.age)) || Number(p.age) <= 0) e.age = "Enter a valid age";
    if (!p.county) e.county = "Required";
    if (!p.subCounty) e.subCounty = "Required";
    if (!p.ward) e.ward = "Required";
    if (!p.village) e.village = "Required";
    if (!p.gps || !/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(p.gps)) e.gps = "Enter GPS as 'lat, lon'";
    if (!p.loanAmount || Number.isNaN(Number(p.loanAmount.replace(/[^0-9.]/g, ""))) ) e.loanAmount = "Enter amount";
    if (!p.loanPurpose || p.loanPurpose.trim().length < 3) e.loanPurpose = "Describe loan purpose";
    return e;
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
                  <Label>Full Name</Label>
                  <Input
                    value={form.personal.fullName}
                    onChange={(e) => update("personal", { fullName: e.target.value })}
                    className={cn(personalErrors.fullName && "border-destructive")}
                  />
                </div>

                <div>
                  <Label>National ID</Label>
                  <Input
                    value={form.personal.nationalId}
                    onChange={(e) => update("personal", { nationalId: e.target.value })}
                    className={cn(personalErrors.nationalId && "border-destructive")}
                  />
                </div>

                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={form.personal.phone}
                    onChange={(e) => update("personal", { phone: e.target.value })}
                    className={cn(personalErrors.phone && "border-destructive")}
                  />
                </div>

                <div>
                  <Label>Gender</Label>
                  <select
                    className={cn(
                      "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base focus-visible:outline-none",
                      personalErrors.gender && "border-destructive",
                    )}
                    value={form.personal.gender}
                    onChange={(e) => update("personal", { gender: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <Label>Age</Label>
                  <Input
                    value={form.personal.age}
                    onChange={(e) => update("personal", { age: e.target.value })}
                    className={cn(personalErrors.age && "border-destructive")}
                  />
                </div>

                <div>
                  <Label>County</Label>
                  <Input
                    value={form.personal.county}
                    onChange={(e) => update("personal", { county: e.target.value })}
                    className={cn(personalErrors.county && "border-destructive")}
                  />
                </div>

                <div>
                  <Label>Sub County</Label>
                  <Input
                    value={form.personal.subCounty}
                    onChange={(e) => update("personal", { subCounty: e.target.value })}
                    className={cn(personalErrors.subCounty && "border-destructive")}
                  />
                </div>

                <div>
                  <Label>Ward</Label>
                  <Input
                    value={form.personal.ward}
                    onChange={(e) => update("personal", { ward: e.target.value })}
                    className={cn(personalErrors.ward && "border-destructive")}
                  />
                </div>

                <div>
                  <Label>Village</Label>
                  <Input
                    value={form.personal.village}
                    onChange={(e) => update("personal", { village: e.target.value })}
                    className={cn(personalErrors.village && "border-destructive")}
                  />
                </div>

                <div>
                  <Label>GPS Coordinates</Label>
                  <Input
                    placeholder="lat, lon"
                    value={form.personal.gps}
                    onChange={(e) => update("personal", { gps: e.target.value })}
                    className={cn(personalErrors.gps && "border-destructive")}
                  />
                </div>

                <div>
                  <Label>Loan Amount Requested</Label>
                  <Input
                    value={form.personal.loanAmount}
                    onChange={(e) => update("personal", { loanAmount: e.target.value })}
                    className={cn(personalErrors.loanAmount && "border-destructive")}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label>Purpose of Loan</Label>
                  <Input
                    value={form.personal.loanPurpose}
                    onChange={(e) => update("personal", { loanPurpose: e.target.value })}
                    className={cn(personalErrors.loanPurpose && "border-destructive")}
                  />
                </div>
              </div>

              {/* show validation messages */}
              {Object.keys(personalErrors).length > 0 && (
                <div className="mt-2 space-y-1 text-sm text-destructive">
                  {Object.entries(personalErrors).map(([k, v]) => (
                    <div key={k}>{v}</div>
                  ))}
                </div>
              )}
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

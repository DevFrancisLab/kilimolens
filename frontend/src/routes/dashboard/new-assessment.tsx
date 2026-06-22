import React, { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Save, X, MapPin, Home, Seedling, Layers, Activity, Calendar, Droplet, ShoppingCart, CreditCard, Wallet, Smartphone, DollarSign, Briefcase, Info } from "lucide-react";

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
    farmSize: string;
    landOwnership: string;
    primaryCrop: string;
    secondaryCrops: string;
    livestock: string;
    yearsFarming: string;
    irrigation: string;
    previousHarvest: string;
    expectedHarvest: string;
    inputPurchases: string;
  };
  finance: {
    previousLoans: string;
    repaymentHistory: string;
    avgIncomePerSeason: string;
    outstandingLoans: string;
    savings: string;
    avgMonthlyIncome: string;
    mobileMoneyActivity: string;
    altIncomeSources: string;
    existingDebts: string;
  };
  community: {
    cooperative: string;
    references: string;
    verified: boolean;
    saccoMembership: string;
    saccoMembershipStatus: string;
    selectedSacco: string;
    selectedSaccoStatus: string;
    yearsInSacco: string;
    yearsInSaccoStatus: string;
    cooperativeMembership: string;
    cooperativeMembershipStatus: string;
    farmerGroup: string;
    farmerGroupStatus: string;
    peerGuarantees: string;
    peerGuaranteesStatus: string;
    extensionOfficer: string;
    extensionOfficerStatus: string;
    climateTraining: string;
    climateTrainingStatus: string;
    verificationChecklist: {
      idDocument: string;
      coopLetter: string;
      onsiteVisit: string;
    };
  };
  climate: {
    irrigation: string;
    soilType: string;
    droughtHistory: string;
    cropDiversification: string;
    droughtResistantCrops: string;
    waterHarvesting: string;
    soilConservation: string;
    livelihoodDiversification: string;
    climateSmartTraining: string;
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
  farm: {
    county: "",
    village: "",
    hectares: "",
    mainCrop: "",
    farmSize: "",
    landOwnership: "",
    primaryCrop: "",
    secondaryCrops: "",
    livestock: "",
    yearsFarming: "",
    irrigation: "",
    previousHarvest: "",
    expectedHarvest: "",
    inputPurchases: "",
  },
  finance: { previousLoans: "No", repaymentHistory: "Good", avgIncomePerSeason: "0", outstandingLoans: "0", savings: "0", avgMonthlyIncome: "0", mobileMoneyActivity: "Low", altIncomeSources: "", existingDebts: "" },
  community: {
    cooperative: "",
    references: "",
    verified: false,
    saccoMembership: "",
    saccoMembershipStatus: "Pending",
    selectedSacco: "",
    selectedSaccoStatus: "Pending",
    yearsInSacco: "",
    yearsInSaccoStatus: "Pending",
    cooperativeMembership: "",
    cooperativeMembershipStatus: "Pending",
    farmerGroup: "",
    farmerGroupStatus: "Pending",
    peerGuarantees: "",
    peerGuaranteesStatus: "Pending",
    extensionOfficer: "",
    extensionOfficerStatus: "Pending",
    climateTraining: "",
    climateTrainingStatus: "Pending",
    verificationChecklist: { idDocument: "Pending", coopLetter: "Pending", onsiteVisit: "Pending" },
  },
  climate: { irrigation: "None", soilType: "Loam", droughtHistory: "None", cropDiversification: "No", droughtResistantCrops: "No", waterHarvesting: "No", soilConservation: "No", livelihoodDiversification: "No", climateSmartTraining: "No" },
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

  function badgeClass(status: string) {
    if (status === "Verified") return "inline-flex items-center rounded-full bg-green-600/10 px-2 py-0.5 text-xs font-medium text-green-600";
    if (status === "Self Declared") return "inline-flex items-center rounded-full bg-muted/10 px-2 py-0.5 text-xs font-medium text-muted-foreground";
    return "inline-flex items-center rounded-full bg-yellow-600/10 px-2 py-0.5 text-xs font-medium text-yellow-600";
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
            <FormCard title="Farm Information" desc="Details about the farm, production and inputs.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Location</div>
                      <div className="text-sm text-muted-foreground">County · Sub County · Ward · Village</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>County</Label>
                      <Input value={form.farm.county} onChange={(e) => update("farm", { county: e.target.value })} />
                    </div>
                    <div>
                      <Label>Sub County</Label>
                      <Input value={form.farm.subCounty} onChange={(e) => update("farm", { subCounty: e.target.value })} />
                    </div>
                    <div>
                      <Label>Ward</Label>
                      <Input value={form.farm.ward} onChange={(e) => update("farm", { ward: e.target.value })} />
                    </div>
                    <div>
                      <Label>Village</Label>
                      <Input value={form.farm.village} onChange={(e) => update("farm", { village: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Farm Size (hectares)</Label>
                      <Input value={form.farm.farmSize} onChange={(e) => update("farm", { farmSize: e.target.value })} />
                    </div>
                    <div>
                      <Label>Land Ownership</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base focus-visible:outline-none"
                        value={form.farm.landOwnership}
                        onChange={(e) => update("farm", { landOwnership: e.target.value })}
                      >
                        <option value="">Select</option>
                        <option>Owned</option>
                        <option>Leased</option>
                        <option>Communal</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Years Farming</Label>
                      <Input value={form.farm.yearsFarming} onChange={(e) => update("farm", { yearsFarming: e.target.value })} />
                    </div>
                    <div>
                      <Label>Livestock (type / count)</Label>
                      <Input value={form.farm.livestock} onChange={(e) => update("farm", { livestock: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
                      <Seedling className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Production</div>
                      <div className="text-sm text-muted-foreground">Crops, irrigation and harvests</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Primary Crop</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base focus-visible:outline-none"
                        value={form.farm.primaryCrop}
                        onChange={(e) => update("farm", { primaryCrop: e.target.value })}
                      >
                        <option value="">Select</option>
                        <option>Maize</option>
                        <option>Beans</option>
                        <option>Sorghum</option>
                        <option>Tea</option>
                        <option>Horticulture</option>
                      </select>
                    </div>
                    <div>
                      <Label>Secondary Crops</Label>
                      <Input placeholder="Comma-separated" value={form.farm.secondaryCrops} onChange={(e) => update("farm", { secondaryCrops: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Irrigation</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base focus-visible:outline-none"
                        value={form.farm.irrigation}
                        onChange={(e) => update("farm", { irrigation: e.target.value })}
                      >
                        <option value="">Select</option>
                        <option>None</option>
                        <option>Rainfed</option>
                        <option>Drip</option>
                        <option>Sprinkler</option>
                      </select>
                    </div>
                    <div>
                      <Label>Input Purchases (seed, fertiliser)</Label>
                      <Input value={form.farm.inputPurchases} onChange={(e) => update("farm", { inputPurchases: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Previous Harvest (kg)</Label>
                      <Input value={form.farm.previousHarvest} onChange={(e) => update("farm", { previousHarvest: e.target.value })} />
                    </div>
                    <div>
                      <Label>Expected Harvest (kg)</Label>
                      <Input value={form.farm.expectedHarvest} onChange={(e) => update("farm", { expectedHarvest: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            </FormCard>
          )}

          {current === 2 && (
            <FormCard title="Financial Behaviour" desc="Understand past loans, savings and cash flows.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Loans & Repayment</div>
                      <div className="text-sm text-muted-foreground">History of borrowing and current obligations</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>
                        Previous Loans
                        <span title="Have they taken loans before?" className="ml-2 inline-block text-muted-foreground">
                          <Info className="inline h-4 w-4" />
                        </span>
                      </Label>
                      <Input value={form.finance.previousLoans} onChange={(e) => update("finance", { previousLoans: e.target.value })} />
                      <div className="mt-1 text-xs text-muted-foreground">Knowing prior loans helps assess repayment patterns.</div>
                    </div>
                    <div>
                      <Label>
                        Repayment History
                        <span title="Repayment punctuality and defaults" className="ml-2 inline-block text-muted-foreground">
                          <Info className="inline h-4 w-4" />
                        </span>
                      </Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1" value={form.finance.repaymentHistory} onChange={(e) => update("finance", { repaymentHistory: e.target.value })}>
                        <option>Good</option>
                        <option>Irregular</option>
                        <option>Defaulted</option>
                      </select>
                      <div className="mt-1 text-xs text-muted-foreground">Reliable repayment increases approval likelihood.</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>
                        Outstanding Loans
                        <span title="Total unpaid loan balance" className="ml-2 inline-block text-muted-foreground">
                          <Info className="inline h-4 w-4" />
                        </span>
                      </Label>
                      <Input value={form.finance.outstandingLoans} onChange={(e) => update("finance", { outstandingLoans: e.target.value })} />
                      <div className="mt-1 text-xs text-muted-foreground">High outstanding balances may reduce capacity to take new loans.</div>
                    </div>

                    <div>
                      <Label>
                        Savings
                        <span title="Cash or formal savings" className="ml-2 inline-block text-muted-foreground">
                          <Info className="inline h-4 w-4" />
                        </span>
                      </Label>
                      <Input value={form.finance.savings} onChange={(e) => update("finance", { savings: e.target.value })} />
                      <div className="mt-1 text-xs text-muted-foreground">Savings act as a buffer for shocks and indicate financial resilience.</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Cashflow & Income</div>
                      <div className="text-sm text-muted-foreground">Monthly income, mobile activity and alternative sources</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>
                        Average Monthly Income
                        <span title="Typical monthly earnings" className="ml-2 inline-block text-muted-foreground">
                          <Info className="inline h-4 w-4" />
                        </span>
                      </Label>
                      <Input value={form.finance.avgMonthlyIncome} onChange={(e) => update("finance", { avgMonthlyIncome: e.target.value })} />
                      <div className="mt-1 text-xs text-muted-foreground">Average earnings help size appropriate loan amounts.</div>
                    </div>

                    <div>
                      <Label>
                        Mobile Money Activity
                        <span title="Frequency & volume of mobile money transactions" className="ml-2 inline-block text-muted-foreground">
                          <Info className="inline h-4 w-4" />
                        </span>
                      </Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1" value={form.finance.mobileMoneyActivity} onChange={(e) => update("finance", { mobileMoneyActivity: e.target.value })}>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                      <div className="mt-1 text-xs text-muted-foreground">Active mobile money usage provides digital trace for income verification.</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>
                        Alternative Income Sources
                        <span title="Other income streams like casual labour, trade" className="ml-2 inline-block text-muted-foreground">
                          <Info className="inline h-4 w-4" />
                        </span>
                      </Label>
                      <Input value={form.finance.altIncomeSources} onChange={(e) => update("finance", { altIncomeSources: e.target.value })} />
                      <div className="mt-1 text-xs text-muted-foreground">Diversified income reduces vulnerability to crop shocks.</div>
                    </div>

                    <div>
                      <Label>
                        Existing Debts
                        <span title="Other liabilities or obligations" className="ml-2 inline-block text-muted-foreground">
                          <Info className="inline h-4 w-4" />
                        </span>
                      </Label>
                      <Input value={form.finance.existingDebts} onChange={(e) => update("finance", { existingDebts: e.target.value })} />
                      <div className="mt-1 text-xs text-muted-foreground">Capture non-loan debts (family, suppliers) to better assess cashflow.</div>
                    </div>
                  </div>
                </div>
              </div>
            </FormCard>
          )}

          {current === 3 && (
            <FormCard title="Community & Verification" desc="Cooperative memberships, SACCO and verification status.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
                      <Home className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Memberships</div>
                      <div className="text-sm text-muted-foreground">SACCOs, cooperatives and farmer groups</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 items-end">
                    <div>
                      <Label>SACCO Membership</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1" value={form.community.saccoMembership} onChange={(e) => update("community", { saccoMembership: e.target.value })}>
                        <option value="">Select</option>
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </div>
                    <div>
                      <Label>Select SACCO</Label>
                      <Input value={form.community.selectedSacco} onChange={(e) => update("community", { selectedSacco: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Years in SACCO</Label>
                      <Input value={form.community.yearsInSacco} onChange={(e) => update("community", { yearsInSacco: e.target.value })} />
                    </div>
                    <div>
                      <Label>Cooperative Membership</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1" value={form.community.cooperativeMembership} onChange={(e) => update("community", { cooperativeMembership: e.target.value })}>
                        <option value="">Select</option>
                        <option>Member</option>
                        <option>Non-member</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label>Farmer Group</Label>
                    <Input value={form.community.farmerGroup} onChange={(e) => update("community", { farmerGroup: e.target.value })} />
                  </div>

                  <div>
                    <Label>Peer Guarantees</Label>
                    <Input value={form.community.peerGuarantees} onChange={(e) => update("community", { peerGuarantees: e.target.value })} />
                    <div className="mt-1 text-xs text-muted-foreground">Is there a peer guarantee or co-signer within the group?</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Verification</div>
                      <div className="text-sm text-muted-foreground">Verification state for membership and documents</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 items-center">
                    <div>
                      <Label>Extension Officer</Label>
                      <Input value={form.community.extensionOfficer} onChange={(e) => update("community", { extensionOfficer: e.target.value })} />
                    </div>
                    <div>
                      <Label>Climate Training</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1" value={form.community.climateTraining} onChange={(e) => update("community", { climateTraining: e.target.value })}>
                        <option value="">Select</option>
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label>Verification Checklist</Label>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-2">
                        <div>
                          <div className="text-sm font-medium">ID Document</div>
                          <div className="text-xs text-muted-foreground">Copy of ID or national identifier</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select className="flex h-8 rounded-md border border-input bg-transparent px-2 py-0.5 text-sm" value={form.community.verificationChecklist.idDocument} onChange={(e) => update("community", { verificationChecklist: { ...form.community.verificationChecklist, idDocument: e.target.value } })}>
                            <option>Pending</option>
                            <option>Self Declared</option>
                            <option>Verified</option>
                          </select>
                          <span className={badgeClass(form.community.verificationChecklist.idDocument)}>{form.community.verificationChecklist.idDocument}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-2">
                        <div>
                          <div className="text-sm font-medium">Cooperative Letter</div>
                          <div className="text-xs text-muted-foreground">Letter confirming membership</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select className="flex h-8 rounded-md border border-input bg-transparent px-2 py-0.5 text-sm" value={form.community.verificationChecklist.coopLetter} onChange={(e) => update("community", { verificationChecklist: { ...form.community.verificationChecklist, coopLetter: e.target.value } })}>
                            <option>Pending</option>
                            <option>Self Declared</option>
                            <option>Verified</option>
                          </select>
                          <span className={badgeClass(form.community.verificationChecklist.coopLetter)}>{form.community.verificationChecklist.coopLetter}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-2">
                        <div>
                          <div className="text-sm font-medium">On-site Visit</div>
                          <div className="text-xs text-muted-foreground">Field verification status</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select className="flex h-8 rounded-md border border-input bg-transparent px-2 py-0.5 text-sm" value={form.community.verificationChecklist.onsiteVisit} onChange={(e) => update("community", { verificationChecklist: { ...form.community.verificationChecklist, onsiteVisit: e.target.value } })}>
                            <option>Pending</option>
                            <option>Self Declared</option>
                            <option>Verified</option>
                          </select>
                          <span className={badgeClass(form.community.verificationChecklist.onsiteVisit)}>{form.community.verificationChecklist.onsiteVisit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FormCard>
          )}

          {current === 4 && (
            <FormCard title="Climate & Farming Practices" desc="Irrigation, soil and climate-smart practices.">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
                      <Seedling className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Farming Practices</div>
                      <div className="text-sm text-muted-foreground">Adoption of climate-smart agriculture practices</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Crop Diversification</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1" value={form.climate.cropDiversification} onChange={(e) => update("climate", { cropDiversification: e.target.value })}>
                        <option>No</option>
                        <option>Yes</option>
                      </select>
                      <div className="mt-1 text-xs text-muted-foreground">Multiple crops reduce exposure to single-crop failures.</div>
                    </div>

                    <div>
                      <Label>Drought-resistant Crops</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1" value={form.climate.droughtResistantCrops} onChange={(e) => update("climate", { droughtResistantCrops: e.target.value })}>
                        <option>No</option>
                        <option>Yes</option>
                      </select>
                      <div className="mt-1 text-xs text-muted-foreground">Using drought-tolerant varieties increases resilience to dry spells.</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Water Harvesting</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1" value={form.climate.waterHarvesting} onChange={(e) => update("climate", { waterHarvesting: e.target.value })}>
                        <option>No</option>
                        <option>Yes</option>
                      </select>
                      <div className="mt-1 text-xs text-muted-foreground">Rainwater harvesting improves water availability during dry periods.</div>
                    </div>

                    <div>
                      <Label>Soil Conservation</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1" value={form.climate.soilConservation} onChange={(e) => update("climate", { soilConservation: e.target.value })}>
                        <option>No</option>
                        <option>Yes</option>
                      </select>
                      <div className="mt-1 text-xs text-muted-foreground">Practices like terracing and cover crops maintain soil fertility and reduce erosion.</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Livelihood Diversification</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1" value={form.climate.livelihoodDiversification} onChange={(e) => update("climate", { livelihoodDiversification: e.target.value })}>
                        <option>No</option>
                        <option>Yes</option>
                      </select>
                      <div className="mt-1 text-xs text-muted-foreground">Alternative livelihoods reduce household vulnerability to crop shocks.</div>
                    </div>

                    <div>
                      <Label>Irrigation</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1" value={form.climate.irrigation} onChange={(e) => update("climate", { irrigation: e.target.value })}>
                        <option>None</option>
                        <option>Rainfed</option>
                        <option>Drip</option>
                        <option>Sprinkler</option>
                      </select>
                      <div className="mt-1 text-xs text-muted-foreground">Irrigation increases yield stability across seasons.</div>
                    </div>
                  </div>

                  <div>
                    <Label>Climate-smart Training</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1" value={form.climate.climateSmartTraining} onChange={(e) => update("climate", { climateSmartTraining: e.target.value })}>
                      <option>No</option>
                      <option>Yes</option>
                    </select>
                    <div className="mt-1 text-xs text-muted-foreground">Training in climate-smart practices supports adoption and improves outcomes.</div>
                  </div>
                </div>

                <aside className="space-y-4">
                  <div className="rounded-md border border-border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
                        <Droplet className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Why these practices matter</div>
                        <p className="mt-2 text-sm text-muted-foreground">Adopting climate-smart farming practices increases resilience to weather shocks and can improve long-term productivity. These practices inform risk assessment but do not guarantee loan approval — they help lenders understand adaptive capacity.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-border bg-background p-3 text-sm">
                    <div className="font-medium">Quick Tips</div>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      <li>Combine crop diversification with water harvesting for best results.</li>
                      <li>Soil conservation preserves long-term yield potential.</li>
                      <li>Training increases the chance that practices are implemented correctly.</li>
                    </ul>
                  </div>
                </aside>
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

"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Sprout, Layers, Activity, CloudRain, Building2, FileBarChart, Info, Users, CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const STEPS = [
  "Personal Information",
  "Farm Information",
  "Financial Behaviour",
  "Community & Verification",
  "Climate & Farming Practices",
  "Review Assessment",
  "AI Assessment Results",
];

type FormData = {
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
    loanAmountRequested: string;
    purposeOfLoan: string;
  };
  farm: {
    farmName: string;
    county: string;
    areaHa: string;
    mainCrops: string;
  };
  finance: {
    previousLoans: string;
    repaymentHistory: string;
    outstandingLoans: string;
    savings: string;
    averageMonthlyIncome: string;
    mobileMoneyActivity: string;
    alternativeIncomeSources: string;
    existingDebts: string;
  };
  community: {
    cooperative: string;
    verifier: string;
    verificationMethod: string;
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
    verificationChecklist: string;
    verificationChecklistStatus: string;
  };
  climate: {
    irrigation: string;
    fertilizerUse: string;
    plantingPractice: string;
    cropDiversification: string;
    droughtResistantCrops: string;
    waterHarvesting: string;
    soilConservation: string;
    livelihoodDiversification: string;
    climateSmartTraining: string;
  };
};

const DEFAULT: FormData = {
  personal: {
    fullName: "",
    nationalId: "",
    phone: "",
    gender: "",
    age: "",
    county: "Embu",
    subCounty: "",
    ward: "",
    village: "",
    gps: "",
    loanAmountRequested: "",
    purposeOfLoan: "",
  },
  farm: { farmName: "", county: "Embu", areaHa: "", mainCrops: "Maize" },
  finance: {
    previousLoans: "",
    repaymentHistory: "Good",
    outstandingLoans: "",
    savings: "",
    averageMonthlyIncome: "",
    mobileMoneyActivity: "Medium",
    alternativeIncomeSources: "",
    existingDebts: "",
  },
  community: {
    cooperative: "No",
    verifier: "",
    verificationMethod: "Field visit",
    saccoMembership: "",
    saccoMembershipStatus: "Pending Verification",
    selectedSacco: "",
    selectedSaccoStatus: "Pending Verification",
    yearsInSacco: "",
    yearsInSaccoStatus: "Pending Verification",
    cooperativeMembership: "",
    cooperativeMembershipStatus: "Pending Verification",
    farmerGroup: "",
    farmerGroupStatus: "Pending Verification",
    peerGuarantees: "",
    peerGuaranteesStatus: "Pending Verification",
    extensionOfficer: "",
    extensionOfficerStatus: "Pending Verification",
    climateTraining: "",
    climateTrainingStatus: "Pending Verification",
    verificationChecklist: "",
    verificationChecklistStatus: "Pending Verification",
  },
  climate: {
    irrigation: "Rainfed",
    fertilizerUse: "Moderate",
    plantingPractice: "Mono-crop",
    cropDiversification: "Moderate",
    droughtResistantCrops: "Some",
    waterHarvesting: "None",
    soilConservation: "Mulching",
    livelihoodDiversification: "None",
    climateSmartTraining: "None",
  },
};

export default function NewAssessmentWizard() {
  const [step, setStep] = useState<number>(0);
  const [data, setData] = useState<FormData>(DEFAULT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [finalDecision, setFinalDecision] = useState<string>('Further Review');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Load draft if present
  useEffect(() => {
    try {
      const raw = localStorage.getItem("assessment_draft");
      if (raw) {
        setData(JSON.parse(raw));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  function update<K extends keyof FormData>(section: K, patch: Partial<FormData[K]>) {
    setData((d) => ({ ...d, [section]: { ...d[section], ...patch } }));
  }

  function saveDraft() {
    localStorage.setItem("assessment_draft", JSON.stringify(data));
    alert("Draft saved locally");
  }

  function clearDraft() {
    localStorage.removeItem("assessment_draft");
  }

  function handleCancel() {
    if (confirm("Discard changes and return to dashboard?")) {
      clearDraft();
      window.location.href = "/dashboard";
    }
  }

  function validateStep(index: number) {
    const newErrors: Record<string, string> = {};
    if (index === 0) {
      const p = data.personal;
      if (!p.fullName.trim()) newErrors["personal.fullName"] = "Full name is required";
      if (!p.nationalId.trim()) newErrors["personal.nationalId"] = "National ID is required";
      if (!p.phone.trim()) newErrors["personal.phone"] = "Phone number is required";
      if (!p.gender.trim()) newErrors["personal.gender"] = "Gender is required";
      if (!p.age.trim() || Number.isNaN(Number(p.age)) || Number(p.age) <= 0) newErrors["personal.age"] = "Valid age is required";
      if (!p.county.trim()) newErrors["personal.county"] = "County is required";
      if (!p.subCounty.trim()) newErrors["personal.subCounty"] = "Sub county is required";
      if (!p.ward.trim()) newErrors["personal.ward"] = "Ward is required";
      if (!p.village.trim()) newErrors["personal.village"] = "Village is required";
      if (!p.gps.trim()) newErrors["personal.gps"] = "GPS coordinates are required";
      if (!p.loanAmountRequested.trim() || Number.isNaN(Number(p.loanAmountRequested)) || Number(p.loanAmountRequested) <= 0) newErrors["personal.loanAmountRequested"] = "Enter a valid amount";
      if (!p.purposeOfLoan.trim()) newErrors["personal.purposeOfLoan"] = "Purpose is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function next() {
    // validate current step before advancing
    if (!validateStep(step)) return;
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  // Simple mock AI scoring based on readiness-like signals
  const aiScore = React.useMemo(() => {
    const readiness = Number(data.finance.averageMonthlyIncome ? 1 : 0) + (data.farm.areaHa ? 1 : 0) + (data.community.cooperative === "Yes" ? 1 : 0);
    const creditAdj = data.finance.repaymentHistory === "Good" ? 10 : data.finance.repaymentHistory === "Fair" ? 0 : -10;
    return Math.min(95, Math.max(20, 50 + readiness * 12 + creditAdj + (data.climate.fertilizerUse === "High" ? 5 : 0)));
  }, [data]);

  // Mock per-dimension scores derived from aiScore and data signals
  const dimensionScores = React.useMemo(() => {
    const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
    const financial = clamp(aiScore + (data.finance.savings ? 5 : 0) + (data.finance.outstandingLoans ? -5 : 0));
    const productivity = clamp(50 + (Number(data.farm.areaHa) ? Math.min(30, Number(data.farm.areaHa) * 2) : 0) + (data.farm.mainCrops ? 5 : 0));
    const resilience = clamp(40 + (data.climate.cropDiversification === 'High' ? 20 : data.climate.cropDiversification === 'Moderate' ? 10 : 0) + (data.climate.climateSmartTraining === 'Comprehensive' ? 15 : 0));
    const envRisk = clamp(70 - (data.climate.soilConservation === 'None' ? 20 : 0) - (data.climate.waterHarvesting === 'None' ? 15 : 0));
    const community = clamp(45 + (data.community.cooperative === 'Yes' ? 20 : 0) + (data.community.yearsInSacco ? 5 : 0));
    const dataConfidence = clamp(30 + (Object.values(data.personal).filter(Boolean).length * 3));
    return {
      financial,
      productivity,
      resilience,
      envRisk,
      community,
      dataConfidence,
    };
  }, [aiScore, data]);

  function toggleCard(key: string) {
    setExpandedCards((s) => ({ ...s, [key]: !s[key] }));
  }

  // Runs a simulated AI processing sequence then navigates to the AI results step
  function runAIProcess() {
    const stages = [
      "Collecting farmer profile",
      "Verifying records",
      "Loading climate intelligence",
      "Building knowledge graph",
      "Running ML models",
      "Generating explanation",
      "Preparing recommendation",
    ];

    setProcessing(true);
    setProcessingProgress(0);

    (async () => {
      for (let i = 0; i < stages.length; i++) {
        setProcessingStage(stages[i]);
        // progress target for this stage
        const stageStart = Math.round((i / stages.length) * 100);
        const stageEnd = Math.round(((i + 1) / stages.length) * 100);
        // animate progress within the stage (faster ticks for a few-second simulation)
        const steps = 4;
        for (let s = 1; s <= steps; s++) {
          const p = stageStart + Math.round(((stageEnd - stageStart) * s) / steps);
          setProcessingProgress(p);
          // small delay to animate
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 250));
        }
      }

      // finish
      setProcessingProgress(100);
      setProcessingStage("Finalizing results");
      await new Promise((r) => setTimeout(r, 600));
      setProcessing(false);
      setProcessingStage("");
      setProcessingProgress(0);
      setStep(6);
    })();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">New Assessment</h1>
        <p className="text-sm text-muted-foreground">Create a new farmer assessment — step by step.</p>
      </div>

      {/* Stepper */}
      <div className="mb-6 overflow-auto">
        <ol className="flex w-max gap-3">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 ${i === step ? "text-foreground" : "text-muted-foreground"}`}>
              <div className={`grid h-8 w-8 place-items-center rounded-full ${i === step ? "gradient-brand text-primary-foreground" : "bg-muted/10"}`}>{i + 1}</div>
              <div className="hidden min-w-40 items-center gap-2 rounded-md px-2 py-1 md:flex md:whitespace-nowrap">{s}</div>
            </li>
          ))}
        </ol>
      </div>

      {/* Step Card */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-muted-foreground">Full name</label>
                <Input
                  value={data.personal.fullName}
                  onChange={(e) => update("personal", { fullName: e.target.value })}
                  className={errors["personal.fullName"] ? "border-destructive" : ""}
                />
                {errors["personal.fullName"] && <div className="mt-1 text-sm text-destructive">{errors["personal.fullName"]}</div>}
              </div>

              <div>
                <label className="text-sm text-muted-foreground">National ID</label>
                <Input
                  value={data.personal.nationalId}
                  onChange={(e) => update("personal", { nationalId: e.target.value })}
                  className={errors["personal.nationalId"] ? "border-destructive" : ""}
                />
                {errors["personal.nationalId"] && <div className="mt-1 text-sm text-destructive">{errors["personal.nationalId"]}</div>}
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Phone number</label>
                <Input
                  value={data.personal.phone}
                  onChange={(e) => update("personal", { phone: e.target.value })}
                  className={errors["personal.phone"] ? "border-destructive" : ""}
                />
                {errors["personal.phone"] && <div className="mt-1 text-sm text-destructive">{errors["personal.phone"]}</div>}
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Gender</label>
                <Select defaultValue={data.personal.gender} onValueChange={(v) => update("personal", { gender: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors["personal.gender"] && <div className="mt-1 text-sm text-destructive">{errors["personal.gender"]}</div>}
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Age</label>
                <Input
                  type="number"
                  value={data.personal.age}
                  onChange={(e) => update("personal", { age: e.target.value })}
                  className={errors["personal.age"] ? "border-destructive" : ""}
                />
                {errors["personal.age"] && <div className="mt-1 text-sm text-destructive">{errors["personal.age"]}</div>}
              </div>

              <div>
                <label className="text-sm text-muted-foreground">County</label>
                <Select defaultValue={data.personal.county} onValueChange={(v) => update("personal", { county: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Embu">Embu</SelectItem>
                    <SelectItem value="Kisumu">Kisumu</SelectItem>
                    <SelectItem value="Mombasa">Mombasa</SelectItem>
                    <SelectItem value="Nakuru">Nakuru</SelectItem>
                    <SelectItem value="Uasin Gishu">Uasin Gishu</SelectItem>
                  </SelectContent>
                </Select>
                {errors["personal.county"] && <div className="mt-1 text-sm text-destructive">{errors["personal.county"]}</div>}
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Sub county</label>
                <Input value={data.personal.subCounty} onChange={(e) => update("personal", { subCounty: e.target.value })} className={errors["personal.subCounty"] ? "border-destructive" : ""} />
                {errors["personal.subCounty"] && <div className="mt-1 text-sm text-destructive">{errors["personal.subCounty"]}</div>}
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Ward</label>
                <Input value={data.personal.ward} onChange={(e) => update("personal", { ward: e.target.value })} className={errors["personal.ward"] ? "border-destructive" : ""} />
                {errors["personal.ward"] && <div className="mt-1 text-sm text-destructive">{errors["personal.ward"]}</div>}
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Village</label>
                <Input value={data.personal.village} onChange={(e) => update("personal", { village: e.target.value })} className={errors["personal.village"] ? "border-destructive" : ""} />
                {errors["personal.village"] && <div className="mt-1 text-sm text-destructive">{errors["personal.village"]}</div>}
              </div>

              <div>
                <label className="text-sm text-muted-foreground">GPS coordinates</label>
                <Input value={data.personal.gps} onChange={(e) => update("personal", { gps: e.target.value })} placeholder="lat, lon (e.g. -1.2921, 36.8219)" className={errors["personal.gps"] ? "border-destructive" : ""} />
                {errors["personal.gps"] && <div className="mt-1 text-sm text-destructive">{errors["personal.gps"]}</div>}
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Loan amount requested (KES)</label>
                <Input value={data.personal.loanAmountRequested} onChange={(e) => update("personal", { loanAmountRequested: e.target.value })} className={errors["personal.loanAmountRequested"] ? "border-destructive" : ""} />
                {errors["personal.loanAmountRequested"] && <div className="mt-1 text-sm text-destructive">{errors["personal.loanAmountRequested"]}</div>}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-muted-foreground">Purpose of loan</label>
                <Textarea value={data.personal.purposeOfLoan} onChange={(e) => update("personal", { purposeOfLoan: e.target.value })} className={errors["personal.purposeOfLoan"] ? "border-destructive" : ""} />
                {errors["personal.purposeOfLoan"] && <div className="mt-1 text-sm text-destructive">{errors["personal.purposeOfLoan"]}</div>}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 text-primary"><Sprout className="h-5 w-5" /></div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Farm size (ha)</div>
                      <Input value={data.farm.areaHa} onChange={(e) => update("farm", { areaHa: e.target.value })} placeholder="e.g. 2.5" />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 text-primary"><Building2 className="h-5 w-5" /></div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Land ownership</div>
                      <Select defaultValue={"Own"} onValueChange={(v) => update("farm", { /* noop mirrored to other field if needed */ })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Own">Own</SelectItem>
                          <SelectItem value="Rent">Rent</SelectItem>
                          <SelectItem value="Communal">Communal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 text-primary"><Sprout className="h-5 w-5" /></div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Primary crop</div>
                      <Select defaultValue={data.farm.mainCrops} onValueChange={(v) => update("farm", { mainCrops: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Maize">Maize</SelectItem>
                          <SelectItem value="Beans">Beans</SelectItem>
                          <SelectItem value="Tea">Tea</SelectItem>
                          <SelectItem value="Coffee">Coffee</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 text-primary"><Layers className="h-5 w-5" /></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">Secondary crops</div>
                      <Input value={data.farm.secondaryCrops as any || ""} onChange={(e) => update("farm", { secondaryCrops: e.target.value as any })} placeholder="Comma separated" />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 text-primary"><Activity className="h-5 w-5" /></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">Livestock</div>
                      <Input value={(data.farm as any).livestock || ""} onChange={(e) => update("farm", { livestock: e.target.value as any })} placeholder="e.g. goats: 10, cattle: 2" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 text-primary"><Activity className="h-5 w-5" /></div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Years farming</div>
                      <Input value={(data.farm as any).yearsOfFarming || ""} onChange={(e) => update("farm", { yearsOfFarming: e.target.value as any })} />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 text-primary"><CloudRain className="h-5 w-5" /></div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Irrigation</div>
                      <Select defaultValue={(data.farm as any).irrigation || "Rainfed"} onValueChange={(v) => update("farm", { irrigation: v as any })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Rainfed">Rainfed</SelectItem>
                          <SelectItem value="Irrigated">Irrigated</SelectItem>
                          <SelectItem value="Mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 text-primary"><FileBarChart className="h-5 w-5" /></div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Previous harvest (kg)</div>
                      <Input value={(data.farm as any).previousHarvest || ""} onChange={(e) => update("farm", { previousHarvest: e.target.value as any })} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 text-primary"><FileBarChart className="h-5 w-5" /></div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Expected harvest (kg)</div>
                      <Input value={(data.farm as any).expectedHarvest || ""} onChange={(e) => update("farm", { expectedHarvest: e.target.value as any })} />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 text-primary"><Layers className="h-5 w-5" /></div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Input purchases</div>
                      <Textarea value={(data.farm as any).inputPurchases || ""} onChange={(e) => update("farm", { inputPurchases: e.target.value as any })} placeholder="Fertilizer, seed, agrochemicals - estimated cost" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Previous loans</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center text-muted-foreground"><Info className="h-4 w-4" /></button>
                      </TooltipTrigger>
                      <TooltipContent>List previous loans and lenders; helps assess prior exposure.</TooltipContent>
                    </Tooltip>
                  </div>
                  <Input value={data.finance.previousLoans} onChange={(e) => update("finance", { previousLoans: e.target.value })} placeholder="e.g. Loan A: KES 20,000 (paid)" />
                  <div className="mt-1 text-xs text-muted-foreground">Why: Past loans indicate borrowing patterns and potential repayment capacity.</div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Repayment history</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center text-muted-foreground"><Info className="h-4 w-4" /></button>
                      </TooltipTrigger>
                      <TooltipContent>Frequency of on-time repayments over past loans.</TooltipContent>
                    </Tooltip>
                  </div>
                  <Select defaultValue={data.finance.repaymentHistory} onValueChange={(v) => update("finance", { repaymentHistory: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="mt-1 text-xs text-muted-foreground">Why: Helps estimate credit reliability and model risk.</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Outstanding loans (KES)</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center text-muted-foreground"><Info className="h-4 w-4" /></button>
                      </TooltipTrigger>
                      <TooltipContent>Current unpaid principal—affects debt service capacity.</TooltipContent>
                    </Tooltip>
                  </div>
                  <Input value={data.finance.outstandingLoans} onChange={(e) => update("finance", { outstandingLoans: e.target.value })} placeholder="e.g. 15000" />
                  <div className="mt-1 text-xs text-muted-foreground">Why: Outstanding obligations reduce available cashflow for new loans.</div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Savings (KES)</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center text-muted-foreground"><Info className="h-4 w-4" /></button>
                      </TooltipTrigger>
                      <TooltipContent>Current liquid savings held by the farmer.</TooltipContent>
                    </Tooltip>
                  </div>
                  <Input value={data.finance.savings} onChange={(e) => update("finance", { savings: e.target.value })} placeholder="e.g. 5000" />
                  <div className="mt-1 text-xs text-muted-foreground">Why: Savings act as buffers and indicate financial resilience.</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Average monthly income (KES)</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center text-muted-foreground"><Info className="h-4 w-4" /></button>
                      </TooltipTrigger>
                      <TooltipContent>Average earnings per month from farming and other activities.</TooltipContent>
                    </Tooltip>
                  </div>
                  <Input value={data.finance.averageMonthlyIncome} onChange={(e) => update("finance", { averageMonthlyIncome: e.target.value })} placeholder="e.g. 12000" />
                  <div className="mt-1 text-xs text-muted-foreground">Why: Core input for affordability and repayment calculations.</div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Mobile money activity</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center text-muted-foreground"><Info className="h-4 w-4" /></button>
                      </TooltipTrigger>
                      <TooltipContent>Frequency and volume of mobile payments—used as proxy for cashflow.</TooltipContent>
                    </Tooltip>
                  </div>
                  <Select defaultValue={data.finance.mobileMoneyActivity} onValueChange={(v) => update("finance", { mobileMoneyActivity: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="mt-1 text-xs text-muted-foreground">Why: Mobile money traces provide transaction history and cashflow signals.</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Alternative income sources</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center text-muted-foreground"><Info className="h-4 w-4" /></button>
                      </TooltipTrigger>
                      <TooltipContent>Other activities contributing to household income.</TooltipContent>
                    </Tooltip>
                  </div>
                  <Textarea value={data.finance.alternativeIncomeSources} onChange={(e) => update("finance", { alternativeIncomeSources: e.target.value })} placeholder="e.g. casual labor, trading" />
                  <div className="mt-1 text-xs text-muted-foreground">Why: Diversified income reduces climate-driven vulnerability.</div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Existing debts</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center text-muted-foreground"><Info className="h-4 w-4" /></button>
                      </TooltipTrigger>
                      <TooltipContent>Other formal or informal debts not captured above.</TooltipContent>
                    </Tooltip>
                  </div>
                  <Textarea value={data.finance.existingDebts} onChange={(e) => update("finance", { existingDebts: e.target.value })} placeholder="Describe other debts" />
                  <div className="mt-1 text-xs text-muted-foreground">Why: Full debt picture informs repayment risk and portfolio exposure.</div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-muted-foreground">Member of cooperative?</label>
                <Select defaultValue={data.community.cooperative} onValueChange={(v) => update("community", { cooperative: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Verifier name</label>
                <Input value={data.community.verifier} onChange={(e) => update("community", { verifier: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-muted-foreground">Verification method</label>
                <Input value={data.community.verificationMethod} onChange={(e) => update("community", { verificationMethod: e.target.value })} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Crop Diversification</label>
                    <Select defaultValue={data.climate.cropDiversification} onValueChange={(v) => update("climate", { cropDiversification: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground">Drought-resistant crops</label>
                    <Select defaultValue={data.climate.droughtResistantCrops} onValueChange={(v) => update("climate", { droughtResistantCrops: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Some">Some</SelectItem>
                        <SelectItem value="Majority">Majority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Water harvesting</label>
                    <Select defaultValue={data.climate.waterHarvesting} onValueChange={(v) => update("climate", { waterHarvesting: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Rainwater harvesting">Rainwater harvesting</SelectItem>
                        <SelectItem value="Ponds/Storage">Ponds/Storage</SelectItem>
                        <SelectItem value="Ridges/Contour">Ridges/Contour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground">Soil conservation</label>
                    <Select defaultValue={data.climate.soilConservation} onValueChange={(v) => update("climate", { soilConservation: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Mulching">Mulching</SelectItem>
                        <SelectItem value="Terracing">Terracing</SelectItem>
                        <SelectItem value="Contour farming">Contour farming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Livelihood diversification</label>
                    <Select defaultValue={data.climate.livelihoodDiversification} onValueChange={(v) => update("climate", { livelihoodDiversification: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Small trade">Small trade</SelectItem>
                        <SelectItem value="Livestock">Livestock</SelectItem>
                        <SelectItem value="Casual labor">Casual labor</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground">Irrigation</label>
                    <Select defaultValue={data.climate.irrigation} onValueChange={(v) => update("climate", { irrigation: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rainfed">Rainfed</SelectItem>
                        <SelectItem value="Irrigated">Irrigated</SelectItem>
                        <SelectItem value="Mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Climate-smart training</label>
                  <Select defaultValue={data.climate.climateSmartTraining} onValueChange={(v) => update("climate", { climateSmartTraining: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Some">Some</SelectItem>
                      <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground">Planting practice</label>
                  <Textarea value={data.climate.plantingPractice} onChange={(e) => update("climate", { plantingPractice: e.target.value })} />
                </div>
              </div>

              <aside className="rounded-md border border-border bg-card p-4">
                <h3 className="text-sm font-medium text-foreground">Climate & Farming Practices</h3>
                <p className="text-sm text-muted-foreground mt-2">Adopting climate-smart practices improves farm resilience to shocks and can reduce risk for lenders. These practices help manage drought, erosion, and water shortages but do not guarantee loan approval — they are one of many factors considered during assessment.</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-start gap-2"><Sprout className="h-4 w-4 text-green-600" />Diversified cropping spreads risk.</li>
                  <li className="flex items-start gap-2"><CloudRain className="h-4 w-4 text-blue-600" />Water harvesting supports dry spells.</li>
                  <li className="flex items-start gap-2"><Layers className="h-4 w-4 text-amber-600" />Soil conservation maintains productivity.</li>
                </ul>
              </aside>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Review Assessment</h3>

              {/* completeness calculation */}
              {/* compute completeness based on filled fields (ignore keys ending with 'Status') */}
              {/* inline helper */}
              <ReviewSummary data={data} onEdit={(s: number) => setStep(s)} onRunAI={runAIProcess} />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <h3 className="sr-only">AI Assessment Results</h3>

              {/* Top hero cards */}
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div className="rounded-lg overflow-hidden bg-linear-to-r from-indigo-600 to-emerald-500 text-white p-5">
                  <div className="text-sm font-medium">Farmer</div>
                  <div className="mt-2 text-xl font-semibold">{data.personal.fullName || 'Unknown Farmer'}</div>
                  <div className="mt-1 text-sm opacity-90">Primary contact: {data.personal.phone || '—'}</div>
                </div>

                <div className="rounded-lg overflow-hidden bg-linear-to-r from-rose-600 to-pink-500 text-white p-5">
                  <div className="text-sm font-medium">Loan Requested</div>
                  <div className="mt-2 text-xl font-semibold">{data.personal.loanAmountRequested ? `KSh ${Number(data.personal.loanAmountRequested).toLocaleString()}` : '—'}</div>
                  <div className="mt-1 text-sm opacity-90">Purpose: {data.personal.purposeOfLoan || '—'}</div>
                </div>

                <div className="rounded-lg overflow-hidden bg-linear-to-r from-emerald-500 to-sky-500 text-white p-5">
                  <div className="text-sm font-medium">Finance Readiness</div>
                  <div className="mt-2 text-3xl font-bold">{aiScore}%</div>
                  <div className="mt-1 text-sm opacity-90">Score based on finances & farm signals</div>
                </div>

                <div className="rounded-lg overflow-hidden bg-linear-to-r from-slate-700 to-slate-500 text-white p-5">
                  <div className="text-sm font-medium">Recommendation</div>
                  <div className="mt-2 text-xl font-semibold">{aiScore > 75 ? 'Approve' : aiScore > 60 ? 'Assess' : 'Decline'}</div>
                  <div className="mt-1 text-sm opacity-90">Confidence: {Math.min(99, Math.round(aiScore * 0.85 + 10))}%</div>
                </div>
              </div>

              {/* Secondary hero row for confidence and details (responsive) */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-sm font-medium text-foreground">Confidence Score</div>
                  <div className="mt-2 text-3xl font-bold text-foreground">{Math.min(99, Math.round(aiScore * 0.85 + 10))}%</div>
                  <div className="mt-1 text-sm text-muted-foreground">Model confidence based on available data and signals.</div>
                </div>

                <div className="md:col-span-2 rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground">Key Drivers</div>
                      <div className="mt-2 text-sm text-muted-foreground">{`Repayment: ${data.finance.repaymentHistory || 'n/a'} · Area: ${data.farm.areaHa || 'n/a'} ha · Cooperative: ${data.community.cooperative || 'n/a'}`}</div>
                    </div>
                    <div>
                      <Button onClick={() => alert('Download PDF (UI-only)')}>Download report</Button>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">Explanation: The model weighs financial behaviour, land area, community participation and climate practices to estimate readiness and recommendation.</div>
                </div>
              </div>

              {/* Six interactive score cards */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-foreground mb-3">Detailed Scores</h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { key: 'financial', title: 'Financial Behaviour', score: dimensionScores.financial, short: 'Repayment history, savings and outstanding loans.' },
                    { key: 'productivity', title: 'Farm Productivity', score: dimensionScores.productivity, short: 'Area, crop mix and expected yield signals.' },
                    { key: 'resilience', title: 'Climate Resilience', score: dimensionScores.resilience, short: 'Adoption of climate-smart practices and training.' },
                    { key: 'envRisk', title: 'Environmental Risk', score: dimensionScores.envRisk, short: 'Soil and water risks that may affect yields.' },
                    { key: 'community', title: 'Community Trust', score: dimensionScores.community, short: 'Cooperative membership and local guarantees.' },
                    { key: 'dataConfidence', title: 'Data Confidence', score: dimensionScores.dataConfidence, short: 'Completeness of profile and verification.' },
                  ].map((c) => (
                    <div key={c.key} className="rounded-lg border border-border bg-card p-4 hover:shadow-lg transform hover:-translate-y-1 transition">
                      <div className="flex items-center gap-4">
                        {/* Circular progress */}
                        <div className="shrink-0">
                          <svg className="h-20 w-20" viewBox="0 0 36 36">
                            <defs>
                              <linearGradient id={`g-${c.key}`} x1="0%" x2="100%" y1="0%" y2="0%">
                                <stop offset="0%" stopColor="#34D399" />
                                <stop offset="100%" stopColor="#06B6D4" />
                              </linearGradient>
                            </defs>
                            <path d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none" stroke="#e5e7eb" strokeWidth="2" />
                            <path
                              d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={`url(#g-${c.key})`}
                              strokeWidth="2"
                              strokeDasharray={`${c.score}, 100`} />
                            <text x="18" y="20.5" fontSize="6" textAnchor="middle" fill="#0f172a" className="font-medium">{c.score}%</text>
                          </svg>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm font-medium text-foreground">{c.title}</div>
                              <div className="mt-1 text-xs text-muted-foreground">{c.short}</div>
                            </div>
                            <div>
                              <button aria-expanded={!!expandedCards[c.key]} aria-controls={`details-${c.key}`} onClick={() => toggleCard(c.key)} className="text-sm text-primary underline">{expandedCards[c.key] ? 'Hide' : 'Details'}</button>
                            </div>
                          </div>

                          <div id={`details-${c.key}`} className={`mt-3 text-sm text-muted-foreground overflow-hidden transition-all ${expandedCards[c.key] ? 'max-h-96' : 'max-h-0'}`}>
                            {expandedCards[c.key] ? (
                              <div>
                                <div className="mb-2 font-medium text-foreground">What this means</div>
                                <div>{`A score of ${c.score} indicates ${c.title.toLowerCase()} is ${c.score > 75 ? 'strong' : c.score > 50 ? 'adequate' : 'weak'}.`}</div>
                                <div className="mt-2 text-xs">Further notes: mock detail text providing more context and suggested actions for improvement.</div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

              {/* Explainable AI premium assistant card */}
              <div className="mt-6">
                <div className="rounded-lg overflow-hidden bg-linear-to-r from-slate-900 to-slate-700 text-white p-6 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-slate-300">AI Summary</div>
                      <div className="mt-2 text-lg font-semibold">Estimated finance readiness and recommendation with explainability</div>
                      <div className="mt-3 text-sm text-slate-200 max-w-2xl">The AI combines financial signals, farm characteristics, community context and climate practices to produce a readiness score and recommendation. Below are strengths, risks, and the key factors that influenced the decision.</div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-slate-300">Recommendation</div>
                        <div className="mt-1 text-2xl font-bold">{aiScore > 75 ? 'Approve' : aiScore > 60 ? 'Assess' : 'Decline'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-300">Confidence</div>
                        <div className="mt-1 text-2xl font-bold">{Math.min(99, Math.round(aiScore * 0.85 + 10))}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="p-4 bg-white/5 rounded">
                      <div className="text-sm font-medium text-slate-100">Strengths</div>
                      <ul className="mt-2 text-sm text-slate-200 space-y-1">
                        <li>Consistent repayment history</li>
                        <li>Cooperative membership</li>
                        <li>Moderate farm area</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-white/5 rounded">
                      <div className="text-sm font-medium text-slate-100">Risks</div>
                      <ul className="mt-2 text-sm text-slate-200 space-y-1">
                        <li>Low diversification in some crops</li>
                        <li>Limited water harvesting infrastructure</li>
                        <li>Outstanding informal debts</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-white/5 rounded">
                      <div className="text-sm font-medium text-slate-100">Key Factors</div>
                      <div className="mt-2 text-sm text-slate-200">
                        <div>Repayment history: {data.finance.repaymentHistory || 'n/a'}</div>
                        <div>Area: {data.farm.areaHa || 'n/a'} ha</div>
                        <div>Cooperative: {data.community.cooperative || 'n/a'}</div>
                        <div>Crop diversification: {data.climate.cropDiversification || 'n/a'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-slate-200">Explanation: The recommendation balances creditworthiness with climate and community signals. Use this as guidance — final decision requires human review.</div>
                    <div>
                      <Button variant="ghost" onClick={() => alert('Show full explainability (UI-only)')}>View full explanation</Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Climate Intelligence section */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-foreground mb-3">Climate Intelligence</h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Rainfall */}
                  <div className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-transform hover:-translate-y-1">
                    <div className="flex items-start gap-3">
                      <CloudRain className="h-6 w-6 text-sky-500" />
                      <div>
                        <div className="text-sm font-medium">Rainfall</div>
                        <div className="mt-1 text-lg font-semibold">{Math.round(300 + Math.random() * 200)} mm / yr</div>
                        <div className="text-xs text-muted-foreground mt-1">Average annual rainfall (mock)</div>
                      </div>
                    </div>
                  </div>

                  {/* Flood Risk */}
                  <div className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-transform hover:-translate-y-1">
                    <div className="flex items-start gap-3">
                      <FileBarChart className="h-6 w-6 text-amber-500" />
                      <div>
                        <div className="text-sm font-medium">Flood Risk</div>
                        <div className="mt-1 text-lg font-semibold">{['Low','Moderate','High'][Math.floor(Math.random()*3)]}</div>
                        <div className="text-xs text-muted-foreground mt-1">Local flood likelihood based on topography (mock)</div>
                      </div>
                    </div>
                  </div>

                  {/* Drought Risk */}
                  <div className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-transform hover:-translate-y-1">
                    <div className="flex items-start gap-3">
                      <Activity className="h-6 w-6 text-rose-500" />
                      <div>
                        <div className="text-sm font-medium">Drought Risk</div>
                        <div className="mt-1 text-lg font-semibold">{Math.round(20 + Math.random()*70)}%</div>
                        <div className="text-xs text-muted-foreground mt-1">Estimated drought probability (mock)</div>
                      </div>
                    </div>
                  </div>

                  {/* NDVI */}
                  <div className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-transform hover:-translate-y-1">
                    <div className="flex items-start gap-3">
                      <Sprout className="h-6 w-6 text-green-500" />
                      <div>
                        <div className="text-sm font-medium">NDVI</div>
                        <div className="mt-1 text-lg font-semibold">{(0.3 + Math.random()*0.5).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground mt-1">Normalized Difference Vegetation Index (mock)</div>
                      </div>
                    </div>
                  </div>

                  {/* Temperature Trend */}
                  <div className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-transform hover:-translate-y-1">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-6 w-6 text-orange-400" />
                      <div>
                        <div className="text-sm font-medium">Temperature Trend</div>
                        <div className="mt-1 text-lg font-semibold">{(0.1 + Math.random()*1.2).toFixed(2)} °C/decade</div>
                        <div className="text-xs text-muted-foreground mt-1">Recent warming trend (mock)</div>
                      </div>
                    </div>
                  </div>

                  {/* Soil Suitability */}
                  <div className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-transform hover:-translate-y-1">
                    <div className="flex items-start gap-3">
                      <Layers className="h-6 w-6 text-emerald-600" />
                      <div>
                        <div className="text-sm font-medium">Soil Suitability</div>
                        <div className="mt-1 text-lg font-semibold">{['Poor','Fair','Good','Excellent'][Math.floor(Math.random()*4)]}</div>
                        <div className="text-xs text-muted-foreground mt-1">Suitability for main crop (mock)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                {/* Verification & Evidence section */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-foreground mb-3">Verification & Evidence</h4>
                  <div className="overflow-x-auto rounded-md border border-border bg-card">
                    <table className="w-full min-w-175 table-auto">
                      <thead>
                        <tr className="text-left text-sm text-muted-foreground">
                          <th className="px-4 py-3">Source</th>
                          <th className="px-4 py-3">Verification Status</th>
                          <th className="px-4 py-3">Verification Source</th>
                          <th className="px-4 py-3">Confidence</th>
                          <th className="px-4 py-3">Verification Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {([
                          { id: 'nationalId', label: 'National ID', value: data.personal.nationalId },
                          { id: 'gps', label: 'GPS', value: data.personal.gps },
                          { id: 'sacco', label: 'SACCO Membership', value: data.community.saccoMembership },
                          { id: 'cooperative', label: 'Cooperative', value: data.community.cooperative },
                          { id: 'mobileMoney', label: 'Mobile Money', value: data.finance.mobileMoneyActivity },
                          { id: 'farmLocation', label: 'Farm Location', value: data.farm.county || data.farm.farmName },
                          { id: 'inputPurchases', label: 'Input Purchases', value: (data.farm as any).inputPurchases },
                        ]).map((row) => {
                          const has = row.value && String(row.value).trim() !== '';
                          const status = has ? 'Verified' : 'Pending Verification';
                          const source = has ? (row.id === 'nationalId' ? 'Government registry' : row.id === 'gps' ? 'GPS device' : row.id === 'mobileMoney' ? 'Mobile operator' : 'Self-declared') : 'N/A';
                          const confidence = has ? (status === 'Verified' ? 85 + Math.floor(Math.random()*10) : 40 + Math.floor(Math.random()*30)) : 20 + Math.floor(Math.random()*10);
                          const date = new Date(Date.now() - Math.floor(Math.random()*1000*60*60*24*90)).toLocaleDateString();
                          return (
                            <tr key={row.id} className="border-t border-border">
                              <td className="px-4 py-3 text-sm text-foreground">{row.label}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : status === 'Self Declared' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>{status}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{source}</td>
                              <td className="px-4 py-3 text-sm text-foreground">{confidence}%</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{date}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
          )}
        </CardContent>

        <CardFooter>
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button variant="ghost" onClick={saveDraft}>Save Draft</Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={back} disabled={step === 0}>Back</Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={next}>Next</Button>
              ) : (
                <Button onClick={() => { alert("Assessment completed (UI-only)"); clearDraft(); window.location.href = "/dashboard"; }}>Finish</Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
      {processing && <ProcessingOverlay stage={processingStage} progress={processingProgress} />}
    </div>
  );
}


// ReviewSummary component placed at end of file to avoid extra imports
function ReviewSummary({ data, onEdit, onRunAI }: { data: any; onEdit: (stepIndex: number) => void; onRunAI: () => void }) {
  // count filled fields excluding verification/status keys
  function countFilled(obj: any) {
    let total = 0;
    let filled = 0;
    if (!obj || typeof obj !== "object") return { total, filled };
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (key.endsWith("Status")) continue;
      if (val && typeof val === "object") {
        const res = countFilled(val);
        total += res.total;
        filled += res.filled;
      } else {
        total += 1;
        if (String(val).trim() !== "") filled += 1;
      }
    }
    return { total, filled };
  }

  const { total, filled } = countFilled(data);
  const completeness = total === 0 ? 0 : Math.round((filled / total) * 100);

  const Section = ({ title, values, stepIndex }: { title: string; values: Record<string, any>; stepIndex: number }) => (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
          <div className="mt-2 text-sm text-muted-foreground space-y-1">
            {Object.keys(values).map((k) => (
              <div key={k} className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground"><strong>{k.replace(/([A-Z])/g, ' $1').trim()}:</strong> {String(values[k]) || '—'}</div>
              </div>
 
            ))}
          </div>
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={() => onEdit(stepIndex)}>Edit</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Estimated completeness</div>
          <div className="text-2xl font-semibold">{completeness}%</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Verification summary</div>
          <div className="text-sm">{data.community.verificationChecklist || 'No verification checklist provided'}</div>
        </div>
      </div>

      <div className="grid gap-4">
        <Section title="Personal Information" values={data.personal} stepIndex={0} />
        <Section title="Farm Information" values={data.farm} stepIndex={1} />
        <Section title="Financial Behaviour" values={data.finance} stepIndex={2} />
        <Section title="Community Information" values={data.community} stepIndex={3} />
        <Section title="Climate Practices" values={data.climate} stepIndex={4} />

        <div className="rounded-md border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-foreground">Verification Summary</h4>
              <div className="mt-2 text-sm text-muted-foreground">Verifier: {data.community.verifier || '—'}</div>
              <div className="mt-1 text-sm text-muted-foreground">Method: {data.community.verificationMethod || '—'}</div>
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={() => onEdit(3)}>Edit</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <Button className="w-full max-w-md" size="lg" onClick={onRunAI}>Run AI Assessment</Button>
      </div>
    </div>
  );
}

// Processing overlay component (renders inside the same file)
function ProcessingOverlay({ stage, progress }: { stage: string; progress: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-md bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">AI Assessment — Processing</h3>
            <p className="text-sm text-muted-foreground mt-1">The system is running a thorough assessment. This typically takes a few seconds.</p>
          </div>
          <div className="text-sm font-medium">{progress}%</div>
        </div>

        <div className="mt-6">
          <div className="h-3 w-full rounded-full bg-background/60">
            <div className="h-3 rounded-full bg-linear-to-r from-emerald-400 to-sky-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
            <div>
              <div className="text-sm font-medium">{stage}</div>
              <div className="text-xs text-muted-foreground">Processing stage — please wait</div>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {[
              "Collecting farmer profile",
              "Verifying records",
              "Loading climate intelligence",
              "Building knowledge graph",
              "Running ML models",
              "Generating explanation",
              "Preparing recommendation",
            ].map((s) => (
              <div key={s} className={`flex items-center justify-between text-sm ${s === stage ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${s === stage ? 'bg-emerald-400' : 'bg-background/30'}`} />
                  <div>{s}</div>
                </div>
                <div>{s === stage ? `${progress}%` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// KnowledgeGraph component (mock, interactive, SVG-based)
function KnowledgeGraph({ data }: { data: any }) {
  const width = 760;
  const height = 360;
  const center = { x: width / 2, y: height / 2 };
  const nodes = [
    { id: 'farmer', label: data.personal.fullName || 'Farmer', x: center.x, y: center.y, main: true },
    { id: 'sacco', label: 'SACCO', x: center.x - 220, y: center.y - 80 },
    { id: 'cooperative', label: 'Cooperative', x: center.x + 220, y: center.y - 80 },
    { id: 'climate', label: 'Climate Data', x: center.x, y: center.y - 160 },
    { id: 'loans', label: 'Loans', x: center.x - 260, y: center.y + 80 },
    { id: 'input', label: 'Input Supplier', x: center.x + 260, y: center.y + 80 },
    { id: 'extension', label: 'Extension Officer', x: center.x - 80, y: center.y + 160 },
    { id: 'weather', label: 'Weather', x: center.x + 80, y: center.y + 160 },
  ];

  const links = [
    { source: 'farmer', target: 'sacco' },
    { source: 'farmer', target: 'cooperative' },
    { source: 'farmer', target: 'climate' },
    { source: 'farmer', target: 'loans' },
    { source: 'farmer', target: 'input' },
    { source: 'farmer', target: 'extension' },
    { source: 'farmer', target: 'weather' },
    { source: 'climate', target: 'weather' },
    { source: 'input', target: 'loans' },
  ];

  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);

  function findNode(id: string) {
    return nodes.find((n) => n.id === id)!;
  }

  return (
    <div className="w-full overflow-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-90">
        <defs>
          <linearGradient id="linkGrad" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {/* links */}
        {links.map((l, i) => {
          const s = findNode(l.source);
          const t = findNode(l.target);
          const key = `${l.source}-${l.target}`;
          const isHighlighted = hovered === l.source || hovered === l.target || active === l.source || active === l.target;
          return (
            <g key={key}>
              <path
                d={`M ${s.x} ${s.y} Q ${(s.x + t.x) / 2} ${(s.y + t.y) / 2 - 40}, ${t.x} ${t.y}`}
                fill="none"
                stroke="url(#linkGrad)"
                strokeWidth={isHighlighted ? 3.2 : 1.8}
                strokeOpacity={isHighlighted ? 1 : 0.6}
                style={{ strokeDasharray: '6 8', animation: 'dash 2s linear infinite' }}
              />
            </g>
          );
        })}

        {/* nodes */}
        {nodes.map((n) => {
          const isCenter = n.main;
          const isHovered = hovered === n.id;
          const isActive = active === n.id;
          return (
            <g key={n.id} transform={`translate(${n.x}, ${n.y})`} className="cursor-pointer">
              <circle
                r={isCenter ? 28 : 20}
                fill={isCenter ? '#0f172a' : isHovered || isActive ? '#ffffff' : '#f8fafc'}
                stroke={isCenter ? '#34d399' : '#94a3b8'}
                strokeWidth={isHovered || isActive ? 3 : 1.5}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setActive((a) => (a === n.id ? null : n.id))}
              />
              <text x={isCenter ? 0 : 0} y={isCenter ? 4 : 4} textAnchor="middle" fontSize={isCenter ? 10 : 9} fill={isCenter ? '#fff' : '#0f172a'}>{n.label}</text>
            </g>
          );
        })}
      </svg>

      {/* tooltip / details */}
      {hovered && (() => {
        const node = findNode(hovered);
        return (
          <div className="absolute left-6 top-6 z-20 w-64 rounded-md border border-border bg-card p-3 text-sm shadow">
            <div className="font-medium text-foreground">{node.label}</div>
            <div className="mt-1 text-xs text-muted-foreground">Type: {node.id === 'farmer' ? 'Person' : 'Entity'}</div>
            <div className="mt-2 text-xs">Mock details: This node is connected to the farmer and represents related records or data sources.</div>
          </div>
        );
      })()}

      {/* active panel */}
      {active && (() => {
        const node = findNode(active);
        return (
          <div className="mt-3 rounded-md border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{node.label} — Details</div>
                <div className="mt-1 text-xs text-muted-foreground">Mock evidence and links for {node.label}.</div>
              </div>
              <div>
                <Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button>
              </div>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">Example properties: <br/> - Connected records: {Math.floor(1 + Math.random()*5)} <br/> - Last verified: {new Date(Date.now()-Math.floor(Math.random()*1000*60*60*24*60)).toLocaleDateString()}</div>
          </div>
        );
      })()}
    </div>
  );
}


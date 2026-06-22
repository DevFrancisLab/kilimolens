import React, { useMemo, useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/Layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Save, X, MapPin, Home, Seedling, Layers, Activity, Calendar, Droplet, ShoppingCart, CreditCard, Wallet, Smartphone, DollarSign, Briefcase, Info, CheckCircle2, CloudRain, AlertTriangle, Sun, Thermometer, TrendingUp, Leaf, BarChart2 } from "lucide-react";

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
  const [processing, setProcessing] = useState(false);
  const [processStage, setProcessStage] = useState(0);
  const mountedRef = useRef(true);

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

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const processingStages = [
    "Collecting farmer profile",
    "Verifying records",
    "Loading climate intelligence",
    "Building knowledge graph",
    "Running ML models",
    "Generating explanation",
    "Preparing recommendation",
  ];

  async function runAIProcessing() {
    setProcessing(true);
    setProcessStage(0);
    // simulate progress through stages
    for (let i = 0; i < processingStages.length; i++) {
      if (!mountedRef.current) return;
      setProcessStage(i);
      // each stage lasts between 600-1200ms to simulate work
      // add a small delay
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, 800 + Math.random() * 600));
    }
    // short finalization pause
    await new Promise((res) => setTimeout(res, 700));
    if (!mountedRef.current) return;
    setProcessing(false);
    setProcessStage(0);
    // navigate to AI results step
    setCurrent(6);
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

  function computeCompleteness(f: FormState) {
    // Count all primitive fields (strings) and compute percentage filled
    const values: string[] = [];
    Object.values(f.personal).forEach((v) => values.push(String(v || "")));
    Object.values(f.farm).forEach((v) => values.push(String(v || "")));
    Object.values(f.finance).forEach((v) => values.push(String(v || "")));
    Object.values(f.community).forEach((v) => {
      if (typeof v === "string") values.push(v || "");
    });
    Object.values(f.climate).forEach((v) => values.push(String(v || "")));

    // include verification checklist fields explicitly
    values.push(String(f.community.verificationChecklist.idDocument || ""));
    values.push(String(f.community.verificationChecklist.coopLetter || ""));
    values.push(String(f.community.verificationChecklist.onsiteVisit || ""));

    const total = values.length;
    const filled = values.filter((v) => v && v.trim() !== "" && v !== "Pending").length;
    return Math.round((filled / Math.max(1, total)) * 100);
  }

  function computeFinanceReadiness(f: FormState) {
    // Simple heuristic-based mock score (0-100)
    let score = 50;
    try {
      if (f.finance.repaymentHistory === "Good") score += 12;
      if (f.finance.repaymentHistory === "Irregular") score += 2;
      if (f.finance.repaymentHistory === "Defaulted") score -= 20;

      const savings = Number(String(f.finance.savings || "").replace(/[^0-9.]/g, "") || 0);
      if (savings > 0) score += 8;

      const outstanding = Number(String(f.finance.outstandingLoans || "").replace(/[^0-9.]/g, "") || 0);
      if (outstanding === 0) score += 8;
      if (outstanding > 0 && outstanding < 5000) score += 3;

      if (f.finance.mobileMoneyActivity === "High") score += 6;
      if (f.finance.mobileMoneyActivity === "Medium") score += 3;

      // Clamp
      score = Math.max(0, Math.min(100, Math.round(score)));
    } catch (e) {
      // fallback
      // eslint-disable-next-line no-console
      console.error(e);
    }
    return score;
  }

  function deriveRecommendation(score: number) {
    if (score >= 80) return "Approve";
    if (score >= 55) return "Conditional approval";
    return "Decline";
  }

  function deriveConfidence(score: number) {
    // Mock confidence: base 50 + 0.4 * score, capped 95
    return Math.min(95, Math.round(50 + score * 0.4));
  }

  /* Score computations for the six cards (mock heuristics) */
  function computeFarmProductivity(f: FormState) {
    let score = 50;
    try {
      const prev = Number(String(f.farm.previousHarvest || "").replace(/[^0-9.]/g, "") || 0);
      const expected = Number(String(f.farm.expectedHarvest || "").replace(/[^0-9.]/g, "") || 0);
      const size = Number(String(f.farm.farmSize || "").replace(/[^0-9.]/g, "") || 0);
      if (expected > prev && expected > 0) score += 15;
      if (size >= 1) score += 10;
      if (f.farm.primaryCrop) score += 5;
      score = Math.max(0, Math.min(100, Math.round(score)));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
    return score;
  }

  function computeClimateResilience(f: FormState) {
    let points = 0;
    const yes = (v?: string) => (v === "Yes" ? 1 : 0);
    points += yes(f.climate.cropDiversification) * 20;
    points += yes(f.climate.droughtResistantCrops) * 20;
    points += yes(f.climate.waterHarvesting) * 15;
    points += yes(f.climate.soilConservation) * 15;
    points += yes(f.climate.climateSmartTraining) * 15;
    points += yes(f.climate.livelihoodDiversification) * 15;
    return Math.max(0, Math.min(100, points));
  }

  function computeEnvironmentalRisk(f: FormState) {
    // Higher value = better (lower risk). We'll invert for display as risk score.
    let safe = 50;
    const yes = (v?: string) => (v === "Yes" ? 0 : 1);
    safe -= yes(f.climate.soilConservation) * 15;
    safe -= yes(f.climate.waterHarvesting) * 12;
    const out = Number(String(f.finance.outstandingLoans || "").replace(/[^0-9.]/g, "") || 0);
    if (out > 5000) safe -= 20;
    const risk = Math.max(0, Math.min(100, 100 - safe));
    return risk;
  }

  function computeCommunityTrust(f: FormState) {
    let score = 30;
    if (f.community.saccoMembership === "Yes") score += 20;
    if (f.community.cooperativeMembership && f.community.cooperativeMembership !== "") score += 10;
    const checklist = f.community.verificationChecklist;
    if (checklist.idDocument === "Verified") score += 15;
    if (checklist.coopLetter === "Verified") score += 10;
    if (checklist.onsiteVisit === "Verified") score += 15;
    return Math.max(0, Math.min(100, score));
  }

  function computeDataConfidence(f: FormState) {
    // Tie to completeness and verification coverage
    const base = computeCompleteness(f);
    const verified = [f.community.verificationChecklist.idDocument, f.community.verificationChecklist.coopLetter, f.community.verificationChecklist.onsiteVisit].filter((v) => v === "Verified").length;
    return Math.max(10, Math.min(100, Math.round(base * 0.8 + verified * 6)));
  }

  /* Explainable AI helpers (mocked) */
  function computeAISummary(f: FormState) {
    const fin = computeFinanceReadiness(f);
    const farm = computeFarmProductivity(f);
    const climate = computeClimateResilience(f);
    const rec = deriveRecommendation(fin);
    return `The model estimates a ${rec.toLowerCase()} outcome. Finance readiness is ${fin}%, farm productivity ${farm}%, and climate resilience ${climate}%. Confidence is ${deriveConfidence(fin)}%.`;
  }

  function computeStrengths(f: FormState) {
    const strengths: string[] = [];
    const fin = computeFinanceReadiness(f);
    const farm = computeFarmProductivity(f);
    if (fin >= 60) strengths.push('Consistent repayment signals and positive savings');
    if (farm >= 60) strengths.push('Strong expected productivity and adequate farm size');
    if (f.community.saccoMembership === 'Yes') strengths.push('Community membership and peer support');
    if (f.climate.climateSmartTraining === 'Yes') strengths.push('Farmer has relevant climate-smart training');
    return strengths;
  }

  function computeRisks(f: FormState) {
    const risks: string[] = [];
    const env = computeEnvironmentalRisk(f);
    const fin = computeFinanceReadiness(f);
    if (env >= 60) risks.push('Elevated environmental exposure (soil/water concerns)');
    if (fin < 50) risks.push('Weak financial buffers or repayment concerns');
    if (f.climate.droughtHistory && f.climate.droughtHistory !== 'None') risks.push('History of droughts in the area');
    if (f.community.verificationChecklist.onsiteVisit !== 'Verified') risks.push('No on-site verification recorded');
    return risks;
  }

  function computeKeyFactors(f: FormState) {
    const factors: string[] = [];
    if (f.finance.repaymentHistory) factors.push(`Repayment history: ${f.finance.repaymentHistory}`);
    if (f.finance.savings) factors.push(`Savings: ${f.finance.savings}`);
    if (f.farm.primaryCrop) factors.push(`Primary crop: ${f.farm.primaryCrop}`);
    if (f.climate.cropDiversification) factors.push(`Crop diversification: ${f.climate.cropDiversification}`);
    return factors.slice(0, 5);
  }

  /* Climate intelligence (mock) */
  function computeClimateIntelligence(f: FormState) {
    // deterministic mock values based on some inputs
    const rainfallBase = 600; // mm/year base
    let rainfall = rainfallBase;
    if (f.climate.waterHarvesting === 'Yes') rainfall += 80;
    if (f.climate.irrigation && f.climate.irrigation !== 'None') rainfall += 40;
    if (f.climate.droughtHistory && f.climate.droughtHistory !== 'None') rainfall -= 200;

    // Risks: simple heuristics
    const floodRisk = Math.max(5, Math.min(95, Math.round((rainfall - 300) / 8)));
    const droughtRisk = Math.max(5, Math.min(95, Math.round((1200 - rainfall) / 12)));

    // NDVI 0-1 mapped from crop diversification and expected harvest
    const ndvi = Math.max(0.2, Math.min(0.9, ( (f.climate.cropDiversification === 'Yes' ? 0.65 : 0.45) + (Number(f.farm.expectedHarvest || 0) > 0 ? 0.05 : 0) ) ));

    // Temperature trend (mock): increasing if no soil conservation
    const tempTrend = f.climate.soilConservation === 'Yes' ? 'Stable' : 'Increasing';

    // Soil suitability: basic heuristic from soilType and irrigation
    let soilScore = 50;
    if (f.climate.soilType === 'Loam') soilScore += 20;
    if (f.climate.soilType === 'Sandy') soilScore -= 10;
    if (f.climate.irrigation && f.climate.irrigation !== 'None') soilScore += 10;
    const soilSuitability = Math.max(0, Math.min(100, soilScore));

    return {
      rainfall: Math.round(rainfall),
      floodRisk,
      droughtRisk,
      ndvi: Math.round(ndvi * 100) / 100,
      tempTrend,
      soilSuitability,
    };
  }

  function assembleVerificationRecords(f: FormState) {
    const now = new Date();
    const randomPastDate = (days: number) => {
      const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    };

    const rows = [
      {
        key: 'nationalId',
        label: 'National ID',
        status: f.community.verificationChecklist.idDocument || 'Pending',
        source: f.personal.nationalId ? (f.community.verificationChecklist.idDocument === 'Verified' ? 'National Registry' : 'Self Declaration') : 'Not Provided',
        confidence: f.community.verificationChecklist.idDocument === 'Verified' ? 92 : f.community.verificationChecklist.idDocument === 'Self Declared' ? 56 : 28,
        date: f.community.verificationChecklist.idDocument === 'Verified' ? randomPastDate(8) : '',
      },
      {
        key: 'gps',
        label: 'GPS',
        status: f.personal.gps ? 'Verified' : 'Pending',
        source: f.personal.gps ? 'GPS Check' : 'Not Provided',
        confidence: f.personal.gps ? 88 : 20,
        date: f.personal.gps ? randomPastDate(2) : '',
      },
      {
        key: 'sacco',
        label: 'SACCO Membership',
        status: f.community.saccoMembership === 'Yes' ? 'Verified' : (f.community.saccoMembership === 'No' ? 'Self Declared' : 'Pending'),
        source: f.community.saccoMembership === 'Yes' ? 'SACCO Record' : 'Self Declaration',
        confidence: f.community.saccoMembership === 'Yes' ? 80 : f.community.saccoMembership === 'No' ? 48 : 25,
        date: f.community.saccoMembership === 'Yes' ? randomPastDate(30) : '',
      },
      {
        key: 'cooperative',
        label: 'Cooperative',
        status: f.community.cooperativeMembership ? (f.community.cooperativeMembership === 'Member' ? 'Verified' : 'Self Declared') : 'Pending',
        source: f.community.cooperativeMembership ? (f.community.cooperativeMembership === 'Member' ? 'Cooperative Letter' : 'Self Declaration') : 'Not Provided',
        confidence: f.community.cooperativeMembership ? (f.community.cooperativeMembership === 'Member' ? 78 : 45) : 22,
        date: f.community.cooperativeMembership ? randomPastDate(40) : '',
      },
      {
        key: 'mobileMoney',
        label: 'Mobile Money',
        status: f.finance.mobileMoneyActivity ? 'Verified' : 'Pending',
        source: f.finance.mobileMoneyActivity ? 'Mobile Money API' : 'Not Provided',
        confidence: f.finance.mobileMoneyActivity === 'High' ? 90 : f.finance.mobileMoneyActivity === 'Medium' ? 70 : f.finance.mobileMoneyActivity === 'Low' ? 50 : 20,
        date: f.finance.mobileMoneyActivity ? randomPastDate(5) : '',
      },
      {
        key: 'farmLocation',
        label: 'Farm Location',
        status: f.farm.county || f.farm.village ? 'Verified' : 'Pending',
        source: f.farm.county || f.farm.village ? 'Satellite/GPS' : 'Not Provided',
        confidence: f.farm.county || f.farm.village ? 82 : 18,
        date: f.farm.county || f.farm.village ? randomPastDate(10) : '',
      },
      {
        key: 'inputPurchases',
        label: 'Input Purchases',
        status: f.farm.inputPurchases ? 'Self Declared' : 'Pending',
        source: f.farm.inputPurchases ? 'Receipts / Self Declaration' : 'Not Provided',
        confidence: f.farm.inputPurchases ? 54 : 16,
        date: f.farm.inputPurchases ? randomPastDate(15) : '',
      },
    ];

    return rows;
  }

  /* Knowledge Graph visualization component */
  function KnowledgeGraph({ f }: { f: FormState }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [hovered, setHovered] = useState<string | null>(null);
    const [dashOffset, setDashOffset] = useState(0);

    useEffect(() => {
      let raf = 0;
      const loop = () => {
        setDashOffset((d) => (d + 1) % 1000);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
    }, []);

    const center = { x: 360, y: 200 };
    const radius = 140;
    const nodesData = useMemo(() => {
      const labels = [
        { id: 'sacco', label: 'SACCO' },
        { id: 'cooperative', label: 'Cooperative' },
        { id: 'climate', label: 'Climate Data' },
        { id: 'loans', label: 'Loans' },
        { id: 'inputs', label: 'Input Supplier' },
        { id: 'extension', label: 'Extension Officer' },
        { id: 'weather', label: 'Weather' },
      ];
      return labels.map((n, i) => {
        const angle = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
        return { ...n, x: Math.round(center.x + Math.cos(angle) * radius), y: Math.round(center.y + Math.sin(angle) * radius) };
      });
    }, []);

    const centerNode = { id: 'farmer', label: f.personal.fullName || 'Farmer', x: center.x, y: center.y };

    return (
      <div className="mt-6">
        <div className="text-sm font-medium mb-3">Knowledge Graph</div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 rounded-lg border border-border bg-card p-4" ref={containerRef}>
            <svg viewBox="0 0 720 420" className="w-full h-[420px]">
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.08" />
                </filter>
              </defs>

              {/* connections */}
              {nodesData.map((n) => (
                <g key={n.id}>
                  <line x1={centerNode.x} y1={centerNode.y} x2={n.x} y2={n.y} stroke="#93c5fd" strokeWidth={2} strokeDasharray="6 6" strokeDashoffset={dashOffset} />
                </g>
              ))}

              {/* peripheral nodes */}
              {nodesData.map((n) => (
                <g key={n.id} transform={`translate(${n.x}, ${n.y})`} style={{ cursor: 'pointer' }} onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)}>
                  <circle r={28} cx={0} cy={0} fill={hovered === n.id ? '#ecfeff' : '#ffffff'} stroke={hovered === n.id ? '#06b6d4' : '#e6eef9'} strokeWidth={2} filter="url(#shadow)" />
                  <text x={0} y={5} textAnchor="middle" className="text-sm font-semibold" style={{ fontSize: 12, fill: '#0f172a' }}>{n.label}</text>
                </g>
              ))}

              {/* center node */}
              <g transform={`translate(${centerNode.x}, ${centerNode.y})`} style={{ cursor: 'default' }}>
                <circle r={36} cx={0} cy={0} fill="#0ea5e9" stroke="#0369a1" strokeWidth={3} filter="url(#shadow)" />
                <text x={0} y={6} textAnchor="middle" className="text-sm font-semibold" style={{ fontSize: 14, fill: '#ffffff' }}>{centerNode.label}</text>
              </g>
            </svg>
          </div>

          <div className="space-y-3">
            <div className="rounded-md border border-border bg-card p-4">
              <div className="text-sm font-medium">Node Details</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {hovered ? (
                  (() => {
                    const n = nodesData.find((x) => x.id === hovered)!;
                    return (
                      <div>
                        <div className="font-semibold">{n.label}</div>
                        <div className="mt-1 text-sm">Relationship: Connected to Farmer</div>
                        <div className="mt-2 text-xs text-muted-foreground">Mock metadata: sourceConfidence — {Math.round(Math.random() * 40 + 60)}%</div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-sm text-muted-foreground">Hover a node to see details here. Nodes animate and show relations to the farmer.</div>
                )}
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-4">
              <div className="text-sm font-medium">Controls</div>
              <div className="mt-2 text-sm text-muted-foreground">Use hover to highlight nodes. Connections animate to show graph flow.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function ScoreCard({
    title,
    score,
    explanation,
    details,
    Icon,
  }: {
    title: string;
    score: number;
    explanation: string;
    details: React.ReactNode;
    Icon?: React.ComponentType<{ className?: string }>;
  }) {
    const [open, setOpen] = useState(false);
    const r = 28; // radius
    const c = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, score));
    const dash = (pct / 100) * c;

    return (
      <div className={cn(
          "group cursor-pointer rounded-lg border bg-card p-4 transition-transform duration-150",
          open ? "shadow-lg scale-100" : "hover:scale-105 hover:shadow-md",
        )} onClick={() => setOpen((s) => !s)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg width="68" height="68" viewBox="0 0 68 68">
                <g transform="translate(34,34)">
                  <circle r={r} cx="0" cy="0" fill="transparent" stroke="#e6e9ee" strokeWidth="6" />
                  <circle
                    r={r}
                    cx="0"
                    cy="0"
                    fill="transparent"
                    stroke="#06b6d4"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${c - dash}`}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                  />
                </g>
              </svg>
              <div className="absolute left-0 top-0 flex h-16 w-16 items-center justify-center text-sm font-semibold">{pct}%</div>
            </div>
            <div>
              <div className="text-sm font-medium">{title}</div>
              <div className="text-sm text-muted-foreground">{explanation}</div>
            </div>
          </div>
          {Icon ? <Icon className="h-6 w-6 text-muted-foreground" /> : null}
        </div>

        <div className={cn("mt-3 overflow-hidden transition-max-h duration-200", open ? "max-h-96" : "max-h-0")}>
          <div className="text-sm text-muted-foreground">{details}</div>
        </div>
      </div>
    );
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
              
              {/* Climate Intelligence */}
              <div className="mt-6">
                <div className="text-sm font-medium mb-3">Climate Intelligence</div>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {(() => {
                    const c = computeClimateIntelligence(form);
                    return (
                      <>
                        <div className="rounded-lg border border-border bg-card p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm text-muted-foreground">Rainfall</div>
                              <div className="mt-2 text-lg font-semibold">{c.rainfall} mm/yr</div>
                              <div className="mt-1 text-sm text-muted-foreground">Annual estimated rainfall</div>
                            </div>
                            <CloudRain className="h-7 w-7 text-sky-500" />
                          </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm text-muted-foreground">Flood Risk</div>
                              <div className="mt-2 text-lg font-semibold">{c.floodRisk}%</div>
                              <div className="mt-1 text-sm text-muted-foreground">Likelihood of surface water flooding</div>
                            </div>
                            <AlertTriangle className="h-7 w-7 text-amber-500" />
                          </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm text-muted-foreground">Drought Risk</div>
                              <div className="mt-2 text-lg font-semibold">{c.droughtRisk}%</div>
                              <div className="mt-1 text-sm text-muted-foreground">Probability of seasonal drought</div>
                            </div>
                            <Sun className="h-7 w-7 text-yellow-500" />
                          </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm text-muted-foreground">NDVI</div>
                              <div className="mt-2 text-lg font-semibold">{c.ndvi}</div>
                              <div className="mt-1 text-sm text-muted-foreground">Vegetation index (0-1)</div>
                            </div>
                            <Leaf className="h-7 w-7 text-emerald-500" />
                          </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm text-muted-foreground">Temperature Trend</div>
                              <div className="mt-2 text-lg font-semibold">{c.tempTrend}</div>
                              <div className="mt-1 text-sm text-muted-foreground">Recent average change</div>
                            </div>
                            <Thermometer className="h-7 w-7 text-rose-500" />
                          </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm text-muted-foreground">Soil Suitability</div>
                              <div className="mt-2 text-lg font-semibold">{c.soilSuitability}%</div>
                              <div className="mt-1 text-sm text-muted-foreground">Estimated suitability for cropping</div>
                            </div>
                            <BarChart2 className="h-7 w-7 text-violet-500" />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {/* Verification & Evidence */}
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Verification & Evidence</CardTitle>
                        <CardDescription>All verification sources and confidence for submitted evidence</CardDescription>
                      </div>
                      <div className="text-sm text-muted-foreground">Updated: {new Date().toISOString().split('T')[0]}</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <div className="min-w-[720px]">
                        <div className="grid grid-cols-6 gap-4 px-2 py-3 text-xs font-medium text-muted-foreground border-b">
                          <div>Verification Item</div>
                          <div className="col-span-2">Status</div>
                          <div>Source</div>
                          <div>Confidence</div>
                          <div>Verification Date</div>
                        </div>
                        {assembleVerificationRecords(form).map((r) => (
                          <div key={r.key} className="grid grid-cols-6 gap-4 items-center px-2 py-3 hover:bg-muted/5">
                            <div className="text-sm font-medium">{r.label}</div>
                            <div className="col-span-2">
                              <div className={badgeClass(r.status)}>{r.status}</div>
                            </div>
                            <div className="text-sm text-muted-foreground">{r.source}</div>
                            <div>
                              <div className="w-full rounded-full bg-muted/20 h-2">
                                <div className="h-2 rounded-full bg-primary" style={{ width: `${r.confidence}%` }} />
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">{r.confidence}%</div>
                            </div>
                            <div className="text-sm text-muted-foreground">{r.date || '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
          
              {/* Knowledge Graph */}
              <div className="mt-6 md:col-span-3">
                <KnowledgeGraph f={form} />
              </div>
              
              {/* Explainable AI Assistant */}
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>AI Assistant</CardTitle>
                        <CardDescription>Explainable assessment and rationale</CardDescription>
                      </div>
                      <div className="text-sm text-muted-foreground">Confidence: {deriveConfidence(computeFinanceReadiness(form))}%</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="md:col-span-2 space-y-3">
                        <div className="text-sm font-medium">AI Summary</div>
                        <div className="text-sm text-muted-foreground">{computeAISummary(form)}</div>

                        <div className="mt-4">
                          <div className="text-sm font-medium">Recommendation</div>
                          <div className="mt-1 text-sm">{deriveRecommendation(computeFinanceReadiness(form))} — {deriveConfidence(computeFinanceReadiness(form)) > 75 ? 'Proceed with standard terms.' : 'Consider conditional approval with monitoring.'}</div>
                        </div>
                      </div>

                      <aside className="space-y-3">
                        <div>
                          <div className="text-sm font-medium">Strengths</div>
                          <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground">
                            {computeStrengths(form).length > 0 ? computeStrengths(form).map((s) => <li key={s}>{s}</li>) : <li>None highlighted</li>}
                          </ul>
                        </div>

                        <div>
                          <div className="text-sm font-medium">Risks</div>
                          <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground">
                            {computeRisks(form).length > 0 ? computeRisks(form).map((r) => <li key={r}>{r}</li>) : <li>No immediate risks detected</li>}
                          </ul>
                        </div>

                        <div>
                          <div className="text-sm font-medium">Key Factors</div>
                          <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground">
                            {computeKeyFactors(form).length > 0 ? computeKeyFactors(form).map((k) => <li key={k}>{k}</li>) : <li>Insufficient data</li>}
                          </ul>
                        </div>
                      </aside>
                    </div>
                  </CardContent>
                </Card>
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
            <FormCard title="Review Assessment" desc="Summarise information and run AI assessment when ready.">
              <div className="space-y-6">
                {/* completeness */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Estimated completeness</div>
                    <div className="text-2xl font-semibold">{computeCompleteness(form)}%</div>
                  </div>
                  <div>
                    <Button variant="ghost" onClick={saveDraft}>Save Draft</Button>
                  </div>
                </div>

                {/* Sections summary */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Personal Information</CardTitle>
                          <CardDescription>{form.personal.fullName || "—"}</CardDescription>
                        </div>
                        <div>
                          <Button variant="ghost" onClick={() => setCurrent(0)}>Edit</Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid gap-2">
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Full name</dt><dd>{form.personal.fullName || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">National ID</dt><dd>{form.personal.nationalId || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Phone</dt><dd>{form.personal.phone || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Gender / Age</dt><dd>{(form.personal.gender || '—') + ' / ' + (form.personal.age || '—')}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Location</dt><dd>{[form.personal.county, form.personal.subCounty, form.personal.ward, form.personal.village].filter(Boolean).join(', ') || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Loan requested</dt><dd>{form.personal.loanAmount ? form.personal.loanAmount + ' — ' + (form.personal.loanPurpose || '') : '—'}</dd></div>
                      </dl>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Farm Information</CardTitle>
                          <CardDescription>{form.farm.primaryCrop || '—'}</CardDescription>
                        </div>
                        <div>
                          <Button variant="ghost" onClick={() => setCurrent(1)}>Edit</Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid gap-2">
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Farm size</dt><dd>{form.farm.farmSize || form.farm.hectares || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Ownership</dt><dd>{form.farm.landOwnership || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Primary / Secondary crops</dt><dd>{[form.farm.primaryCrop, form.farm.secondaryCrops].filter(Boolean).join(' / ') || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Livestock</dt><dd>{form.farm.livestock || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Irrigation</dt><dd>{form.farm.irrigation || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Last / Expected harvest (kg)</dt><dd>{(form.farm.previousHarvest || '—') + ' / ' + (form.farm.expectedHarvest || '—')}</dd></div>
                      </dl>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Financial Behaviour</CardTitle>
                          <CardDescription>{form.finance.repaymentHistory || '—'}</CardDescription>
                        </div>
                        <div>
                          <Button variant="ghost" onClick={() => setCurrent(2)}>Edit</Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid gap-2">
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Previous loans</dt><dd>{form.finance.previousLoans || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Outstanding</dt><dd>{form.finance.outstandingLoans || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Savings</dt><dd>{form.finance.savings || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Avg monthly income</dt><dd>{form.finance.avgMonthlyIncome || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Mobile money</dt><dd>{form.finance.mobileMoneyActivity || '—'}</dd></div>
                      </dl>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Community Information</CardTitle>
                          <CardDescription>{form.community.selectedSacco || form.community.cooperative || '—'}</CardDescription>
                        </div>
                        <div>
                          <Button variant="ghost" onClick={() => setCurrent(3)}>Edit</Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid gap-2">
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">SACCO membership</dt><dd>{form.community.saccoMembership || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Selected SACCO</dt><dd>{form.community.selectedSacco || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Years in SACCO</dt><dd>{form.community.yearsInSacco || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Cooperative / Farmer group</dt><dd>{[form.community.cooperativeMembership, form.community.farmerGroup].filter(Boolean).join(' / ') || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Peer guarantees</dt><dd>{form.community.peerGuarantees || '—'}</dd></div>
                      </dl>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Climate Practices</CardTitle>
                          <CardDescription>{form.climate.primaryCrop || '—'}</CardDescription>
                        </div>
                        <div>
                          <Button variant="ghost" onClick={() => setCurrent(4)}>Edit</Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid gap-2">
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Crop diversification</dt><dd>{form.climate.cropDiversification || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Drought-resistant crops</dt><dd>{form.climate.droughtResistantCrops || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Water harvesting</dt><dd>{form.climate.waterHarvesting || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Soil conservation</dt><dd>{form.climate.soilConservation || '—'}</dd></div>
                        <div className="flex justify-between text-sm"><dt className="text-muted-foreground">Livelihood diversification</dt><dd>{form.climate.livelihoodDiversification || '—'}</dd></div>
                      </dl>
                    </CardContent>
                  </Card>
                </div>

                {/* Verification summary */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Verification Summary</CardTitle>
                      <CardDescription>Statuses for key verification items</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">ID Document</div><div className={badgeClass(form.community.verificationChecklist.idDocument)}>{form.community.verificationChecklist.idDocument}</div></div>
                        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">Cooperative Letter</div><div className={badgeClass(form.community.verificationChecklist.coopLetter)}>{form.community.verificationChecklist.coopLetter}</div></div>
                        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">On-site Visit</div><div className={badgeClass(form.community.verificationChecklist.onsiteVisit)}>{form.community.verificationChecklist.onsiteVisit}</div></div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="mt-4">
                      <Button variant="default" className="w-full" onClick={() => runAIProcessing()}>Run AI Assessment</Button>
                    </div>
                </div>
              </div>
            </FormCard>
          )}

            {/* Processing overlay */}
            {processing && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
                <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold">Running AI Assessment</div>
                      <div className="text-sm text-muted-foreground">This may take a few moments — we&apos;re analysing the submission.</div>
                    </div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted/20">
                      <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.15" /><path d="M22 12a10 10 0 0 0-10-10" strokeWidth="3" strokeLinecap="round" /></svg>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    {processingStages.map((s, i) => (
                      <div key={s} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${i <= processStage ? 'bg-green-600/10 text-green-600' : 'bg-muted/10 text-muted-foreground'}`}>
                            {i < processStage ? <CheckCircle2 className="h-5 w-5" /> : <span className={`h-2 w-2 rounded-full ${i === processStage ? 'bg-primary' : 'bg-muted'}`} />}
                          </div>
                          <div>
                            <div className={`text-sm ${i === processStage ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{s}</div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">{i < processStage ? 'Done' : i === processStage ? 'Processing' : 'Pending'}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <div className="h-2 w-full rounded-full bg-muted/20">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${Math.round(((processStage+1)/processingStages.length)*100)}%` }} />
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">{Math.round(((processStage+1)/processingStages.length)*100)}% complete</div>
                  </div>
                </div>
              </div>
            )}

          {current === 6 && (
            <FormCard title="AI Assessment Results" desc="Mocked AI results based on submitted data.">
              <div className="space-y-6">
                {/* Top hero cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="col-span-1 rounded-lg border border-border bg-gradient-to-br from-white/60 to-muted/5 p-4">
                    <div className="text-sm text-muted-foreground">Farmer</div>
                    <div className="mt-2 text-lg font-semibold">{form.personal.fullName || 'Unknown'}</div>
                  </div>

                  <div className="col-span-1 rounded-lg border border-border bg-card p-4">
                    <div className="text-sm text-muted-foreground">Loan Requested</div>
                    <div className="mt-2 text-lg font-semibold">{form.personal.loanAmount || '—'}</div>
                    {form.personal.loanPurpose ? <div className="mt-1 text-sm text-muted-foreground">{form.personal.loanPurpose}</div> : null}
                  </div>

                  <div className="col-span-1 rounded-lg border border-border bg-card p-4">
                    <div className="text-sm text-muted-foreground">Finance Readiness</div>
                    <div className="mt-2 text-2xl font-bold text-foreground">{computeFinanceReadiness(form)}%</div>
                    <div className="mt-1 text-sm text-muted-foreground">Higher means better repayment capacity</div>
                  </div>

                  <div className="col-span-1 rounded-lg border border-border bg-card p-4">
                    <div className="text-sm text-muted-foreground">Recommendation</div>
                    <div className="mt-2 text-lg font-semibold">{deriveRecommendation(computeFinanceReadiness(form))}</div>
                    <div className="mt-1 text-sm text-muted-foreground">Based on a mock scoring heuristic</div>
                  </div>

                  <div className="col-span-1 rounded-lg border border-border bg-card p-4">
                    <div className="text-sm text-muted-foreground">Confidence</div>
                    <div className="mt-2 text-2xl font-bold text-foreground">{deriveConfidence(computeFinanceReadiness(form))}%</div>
                    <div className="mt-1 text-sm text-muted-foreground">Model confidence (mock)</div>
                  </div>
                </div>

                {/* Detailed results */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Resilience Score</div>
                        <div className="text-2xl font-semibold">{Math.round((computeFinanceReadiness(form) * 0.9) + 10)} / 100</div>
                      </div>
                      <div className="text-sm text-muted-foreground">Confidence: {deriveConfidence(computeFinanceReadiness(form))}%</div>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">This score is a mocked indicator combining finance and climate practice signals.</div>
                  </div>

                  <div className="rounded-md border border-border bg-card p-4">
                    <div className="text-sm font-medium">Suggested Recommendation</div>
                    <div className="mt-2">{deriveRecommendation(computeFinanceReadiness(form))} — {deriveConfidence(computeFinanceReadiness(form)) > 75 ? 'Proceed with standard terms' : 'Consider conditional loan with monitoring and capacity support.'}</div>
                    <div className="mt-3 text-sm text-muted-foreground">Notes: This is a frontend-only mock. For production, replace with model output from the AI service.</div>
                  </div>
                </div>

                {/* Score cards */}
                <div className="mt-6">
                  <div className="text-sm font-medium mb-3">Detailed Scores</div>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <ScoreCard
                      title="Financial Behaviour"
                      score={computeFinanceReadiness(form)}
                      explanation="Repayment history, savings and mobile activity"
                      details={<>
                        <div className="font-medium">Key drivers</div>
                        <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground">
                          <li>Repayment history: {form.finance.repaymentHistory}</li>
                          <li>Savings: {form.finance.savings || '—'}</li>
                          <li>Mobile activity: {form.finance.mobileMoneyActivity}</li>
                        </ul>
                      </>}
                      Icon={CreditCard}
                    />

                    <ScoreCard
                      title="Farm Productivity"
                      score={computeFarmProductivity(form)}
                      explanation="Harvests, farm size and crop mix"
                      details={<>
                        <div className="font-medium">Productivity factors</div>
                        <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground">
                          <li>Previous harvest: {form.farm.previousHarvest || '—'}</li>
                          <li>Expected harvest: {form.farm.expectedHarvest || '—'}</li>
                          <li>Farm size: {form.farm.farmSize || '—'}</li>
                        </ul>
                      </>}
                      Icon={Seedling}
                    />

                    <ScoreCard
                      title="Climate Resilience"
                      score={computeClimateResilience(form)}
                      explanation="Adoption of climate-smart practices"
                      details={<>
                        <div className="font-medium">Practices</div>
                        <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground">
                          <li>Crop diversification: {form.climate.cropDiversification}</li>
                          <li>Water harvesting: {form.climate.waterHarvesting}</li>
                          <li>Soil conservation: {form.climate.soilConservation}</li>
                        </ul>
                      </>}
                      Icon={Droplet}
                    />

                    <ScoreCard
                      title="Environmental Risk"
                      score={computeEnvironmentalRisk(form)}
                      explanation="Exposure to environmental hazards"
                      details={<>
                        <div className="font-medium">Risk signals</div>
                        <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground">
                          <li>Irrigation: {form.climate.irrigation}</li>
                          <li>Soil conservation: {form.climate.soilConservation}</li>
                          <li>Outstanding loans: {form.finance.outstandingLoans || '—'}</li>
                        </ul>
                      </>}
                      Icon={Activity}
                    />

                    <ScoreCard
                      title="Community Trust"
                      score={computeCommunityTrust(form)}
                      explanation="Memberships and verified documents"
                      details={<>
                        <div className="font-medium">Community signals</div>
                        <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground">
                          <li>SACCO member: {form.community.saccoMembership || '—'}</li>
                          <li>Verified ID: {form.community.verificationChecklist.idDocument}</li>
                          <li>On-site visit: {form.community.verificationChecklist.onsiteVisit}</li>
                        </ul>
                      </>}
                      Icon={Layers}
                    />

                    <ScoreCard
                      title="Data Confidence"
                      score={computeDataConfidence(form)}
                      explanation="Completeness and verified evidence"
                      details={<>
                        <div className="font-medium">Confidence drivers</div>
                        <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground">
                          <li>Form completeness: {computeCompleteness(form)}%</li>
                          <li>Verified items: {[form.community.verificationChecklist.idDocument, form.community.verificationChecklist.coopLetter, form.community.verificationChecklist.onsiteVisit].filter(Boolean).join(', ') || '—'}</li>
                        </ul>
                      </>}
                      Icon={Smartphone}
                    />
                  </div>
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

// KilimoLens API client — talks to the FastAPI backend (graph AI credit scoring).
// Configure the base URL with VITE_API_URL (defaults to local dev backend).

const API_BASE =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api";

export type Driver = {
  feature: string;
  label: string;
  impact: number;
  direction: "positive" | "negative";
  value: string;
};

export type DimensionScores = {
  financial: number;
  productivity: number;
  resilience: number;
  envRisk: number;
  community: number;
  dataConfidence: number;
};

export type GraphFeatures = {
  cooperativeNetworkStrength: number;
  peerRepaymentScore: number;
  cooperativeSize: number;
  source: "neo4j" | "derived";
};

export type Explanation = {
  summary: string;
  strengths: string[];
  risks: string[];
  farmerMessage: string;
  farmerMessageSw: string;
  nextSteps: string[];
  source: "featherless" | "fallback";
};

export type ClimateData = {
  rainfallMmYr: number;
  avgTempC: number;
  tempTrendCPerDecade: number;
  droughtRiskPct: number;
  floodRisk: string;
  ndviProxy: number;
  soilSuitability: string;
  latitude: number;
  longitude: number;
  source: "open-meteo" | "estimated";
};

export type AssessmentSummary = {
  id: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  county: string;
  loanAmount: number;
  purpose: string;
  readiness: number;
  confidence: number;
  recommendation: string;
  status: string;
  createdAt: string;
  assessmentCount?: number;
};

export type DashboardStats = {
  totalAssessments: number;
  totalFarmers: number;
  pending: number;
  approved: number;
  declined: number;
  approvalRate: number;
  avgReadiness: number;
  avgConfidence: number;
  approvedLoanValue: number;
  byCounty: { county: string; count: number }[];
};

export type FarmerDetail = {
  farmerId: string;
  profile: any;
  latest: AssessmentResult;
  summary: AssessmentSummary;
  history: {
    id: string;
    createdAt: string;
    readiness: number;
    confidence: number;
    recommendation: string;
    status: string;
  }[];
};

export type GraphData = {
  nodes: { id: string; label: string; name?: string }[];
  edges: { source: string; target: string; rel: string }[];
  source: string;
};

export type AssessmentResult = {
  farmerId: string;
  creditReadinessScore: number;
  confidenceScore: number;
  recommendation: string;
  dimensionScores: DimensionScores;
  drivers: Driver[];
  graphFeatures: GraphFeatures;
  climate: ClimateData;
  explanation: Explanation;
  modelVersion: string;
  assessmentId?: string;
  createdAt?: string;
  status?: string;
};

/** POST the wizard form to the backend. Throws on network/HTTP error so the
 *  caller can fall back to the local mock scoring. */
export async function assessFarmer(form: unknown, signal?: AbortSignal): Promise<AssessmentResult> {
  const res = await fetch(`${API_BASE}/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...(form as object), persist: true }),
    signal,
  });
  if (!res.ok) throw new Error(`Assess failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as AssessmentResult;
}

export async function getHealth(): Promise<unknown> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health failed: ${res.status}`);
  return res.json();
}

export async function getFarmerGraph(farmerId: string): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/farmers/${encodeURIComponent(farmerId)}/graph`);
  if (!res.ok) throw new Error(`Graph failed: ${res.status}`);
  return res.json();
}

export async function getStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`);
  return res.json();
}

export async function listAssessments(limit = 100): Promise<AssessmentSummary[]> {
  const res = await fetch(`${API_BASE}/assessments?limit=${limit}`);
  if (!res.ok) throw new Error(`Assessments failed: ${res.status}`);
  return (await res.json()).items;
}

export async function getAssessment(id: string): Promise<
  AssessmentSummary & { result: AssessmentResult; request: any }
> {
  const res = await fetch(`${API_BASE}/assessments/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Assessment failed: ${res.status}`);
  return res.json();
}

export async function listFarmers(): Promise<AssessmentSummary[]> {
  const res = await fetch(`${API_BASE}/farmers`);
  if (!res.ok) throw new Error(`Farmers failed: ${res.status}`);
  return (await res.json()).items;
}

export async function getFarmer(farmerId: string): Promise<FarmerDetail> {
  const res = await fetch(`${API_BASE}/farmers/${encodeURIComponent(farmerId)}`);
  if (!res.ok) throw new Error(`Farmer failed: ${res.status}`);
  return res.json();
}

export async function getClimate(params: {
  gps?: string;
  county?: string;
  lat?: number;
  lon?: number;
}): Promise<ClimateData> {
  const q = new URLSearchParams();
  if (params.lat != null && params.lon != null) {
    q.set("lat", String(params.lat));
    q.set("lon", String(params.lon));
  }
  if (params.gps) q.set("gps", params.gps);
  if (params.county) q.set("county", params.county);
  const res = await fetch(`${API_BASE}/climate?${q.toString()}`);
  if (!res.ok) throw new Error(`Climate failed: ${res.status}`);
  return res.json();
}

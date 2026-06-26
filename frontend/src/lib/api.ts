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
  nextSteps: string[];
  source: "featherless" | "fallback";
};

export type AssessmentResult = {
  farmerId: string;
  creditReadinessScore: number;
  confidenceScore: number;
  recommendation: string;
  dimensionScores: DimensionScores;
  drivers: Driver[];
  graphFeatures: GraphFeatures;
  explanation: Explanation;
  modelVersion: string;
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

export async function getFarmerGraph(farmerId: string): Promise<{
  nodes: { id: string; label: string; name?: string }[];
  edges: { source: string; target: string; rel: string }[];
  source: string;
}> {
  const res = await fetch(`${API_BASE}/farmers/${encodeURIComponent(farmerId)}/graph`);
  if (!res.ok) throw new Error(`Graph failed: ${res.status}`);
  return res.json();
}

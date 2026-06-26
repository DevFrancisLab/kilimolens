import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, CloudRain, Thermometer, Droplets, Sprout, Waves, Activity } from "lucide-react";

import DashboardLayout from "@/components/dashboard/Layout";
import { getClimate, type ClimateData } from "@/lib/api";

const COUNTIES = ["Embu", "Kisumu", "Mombasa", "Nakuru", "Uasin Gishu", "Nairobi"];

function Metric({ icon: Icon, label, value, sub, tone = "text-primary" }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold text-foreground">{value}</div>
        </div>
      </div>
      {sub && <div className="mt-2 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function ClimateInsightsPage() {
  const [county, setCounty] = useState("Embu");
  const [data, setData] = useState<ClimateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const d = await getClimate({ county });
        if (active) setData(d);
      } catch (e: any) {
        if (active) setError(e?.message || "Could not load climate data.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [county]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center gap-2">
        <CloudRain className="h-5 w-5 text-sky-500" />
        <h2 className="text-2xl font-semibold text-foreground">Climate Insights</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Live agro-climate intelligence per region, powered by Open-Meteo historical data.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <label className="text-sm text-muted-foreground">Region</label>
        <select
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {COUNTIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Fetching climate data…
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">{error}</div>
      ) : data ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Metric icon={CloudRain} label="Annual Rainfall" value={`${data.rainfallMmYr} mm`} sub="last 12 months" tone="text-sky-500" />
            <Metric icon={Thermometer} label="Avg Temperature" value={`${data.avgTempC} °C`} sub={`warming ${data.tempTrendCPerDecade} °C/decade`} tone="text-orange-500" />
            <Metric icon={Activity} label="Drought Risk" value={`${data.droughtRiskPct}%`} sub="vs 5-yr baseline" tone="text-rose-500" />
            <Metric icon={Waves} label="Flood Risk" value={data.floodRisk} sub="from peak daily rainfall" tone="text-blue-500" />
            <Metric icon={Sprout} label="Vegetation Index" value={data.ndviProxy.toFixed(2)} sub="rainfall-based proxy" tone="text-green-500" />
            <Metric icon={Droplets} label="Soil Suitability" value={data.soilSuitability} sub="for main crops" tone="text-emerald-600" />
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Coordinates: {data.latitude}, {data.longitude}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${data.source === "open-meteo" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {data.source === "open-meteo" ? "Live: Open-Meteo" : "Estimated (offline)"}
              </span>
            </div>
            <p className="mt-2">
              Rainfall and temperature are real measurements from the Open-Meteo historical archive for this region.
              Drought and flood risk are derived from the rainfall distribution; the vegetation index is a rainfall-based
              proxy (not satellite NDVI).
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/dashboard/climate-insights")({
  component: () => (
    <DashboardLayout>
      <ClimateInsightsPage />
    </DashboardLayout>
  ),
});

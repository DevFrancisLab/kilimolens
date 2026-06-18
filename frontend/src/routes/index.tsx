import { createFileRoute } from "@tanstack/react-router";
import heroImg from "@/assets/hero-satellite.jpg";
import dashImg from "@/assets/dashboard-mock.jpg";
import {
  ArrowRight,
  Satellite,
  Brain,
  LineChart,
  ShieldCheck,
  Sprout,
  CloudRain,
  Layers,
  Lightbulb,
  Building2,
  Landmark,
  Umbrella,
  CheckCircle2,
  Database,
  Activity,
  FileBarChart,
  Twitter,
  Linkedin,
  Github,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KilimoLens — See agricultural risk clearly" },
      {
        name: "description",
        content:
          "KilimoLens is an AI-powered climate-finance platform helping SACCOs, MFIs, banks and insurers turn fragmented agricultural and climate data into explainable lending risk insights.",
      },
      { property: "og:title", content: "KilimoLens — Agricultural Risk Intelligence" },
      {
        property: "og:description",
        content:
          "Explainable AI for agricultural lending. Climate + satellite + farmer data, unified.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

/* ------------------------------ NAV ------------------------------ */
function Navbar() {
  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how" },
    { label: "Solutions", href: "#solutions" },
    { label: "Pricing", href: "#pricing" },
  ];
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-background/70 px-4 py-3 shadow-soft backdrop-blur-xl">
          <a href="#" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg gradient-brand text-primary-foreground shadow-card">
              <Satellite className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">
              Kilimo<span className="text-gradient-brand">Lens</span>
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <a
            href="#cta"
            className="inline-flex items-center gap-1.5 rounded-lg gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition-transform hover:-translate-y-0.5 hover:shadow-elevated"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ HERO ------------------------------ */
function Hero() {
  return (
    <section className="relative isolate min-h-[92vh] overflow-hidden pt-32 pb-24">
      <img
        src={heroImg}
        alt="Satellite view of farmland with AI data overlay"
        width={1920}
        height={1280}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 hero-overlay" />

      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
        <div className="flex flex-col justify-center text-white">
          
          <h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Finance <span className="text-gradient-brand">Resilience</span>, Not Just Credit Scores
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/75 leading-relaxed">
            KilimoLens helps lenders make smarter agricultural financing decisions using climate risk,
            farmer resilience, and AI-driven insights, built for African markets.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#cta"
              className="group inline-flex items-center gap-2 rounded-xl gradient-brand px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-elevated transition-all hover:-translate-y-0.5"
            >
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6">
            {[
              { k: "37%", v: "Lower default risk" },
              { k: "12×", v: "Faster underwriting" },
              { k: "1.2M", v: "Farmers indexed" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="text-2xl font-semibold text-white">{s.k}</dt>
                <dd className="text-xs text-white/60 mt-1">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-accent-blue/20 blur-3xl" />
          <div className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-elevated backdrop-blur-md">
            <img
              src={dashImg}
              alt="KilimoLens risk intelligence dashboard"
              width={1600}
              height={1100}
              className="w-full"
            />
            
          </div>
        </div>
      </div>
    </section>
  );
}



/* ------------------------------ SECTION HEADER ------------------------------ */
function SectionHead({
  eyebrow,
  title,
  desc,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  desc?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-brand-blue">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {desc && <p className="mt-4 text-base text-muted-foreground leading-relaxed">{desc}</p>}
    </div>
  );
}

/* ------------------------------ PROBLEM ------------------------------ */
function Problem() {
  const cards = [
    {
      icon: Layers,
      title: "Fragmented farmer data",
      body: "Information lives in silos — cooperative records, paper logs, mobile money, and informal field reports never reach the credit officer.",
    },
    {
      icon: CloudRain,
      title: "Climate uncertainty",
      body: "Rainfall, drought and seasonal volatility shift faster than traditional underwriting models can respond.",
    },
    {
      icon: ShieldCheck,
      title: "High lending risk exposure",
      body: "Without unified insight, lenders price risk blindly — driving defaults up and shutting good farmers out.",
    },
  ];
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHead
          title={<>Agricultural lending is built on <span className="text-gradient-brand">incomplete data.</span></>}
          desc="Financial institutions struggle to assess agricultural risk because farmer data is fragmented across climate systems, field reports and financial records."
        />
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.title}
              className="group rounded-2xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ SOLUTION / FEATURES ------------------------------ */
function Solution() {
  const features = [
    { icon: CloudRain, title: "Climate Risk Scoring", body: "Quantify weather, drought and seasonal exposure per farm, per crop, per cycle." },
    { icon: Sprout, title: "Farmer Resilience Index", body: "Measure operational, financial and adaptive resilience with a single composite score." },
    { icon: Satellite, title: "Satellite Data Intelligence", body: "Ground-truth vegetation, land use and yield potential from multi-spectral imagery." },
    { icon: Brain, title: "Explainable AI Insights", body: "Every score is traceable — show the drivers a credit committee actually trusts." },
    { icon: FileBarChart, title: "Lending Recommendations", body: "Approve, restructure or decline with model-suggested loan size, tenor and pricing." },
    { icon: Database, title: "Unified Farmer Profile", body: "One record, every signal — climate, cooperative, agronomic and financial." },
  ];
  return (
    <section id="features" className="relative bg-surface py-24 sm:py-32">
      <div className="absolute inset-0 grid-bg opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHead
          title={<>One platform for <span className="text-gradient-brand">Farmer Risk Intelligence.</span></>}
          desc="KilimoLens aggregates climate, satellite and agricultural data into an explainable risk and resilience layer your credit team can act on."
        />
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card"
            >
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full gradient-soft opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-primary-foreground shadow-card">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="relative mt-5 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="relative mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ HOW IT WORKS ------------------------------ */
function HowItWorks() {
  const steps = [
    { icon: Sprout, title: "Capture loan input", body: "Farmer location, crops, cooperative and livestock data enters via lender portal or API." },
    { icon: Satellite, title: "Enrich with climate & satellite", body: "We layer historical and real-time geospatial signals onto every applicant." },
    { icon: Brain, title: "Run AI risk & resilience models", body: "Ensemble models score climate, operational and financial exposure." },
    { icon: Lightbulb, title: "Generate explainable insights", body: "Each decision ships with human-readable drivers and confidence ranges." },
    { icon: Activity, title: "Decide with confidence", body: "Approve, adjust or escalate — straight from the lending dashboard." },
  ];
  return (
    <section id="how" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHead
          title={<>From raw signal to <span className="text-gradient-brand">a confident decision.</span></>}
        />
        <ol className="relative mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-brand-blue">
                  0{i + 1}
                </span>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <h3 className="mt-5 text-base font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------ USE CASES ------------------------------ */
function UseCases() {
  const cases = [
    {
      icon: Building2,
      tag: "SACCOs & MFIs",
      title: "Better loan decisions at the last mile",
      body: "Equip community-based lenders with institutional-grade risk insight on every smallholder applicant.",
      points: ["Pre-approval scoring", "Cooperative-level dashboards", "Mobile-first credit officer flow"],
    },
    {
      icon: Landmark,
      tag: "Banks",
      title: "Reduced default risk at scale",
      body: "Plug KilimoLens into existing core banking and origination systems via API.",
      points: ["Portfolio climate stress tests", "Automated underwriting", "Regulatory-ready audit trails"],
    },
    {
      icon: Umbrella,
      tag: "Insurers",
      title: "Improved risk visibility & pricing",
      body: "Underwrite parametric and indemnity products with sharper geospatial context.",
      points: ["Granular peril modelling", "Claims triage support", "Cohort resilience tracking"],
    },
  ];
  return (
    <section id="solutions" className="bg-surface py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHead
          title={<>Every actor in the <span className="text-gradient-brand">agricultural-finance stack.</span></>}
        />
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {cases.map((c) => (
            <article
              key={c.tag}
              className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-primary-foreground shadow-card">
                  <c.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
                  {c.tag}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.body}</p>
              <ul className="mt-6 space-y-2.5 border-t border-border pt-5">
                {c.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-soft" />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ VALUE PROP ------------------------------ */
function ValueProp() {
  const cols = [
    {
      tag: "For Farmers",
      icon: Sprout,
      points: ["Better access to finance", "Recognition of resilience", "Fairer, data-backed pricing"],
    },
    {
      tag: "For Lenders",
      icon: LineChart,
      points: ["Better risk visibility", "Lower defaults", "Faster credit decisions"],
    },
    {
      tag: "For Climate Finance",
      icon: Brain,
      points: ["Smarter capital allocation", "Data-driven decisions", "Measurable adaptation impact"],
    },
  ];
  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHead
          title={<>One platform. <span className="text-gradient-brand">Aligned outcomes.</span></>}
          desc="When climate, farmer and financial data converge, every stakeholder wins."
        />
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {cols.map((c) => (
            <div
              key={c.tag}
              className="rounded-2xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">{c.tag}</h3>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue-soft text-brand-blue">
                  <c.icon className="h-4 w-4" />
                </div>
              </div>
              <ul className="mt-6 space-y-3">
                {c.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-foreground/85">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-soft" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ CTA ------------------------------ */
function CTA() {
  return (
    <section id="cta" className="px-6 pb-24 sm:pb-32 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl gradient-brand p-12 sm:p-16 shadow-elevated">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-blue/40 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-primary-soft/50 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to see agricultural risk clearly?
            </h2>
            <p className="mt-4 max-w-xl text-base text-primary-foreground/80 leading-relaxed">
              Get a guided walkthrough of KilimoLens with your portfolio data. We'll show you
              risk scoring, satellite intelligence and lending decision support — live.
            </p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col gap-3 sm:flex-row lg:flex-col"
          >
            <input
              type="email"
              required
              placeholder="you@institution.com"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/55 backdrop-blur outline-none transition focus:border-white/40 focus:bg-white/15"
            />
            <button
              type="submit"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary shadow-card transition-transform hover:-translate-y-0.5"
            >
              Request Demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FOOTER ------------------------------ */
function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg gradient-brand text-primary-foreground">
                <Satellite className="h-4 w-4" />
              </span>
              <span className="text-base font-semibold tracking-tight">
                Kilimo<span className="text-gradient-brand">Lens</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
              Climate-finance intelligence for the institutions reshaping how agriculture
              gets capitalised.
            </p>
            <div className="mt-6 flex gap-3">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-brand-blue"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Platform</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#how" className="hover:text-foreground">How It Works</a></li>
              <li><a href="#solutions" className="hover:text-foreground">Solutions</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Contact</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>hello@kilimolens.ai</li>
              <li>Nairobi · Remote</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} KilimoLens. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for climate-resilient agricultural finance.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------ PAGE ------------------------------ */
function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <UseCases />
        <ValueProp />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

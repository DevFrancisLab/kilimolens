import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Satellite, ArrowRight, Loader2 } from "lucide-react";

import { useAuth } from "@/lib/auth";

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already signed in → go straight to the dashboard.
  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (ok) {
      navigate({ to: "/dashboard" });
    } else {
      setError("Invalid email or password. Try a demo account below.");
    }
  }

  function useDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden gradient-brand p-12 text-primary-foreground lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15">
            <Satellite className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">KilimoLens</span>
        </Link>
        <div className="relative">
          <h1 className="text-3xl font-semibold leading-tight">
            Making the invisible farmer visible.
          </h1>
          <p className="mt-4 max-w-md text-sm text-primary-foreground/80">
            Explainable graph-AI credit intelligence for SACCOs, MFIs and banks lending at
            Africa's last mile.
          </p>
        </div>
        <div className="relative text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} KilimoLens
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg gradient-brand text-primary-foreground">
                <Satellite className="h-4 w-4" />
              </span>
              <span className="text-base font-semibold tracking-tight">KilimoLens</span>
            </Link>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your lending workspace.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@institution.com"
                autoComplete="email"
                className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign in
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to KilimoLens?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>

          {/* Demo accounts */}
          <div className="mt-8 rounded-xl border border-border bg-surface p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Demo accounts (click to fill)
            </div>
            <div className="mt-3 space-y-2">
              {[
                { label: "Loan Officer", email: "asha@kilimolens.test", password: "password" },
                { label: "Analyst", email: "eliot@kilimolens.test", password: "password" },
                { label: "Admin", email: "admin@kilimolens.test", password: "admin" },
              ].map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => useDemo(d.email, d.password)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition hover:border-primary/40"
                >
                  <span className="font-medium text-foreground">{d.label}</span>
                  <span className="text-xs text-muted-foreground">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

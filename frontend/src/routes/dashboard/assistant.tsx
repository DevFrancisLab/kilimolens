import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Sparkles, Send, Loader2, Share2 } from "lucide-react";

import DashboardLayout from "@/components/dashboard/Layout";
import { askAssistant, type AssistantMatch } from "@/lib/api";
import { statusClasses } from "@/lib/format";

type Turn = {
  role: "user" | "assistant";
  text: string;
  matches?: AssistantMatch[];
};

const SUGGESTIONS = [
  "Which farmers have strong credit readiness and are in a cooperative?",
  "Who is most at risk of default?",
  "Show me farmers in Nakuru and their cooperatives",
  "Which approved farmers grow maize?",
];

function AssistantPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setInput("");
    setTurns((t) => [...t, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await askAssistant(q);
      setTurns((t) => [...t, { role: "assistant", text: res.answer, matches: res.matches }]);
    } catch (e: any) {
      setTurns((t) => [...t, { role: "assistant", text: e?.message || "The assistant is unavailable. Is the backend running?" }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }));
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-semibold text-foreground">Ask KilimoLens</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Ask about your farmers in plain language. Answered by Vector + Cypher retrieval over the Neo4j knowledge graph.
      </p>

      <div ref={scrollRef} className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-4">
        {turns.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-brand text-primary-foreground">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Try one of these:</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground transition hover:border-primary/40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          turns.map((t, i) => (
            <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${t.role === "user" ? "gradient-brand text-primary-foreground" : "border border-border bg-background"}`}>
                <div className="whitespace-pre-wrap">{t.text}</div>
                {t.matches && t.matches.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-border/60 pt-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Retrieved farmers
                    </div>
                    {t.matches.slice(0, 5).map((m) => (
                      <Link
                        key={m.farmerId + m.score}
                        to="/dashboard/farmer-profiles"
                        search={{ id: m.farmerId } as any}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs transition hover:bg-muted/50"
                      >
                        <span className="font-medium text-foreground">{m.farmer || "Unknown"}</span>
                        <span className="text-muted-foreground">
                          {m.county || "—"}{m.cooperative ? ` · ${m.cooperative}` : ""} · readiness {m.readiness}
                        </span>
                        <span className={`rounded-full px-1.5 py-0.5 ${statusClasses(m.status)}`}>{m.status}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching the graph…
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about farmers, cooperatives, risk, readiness…"
          className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl gradient-brand px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> Ask
        </button>
      </form>
      <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
        <Share2 className="h-3 w-3" /> GraphRAG · semantic vector search + graph traversal on Neo4j
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/assistant")({
  component: () => (
    <DashboardLayout>
      <AssistantPage />
    </DashboardLayout>
  ),
});

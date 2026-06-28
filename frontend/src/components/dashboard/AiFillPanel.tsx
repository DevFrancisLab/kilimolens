"use client";

import React, { useRef, useState } from "react";
import { Sparkles, Paperclip, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractForm } from "@/lib/api";

type Section = "personal" | "farm" | "finance" | "community" | "climate";

type Props = {
  section: Section;
  /** Shared source text across steps so the officer can paste once. */
  text: string;
  onTextChange: (t: string) => void;
  /** Called with the extracted (non-empty) fields to merge into the form. */
  onFilled: (fields: Record<string, string>) => void;
};

const TITLES: Record<Section, string> = {
  personal: "AI assistant — fill Personal Information",
  farm: "AI assistant — fill Farm Information",
  finance: "AI assistant — fill Financial Behaviour",
  community: "AI assistant — fill Community & Verification",
  climate: "AI assistant — fill Climate & Farming Practices",
};

const BUTTON_LABELS: Record<Section, string> = {
  personal: "Extract & fill personal info",
  farm: "Extract & fill farm info",
  finance: "Extract & fill financial info",
  community: "Extract & fill community info",
  climate: "Extract & fill climate info",
};

export default function AiFillPanel({ section, text, onTextChange, onFilled }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filled, setFilled] = useState<string[] | null>(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const fileObj = useRef<File | undefined>(undefined);

  async function run() {
    setError("");
    setFilled(null);
    if (!text.trim() && !fileObj.current) {
      setError("Paste the farmer's details or attach a file first.");
      return;
    }
    setBusy(true);
    try {
      const res = await extractForm(section, { text, file: fileObj.current });
      if (res.filledCount === 0) {
        setError("No matching details found for this section. Try adding more detail.");
      } else {
        onFilled(res.fields);
        setFilled(Object.keys(res.fields));
      }
    } catch (e: any) {
      setError(e?.message || "Extraction failed. Is the backend running?");
    } finally {
      setBusy(false);
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    fileObj.current = f;
    setFileName(f?.name || "");
  }

  return (
    <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{TITLES[section]}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Paste the farmer's details (free text, JSON, or spreadsheet rows) or attach a file
        (PDF, image, Excel, CSV). The assistant fills the fields below — review and confirm with
        <strong> Next</strong>.
      </p>

      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="e.g. Jane Wanjiku, ID 29384756, 0712345678, 41yo, Embu… farm 2.5ha maize & beans…"
        rows={3}
        className="mt-3 w-full rounded-lg border border-border bg-card p-2.5 text-sm outline-none focus:border-primary"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={run} disabled={busy} size="sm">
          {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
          {BUTTON_LABELS[section]}
        </Button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition hover:border-primary/40"
        >
          <Paperclip className="h-4 w-4" /> {fileName || "Attach file"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.json,.txt,application/pdf,image/*"
          onChange={onPickFile}
          className="hidden"
        />
        {fileName && (
          <button type="button" onClick={() => { fileObj.current = undefined; setFileName(""); if (fileRef.current) fileRef.current.value = ""; }} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
      {filled && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Filled {filled.length} field{filled.length === 1 ? "" : "s"}: {filled.join(", ")}. Review below, then click Next to confirm.</span>
        </div>
      )}
    </div>
  );
}

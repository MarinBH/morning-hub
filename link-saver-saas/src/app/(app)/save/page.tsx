"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link as LinkIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type ProcessingStep = {
  label: string;
  status: "pending" | "active" | "done" | "error";
};

export default function SavePage() {
  const [url, setUrl] = useState("");
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ id: string; type: string; section: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || processing) return;

    setError("");
    setResult(null);
    setProcessing(true);

    setSteps([
      { label: "Detecting link type", status: "active" },
      { label: "Extracting content", status: "pending" },
      { label: "Generating AI summary", status: "pending" },
      { label: "Saving to your library", status: "pending" },
    ]);

    try {
      const res = await fetch("/api/links/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save link");
      }

      setSteps([
        { label: `Detected: ${data.type}`, status: "done" },
        { label: "Extracting content", status: "done" },
        { label: "Generating AI summary", status: "active" },
        { label: "Saving to your library", status: "pending" },
      ]);

      const linkId = data.id;
      let attempts = 0;
      const maxAttempts = 30;

      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await fetch(`/api/links/${linkId}`);
          const statusData = await statusRes.json();

          if (statusData.status === "complete") {
            clearInterval(pollInterval);
            setSteps([
              { label: `Detected: ${data.type}`, status: "done" },
              { label: "Content extracted", status: "done" },
              { label: "AI summary generated", status: "done" },
              { label: "Saved to your library", status: "done" },
            ]);
            setResult({ id: linkId, type: data.type, section: data.section });
            setProcessing(false);
          } else if (statusData.status === "error") {
            clearInterval(pollInterval);
            throw new Error(statusData.error_message || "Processing failed");
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setSteps(prev => prev.map(s =>
              s.status === "active" ? { ...s, status: "done" } : s
            ));
            setResult({ id: linkId, type: data.type, section: data.section });
            setProcessing(false);
          }
        } catch {
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setProcessing(false);
          }
        }
      }, 2000);
    } catch (err) {
      setError((err as Error).message);
      setSteps(prev =>
        prev.map(s =>
          s.status === "active" ? { ...s, status: "error" } : s
        )
      );
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-heading text-xl font-bold tracking-tight mb-1">Save a Link</h1>
      <p className="text-muted text-sm mb-6">Paste any URL to get an AI-powered summary</p>

      <form onSubmit={handleSave}>
        <div className="relative mb-3">
          <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input pl-10 !border-dashed focus:!border-solid"
            placeholder="https://youtube.com/watch?v=..."
            disabled={processing}
            required
          />
        </div>
        <button
          type="submit"
          disabled={processing || !url.trim()}
          className="btn btn-primary btn-md w-full disabled:opacity-50"
        >
          {processing ? "Processing..." : "Save & Analyze"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 rounded-[--radius-md] bg-error-subtle text-error text-sm flex items-center gap-2">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {steps.length > 0 && (
        <div className="mt-6 space-y-2.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.status === "done"
                  ? "bg-success-subtle text-success"
                  : step.status === "active"
                  ? "bg-accent-subtle text-accent"
                  : step.status === "error"
                  ? "bg-error-subtle text-error"
                  : "bg-surface text-muted"
              }`}>
                {step.status === "done" ? (
                  <CheckCircle2 size={13} />
                ) : step.status === "active" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : step.status === "error" ? (
                  <AlertCircle size={13} />
                ) : (
                  <span className="text-[10px] font-mono">{i + 1}</span>
                )}
              </div>
              <span className={`text-sm ${
                step.status === "active" ? "text-text-primary font-medium" :
                step.status === "done" ? "text-text-secondary" :
                "text-muted"
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 rounded-[--radius-lg] bg-success-subtle border border-success/15">
          <p className="text-success font-medium text-sm mb-2 font-heading">Link saved successfully!</p>
          <button
            onClick={() => router.push(`/link/${result.id}`)}
            className="text-sm text-accent hover:text-accent-hover font-medium"
          >
            View summary &rarr;
          </button>
        </div>
      )}
    </div>
  );
}

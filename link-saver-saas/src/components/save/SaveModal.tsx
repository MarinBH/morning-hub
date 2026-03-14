"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Link as LinkIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type ProcessingStep = {
  label: string;
  status: "pending" | "active" | "done" | "error";
};

export function SaveModal() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ id: string; type: string; section: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  // Listen for open events from any page
  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }
    window.addEventListener("open-save-modal", handleOpen);
    return () => window.removeEventListener("open-save-modal", handleOpen);
  }, []);

  const resetState = useCallback(() => {
    setUrl("");
    setSteps([]);
    setError("");
    setResult(null);
    setProcessing(false);
  }, []);

  function handleClose() {
    if (processing) return; // Don't close while processing
    setOpen(false);
    // Reset state after animation
    setTimeout(resetState, 300);
  }

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

  function handleViewResult() {
    if (!result) return;
    setOpen(false);
    setTimeout(() => {
      resetState();
      router.push(`/link/${result.id}`);
    }, 200);
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-enter"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md sheet-enter">
        <div className="bg-bg rounded-t-2xl md:rounded-2xl border border-border shadow-2xl shadow-black/40 overflow-hidden">
          {/* Handle bar (mobile) */}
          <div className="flex justify-center pt-2 pb-1 md:hidden">
            <div className="w-8 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2 md:pt-5">
            <h2 className="font-heading text-lg font-bold tracking-tight">Save a Link</h2>
            <button
              onClick={handleClose}
              disabled={processing}
              className="btn btn-ghost p-1.5 text-muted hover:text-text-primary disabled:opacity-30"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 pb-6 md:pb-5">
            <p className="text-muted text-sm mb-4">Paste any URL to get an AI-powered summary</p>

            <form onSubmit={handleSave}>
              <div className="relative mb-3">
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="input pl-10 !border-dashed focus:!border-solid"
                  placeholder="https://..."
                  disabled={processing}
                  required
                  autoFocus
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
              <div className="mt-3 p-3 rounded-[--radius-md] bg-error-subtle text-error text-sm flex items-center gap-2">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            {steps.length > 0 && (
              <div className="mt-4 space-y-2">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.status === "done"
                        ? "bg-success-subtle text-success"
                        : step.status === "active"
                        ? "bg-accent-subtle text-accent"
                        : step.status === "error"
                        ? "bg-error-subtle text-error"
                        : "bg-surface text-muted"
                    }`}>
                      {step.status === "done" ? (
                        <CheckCircle2 size={11} />
                      ) : step.status === "active" ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : step.status === "error" ? (
                        <AlertCircle size={11} />
                      ) : (
                        <span className="text-[9px] font-mono">{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-[13px] ${
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
              <div className="mt-4 p-3 rounded-[--radius-md] bg-success-subtle border border-success/15">
                <p className="text-success font-medium text-sm mb-1.5 font-heading">Saved!</p>
                <button
                  onClick={handleViewResult}
                  className="text-sm text-accent hover:text-accent-hover font-medium"
                >
                  View summary &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

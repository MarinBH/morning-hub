"use client";

import { useState, useRef } from "react";
import { STEPS, extractDomain } from "./constants";

export default function URLInput({ onProcessed, onError }) {
  const [url, setUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [steps, setSteps] = useState({});
  const [duplicate, setDuplicate] = useState(null);
  const [processError, setProcessError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const processUrl = async () => {
    if (!url.trim() || processing) return;
    setProcessing(true);
    setSteps({});
    setDuplicate(null);
    setProcessError(null);
    setLastSaved(null);

    try {
      const res = await fetch("/api/links/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = null;
        for (const line of lines) {
          if (line.startsWith("event: ")) currentEvent = line.slice(7);
          else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === "step") setSteps(prev => ({ ...prev, [data.step]: { status: data.status, result: data.result, error: data.error } }));
              else if (currentEvent === "duplicate") setDuplicate(data);
              else if (currentEvent === "done") { setLastSaved(data.item); setUrl(""); onProcessed?.(); }
              else if (currentEvent === "error") setProcessError(data.message);
            } catch { /* ignore parse error */ }
            currentEvent = null;
          }
        }
      }
    } catch (err) {
      setProcessError(err.message || "Connection failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleDragEnter = (e) => { e.preventDefault(); dragCounterRef.current++; setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); dragCounterRef.current--; if (dragCounterRef.current === 0) setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const text = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("text/uri-list");
    if (text) setUrl(text.trim());
  };
  const handlePasteFromClipboard = async () => {
    try { const text = await navigator.clipboard.readText(); if (text) setUrl(text.trim()); } catch { /* clipboard access denied */ }
  };

  const completedSteps = STEPS.filter(s => steps[s.key]?.status === "complete").length;
  const completedPercent = (completedSteps / STEPS.length) * 100;
  const detectedTitle = steps.extracting?.status === "complete" && steps.extracting?.result?.title;

  return (
    <>
      {/* Drop Zone */}
      <div
        className="mb-8"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div
          className={`rounded-2xl border-2 transition-all duration-300 ${
            isDragging ? "border-accent/50 bg-accent/5 scale-[1.01]"
            : url.trim() ? "border-border-focus/50 bg-bg-card"
            : "border-dashed border-border bg-bg-drop"
          } ${processing ? "opacity-60 pointer-events-none" : ""}`}
          style={isDragging ? { animation: "glowPulse 2s ease infinite" } : {}}
        >
          <div className="px-5 py-5 sm:py-6">
            {!url.trim() && !processing && (
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border flex items-center justify-center text-text-dim">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </div>
              </div>
            )}

            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), processUrl())}
                  placeholder="Paste a URL to save..."
                  disabled={processing}
                  aria-label="URL to save"
                  className="w-full bg-bg-input border border-border rounded-xl pl-10 pr-4 py-3 sm:py-3.5 text-sm text-text placeholder:text-text-dim focus:border-border-focus focus:outline-none transition-all duration-300 disabled:opacity-40"
                />
              </div>
              <button
                onClick={handlePasteFromClipboard}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-dim hover:text-text-muted hover:border-border-focus transition-all duration-250 active:scale-[0.95] flex-shrink-0"
                title="Paste from clipboard"
                aria-label="Paste from clipboard"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
              <button
                onClick={processUrl}
                disabled={processing || !url.trim()}
                className="bg-accent hover:bg-accent-hover disabled:opacity-30 disabled:hover:bg-accent text-bg font-medium rounded-xl px-5 sm:px-6 py-3 sm:py-3.5 text-sm transition-all duration-250 whitespace-nowrap active:scale-[0.96] flex-shrink-0"
                style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3.5 h-3.5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                    <span className="hidden sm:inline">Saving</span>
                  </span>
                ) : "Save"}
              </button>
            </div>

            {url.trim() && extractDomain(url.trim()) && !processing && (
              <div className="mt-3 flex items-center gap-2 text-xs text-text-muted" style={{ animation: "fadeUp 0.25s ease" }}>
                <img
                  src={`https://www.google.com/s2/favicons?domain=${extractDomain(url.trim())}&sz=16`}
                  alt=""
                  className="w-4 h-4 rounded-sm"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <span className="font-mono text-[11px] truncate">{extractDomain(url.trim())}</span>
              </div>
            )}

            {!url.trim() && !processing && (
              <p className="text-center text-[11px] text-text-dim mt-2 hidden sm:block">
                Paste a link, drag a URL, or use the clipboard button
              </p>
            )}
          </div>
        </div>

        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <span className="text-accent font-medium text-sm bg-bg/90 px-4 py-2 rounded-xl border border-accent/20" style={{ animation: "fadeIn 0.2s ease" }}>
              Drop to save
            </span>
          </div>
        )}

        {duplicate && (
          <div className="mt-3 bg-warning/8 border border-warning/15 rounded-xl px-4 py-2.5 text-sm text-warning/90 flex items-center gap-2" style={{ animation: "fadeUp 0.3s ease" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Already saved — re-processing
          </div>
        )}

        {processError && (
          <div className="mt-3 bg-error/8 border border-error/15 rounded-xl px-4 py-2.5 text-sm text-error/90 flex items-center gap-2" style={{ animation: "fadeUp 0.3s ease" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {processError}
          </div>
        )}
      </div>

      {/* Processing Stepper */}
      {processing && (
        <div className="mb-8 bg-bg-elevated border border-border rounded-2xl p-5 sm:p-6" style={{ animation: "fadeUp 0.4s ease" }}>
          <div className="relative pl-10">
            <div className="absolute left-[15px] top-0 bottom-0 w-[2px] rounded-full bg-border overflow-hidden">
              <div className="w-full bg-accent rounded-full transition-all duration-500 ease-out" style={{ height: `${completedPercent}%` }} />
            </div>

            {STEPS.map((step, idx) => {
              const state = steps[step.key];
              const isActive = state?.status === "in_progress";
              const isComplete = state?.status === "complete";
              const isFailed = state?.status === "failed";
              const isLast = idx === STEPS.length - 1;

              return (
                <div key={step.key} className={`relative flex gap-4 ${isLast ? "" : "pb-6"}`}>
                  <div
                    className={`absolute -left-10 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 z-10 ${
                      isComplete ? "bg-success/15 text-success border border-success/20" :
                      isFailed ? "bg-error/15 text-error border border-error/20" :
                      isActive ? "bg-accent/15 text-accent border border-accent/25" :
                      "bg-bg-card text-text-dim border border-border"
                    }`}
                    style={isActive ? { animation: "glowPulse 2s ease infinite" } : isComplete ? { animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" } : {}}
                  >
                    {isComplete ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : isFailed ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    ) : isActive ? (
                      <span className="inline-block w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-text-dim/40" />
                    )}
                  </div>

                  <div className="flex-1 pt-1">
                    <span className={`text-sm font-medium transition-colors duration-300 ${
                      isActive ? "text-text" : isComplete ? "text-text-muted" : isFailed ? "text-error" : "text-text-dim"
                    }`}>
                      {step.label}
                    </span>
                    {isActive && (
                      <div className="text-xs text-text-dim mt-0.5" style={{ animation: "fadeIn 0.3s ease" }}>{step.detail}</div>
                    )}
                    {state?.result?.type && (
                      <span className="ml-2 text-[11px] bg-bg-card px-2 py-0.5 rounded-md text-text-muted font-medium">{state.result.type}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {steps.extracting?.status === "complete" && !lastSaved && (
            <div className="mt-5 pt-5 border-t border-border">
              <div className="bg-bg-card rounded-xl p-4" style={{ animation: "fadeUp 0.3s ease" }}>
                {detectedTitle ? (
                  <div className="text-sm font-medium text-text truncate">{detectedTitle}</div>
                ) : (
                  <div className="skeleton h-4 w-3/4" />
                )}
                <div className="skeleton h-3 w-1/3 mt-2" />
                <div className="skeleton h-3 w-full mt-3" />
                <div className="skeleton h-3 w-5/6 mt-1.5" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Last Saved (success card) */}
      {lastSaved && !processing && (
        <div
          className="mb-8 bg-success/5 border border-success/15 rounded-2xl p-4"
          style={{ animation: "successPulse 0.6s ease-out, fadeUp 0.4s ease" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center" style={{ animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6CFFB8" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span className="text-sm text-success font-medium">Saved</span>
              </div>
              <div className="text-text text-sm font-medium truncate">{lastSaved.title}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => onProcessed?.(lastSaved)} className="text-accent text-sm font-medium hover:text-accent-hover transition-colors">View</button>
              <button onClick={() => setLastSaved(null)} className="text-text-dim hover:text-text-muted transition-colors p-1" aria-label="Dismiss">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

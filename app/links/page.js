"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STEPS = [
  { key: "detecting", label: "Detecting content type", detail: "Identifying URL type..." },
  { key: "extracting", label: "Extracting content", detail: "Pulling content from source..." },
  { key: "summarizing", label: "AI analysis", detail: "Analyzing with Claude..." },
  { key: "saving", label: "Saving & organizing", detail: "Filing into your knowledge base..." },
];

const CONTENT_FORMAT_LABELS = {
  tutorial: "Tutorial", opinion: "Opinion", research: "Research",
  interview: "Interview", review: "Review", explainer: "Explainer",
  motivational: "Motivational", news: "News", "case-study": "Case Study", other: "Other",
};

const DIFFICULTY_STYLES = {
  beginner: { bg: "rgba(108, 255, 184, 0.1)", text: "#6CFFB8", border: "rgba(108, 255, 184, 0.2)" },
  intermediate: { bg: "rgba(108, 155, 255, 0.1)", text: "#6C9BFF", border: "rgba(108, 155, 255, 0.2)" },
  advanced: { bg: "rgba(255, 214, 102, 0.1)", text: "#FFD666", border: "rgba(255, 214, 102, 0.2)" },
};

const SOURCE_TYPE_STYLES = {
  quote: { bg: "rgba(108, 155, 255, 0.1)", text: "#6C9BFF" },
  anecdote: { bg: "rgba(108, 255, 184, 0.1)", text: "#6CFFB8" },
  analogy: { bg: "rgba(255, 214, 102, 0.1)", text: "#FFD666" },
  "data-point": { bg: "rgba(255, 107, 107, 0.1)", text: "#FF6B6B" },
  example: { bg: "rgba(180, 160, 255, 0.1)", text: "#B4A0FF" },
};

function extractDomain(urlStr) {
  try { return new URL(urlStr).hostname.replace("www.", ""); } catch { return null; }
}

export default function LinksPage() {
  const [url, setUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [steps, setSteps] = useState({});
  const [duplicate, setDuplicate] = useState(null);
  const [processError, setProcessError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const [items, setItems] = useState([]);
  const [domains, setDomains] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [allGoals, setAllGoals] = useState([]);
  const [activeDomain, setActiveDomain] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeGoal, setActiveGoal] = useState(null);
  const [filterMode, setFilterMode] = useState("domains");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalItems, setTotalItems] = useState(0);

  const [selectedItem, setSelectedItem] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [notes, setNotes] = useState("");
  const notesTimeout = useRef(null);

  useEffect(() => {
    fetchItems();
    fetchTags();
  }, [activeDomain, activeCategory, activeType, activeTopic, activeGoal]);

  const fetchItems = useCallback(async () => {
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (activeDomain && !activeCategory) params.set("domain", activeDomain);
    if (activeType) params.set("type", activeType);
    if (activeTopic && filterMode === "topics") params.set("topic", activeTopic);
    if (activeTopic && filterMode === "concepts") params.set("concept", activeTopic);
    if (activeGoal) params.set("goal", activeGoal);
    if (searchQuery) params.set("search", searchQuery);

    try {
      const res = await fetch(`/api/links?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotalItems(data.total || 0);
    } catch { /* silent */ }
  }, [activeDomain, activeCategory, activeType, activeTopic, activeGoal, searchQuery]);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/links/tags");
      const data = await res.json();
      setDomains(data.domains || []);
      setAllTopics(data.topics || []);
      setAllGoals(data.goals || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchItems(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchItems]);

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
              else if (currentEvent === "done") { setLastSaved(data.item); setUrl(""); fetchItems(); fetchTags(); }
              else if (currentEvent === "error") setProcessError(data.message);
            } catch { /* ignore */ }
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

  // ─── Drag and Drop ──────────────────────────────────────────
  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounterRef.current++;
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const text = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("text/uri-list");
    if (text) setUrl(text.trim());
  };
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch { /* clipboard access denied */ }
  };

  const openDetail = async (item) => {
    setSelectedItem(item);
    setDetailData(null);
    setNotes(item.personal_notes || "");
    try {
      const res = await fetch(`/api/links/${item.id}`);
      const data = await res.json();
      setDetailData(data);
      setNotes(data.personal_notes || "");
    } catch { /* silent */ }
  };

  const saveNotes = (value) => {
    setNotes(value);
    if (notesTimeout.current) clearTimeout(notesTimeout.current);
    notesTimeout.current = setTimeout(async () => {
      if (!selectedItem) return;
      try {
        await fetch(`/api/links/${selectedItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personal_notes: value }),
        });
      } catch { /* silent */ }
    }, 1000);
  };

  if (selectedItem) {
    return (
      <div className="min-h-screen bg-bg text-text font-sans">
        <DetailView
          item={selectedItem}
          detail={detailData}
          notes={notes}
          onNotesChange={saveNotes}
          onBack={() => { setSelectedItem(null); setDetailData(null); }}
        />
      </div>
    );
  }

  const domainsWithItems = domains.filter(d => d.categories?.some(c => c.item_count > 0));
  const topicsWithItems = allTopics.filter(t => t.item_count > 0 && t.topic_type === "topic");
  const conceptsWithItems = allTopics.filter(t => t.item_count > 0 && t.topic_type === "concept");
  const goalsWithItems = allGoals.filter(g => g.item_count > 0);

  const clearFilters = () => {
    setActiveDomain(null);
    setActiveCategory(null);
    setActiveTopic(null);
    setActiveGoal(null);
  };

  const hasActiveFilter = activeDomain || activeCategory || activeTopic || activeGoal;
  const activeFilterLabel = activeCategory
    ? domains.flatMap(d => d.categories || []).find(c => c.slug === activeCategory)?.name
    : activeDomain ? domains.find(d => d.slug === activeDomain)?.name
    : activeTopic || activeGoal || null;

  // Compute processing progress
  const completedSteps = STEPS.filter(s => steps[s.key]?.status === "complete").length;
  const completedPercent = (completedSteps / STEPS.length) * 100;
  const detectedTitle = steps.extracting?.status === "complete" && steps.extracting?.result?.title;

  // Filter mode tabs
  const filterTabs = [
    { key: "domains", label: "Domains" },
    ...(topicsWithItems.length > 0 ? [{ key: "topics", label: "Topics" }] : []),
    ...(conceptsWithItems.length > 0 ? [{ key: "concepts", label: "Concepts" }] : []),
    ...(goalsWithItems.length > 0 ? [{ key: "goals", label: "Goals" }] : []),
  ];
  const activeTabIndex = filterTabs.findIndex(t => t.key === filterMode);

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border-subtle" style={{ background: "rgba(12, 11, 10, 0.85)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-text-dim hover:text-text-muted transition-colors duration-300">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </a>
            <h1 className="text-base font-semibold tracking-tight">Knowledge Base</h1>
          </div>
          <span className="text-text-dim text-xs font-mono tabular-nums">{totalItems}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Drop Zone ── */}
        <div
          className="mb-8"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div
            className={`rounded-2xl border-2 transition-all duration-300 ${
              isDragging
                ? "border-accent/50 bg-accent/5 scale-[1.01]"
                : url.trim()
                ? "border-border-focus/50 bg-bg-card"
                : "border-dashed border-border bg-bg-drop"
            } ${processing ? "opacity-60 pointer-events-none" : ""}`}
            style={isDragging ? { animation: "glowPulse 2s ease infinite" } : {}}
          >
            <div className="px-5 py-5 sm:py-6">
              {/* Link icon when empty */}
              {!url.trim() && !processing && (
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border flex items-center justify-center text-text-dim">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  </div>
                </div>
              )}

              {/* Input row */}
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
                    className="w-full bg-bg-input border border-border rounded-xl pl-10 pr-4 py-3 sm:py-3.5 text-sm text-text placeholder:text-text-dim focus:border-border-focus focus:outline-none transition-all duration-300 disabled:opacity-40"
                  />
                </div>
                {/* Paste button */}
                <button
                  onClick={handlePasteFromClipboard}
                  className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-dim hover:text-text-muted hover:border-border-focus transition-all duration-250 active:scale-[0.95] flex-shrink-0"
                  title="Paste from clipboard"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
                {/* Save button */}
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

              {/* URL preview when URL entered */}
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

              {/* Hint text when empty */}
              {!url.trim() && !processing && (
                <p className="text-center text-[11px] text-text-dim mt-2 hidden sm:block">
                  Paste a link, drag a URL, or use the clipboard button
                </p>
              )}
            </div>
          </div>

          {/* Drag overlay text */}
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

        {/* ── Processing Stepper ── */}
        {processing && (
          <div className="mb-8 bg-bg-elevated border border-border rounded-2xl p-5 sm:p-6" style={{ animation: "fadeUp 0.4s ease" }}>
            <div className="relative pl-10">
              {/* Vertical connector line */}
              <div className="absolute left-[15px] top-0 bottom-0 w-[2px] rounded-full bg-border overflow-hidden">
                <div
                  className="w-full bg-accent rounded-full transition-all duration-500 ease-out"
                  style={{ height: `${completedPercent}%` }}
                />
              </div>

              {STEPS.map((step, idx) => {
                const state = steps[step.key];
                const isActive = state?.status === "in_progress";
                const isComplete = state?.status === "complete";
                const isFailed = state?.status === "failed";
                const isLast = idx === STEPS.length - 1;

                return (
                  <div key={step.key} className={`relative flex gap-4 ${isLast ? "" : "pb-6"}`}>
                    {/* Step circle */}
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

                    {/* Step content */}
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

            {/* Skeleton preview during processing */}
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

        {/* ── Last Saved (success card) ── */}
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
                <button onClick={() => openDetail(lastSaved)} className="text-accent text-sm font-medium hover:text-accent-hover transition-colors">View</button>
                <button onClick={() => setLastSaved(null)} className="text-text-dim hover:text-text-muted transition-colors p-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="mb-6 space-y-3">
          {/* Search with type toggles */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-bg-input border border-border rounded-xl pl-9 pr-9 py-2.5 sm:py-3 text-sm text-text placeholder:text-text-dim focus:border-border-focus focus:outline-none transition-all duration-300"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
            {/* Type toggles inline */}
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => setActiveType(activeType === "youtube" ? null : "youtube")}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-250 border ${
                  activeType === "youtube" ? "bg-youtube/10 border-youtube/25 text-youtube" : "bg-bg-elevated border-border text-text-dim hover:text-text-muted hover:border-border-focus"
                }`}
                title="YouTube"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </button>
              <button
                onClick={() => setActiveType(activeType === "article" ? null : "article")}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-250 border ${
                  activeType === "article" ? "bg-accent/10 border-accent/25 text-accent" : "bg-bg-elevated border-border text-text-dim hover:text-text-muted hover:border-border-focus"
                }`}
                title="Articles"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </button>
            </div>
          </div>

          {/* Filter mode tabs — segmented control */}
          <div className="relative flex bg-bg-elevated rounded-xl p-1 border border-border">
            {/* Sliding indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-bg-card transition-all duration-300 ease-out"
              style={{
                left: `calc(${(activeTabIndex / filterTabs.length) * 100}% + 4px)`,
                width: `calc(${100 / filterTabs.length}% - 8px)`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            />
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setFilterMode(tab.key); clearFilters(); }}
                className={`relative z-10 flex-1 text-[11px] font-medium py-2 px-3 rounded-lg transition-colors duration-250 ${
                  filterMode === tab.key ? "text-text" : "text-text-dim hover:text-text-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Domain filter chips */}
          {filterMode === "domains" && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none chip-scroll -mx-1 px-1">
              <Chip label="All" active={!activeDomain} onClick={() => { setActiveDomain(null); setActiveCategory(null); }} />
              {domainsWithItems.map((d) => (
                <Chip
                  key={d.slug}
                  label={d.name}
                  count={d.categories?.reduce((s, c) => s + c.item_count, 0)}
                  active={activeDomain === d.slug}
                  onClick={() => { setActiveDomain(activeDomain === d.slug ? null : d.slug); setActiveCategory(null); }}
                />
              ))}
            </div>
          )}

          {/* Sub-category chips */}
          {filterMode === "domains" && activeDomain && (() => {
            const domain = domains.find(d => d.slug === activeDomain);
            const cats = domain?.categories?.filter(c => c.item_count > 0) || [];
            if (!cats.length) return null;
            return (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none chip-scroll -mx-1 px-1 pl-3" style={{ animation: "fadeUp 0.2s ease" }}>
                <Chip label="All" active={!activeCategory} onClick={() => setActiveCategory(null)} small />
                {cats.map((c) => (
                  <Chip key={c.slug} label={c.name} count={c.item_count} active={activeCategory === c.slug} onClick={() => setActiveCategory(activeCategory === c.slug ? null : c.slug)} small />
                ))}
              </div>
            );
          })()}

          {/* Topic chips */}
          {filterMode === "topics" && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none chip-scroll -mx-1 px-1">
              <Chip label="All" active={!activeTopic} onClick={() => setActiveTopic(null)} />
              {topicsWithItems.slice(0, 20).map((t) => (
                <Chip key={t.topic} label={t.topic} count={t.item_count} active={activeTopic === t.topic} onClick={() => setActiveTopic(activeTopic === t.topic ? null : t.topic)} mono />
              ))}
            </div>
          )}

          {/* Concept chips */}
          {filterMode === "concepts" && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none chip-scroll -mx-1 px-1">
              <Chip label="All" active={!activeTopic} onClick={() => setActiveTopic(null)} />
              {conceptsWithItems.slice(0, 20).map((t) => (
                <Chip key={t.topic} label={t.topic} count={t.item_count} active={activeTopic === t.topic} onClick={() => setActiveTopic(activeTopic === t.topic ? null : t.topic)} mono concept />
              ))}
            </div>
          )}

          {/* Goal chips */}
          {filterMode === "goals" && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none chip-scroll -mx-1 px-1">
              <Chip label="All" active={!activeGoal} onClick={() => setActiveGoal(null)} />
              {goalsWithItems.slice(0, 15).map((g) => (
                <Chip key={g.goal} label={g.goal} count={g.item_count} active={activeGoal === g.goal} onClick={() => setActiveGoal(activeGoal === g.goal ? null : g.goal)} />
              ))}
            </div>
          )}

          {/* Active filter summary bar */}
          {hasActiveFilter && (
            <div className="flex items-center justify-between bg-bg-elevated rounded-lg px-3 py-2 border border-border" style={{ animation: "fadeUp 0.2s ease" }}>
              <span className="text-xs text-text-muted">
                Filtering: <span className="text-text-secondary font-medium">{activeFilterLabel}</span>
              </span>
              <button onClick={clearFilters} className="text-xs text-text-dim hover:text-text-muted transition-colors flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Clear
              </button>
            </div>
          )}
        </div>

        {/* ── Items List ── */}
        <div className="space-y-3">
          {items.length === 0 && !processing && (
            <div className="text-center py-20 text-text-dim" style={{ animation: "fadeIn 0.5s ease" }}>
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center" style={{ animation: "breathe 3s ease infinite" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              {hasActiveFilter ? (
                <>
                  <div className="text-sm font-medium text-text-muted mb-1">No links match this filter</div>
                  <button onClick={clearFilters} className="text-xs text-accent hover:text-accent-hover transition-colors mt-2">Clear filters</button>
                </>
              ) : (
                <>
                  <div className="text-base font-display font-semibold text-text-muted mb-1">Your knowledge base starts here</div>
                  <div className="text-xs">Save your first link above and let AI organize it</div>
                </>
              )}
            </div>
          )}

          {items.map((item, idx) => (
            <ItemCard key={item.id} item={item} onClick={() => openDetail(item)} index={idx} isHero={idx === 0 && !hasActiveFilter && items.length > 1} />
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────

function Chip({ label, count, active, onClick, small, mono, concept }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg transition-all duration-250 flex items-center gap-1.5 active:scale-[0.96] ${
        small ? "text-[11px] px-2.5 py-1.5" : "text-xs px-3.5 py-2"
      } ${mono ? "font-mono" : ""} ${
        active
          ? concept ? "bg-warning/15 text-warning font-medium border border-warning/20" : "bg-accent text-bg font-medium shadow-sm"
          : "bg-bg-elevated border border-border text-text-muted hover:text-text-secondary hover:border-border-focus"
      }`}
    >
      <span>{label}</span>
      {count !== undefined && <span className={`${active ? (concept ? "text-warning/60" : "text-bg/60") : "text-text-dim"} font-mono text-[10px]`}>{count}</span>}
    </button>
  );
}

function ItemCard({ item, onClick, index, isHero }) {
  const isYoutube = item.type === "youtube";
  const categories = item.categories || [];
  const topics = (item.topics_list || []).filter(t => t.topic_type === "topic").slice(0, 3);
  const goals = (item.goals_list || []).slice(0, 2);
  const allTags = [...categories.slice(0, 2), ...topics, ...goals];
  const visibleTags = allTags.slice(0, 3);
  const overflowCount = allTags.length - visibleTags.length;

  return (
    <button
      onClick={onClick}
      className="w-full text-left group"
      style={{ animation: `scaleIn 0.35s ease ${index * 0.06}s both` }}
    >
      <div className={`bg-bg-card hover:bg-bg-card-hover rounded-2xl overflow-hidden border border-border hover:border-border-focus transition-all duration-300 hover:translate-y-[-1px] ${
        isHero ? "ring-1 ring-accent/8" : ""
      }`}
      style={{ transitionProperty: "background-color, border-color, transform, box-shadow" }}
      >
        {/* YouTube: full-width thumbnail */}
        {isYoutube && item.thumbnail && (
          <div className="relative aspect-video overflow-hidden">
            <img src={item.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            {/* Gradient overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute bottom-2 left-3 text-[10px] bg-youtube/90 text-white px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wide">YT</span>
          </div>
        )}

        <div className={`p-4 ${isHero ? "sm:p-5" : ""}`}>
          {/* Article: accent left border */}
          {!isYoutube ? (
            <div className="border-l-2 border-accent/25 pl-3">
              <h3 className={`font-semibold text-text leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-300 ${isHero ? "text-base" : "text-sm"}`}>
                {item.title || "Untitled"}
              </h3>
            </div>
          ) : (
            <h3 className={`font-semibold text-text leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-300 ${isHero ? "text-base" : "text-sm"}`}>
              {item.title || "Untitled"}
            </h3>
          )}

          <div className="text-xs text-text-muted mt-1.5 flex items-center gap-1.5">
            {!isYoutube && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent/40 flex-shrink-0" />
            )}
            {item.author && <span className="truncate max-w-[160px]">{item.author}</span>}
            {item.author && item.created_at && <span className="text-text-dim">·</span>}
            {item.created_at && <span className="text-text-dim font-mono text-[11px]">{formatDate(item.created_at)}</span>}
          </div>

          {item.summary_preview && (
            <p className="text-xs text-text-secondary mt-2 line-clamp-2 leading-relaxed">{item.summary_preview}</p>
          )}

          {visibleTags.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {categories.slice(0, 2).map((cat, i) => (
                <span key={`c${i}`} className="text-[10px] bg-bg-elevated px-2 py-0.5 rounded-md text-text-dim border border-border-subtle">
                  {cat.name || cat.category}
                </span>
              ))}
              {topics.slice(0, visibleTags.length - categories.slice(0, 2).length).map((t, i) => (
                <span key={`t${i}`} className="text-[10px] bg-bg-elevated px-1.5 py-0.5 rounded-md text-accent/60 font-mono border border-border-subtle">
                  {t.topic}
                </span>
              ))}
              {goals.slice(0, Math.max(0, 3 - categories.slice(0, 2).length - topics.length)).map((g, i) => (
                <span key={`g${i}`} className="text-[10px] bg-success/5 px-1.5 py-0.5 rounded-md text-success/60 border border-success/10">
                  {g.goal}
                </span>
              ))}
              {overflowCount > 0 && (
                <span className="text-[10px] text-text-dim font-mono">+{overflowCount}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Detail View (renders from JSON artifact v2) ──────────────────────

function DetailView({ item, detail, notes, onNotesChange, onBack }) {
  const json = detail?.jsonArtifact;
  const categories = detail?.categories || item.categories || [];
  const [expandedActions, setExpandedActions] = useState({});

  const source = json?.source || {};
  const summary = json?.summary || {};
  const actions = json?.actions || [];
  const quotes = json?.quotes_and_examples || [];
  const frameworks = json?.frameworks || [];
  const tags = json?.tags || {};

  const hasJsonV2 = json?.schema_version === 2;

  const grouped = {};
  for (const cat of categories) {
    const domain = cat.domain_name || cat.domain || "Other";
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push(cat);
  }

  const toggleAction = (idx) => {
    setExpandedActions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border-subtle" style={{ background: "rgba(12, 11, 10, 0.85)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-bg-elevated hover:bg-bg-card border border-border flex items-center justify-center text-text-dim hover:text-text transition-all duration-250 flex-shrink-0 active:scale-[0.95]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="text-sm font-medium truncate flex-1 text-text-secondary">{item.title || "Untitled"}</h1>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-accent text-xs font-medium hover:text-accent-hover transition-colors flex-shrink-0 flex items-center gap-1.5 bg-bg-elevated hover:bg-bg-card border border-border rounded-lg px-3 py-1.5">
            <span className="hidden sm:inline">Open</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Loading skeleton */}
        {!detail && (
          <div className="space-y-6" style={{ animation: "fadeIn 0.3s ease" }}>
            <div className="skeleton h-8 w-3/4" />
            <div className="bg-bg-elevated rounded-xl p-4 border border-border">
              <div className="skeleton h-4 w-1/3 mb-2" />
              <div className="skeleton h-3 w-2/3" />
            </div>
            <div className="skeleton h-16 w-full rounded-xl" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-4/6" />
          </div>
        )}

        {detail && hasJsonV2 ? (
          <div>
            {/* ── Source Context ── */}
            <section className="mb-8" style={{ animation: "fadeUp 0.35s ease" }}>
              <h2 className="text-2xl sm:text-3xl font-bold font-display leading-tight tracking-tight">{source.title || item.title}</h2>

              {/* Author + platform card */}
              <div className="mt-4 bg-bg-elevated rounded-xl p-4 border-l-2" style={{ borderLeftColor: item.type === "youtube" ? "#FF4444" : "#6C9BFF", borderTop: "1px solid var(--color-border)", borderRight: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)", borderTopLeftRadius: "0.75rem", borderBottomLeftRadius: "0.75rem", borderTopRightRadius: "0.75rem", borderBottomRightRadius: "0.75rem" }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center flex-shrink-0 text-text-dim">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text">{source.author?.name || item.author || "Unknown"}</div>
                    {source.author?.description && (
                      <div className="text-xs text-text-muted mt-0.5 leading-relaxed">{source.author.description}</div>
                    )}
                    <div className="text-[11px] text-text-dim mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span>{source.platform || (item.type === "youtube" ? "YouTube" : "Web")}</span>
                      {source.published_date && <><span>·</span><span>{source.published_date}</span></>}
                      {source.duration && <><span>·</span><span>{source.duration}</span></>}
                      {source.reading_time_min && <><span>·</span><span>~{source.reading_time_min} min read</span></>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2.5 mt-4 flex-wrap">
                <span className="text-[11px] px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wide" style={{
                  background: item.type === "youtube" ? "rgba(255, 68, 68, 0.1)" : "rgba(108, 155, 255, 0.1)",
                  color: item.type === "youtube" ? "#FF4444" : "#6C9BFF",
                }}>
                  {item.type === "youtube" ? "YouTube" : "Article"}
                </span>
                {summary.difficulty && (
                  <span className="text-[11px] px-2.5 py-1 rounded-lg font-medium capitalize" style={{
                    background: DIFFICULTY_STYLES[summary.difficulty]?.bg,
                    color: DIFFICULTY_STYLES[summary.difficulty]?.text,
                    border: `1px solid ${DIFFICULTY_STYLES[summary.difficulty]?.border}`,
                  }}>
                    {summary.difficulty}
                  </span>
                )}
                {summary.content_format && summary.content_format !== "other" && (
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-bg-elevated border border-border text-text-muted font-medium">
                    {CONTENT_FORMAT_LABELS[summary.content_format] || summary.content_format}
                  </span>
                )}
              </div>
            </section>

            {/* Thumbnail */}
            {item.type === "youtube" && (item.thumbnail || detail?.thumbnail) && (
              <div className="mb-8 rounded-2xl overflow-hidden border border-border" style={{ animation: "fadeUp 0.4s ease 0.05s both" }}>
                <img src={item.thumbnail || detail?.thumbnail} alt={item.title} className="w-full aspect-video object-cover" />
              </div>
            )}

            {/* ── TL;DR ── */}
            {summary.tldr && (
              <div className="mb-8 bg-accent/8 border border-accent/15 rounded-2xl px-5 py-4" style={{ animation: "fadeUp 0.4s ease 0.1s both" }}>
                <div className="text-[10px] uppercase tracking-widest text-accent/50 font-semibold mb-1.5">TL;DR</div>
                <p className="text-base text-text leading-relaxed font-medium">{summary.tldr}</p>
              </div>
            )}

            {/* ── Core Thesis ── */}
            {summary.core_thesis && (
              <Section title="Core Thesis" delay="0.15s">
                <p className="text-base text-text/85 leading-[1.75] whitespace-pre-line">{summary.core_thesis}</p>
              </Section>
            )}

            {/* ── Key Takeaways (numbered) ── */}
            {summary.key_takeaways?.length > 0 && (
              <Section title="Key Takeaways" delay="0.2s">
                {summary.key_takeaways.map((t, i) => (
                  <div key={i} className="flex gap-3 text-sm text-text/85 my-2 leading-relaxed">
                    <span className="text-accent/40 font-mono text-xs mt-0.5 flex-shrink-0 w-5 text-right">{i + 1}.</span>
                    <span>{t}</span>
                  </div>
                ))}
              </Section>
            )}

            {/* ── Actions with Rationale (collapsible) ── */}
            {actions.length > 0 && (
              <Section title="Actions" delay="0.25s">
                <div className="space-y-3">
                  {actions.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => a.rationale && toggleAction(i)}
                      className={`w-full text-left bg-bg-elevated border border-border rounded-xl p-4 transition-all duration-250 ${a.rationale ? "hover:bg-bg-card-hover cursor-pointer" : "cursor-default"}`}
                      style={{ borderLeft: "2px solid rgba(108, 155, 255, 0.25)" }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-accent/40 font-mono text-xs mt-0.5 flex-shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-text leading-snug">{a.action}</div>
                          {a.rationale && (
                            <>
                              <div className={`text-xs text-text-muted mt-2 leading-relaxed italic overflow-hidden transition-all duration-300 ${
                                expandedActions[i] ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                              }`}>
                                {a.rationale}
                              </div>
                              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-text-dim">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-200 ${expandedActions[i] ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                                {expandedActions[i] ? "hide rationale" : "show rationale"}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Quotes & Examples ── */}
            {quotes.length > 0 && (
              <Section title="Quotes & Examples" delay="0.3s">
                <div className="space-y-4">
                  {quotes.map((q, i) => (
                    <div key={i} className="relative bg-bg-elevated rounded-2xl p-5 border border-border quote-decoration">
                      <p className="text-sm sm:text-base text-text/85 italic leading-relaxed font-display">
                        &ldquo;{q.text}&rdquo;
                      </p>
                      {q.attribution && (
                        <p className="text-xs text-text-muted mt-2.5">— {q.attribution}</p>
                      )}
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {q.source_type && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{
                            background: SOURCE_TYPE_STYLES[q.source_type]?.bg || "rgba(108,155,255,0.1)",
                            color: SOURCE_TYPE_STYLES[q.source_type]?.text || "#6C9BFF",
                          }}>
                            {q.source_type}
                          </span>
                        )}
                        {q.theme && <span className="text-[10px] bg-bg-card px-2 py-0.5 rounded-md text-text-dim border border-border-subtle">{q.theme}</span>}
                        {q.topic && <span className="text-[10px] bg-bg-card px-2 py-0.5 rounded-md text-accent/60 font-mono border border-border-subtle">{q.topic}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Frameworks ── */}
            {frameworks.length > 0 && (
              <Section title="Frameworks" delay="0.35s">
                <div className="space-y-3">
                  {frameworks.map((f, i) => (
                    <div key={i} className="bg-bg-elevated border border-border rounded-xl p-4" style={{ borderTop: "2px solid rgba(255, 214, 102, 0.2)" }}>
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-warning/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFD666" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-text">{f.name}</div>
                          {f.description && <div className="text-xs text-text-muted mt-1 leading-relaxed">{f.description}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Tags (4 dimensions) ── */}
            <div className="mt-10 pt-6 border-t border-border space-y-5" style={{ animation: "fadeUp 0.4s ease 0.4s both" }}>
              {/* Categories by domain */}
              {Object.keys(grouped).length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-text-dim font-semibold mb-2.5">Domains</h3>
                  <div className="space-y-2">
                    {Object.entries(grouped).map(([domain, cats]) => (
                      <div key={domain} className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-text-dim font-medium min-w-fit">{domain}</span>
                        {cats.map((cat, i) => (
                          <span key={i} className="text-[11px] bg-accent/8 text-accent/80 px-2.5 py-0.5 rounded-md border border-accent/10">{cat.name || cat.category}</span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {tags.topics?.length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-text-dim font-semibold mb-2.5">Topics</h3>
                  <div className="flex gap-2 flex-wrap">
                    {tags.topics.map((t, i) => (
                      <span key={i} className="text-[11px] text-accent/70 bg-bg-elevated px-2.5 py-1 rounded-md border border-border-subtle font-mono">#{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Concepts */}
              {tags.concepts?.length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-text-dim font-semibold mb-2.5">Concepts</h3>
                  <div className="flex gap-2 flex-wrap">
                    {tags.concepts.map((c, i) => (
                      <span key={i} className="text-[11px] text-warning/80 bg-warning/8 px-2.5 py-1 rounded-md border border-warning/15 font-mono">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals */}
              {tags.goals?.length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-text-dim font-semibold mb-2.5">Goals</h3>
                  <div className="space-y-2">
                    {tags.goals.map((g, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="text-success/60 mt-0.5 text-[8px]">&#9670;</span>
                        <div>
                          <span className="text-[11px] text-success/80 font-medium">{g.goal}</span>
                          {g.relevance && <span className="text-[11px] text-text-dim"> — {g.relevance}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : detail?.markdownContent ? (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <MarkdownRenderer content={detail.markdownContent} />
          </div>
        ) : null}

        {/* Personal Notes */}
        {detail && (
          <div className="mt-10 pt-6 border-t border-border">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Add your thoughts..."
              className="w-full bg-bg-input border border-border rounded-2xl px-4 py-3.5 text-sm text-text placeholder:text-text-dim focus:border-border-focus focus:outline-none min-h-[120px] resize-y transition-all duration-300 leading-relaxed"
            />
            <p className="text-[10px] text-text-dim mt-1.5 font-mono">Auto-saves</p>
          </div>
        )}

        {/* JSON download + file path */}
        {json && (
          <div className="mt-8 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Data</h3>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
                  const u = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = u;
                  a.download = `${(item.title || "summary").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`;
                  a.click();
                  URL.revokeObjectURL(u);
                }}
                className="text-xs bg-bg-elevated border border-border hover:border-border-focus text-text-muted hover:text-text rounded-lg px-3 py-1.5 transition-all duration-250 flex items-center gap-1.5 active:scale-[0.96]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                JSON
              </button>
            </div>
            {(item.file_path || detail?.file_path) && (
              <div className="text-[11px] text-text-dim font-mono bg-bg-elevated rounded-xl p-3 border border-border-subtle break-all leading-relaxed mt-3">
                storage/saved/{item.file_path || detail?.file_path}/
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

function Section({ title, children, delay = "0s" }) {
  return (
    <section className="mb-8" style={{ animation: `fadeUp 0.4s ease ${delay} both` }}>
      <h3 className="text-sm font-semibold text-text uppercase tracking-wider mb-3.5 flex items-center gap-2.5">
        <span className="w-1 h-4 bg-accent rounded-full" />
        {title}
      </h3>
      {children}
    </section>
  );
}

// ─── Markdown Fallback Renderer ──────────────────────────────────────

function MarkdownRenderer({ content }) {
  const stripped = content.replace(/^---[\s\S]*?---\n*/, "");
  const lines = stripped.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("# ")) { i++; continue; }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-sm font-semibold text-text uppercase tracking-wider mt-8 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-accent rounded-full" />{line.slice(3)}
        </h2>
      );
      i++; continue;
    }
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-accent/30 pl-4 my-3 py-1">
          <p className="text-sm text-text-muted italic leading-relaxed">{line.slice(2)}</p>
        </blockquote>
      );
      i++; continue;
    }
    if (line.startsWith("- ")) {
      elements.push(
        <div key={i} className="flex gap-2.5 text-sm text-text/85 my-1.5 leading-relaxed">
          <span className="text-accent/60 mt-1 flex-shrink-0 text-[8px]">&#9679;</span>
          <span>{formatInline(line.slice(2))}</span>
        </div>
      );
      i++; continue;
    }
    if (line.trim() === "---") { elements.push(<hr key={i} className="border-border my-6" />); i++; continue; }
    if (line.trim() === "") { i++; continue; }
    elements.push(<p key={i} className="text-sm text-text/75 my-2 leading-relaxed">{formatInline(line)}</p>);
    i++;
  }
  return <div>{elements}</div>;
}

function formatInline(text) {
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-text">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="text-[11px] bg-bg-elevated px-1.5 py-0.5 rounded text-accent/80 font-mono border border-border-subtle">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STEPS = [
  { key: "detecting", label: "Detecting content type", icon: "🔍" },
  { key: "extracting", label: "Extracting content", icon: "📄" },
  { key: "summarizing", label: "AI analysis", icon: "🧠" },
  { key: "saving", label: "Saving & organizing", icon: "💾" },
];

const CONTENT_TYPE_LABELS = {
  tutorial: "Tutorial",
  opinion: "Opinion",
  research: "Research",
  interview: "Interview",
  review: "Review",
  explainer: "Explainer",
  motivational: "Motivational",
  news: "News",
  "case-study": "Case Study",
  other: "Other",
};

const DIFFICULTY_COLORS = {
  beginner: { bg: "rgba(108, 255, 184, 0.1)", text: "#6CFFB8", border: "rgba(108, 255, 184, 0.2)" },
  intermediate: { bg: "rgba(108, 155, 255, 0.1)", text: "#6C9BFF", border: "rgba(108, 155, 255, 0.2)" },
  advanced: { bg: "rgba(255, 214, 102, 0.1)", text: "#FFD666", border: "rgba(255, 214, 102, 0.2)" },
};

export default function LinksPage() {
  const [url, setUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [steps, setSteps] = useState({});
  const [duplicate, setDuplicate] = useState(null);
  const [processError, setProcessError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  const [items, setItems] = useState([]);
  const [domains, setDomains] = useState([]);
  const [activeDomain, setActiveDomain] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalItems, setTotalItems] = useState(0);

  const [selectedItem, setSelectedItem] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [notes, setNotes] = useState("");
  const notesTimeout = useRef(null);

  const inputRef = useRef(null);

  useEffect(() => {
    fetchItems();
    fetchDomains();
  }, [activeDomain, activeCategory, activeType]);

  const fetchItems = useCallback(async () => {
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (activeDomain && !activeCategory) params.set("domain", activeDomain);
    if (activeType) params.set("type", activeType);
    if (searchQuery) params.set("search", searchQuery);

    try {
      const res = await fetch(`/api/links?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotalItems(data.total || 0);
    } catch {
      console.error("Failed to fetch items");
    }
  }, [activeDomain, activeCategory, activeType, searchQuery]);

  const fetchDomains = async () => {
    try {
      const res = await fetch("/api/links/tags");
      const data = await res.json();
      setDomains(data.domains || []);
    } catch {
      console.error("Failed to fetch domains");
    }
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
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              handleSSEEvent(currentEvent, data);
            } catch { /* ignore parse errors */ }
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

  const handleSSEEvent = (event, data) => {
    switch (event) {
      case "step":
        setSteps((prev) => ({
          ...prev,
          [data.step]: { status: data.status, result: data.result, error: data.error },
        }));
        break;
      case "duplicate":
        setDuplicate(data);
        break;
      case "done":
        setLastSaved(data.item);
        setUrl("");
        fetchItems();
        fetchDomains();
        break;
      case "error":
        setProcessError(data.message);
        break;
    }
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
    } catch {
      console.error("Failed to load detail");
    }
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      processUrl();
    }
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

  const domainsWithItems = domains.filter(d =>
    d.categories?.some(c => c.item_count > 0)
  );

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border-subtle" style={{ background: "rgba(12, 11, 10, 0.85)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-text-dim hover:text-text-muted transition-colors duration-200">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </a>
            <h1 className="text-base font-semibold tracking-tight">Links</h1>
          </div>
          <span className="text-text-dim text-xs font-mono tabular-nums">{totalItems}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
        {/* URL Input */}
        <div className="mb-6">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste a URL to save..."
                disabled={processing}
                className="w-full bg-bg-input border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-text placeholder:text-text-dim focus:border-border-focus focus:outline-none transition-all duration-200 disabled:opacity-40"
              />
            </div>
            <button
              onClick={processUrl}
              disabled={processing || !url.trim()}
              className="bg-accent hover:bg-accent-hover disabled:opacity-30 disabled:hover:bg-accent text-bg font-medium rounded-xl px-5 py-3 text-sm transition-all duration-200 whitespace-nowrap active:scale-[0.97]"
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                  <span className="hidden sm:inline">Saving</span>
                </span>
              ) : "Save"}
            </button>
          </div>

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

        {/* Processing Progress */}
        {processing && (
          <div className="mb-6 bg-bg-elevated border border-border rounded-2xl p-5 overflow-hidden" style={{ animation: "fadeUp 0.4s ease" }}>
            <div className="space-y-4">
              {STEPS.map((step, idx) => {
                const state = steps[step.key];
                const isActive = state?.status === "in_progress";
                const isComplete = state?.status === "complete";
                const isFailed = state?.status === "failed";
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all duration-300 ${
                      isComplete ? "bg-success/15 text-success" :
                      isFailed ? "bg-error/15 text-error" :
                      isActive ? "bg-accent/15 text-accent" :
                      "bg-bg-card text-text-dim"
                    }`}>
                      {isComplete ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : isFailed ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      ) : isActive ? (
                        <span className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-text-dim/50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className={`text-sm font-medium transition-colors duration-200 ${
                        isActive ? "text-text" : isComplete ? "text-text-muted" : isFailed ? "text-error" : "text-text-dim"
                      }`}>
                        {step.label}
                      </span>
                      {isFailed && state.error && (
                        <p className="text-xs text-error/70 mt-0.5">{state.error}</p>
                      )}
                    </div>
                    {state?.result?.type && (
                      <span className="text-[11px] bg-bg-card px-2 py-0.5 rounded-md text-text-muted font-medium">
                        {state.result.type}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Last saved success */}
        {lastSaved && !processing && (
          <div className="mb-6 bg-success-glow border border-success/15 rounded-2xl p-4" style={{ animation: "fadeUp 0.4s ease" }}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6CFFB8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-sm text-success font-medium">Saved</span>
                </div>
                <div className="text-text text-sm font-medium truncate">{lastSaved.title}</div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {lastSaved.categories?.map((cat, i) => (
                    <span key={i} className="text-[11px] bg-bg-card/80 px-2 py-0.5 rounded-md text-text-muted">
                      {cat.category}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => openDetail(lastSaved)}
                className="text-accent text-sm font-medium hover:text-accent-hover transition-colors flex-shrink-0"
              >
                View
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-5 space-y-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-bg-input border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:border-border-focus focus:outline-none transition-all duration-200"
            />
          </div>

          {/* Domain filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            <FilterChip
              label="All"
              active={!activeDomain}
              onClick={() => { setActiveDomain(null); setActiveCategory(null); }}
            />
            {domainsWithItems.map((domain) => {
              const totalCount = domain.categories?.reduce((sum, c) => sum + c.item_count, 0) || 0;
              return (
                <FilterChip
                  key={domain.slug}
                  label={domain.name}
                  count={totalCount}
                  active={activeDomain === domain.slug}
                  onClick={() => {
                    if (activeDomain === domain.slug) {
                      setActiveDomain(null);
                      setActiveCategory(null);
                    } else {
                      setActiveDomain(domain.slug);
                      setActiveCategory(null);
                    }
                  }}
                />
              );
            })}
          </div>

          {/* Sub-category chips */}
          {activeDomain && (() => {
            const domain = domains.find(d => d.slug === activeDomain);
            const catsWithItems = domain?.categories?.filter(c => c.item_count > 0) || [];
            if (catsWithItems.length === 0) return null;
            return (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 pl-3" style={{ animation: "fadeUp 0.2s ease" }}>
                <FilterChip
                  label="All"
                  active={!activeCategory}
                  onClick={() => setActiveCategory(null)}
                  small
                />
                {catsWithItems.map((cat) => (
                  <FilterChip
                    key={cat.slug}
                    label={cat.name}
                    count={cat.item_count}
                    active={activeCategory === cat.slug}
                    onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
                    small
                  />
                ))}
              </div>
            );
          })()}

          {/* Type filter */}
          <div className="flex gap-1.5">
            <TypeChip label="All" active={!activeType} onClick={() => setActiveType(null)} />
            <TypeChip label="YouTube" active={activeType === "youtube"} onClick={() => setActiveType(activeType === "youtube" ? null : "youtube")} color="youtube" />
            <TypeChip label="Articles" active={activeType === "article"} onClick={() => setActiveType(activeType === "article" ? null : "article")} color="article" />
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {items.length === 0 && !processing && (
            <div className="text-center py-20 text-text-dim" style={{ animation: "fadeIn 0.5s ease" }}>
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              <div className="text-sm font-medium text-text-muted mb-1">No saved links</div>
              <div className="text-xs">Paste a URL above to get started</div>
            </div>
          )}

          {items.map((item, idx) => (
            <ItemCard key={item.id} item={item} onClick={() => openDetail(item)} index={idx} />
          ))}
        </div>
      </main>
    </div>
  );
}

function FilterChip({ label, count, active, onClick, small }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
        small ? "text-[11px] px-2.5 py-1" : "text-xs px-3 py-1.5"
      } ${
        active
          ? "bg-accent text-bg font-medium shadow-sm"
          : "bg-bg-elevated border border-border text-text-muted hover:text-text-secondary hover:border-border-focus"
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`${active ? "text-bg/60" : "text-text-dim"} font-mono text-[10px]`}>{count}</span>
      )}
    </button>
  );
}

function TypeChip({ label, active, onClick, color }) {
  const colorVar = color === "youtube" ? "#FF4444" : color === "article" ? "#6C9BFF" : null;
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-200 font-medium ${
        active
          ? "border shadow-sm"
          : "bg-bg-elevated border border-border text-text-muted hover:text-text-secondary"
      }`}
      style={active && colorVar ? {
        background: `${colorVar}15`,
        borderColor: `${colorVar}30`,
        color: colorVar,
      } : active ? {
        background: "rgba(108, 155, 255, 0.1)",
        borderColor: "rgba(108, 155, 255, 0.25)",
        color: "#6C9BFF",
      } : {}}
    >
      {label}
    </button>
  );
}

function ItemCard({ item, onClick, index }) {
  const isYoutube = item.type === "youtube";
  const categories = item.categories || [];

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-bg-card hover:bg-bg-card-hover border border-border hover:border-border-focus rounded-2xl p-4 transition-all duration-200 group"
      style={{ animation: `fadeUp 0.3s ease ${index * 0.04}s both` }}
    >
      <div className="flex gap-3">
        {isYoutube && item.thumbnail && (
          <div className="flex-shrink-0 w-28 sm:w-32 aspect-video rounded-xl overflow-hidden bg-bg-elevated">
            <img src={item.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="text-sm font-medium text-text leading-snug line-clamp-2 flex-1 group-hover:text-accent transition-colors duration-200">
              {item.title || "Untitled"}
            </h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold flex-shrink-0 uppercase tracking-wide ${
              isYoutube ? "text-youtube/80" : "text-article/80"
            }`} style={{
              background: isYoutube ? "rgba(255, 68, 68, 0.1)" : "rgba(108, 155, 255, 0.1)",
            }}>
              {isYoutube ? "YT" : "Art"}
            </span>
          </div>

          <div className="text-xs text-text-muted mt-1 flex items-center gap-1.5">
            {item.author && <span className="truncate max-w-[140px]">{item.author}</span>}
            {item.author && item.created_at && <span className="text-text-dim">·</span>}
            {item.created_at && <span className="text-text-dim font-mono text-[11px]">{formatDate(item.created_at)}</span>}
          </div>

          {item.summary_preview && (
            <p className="text-xs text-text-dim mt-1.5 line-clamp-2 leading-relaxed">{item.summary_preview}</p>
          )}

          {categories.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {categories.slice(0, 3).map((cat, i) => (
                <span key={i} className="text-[10px] bg-bg-elevated px-2 py-0.5 rounded-md text-text-dim border border-border-subtle">
                  {cat.name || cat.category}
                </span>
              ))}
              {categories.length > 3 && (
                <span className="text-[10px] text-text-dim">+{categories.length - 3}</span>
              )}
            </div>
          )}

          {item.status === "partial" && (
            <div className="flex items-center gap-1 mt-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFD666" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              <span className="text-[10px] text-warning">Partial</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function DetailView({ item, detail, notes, onNotesChange, onBack }) {
  const markdown = detail?.markdownContent;
  const json = detail?.jsonArtifact;
  const categories = detail?.categories || item.categories || [];

  // Group categories by domain
  const grouped = {};
  for (const cat of categories) {
    const domain = cat.domain_name || cat.domain || "Other";
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push(cat);
  }

  // Extract rich metadata from JSON artifact
  const tldr = json?.ai_summary?.tldr;
  const difficulty = json?.ai_summary?.difficulty;
  const contentType = json?.ai_summary?.content_type;
  const topics = json?.ai_summary?.topics || [];

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border-subtle" style={{ background: "rgba(12, 11, 10, 0.85)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={onBack} className="text-text-dim hover:text-text transition-colors duration-200 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="text-sm font-medium truncate flex-1 text-text-secondary">{item.title || "Untitled"}</h1>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent text-xs font-medium hover:text-accent-hover transition-colors flex-shrink-0 flex items-center gap-1"
          >
            <span className="hidden sm:inline">Open</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Title & meta */}
        <div className="mb-6" style={{ animation: "fadeUp 0.3s ease" }}>
          <h2 className="text-xl sm:text-2xl font-semibold leading-tight tracking-tight">{item.title}</h2>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wide ${
              item.type === "youtube" ? "text-youtube/90" : "text-article/90"
            }`} style={{
              background: item.type === "youtube" ? "rgba(255, 68, 68, 0.1)" : "rgba(108, 155, 255, 0.1)",
            }}>
              {item.type === "youtube" ? "YouTube" : "Article"}
            </span>
            {difficulty && (
              <span className="text-[11px] px-2 py-0.5 rounded-md font-medium capitalize" style={{
                background: DIFFICULTY_COLORS[difficulty]?.bg,
                color: DIFFICULTY_COLORS[difficulty]?.text,
                border: `1px solid ${DIFFICULTY_COLORS[difficulty]?.border}`,
              }}>
                {difficulty}
              </span>
            )}
            {contentType && contentType !== "other" && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-bg-elevated border border-border text-text-muted font-medium">
                {CONTENT_TYPE_LABELS[contentType] || contentType}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
            {(item.author || detail?.author) && <span>{item.author || detail?.author}</span>}
            {item.created_at && (
              <>
                <span className="text-text-dim">·</span>
                <span className="text-text-dim font-mono">{formatDate(item.created_at)}</span>
              </>
            )}
          </div>

          {/* TL;DR */}
          {tldr && (
            <div className="mt-4 bg-accent-glow border border-accent/15 rounded-xl px-4 py-3" style={{ animation: "fadeUp 0.4s ease" }}>
              <div className="text-[10px] uppercase tracking-widest text-accent/60 font-semibold mb-1">TL;DR</div>
              <p className="text-sm text-text leading-relaxed">{tldr}</p>
            </div>
          )}

          {/* Categories grouped by domain */}
          {Object.keys(grouped).length > 0 && (
            <div className="mt-4 space-y-2">
              {Object.entries(grouped).map(([domain, cats]) => (
                <div key={domain} className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-text-dim uppercase tracking-wider font-medium min-w-fit">{domain}</span>
                  <div className="flex gap-1 flex-wrap">
                    {cats.map((cat, i) => (
                      <span key={i} className="text-[11px] bg-accent/8 text-accent/90 px-2.5 py-1 rounded-lg border border-accent/10">
                        {cat.name || cat.category}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Topics */}
          {topics.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {topics.map((topic, i) => (
                <span key={i} className="text-[11px] text-text-dim bg-bg-elevated px-2 py-0.5 rounded-md border border-border-subtle font-mono">
                  #{topic}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail */}
        {item.type === "youtube" && (item.thumbnail || detail?.thumbnail) && (
          <div className="mb-6 rounded-2xl overflow-hidden border border-border" style={{ animation: "fadeUp 0.4s ease 0.1s both" }}>
            <img
              src={item.thumbnail || detail?.thumbnail}
              alt={item.title}
              className="w-full aspect-video object-cover"
            />
          </div>
        )}

        {/* Loading state */}
        {!detail && (
          <div className="flex items-center justify-center py-16" style={{ animation: "fadeIn 0.3s ease" }}>
            <span className="inline-block w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <span className="ml-3 text-text-dim text-sm">Loading summary...</span>
          </div>
        )}

        {/* Markdown content */}
        {markdown && (
          <div style={{ animation: "fadeUp 0.4s ease 0.15s both" }}>
            <MarkdownRenderer content={markdown} />
          </div>
        )}

        {/* Personal Notes */}
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add your thoughts..."
            className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-dim focus:border-border-focus focus:outline-none min-h-[100px] resize-y transition-all duration-200 leading-relaxed"
          />
          <p className="text-[10px] text-text-dim mt-1.5 font-mono">Auto-saves</p>
        </div>

        {/* JSON Artifact download */}
        {json && (
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Data</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${(item.title || "summary").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-xs bg-bg-elevated border border-border hover:border-border-focus text-text-muted hover:text-text rounded-lg px-3 py-2 transition-all duration-200 flex items-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                JSON
              </button>
            </div>
          </div>
        )}

        {/* File path */}
        {(item.file_path || detail?.file_path) && (
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Local Path</h3>
            <div className="text-[11px] text-text-dim font-mono bg-bg-elevated rounded-xl p-3 border border-border-subtle break-all leading-relaxed">
              storage/saved/{item.file_path || detail?.file_path}/
            </div>
          </div>
        )}
      </main>
    </>
  );
}

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
          <span className="w-1 h-4 bg-accent rounded-full" />
          {line.slice(3)}
        </h2>
      );
      i++; continue;
    }
    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-sm font-semibold text-text-secondary mt-5 mb-2">{line.slice(4)}</h3>);
      i++; continue;
    }
    if (line.startsWith("> ")) {
      const quoteText = line.slice(2);
      elements.push(
        <blockquote key={i} className="border-l-2 border-accent/30 pl-4 my-3 py-1">
          <p className="text-sm text-text-muted italic leading-relaxed">{quoteText}</p>
        </blockquote>
      );
      i++; continue;
    }
    if (line.startsWith("- ")) {
      elements.push(
        <div key={i} className="flex gap-2.5 text-sm text-text/85 my-1.5 leading-relaxed">
          <span className="text-accent/60 mt-1 flex-shrink-0 text-[8px]">●</span>
          <span>{formatInlineMarkdown(line.slice(2))}</span>
        </div>
      );
      i++; continue;
    }
    if (line.trim() === "---") { elements.push(<hr key={i} className="border-border my-6" />); i++; continue; }
    if (line.trim() === "") { i++; continue; }

    // Handle inline code blocks (topic tags)
    if (line.includes("`")) {
      elements.push(
        <p key={i} className="text-sm text-text/75 my-2 leading-relaxed">
          {formatInlineCode(line)}
        </p>
      );
      i++; continue;
    }

    elements.push(<p key={i} className="text-sm text-text/75 my-2 leading-relaxed">{formatInlineMarkdown(line)}</p>);
    i++;
  }

  return <div>{elements}</div>;
}

function formatInlineMarkdown(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-text">{part}</strong> : part
  );
}

function formatInlineCode(text) {
  const parts = text.split(/`([^`]+)`/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <code key={i} className="text-[11px] bg-bg-elevated px-1.5 py-0.5 rounded text-accent/80 font-mono border border-border-subtle">
        {part}
      </code>
    ) : formatInlineMarkdown(part)
  );
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

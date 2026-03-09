"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STEPS = [
  { key: "detecting", label: "Detecting type" },
  { key: "extracting", label: "Extracting content" },
  { key: "summarizing", label: "AI summarizing" },
  { key: "saving", label: "Saving files" },
];

export default function LinksPage() {
  const [url, setUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [steps, setSteps] = useState({});
  const [duplicate, setDuplicate] = useState(null);
  const [processError, setProcessError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  const [items, setItems] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalItems, setTotalItems] = useState(0);

  const [selectedItem, setSelectedItem] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [notes, setNotes] = useState("");
  const notesTimeout = useRef(null);

  const inputRef = useRef(null);

  // Load items and tags on mount
  useEffect(() => {
    fetchItems();
    fetchTags();
  }, [activeTag, activeType]);

  const fetchItems = useCallback(async () => {
    const params = new URLSearchParams();
    if (activeTag) params.set("tag", activeTag);
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
  }, [activeTag, activeType, searchQuery]);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/links/tags");
      const data = await res.json();
      setTags(data.tags || []);
    } catch {
      console.error("Failed to fetch tags");
    }
  };

  // Search debounce
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
        fetchTags();
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

  // If detail view is open
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

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-text-muted hover:text-text transition-colors text-sm">
              ← Hub
            </a>
            <h1 className="text-lg font-semibold">Link Saver</h1>
          </div>
          <span className="text-text-dim text-xs">{totalItems} saved</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4">
        {/* URL Input */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste a YouTube or article URL..."
              disabled={processing}
              className="flex-1 bg-bg-input border border-border rounded-lg px-4 py-3 text-text placeholder:text-text-dim focus:border-border-focus focus:outline-none transition-colors disabled:opacity-50"
            />
            <button
              onClick={processUrl}
              disabled={processing || !url.trim()}
              className="bg-accent hover:bg-accent-hover disabled:opacity-40 text-bg font-medium rounded-lg px-5 py-3 transition-colors whitespace-nowrap"
            >
              {processing ? "Processing..." : "Save"}
            </button>
          </div>

          {/* Duplicate warning */}
          {duplicate && (
            <div className="mt-2 bg-warning/10 border border-warning/20 rounded-lg px-3 py-2 text-sm text-warning">
              Already saved: "{duplicate.existingItem.title}" — processing anyway
            </div>
          )}

          {/* Process error */}
          {processError && (
            <div className="mt-2 bg-error/10 border border-error/20 rounded-lg px-3 py-2 text-sm text-error">
              {processError}
            </div>
          )}
        </div>

        {/* Processing Progress */}
        {processing && (
          <div className="mb-6 bg-bg-card border border-border rounded-xl p-4">
            <div className="space-y-3">
              {STEPS.map((step) => {
                const state = steps[step.key];
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <StepIcon status={state?.status} />
                    <span className={`text-sm ${state?.status === "in_progress" ? "text-accent" : state?.status === "complete" ? "text-success" : state?.status === "failed" ? "text-error" : "text-text-dim"}`}>
                      {step.label}
                      {state?.status === "in_progress" && "..."}
                      {state?.status === "failed" && ` — ${state.error || "failed"}`}
                    </span>
                    {state?.result?.type && (
                      <span className="text-xs bg-bg px-2 py-0.5 rounded-full text-text-muted">
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
          <div className="mb-6 bg-success/10 border border-success/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-success font-medium">Saved successfully</div>
                <div className="text-text text-sm mt-1">{lastSaved.title}</div>
                <div className="flex gap-1 mt-1">
                  {lastSaved.tags?.map((tag) => (
                    <span key={tag} className="text-xs bg-bg px-2 py-0.5 rounded-full text-text-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => openDetail(lastSaved)}
                className="text-accent text-sm hover:underline"
              >
                View
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 space-y-3">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved links..."
            className="w-full bg-bg-input border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-border-focus focus:outline-none"
          />

          {/* Tag filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <TagChip
              label="All"
              active={!activeTag}
              onClick={() => setActiveTag(null)}
            />
            {tags
              .filter((t) => t.item_count > 0)
              .map((tag) => (
                <TagChip
                  key={tag.slug}
                  label={`${tag.name} (${tag.item_count})`}
                  active={activeTag === tag.slug}
                  onClick={() => setActiveTag(activeTag === tag.slug ? null : tag.slug)}
                />
              ))}
          </div>

          {/* Type filter */}
          <div className="flex gap-2">
            <TypeChip label="All" active={!activeType} onClick={() => setActiveType(null)} />
            <TypeChip label="YouTube" active={activeType === "youtube"} onClick={() => setActiveType(activeType === "youtube" ? null : "youtube")} />
            <TypeChip label="Articles" active={activeType === "article"} onClick={() => setActiveType(activeType === "article" ? null : "article")} />
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          {items.length === 0 && !processing && (
            <div className="text-center py-16 text-text-dim">
              <div className="text-4xl mb-3">🔗</div>
              <div className="text-lg">No saved links yet</div>
              <div className="text-sm mt-1">Paste a YouTube or article URL above to get started</div>
            </div>
          )}

          {items.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => openDetail(item)} />
          ))}
        </div>
      </main>
    </div>
  );
}

function StepIcon({ status }) {
  if (status === "complete") return <span className="text-success text-lg">✓</span>;
  if (status === "failed") return <span className="text-error text-lg">✗</span>;
  if (status === "in_progress") return <span className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />;
  return <span className="w-4 h-4 rounded-full border border-text-dim inline-block" />;
}

function TagChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full transition-colors ${
        active
          ? "bg-accent text-bg"
          : "bg-bg-card border border-border text-text-muted hover:border-border-focus"
      }`}
    >
      {label}
    </button>
  );
}

function TypeChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1 rounded-md transition-colors ${
        active
          ? "bg-accent/20 text-accent border border-accent/30"
          : "bg-bg-card border border-border text-text-muted hover:text-text"
      }`}
    >
      {label}
    </button>
  );
}

function ItemCard({ item, onClick }) {
  const isYoutube = item.type === "youtube";

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-bg-card hover:bg-bg-card-hover border border-border rounded-xl p-4 transition-colors"
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        {isYoutube && item.thumbnail && (
          <div className="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden bg-bg">
            <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title + type badge */}
          <div className="flex items-start gap-2">
            <h3 className="text-sm font-medium text-text truncate flex-1">
              {item.title || "Untitled"}
            </h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
              isYoutube ? "bg-youtube/20 text-youtube" : "bg-article/20 text-article"
            }`}>
              {isYoutube ? "YT" : "Article"}
            </span>
          </div>

          {/* Author + date */}
          <div className="text-xs text-text-muted mt-0.5">
            {item.author && <span>{item.author}</span>}
            {item.author && item.created_at && <span> · </span>}
            {item.created_at && <span>{new Date(item.created_at).toLocaleDateString()}</span>}
          </div>

          {/* Summary preview */}
          {item.summary_preview && (
            <p className="text-xs text-text-dim mt-1 line-clamp-2">{item.summary_preview}</p>
          )}

          {/* Tags */}
          {item.tags?.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {item.tags.map((tag) => (
                <span key={tag.slug || tag} className="text-[10px] bg-bg px-2 py-0.5 rounded-full text-text-dim">
                  {tag.name || tag}
                </span>
              ))}
            </div>
          )}

          {/* Status indicator */}
          {item.status === "partial" && (
            <span className="text-[10px] text-warning mt-1 inline-block">⚠ Partial save</span>
          )}
        </div>
      </div>
    </button>
  );
}

function DetailView({ item, detail, notes, onNotesChange, onBack }) {
  const markdown = detail?.markdownContent;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="text-text-muted hover:text-text transition-colors text-sm">
            ← Back
          </button>
          <h1 className="text-sm font-medium truncate flex-1">{item.title || "Untitled"}</h1>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent text-xs hover:underline flex-shrink-0"
          >
            Open original ↗
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Meta */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold font-display">{item.title}</h2>
          <div className="flex items-center gap-2 mt-2 text-sm text-text-muted">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              item.type === "youtube" ? "bg-youtube/20 text-youtube" : "bg-article/20 text-article"
            }`}>
              {item.type === "youtube" ? "YouTube" : "Article"}
            </span>
            {(item.author || detail?.author) && <span>{item.author || detail?.author}</span>}
            {item.created_at && <span>· Saved {new Date(item.created_at).toLocaleDateString()}</span>}
          </div>

          {/* Tags */}
          {(item.tags?.length > 0 || detail?.tags?.length > 0) && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {(detail?.tags || item.tags || []).map((tag) => (
                <span key={tag.slug || tag.name || tag} className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full">
                  {tag.name || tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* YouTube thumbnail */}
        {item.type === "youtube" && (item.thumbnail || detail?.thumbnail) && (
          <div className="mb-6 rounded-xl overflow-hidden">
            <img
              src={item.thumbnail || detail?.thumbnail}
              alt={item.title}
              className="w-full aspect-video object-cover"
            />
          </div>
        )}

        {/* Markdown content */}
        {!detail && (
          <div className="flex items-center justify-center py-12">
            <span className="inline-block w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-text-muted text-sm">Loading...</span>
          </div>
        )}

        {markdown && (
          <div className="prose-custom">
            <MarkdownRenderer content={markdown} />
          </div>
        )}

        {/* Personal Notes */}
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-sm font-medium text-text-muted mb-2">Personal Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add your notes..."
            className="w-full bg-bg-input border border-border rounded-lg px-3 py-3 text-sm text-text placeholder:text-text-dim focus:border-border-focus focus:outline-none min-h-[100px] resize-y"
          />
          <p className="text-[10px] text-text-dim mt-1">Auto-saves as you type</p>
        </div>

        {/* File paths */}
        {(item.file_path || detail?.file_path) && (
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-text-muted mb-2">Local Files</h3>
            <div className="text-xs text-text-dim font-mono bg-bg-card rounded-lg p-3">
              storage/saved/{item.file_path || detail?.file_path}/
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function MarkdownRenderer({ content }) {
  // Strip YAML frontmatter
  const stripped = content.replace(/^---[\s\S]*?---\n*/, "");

  // Simple markdown to HTML conversion
  const lines = stripped.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headers
    if (line.startsWith("# ")) {
      // Skip the main title (we show it above)
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-semibold text-text mt-6 mb-2">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-text mt-4 mb-1">
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-accent/40 pl-3 my-2 text-sm text-text-muted italic">
          {line.slice(2)}
        </blockquote>
      );
      i++;
      continue;
    }

    // List item
    if (line.startsWith("- ")) {
      elements.push(
        <div key={i} className="flex gap-2 text-sm text-text/90 my-1">
          <span className="text-accent mt-0.5 flex-shrink-0">•</span>
          <span>{formatInlineMarkdown(line.slice(2))}</span>
        </div>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.trim() === "---") {
      elements.push(<hr key={i} className="border-border my-4" />);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm text-text/80 my-2 leading-relaxed">
        {formatInlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return <div>{elements}</div>;
}

function formatInlineMarkdown(text) {
  // Bold
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-text">
        {part}
      </strong>
    ) : (
      part
    )
  );
}

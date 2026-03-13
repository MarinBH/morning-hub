"use client";

import { useState, useEffect } from "react";
import { CONTENT_FORMAT_LABELS, DIFFICULTY_STYLES, SOURCE_TYPE_STYLES } from "./constants";
import MarkdownRenderer from "./MarkdownRenderer";

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

export default function LinkDetail({ item, detail, notes, onNotesChange, onBack }) {
  const json = detail?.jsonArtifact;
  const categories = detail?.categories || item.categories || [];
  const [expandedActions, setExpandedActions] = useState({});

  // Escape key closes detail view
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onBack();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

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
    <div className="min-h-screen bg-bg text-text font-sans">
      <header className="sticky top-0 z-20 border-b border-border-subtle" style={{ background: "rgba(12, 11, 10, 0.85)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-bg-elevated hover:bg-bg-card border border-border flex items-center justify-center text-text-dim hover:text-text transition-all duration-250 flex-shrink-0 active:scale-[0.95]" aria-label="Go back">
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
            {/* Source Context */}
            <section className="mb-8" style={{ animation: "fadeUp 0.35s ease" }}>
              <h2 className="text-2xl sm:text-3xl font-bold font-display leading-tight tracking-tight">{source.title || item.title}</h2>

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
                <img src={item.thumbnail || detail?.thumbnail} alt={item.title || "Video thumbnail"} className="w-full aspect-video object-cover" />
              </div>
            )}

            {/* TL;DR */}
            {summary.tldr && (
              <div className="mb-8 bg-accent/8 border border-accent/15 rounded-2xl px-5 py-4" style={{ animation: "fadeUp 0.4s ease 0.1s both" }}>
                <div className="text-[10px] uppercase tracking-widest text-accent/50 font-semibold mb-1.5">TL;DR</div>
                <p className="text-base text-text leading-relaxed font-medium">{summary.tldr}</p>
              </div>
            )}

            {/* Core Thesis */}
            {summary.core_thesis && (
              <Section title="Core Thesis" delay="0.15s">
                <p className="text-base text-text/85 leading-[1.75] whitespace-pre-line">{summary.core_thesis}</p>
              </Section>
            )}

            {/* Key Takeaways */}
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

            {/* Actions */}
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

            {/* Quotes & Examples */}
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

            {/* Frameworks */}
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

            {/* Tags (4 dimensions) */}
            <div className="mt-10 pt-6 border-t border-border space-y-5" style={{ animation: "fadeUp 0.4s ease 0.4s both" }}>
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
              aria-label="Personal notes"
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
    </div>
  );
}

"use client";

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

export default function FilterBar({
  domains, allTopics, allGoals,
  activeDomain, setActiveDomain,
  activeCategory, setActiveCategory,
  activeType, setActiveType,
  activeTopic, setActiveTopic,
  activeGoal, setActiveGoal,
  filterMode, setFilterMode,
  searchQuery, setSearchQuery,
}) {
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

  const filterTabs = [
    { key: "domains", label: "Domains" },
    ...(topicsWithItems.length > 0 ? [{ key: "topics", label: "Topics" }] : []),
    ...(conceptsWithItems.length > 0 ? [{ key: "concepts", label: "Concepts" }] : []),
    ...(goalsWithItems.length > 0 ? [{ key: "goals", label: "Goals" }] : []),
  ];
  const activeTabIndex = filterTabs.findIndex(t => t.key === filterMode);

  return (
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
            aria-label="Search links"
            className="w-full bg-bg-input border border-border rounded-xl pl-9 pr-9 py-2.5 sm:py-3 text-sm text-text placeholder:text-text-dim focus:border-border-focus focus:outline-none transition-all duration-300"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors" aria-label="Clear search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => setActiveType(activeType === "youtube" ? null : "youtube")}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-250 border ${
              activeType === "youtube" ? "bg-youtube/10 border-youtube/25 text-youtube" : "bg-bg-elevated border-border text-text-dim hover:text-text-muted hover:border-border-focus"
            }`}
            title="YouTube"
            aria-label="Filter YouTube"
            aria-pressed={activeType === "youtube"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </button>
          <button
            onClick={() => setActiveType(activeType === "article" ? null : "article")}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-250 border ${
              activeType === "article" ? "bg-accent/10 border-accent/25 text-accent" : "bg-bg-elevated border-border text-text-dim hover:text-text-muted hover:border-border-focus"
            }`}
            title="Articles"
            aria-label="Filter articles"
            aria-pressed={activeType === "article"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </button>
        </div>
      </div>

      {/* Filter mode tabs */}
      <div className="relative flex bg-bg-elevated rounded-xl p-1 border border-border" role="tablist">
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
            role="tab"
            aria-selected={filterMode === tab.key}
            onClick={() => { setFilterMode(tab.key); clearFilters(); }}
            className={`relative z-10 flex-1 text-[11px] font-medium py-2 px-3 rounded-lg transition-colors duration-250 ${
              filterMode === tab.key ? "text-text" : "text-text-dim hover:text-text-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Domain chips */}
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

      {/* Active filter summary */}
      {hasActiveFilter && (
        <div className="flex items-center justify-between bg-bg-elevated rounded-lg px-3 py-2 border border-border" style={{ animation: "fadeUp 0.2s ease" }}>
          <span className="text-xs text-text-muted">
            Filtering: <span className="text-text-secondary font-medium">{activeFilterLabel}</span>
          </span>
          <button onClick={clearFilters} className="text-xs text-text-dim hover:text-text-muted transition-colors flex items-center gap-1" aria-label="Clear filters">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import URLInput from "./components/URLInput";
import FilterBar from "./components/FilterBar";
import LinkCard from "./components/LinkCard";
import LinkDetail from "./components/LinkDetail";

export default function LinksPage() {
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
      if (!res.ok) throw new Error("Failed to fetch items");
      const data = await res.json();
      setItems(data.items || []);
      setTotalItems(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch items:", err);
    }
  }, [activeDomain, activeCategory, activeType, activeTopic, activeGoal, searchQuery, filterMode]);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/links/tags");
      if (!res.ok) throw new Error("Failed to fetch tags");
      const data = await res.json();
      setDomains(data.domains || []);
      setAllTopics(data.topics || []);
      setAllGoals(data.goals || []);
    } catch (err) {
      console.error("Failed to fetch tags:", err);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchTags();
  }, [activeDomain, activeCategory, activeType, activeTopic, activeGoal, fetchItems]);

  useEffect(() => {
    const timer = setTimeout(() => fetchItems(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchItems]);

  const openDetail = async (item) => {
    setSelectedItem(item);
    setDetailData(null);
    setNotes(item.personal_notes || "");
    try {
      const res = await fetch(`/api/links/${item.id}`);
      if (!res.ok) throw new Error("Failed to fetch detail");
      const data = await res.json();
      setDetailData(data);
      setNotes(data.personal_notes || "");
    } catch (err) {
      console.error("Failed to fetch detail:", err);
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
      } catch (err) {
        console.error("Failed to save notes:", err);
      }
    }, 1000);
  };

  const handleProcessed = (savedItem) => {
    fetchItems();
    fetchTags();
    if (savedItem?.id) openDetail(savedItem);
  };

  // Detail view
  if (selectedItem) {
    return (
      <LinkDetail
        item={selectedItem}
        detail={detailData}
        notes={notes}
        onNotesChange={saveNotes}
        onBack={() => { setSelectedItem(null); setDetailData(null); }}
      />
    );
  }

  const hasActiveFilter = activeDomain || activeCategory || activeTopic || activeGoal;

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border-subtle" style={{ background: "rgba(12, 11, 10, 0.85)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-text-dim hover:text-text-muted transition-colors duration-300" aria-label="Home">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </a>
            <h1 className="text-base font-semibold tracking-tight">Knowledge Base</h1>
          </div>
          <span className="text-text-dim text-xs font-mono tabular-nums">{totalItems}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <URLInput onProcessed={handleProcessed} />

        <FilterBar
          domains={domains}
          allTopics={allTopics}
          allGoals={allGoals}
          activeDomain={activeDomain}
          setActiveDomain={setActiveDomain}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          activeType={activeType}
          setActiveType={setActiveType}
          activeTopic={activeTopic}
          setActiveTopic={setActiveTopic}
          activeGoal={activeGoal}
          setActiveGoal={setActiveGoal}
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Items List */}
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="text-center py-20 text-text-dim" style={{ animation: "fadeIn 0.5s ease" }}>
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center" style={{ animation: "breathe 3s ease infinite" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              {hasActiveFilter ? (
                <>
                  <div className="text-sm font-medium text-text-muted mb-1">No links match this filter</div>
                  <button onClick={() => { setActiveDomain(null); setActiveCategory(null); setActiveTopic(null); setActiveGoal(null); }} className="text-xs text-accent hover:text-accent-hover transition-colors mt-2">Clear filters</button>
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
            <LinkCard key={item.id} item={item} onClick={() => openDetail(item)} index={idx} isHero={idx === 0 && !hasActiveFilter && items.length > 1} />
          ))}
        </div>
      </main>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { colors, radius, spacing, fonts } from '../../lib/theme';
import KnowledgeCard from './KnowledgeCard';

const CATEGORIES = ['All', 'Health', 'Tech', 'Productivity', 'Business', 'Science', 'Finance', 'Learning', 'Lifestyle', 'Other'];

export default function KnowledgeFeed({ items, onRemove }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = items.filter((item) => {
    if (filter !== 'All' && item.summary?.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const title = (item.summary?.title || '').toLowerCase();
      const content = (item.content || '').toLowerCase();
      const tags = (item.summary?.tags || []).join(' ').toLowerCase();
      if (!title.includes(q) && !content.includes(q) && !tags.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={'\u{1F50D} Search knowledge...'}
        style={{
          width: '100%', padding: `${spacing.md}px ${spacing.lg}px`,
          borderRadius: radius.md,
          border: `1px solid ${colors.border}`,
          background: colors.bgCard,
          color: colors.text, fontSize: 15,
          fontFamily: fonts.body, outline: 'none',
          boxSizing: 'border-box', marginBottom: spacing.md,
        }}
      />

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: spacing.lg, paddingBottom: 4 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '6px 12px', borderRadius: radius.full,
              fontSize: 12, whiteSpace: 'nowrap', minHeight: 32,
              border: filter === cat ? `1px solid ${colors.primaryBorder}` : `1px solid ${colors.borderActive}`,
              background: filter === cat ? colors.primaryBg : 'transparent',
              color: filter === cat ? colors.primary : colors.textDim,
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items */}
      {filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {filtered.map((item) => (
            <KnowledgeCard key={item.id} item={item} onRemove={onRemove} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: `${spacing.xxxl}px 0`, color: colors.textFaint }}>
          {items.length === 0 ? (
            <>
              <div style={{ fontSize: 48, marginBottom: spacing.md }}>{'\u{1F9E0}'}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: spacing.sm }}>
                Your knowledge base is empty
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
                Use the + button to capture links, articles, and ideas with AI summaries.
              </div>
            </>
          ) : (
            <div style={{ fontSize: 14 }}>No matches found</div>
          )}
        </div>
      )}
    </div>
  );
}

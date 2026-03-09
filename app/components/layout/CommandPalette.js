'use client';
import { useState, useEffect, useRef } from 'react';
import { colors, radius, spacing, fonts } from '../../lib/theme';
import { NAV_ITEMS } from '../../lib/constants';

const QUICK_ACTIONS = [
  { id: 'capture', label: 'Quick capture', icon: '\u2795', description: 'Add a note, link, or idea' },
  { id: 'breath', label: 'Breathwork', icon: '\u{1F32C}\uFE0F', description: 'Start a breathing session' },
];

export default function CommandPalette({ open, onClose, onNavigate, onCapture }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  if (!open) return null;

  const q = query.toLowerCase().trim();

  const matchedTabs = q
    ? NAV_ITEMS.filter(
        (t) => t.label.toLowerCase().includes(q) || t.id.includes(q)
      )
    : NAV_ITEMS;

  const matchedActions = q
    ? QUICK_ACTIONS.filter(
        (a) => a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      )
    : QUICK_ACTIONS;

  // Build flat list of all items for keyboard nav
  const allItems = [
    ...matchedTabs.map((t) => ({ type: 'tab', item: t })),
    ...matchedActions.map((a) => ({ type: 'action', item: a })),
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allItems.length > 0) {
      e.preventDefault();
      const selected = allItems[selectedIndex];
      if (selected) handleSelect(selected.type, selected.item);
    }
  };

  const handleSelect = (type, item) => {
    if (type === 'tab') {
      onNavigate(item.id);
    } else if (item.id === 'capture') {
      onCapture();
    }
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 60,
        animation: 'fadeUp 0.2s ease',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: 440,
          background: colors.bgElevated,
          borderRadius: radius.md,
          border: `1px solid ${colors.borderActive}`,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Search input */}
        <div style={{ padding: `${spacing.lg}px`, borderBottom: `1px solid ${colors.border}` }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search or jump to..."
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            style={{
              width: '100%',
              padding: `${spacing.md}px ${spacing.lg}px`,
              borderRadius: radius.sm,
              border: `1px solid ${colors.borderActive}`,
              background: 'rgba(255,255,255,0.04)',
              color: colors.text,
              fontSize: 16,
              fontFamily: fonts.body,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Results */}
        <div id="palette-results" role="listbox" style={{ maxHeight: 320, overflowY: 'auto', padding: `${spacing.sm}px 0` }}>
          {/* Navigation */}
          {matchedTabs.length > 0 && (
            <div>
              <div style={{
                padding: `${spacing.sm}px ${spacing.lg}px`,
                fontSize: 11,
                fontWeight: 600,
                color: colors.textFaint,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}>
                Navigate
              </div>
              {matchedTabs.map((t, i) => (
                <button
                  key={t.id}
                  role="option"
                  aria-selected={selectedIndex === i}
                  onClick={() => handleSelect('tab', t)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: `${spacing.md}px ${spacing.lg}px`,
                    minHeight: 44,
                    border: 'none',
                    background: selectedIndex === i ? colors.bgCard : 'transparent',
                    cursor: 'pointer',
                    color: colors.text,
                    fontSize: 15,
                    fontFamily: fonts.body,
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          {matchedActions.length > 0 && (
            <div>
              <div style={{
                padding: `${spacing.sm}px ${spacing.lg}px`,
                fontSize: 11,
                fontWeight: 600,
                color: colors.textFaint,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginTop: spacing.sm,
              }}>
                Actions
              </div>
              {matchedActions.map((a, i) => {
                const flatIdx = matchedTabs.length + i;
                return (
                <button
                  key={a.id}
                  role="option"
                  aria-selected={selectedIndex === flatIdx}
                  onClick={() => handleSelect('action', a)}
                  onMouseEnter={() => setSelectedIndex(flatIdx)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: `${spacing.md}px ${spacing.lg}px`,
                    minHeight: 44,
                    border: 'none',
                    background: selectedIndex === flatIdx ? colors.bgCard : 'transparent',
                    cursor: 'pointer',
                    color: colors.text,
                    fontSize: 15,
                    fontFamily: fonts.body,
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{a.icon}</span>
                  <div>
                    <div>{a.label}</div>
                    <div style={{ fontSize: 12, color: colors.textDim }}>{a.description}</div>
                  </div>
                </button>
                );
              })}
            </div>
          )}

          {q && matchedTabs.length === 0 && matchedActions.length === 0 && (
            <div style={{ padding: `${spacing.xl}px`, textAlign: 'center', color: colors.textFaint, fontSize: 14 }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: `${spacing.sm}px ${spacing.lg}px`,
          borderTop: `1px solid ${colors.border}`,
          fontSize: 11,
          color: colors.textGhost,
          textAlign: 'center',
        }}>
          {'↑↓'} navigate {'·'} {'↵'} select {'·'} esc close
        </div>
      </div>
    </div>
  );
}

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
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or jump to..."
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
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: `${spacing.sm}px 0` }}>
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
              {matchedTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelect('tab', t)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: `${spacing.md}px ${spacing.lg}px`,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: colors.text,
                    fontSize: 15,
                    fontFamily: fonts.body,
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.bgCard)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
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
              {matchedActions.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleSelect('action', a)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: `${spacing.md}px ${spacing.lg}px`,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: colors.text,
                    fontSize: 15,
                    fontFamily: fonts.body,
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.bgCard)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{a.icon}</span>
                  <div>
                    <div>{a.label}</div>
                    <div style={{ fontSize: 12, color: colors.textDim }}>{a.description}</div>
                  </div>
                </button>
              ))}
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
          esc to close
        </div>
      </div>
    </div>
  );
}

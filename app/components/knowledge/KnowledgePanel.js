'use client';
import { useState } from 'react';
import { colors, radius, spacing, typography, fonts } from '../../lib/theme';
import { fmtTime } from '../../lib/utils';
import Card from '../common/Card';
import Badge from '../common/Badge';

const CONTENT_TYPES = [
  { id: 'all', label: 'All', icon: '\u{1F4CB}' },
  { id: 'link', label: 'Links', icon: '\u{1F517}' },
  { id: 'youtube', label: 'YouTube', icon: '\u{1F3AC}' },
  { id: 'article', label: 'Articles', icon: '\u{1F4F0}' },
  { id: 'voice', label: 'Voice', icon: '\u{1F399}\uFE0F' },
  { id: 'note', label: 'Notes', icon: '\u{1F4DD}' },
];

export default function KnowledgePanel({ captures = [] }) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCaptures = captures.filter((c) => {
    if (filter !== 'all' && c.type !== filter) return false;
    if (searchQuery && !c.text?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: `0 ${spacing.xl}px 100px` }}>
      <div style={{ marginBottom: spacing.xxl }}>
        <div style={typography.label}>KNOWLEDGE BASE</div>
        <div style={{ fontSize: 14, color: colors.textDim }}>
          {captures.length} items captured
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: spacing.lg }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="\u{1F50D} Search captures..."
          style={{
            width: '100%',
            padding: `${spacing.md}px ${spacing.lg}px`,
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
            background: colors.bgCard,
            color: colors.text,
            fontSize: 15,
            fontFamily: fonts.body,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Type filters */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: spacing.xl, paddingBottom: 4 }}>
        {CONTENT_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            style={{
              padding: '8px 14px',
              minHeight: 36,
              borderRadius: radius.full,
              fontSize: 12,
              whiteSpace: 'nowrap',
              border: filter === t.id ? `1px solid ${colors.primaryBorder}` : `1px solid ${colors.borderActive}`,
              background: filter === t.id ? colors.primaryBg : 'transparent',
              color: filter === t.id ? colors.primary : colors.textDim,
              cursor: 'pointer',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Captures List */}
      {filteredCaptures.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {filteredCaptures.map((capture, i) => (
            <Card key={i}>
              <div style={{ fontSize: 14, color: colors.text, marginBottom: spacing.xs }}>
                {capture.text}
              </div>
              <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
                <Badge>{capture.destination || 'inbox'}</Badge>
                <span style={{ fontSize: 11, color: colors.textFaint }}>
                  {fmtTime(capture.timestamp)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: `${spacing.xxxl}px 0` }}>
          <div style={{ fontSize: 48, marginBottom: spacing.md }}>{'\u{1F9E0}'}</div>
          <div style={{ ...typography.h3, color: colors.text, marginBottom: spacing.sm }}>
            {captures.length === 0 ? 'Your knowledge base is empty' : 'No matches found'}
          </div>
          <div style={{ fontSize: 14, color: colors.textDim, lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
            {captures.length === 0
              ? 'Use the + button to capture links, articles, YouTube videos, voice notes, and more.'
              : 'Try a different search or filter.'}
          </div>
          {captures.length === 0 && (
            <div style={{
              marginTop: spacing.xl,
              display: 'flex', flexDirection: 'column', gap: spacing.sm,
              alignItems: 'center',
            }}>
              <div style={{ fontSize: 12, color: colors.textFaint }}>Supported types:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {['\u{1F517} Links', '\u{1F3AC} YouTube', '\u{1F4F0} Articles', '\u{1F5FA}\uFE0F Maps', '\u{1F399}\uFE0F Voice', '\u{1F4C4} Files'].map((t) => (
                  <Badge key={t} color={colors.textDim} bg="rgba(255,255,255,0.04)">{t}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Searches Placeholder */}
      <Card
        title="Saved Searches"
        icon={'\u{1F50D}'}
        style={{ marginTop: spacing.xl }}
      >
        <div style={{ padding: spacing.lg, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: colors.textDim }}>
            Coming soon: create recurring searches that run on schedule
          </div>
        </div>
      </Card>
    </div>
  );
}

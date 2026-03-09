'use client';
import { useState } from 'react';
import { colors, radius, spacing } from '../../lib/theme';
import Badge from '../common/Badge';

const TYPE_ICONS = {
  article: '\u{1F4F0}',
  video: '\u{1F3AC}',
  place: '\u{1F5FA}\uFE0F',
  social: '\u{1F4F1}',
  note: '\u{1F4DD}',
  other: '\u{1F517}',
};

export default function KnowledgeCard({ item, onRemove }) {
  const [expanded, setExpanded] = useState(false);

  const icon = TYPE_ICONS[item.summary?.contentType] || TYPE_ICONS.other;
  const title = item.summary?.title || item.content?.slice(0, 60) || 'Untitled';
  const keyPoints = item.summary?.keyPoints || [];
  const tags = item.summary?.tags || [];
  const actionItems = item.summary?.actionItems || [];
  const category = item.summary?.category;

  const timeAgo = (() => {
    if (!item.createdAt) return '';
    const diff = Date.now() - new Date(item.createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  })();

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: colors.bgCard,
        borderRadius: radius.md,
        border: `1px solid ${colors.border}`,
        padding: `${spacing.lg}px`,
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 600, color: colors.text,
            overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: expanded ? 'normal' : 'nowrap',
          }}>
            {title}
          </div>
          <div style={{ display: 'flex', gap: spacing.sm, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            {category && <Badge color={colors.primary} bg={colors.primaryBg}>{category}</Badge>}
            <span style={{ fontSize: 11, color: colors.textFaint }}>{timeAgo}</span>
            {keyPoints.length > 0 && (
              <span style={{ fontSize: 11, color: colors.textFaint }}>
                {keyPoints.length} points
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: spacing.md }}>
          {/* Key points */}
          {keyPoints.length > 0 && (
            <div style={{ marginBottom: spacing.md }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs }}>
                Key Points
              </div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {keyPoints.map((p, i) => (
                  <li key={i} style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6, marginBottom: 2 }}>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action items */}
          {actionItems.length > 0 && (
            <div style={{ marginBottom: spacing.md }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs }}>
                Action Items
              </div>
              {actionItems.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: spacing.xs, fontSize: 13, color: colors.text, marginBottom: 2 }}>
                  <span>{'\u25CB'}</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: spacing.md }}>
              {tags.map((tag) => (
                <span key={tag} style={{
                  fontSize: 11, padding: '3px 8px',
                  borderRadius: radius.full,
                  background: 'rgba(255,255,255,0.04)',
                  color: colors.textDim,
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Original content */}
          {item.content && (
            <div style={{
              fontSize: 12, color: colors.textFaint, marginBottom: spacing.sm,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {item.content}
            </div>
          )}

          {onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
              style={{
                background: 'none', border: 'none',
                color: colors.textFaint, fontSize: 12,
                cursor: 'pointer', padding: '4px 0',
              }}
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { fmtTime, fmtDuration, getDateString } from '../../lib/utils';

export default function CalendarPanel() {
  const [events, setEvents] = useState([]);
  const [configured, setConfigured] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calendar')
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events || []);
        setConfigured(d.configured);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: `0 ${spacing.xl}px 100px` }}>
      <div style={{ marginBottom: spacing.xxl }}>
        <div style={typography.label}>TODAY</div>
        <div style={{ ...typography.h1, color: colors.text }}>{getDateString()}</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: colors.textFaint }}>
          Loading events...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.map((ev, i) => (
            <div
              key={ev.id}
              style={{
                display: 'flex',
                alignItems: 'stretch',
                gap: 12,
                background: colors.bgCard,
                borderRadius: radius.md,
                padding: `${spacing.md}px ${spacing.lg}px`,
                borderLeft: `3px solid ${ev.color || colors.events[i % colors.events.length]}`,
              }}
            >
              <div style={{ minWidth: 70 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>
                  {fmtTime(ev.start)}
                </div>
                <div style={{ fontSize: 12, color: colors.textDim, marginTop: 2 }}>
                  {fmtDuration(ev.start, ev.end)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 15, color: 'rgba(240,237,230,0.85)', lineHeight: 1.4 }}>
                  {ev.summary}
                </div>
                {ev.location && (
                  <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 3 }}>
                    {'\u{1F4CD}'} {ev.location}
                  </div>
                )}
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: colors.textFaint }}>
              No events today
            </div>
          )}
        </div>
      )}

      {configured === false && (
        <div
          style={{
            marginTop: spacing.xxl,
            padding: `${spacing.lg}px 18px`,
            background: colors.primaryBg,
            borderRadius: radius.md,
            border: `1px dashed ${colors.primaryBorder}`,
          }}
        >
          <div style={{ fontSize: 13, color: colors.primary, fontWeight: 500 }}>
            {'\u{1F517}'} Connect Google Calendar
          </div>
          <div style={{ fontSize: 12, color: colors.textDim, marginTop: 4 }}>
            Set GOOGLE_CALENDAR_CREDENTIALS env var in Vercel
          </div>
        </div>
      )}
    </div>
  );
}

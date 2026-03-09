'use client';
import { useState, useRef, useEffect } from 'react';
import { colors, radius, fonts, spacing } from '../../lib/theme';
import { API } from '../../lib/constants';

const DESTINATIONS = [
  { id: 'inbox', label: '\u{1F4E5} inbox' },
  { id: 'note', label: '\u{1F4DD} note' },
  { id: 'task', label: '\u{1F4CC} task' },
  { id: 'knowledge', label: '\u{1F9E0} knowledge' },
];

export default function CaptureModal({ open, onClose, onCapture, onKnowledgeCapture }) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [dest, setDest] = useState('inbox');
  const [submitError, setSubmitError] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);
  const recRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setText('');
      setDest('inbox');
      setSubmitError(null);
      setSummary(null);
      setSummarizing(false);
    }
  }, [open]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recRef.current) recRef.current.stop();
    };
  }, []);

  const stopVoice = () => {
    if (recRef.current) {
      recRef.current.stop();
      recRef.current = null;
    }
    setListening(false);
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSubmitError('Voice input not supported in this browser. Try Chrome on Android.');
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setText((prev) => prev ? prev + ' ' + transcript : transcript);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start();
    recRef.current = r;
    setListening(true);
  };

  const handleClose = () => {
    stopVoice();
    onClose();
  };

  const handleSummarize = async () => {
    if (!text.trim()) return;
    stopVoice();
    setSummarizing(true);
    setSubmitError(null);
    try {
      const isUrl = /^https?:\/\//.test(text.trim());
      const res = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim(), type: isUrl ? 'url' : 'note' }),
      });
      if (!res.ok) throw new Error('AI summary failed');
      const data = await res.json();
      setSummary(data);
    } catch {
      setSubmitError('Could not generate summary. You can still save without it.');
    } finally {
      setSummarizing(false);
    }
  };

  const submit = async () => {
    if (!text.trim()) return;
    stopVoice();
    setSubmitError(null);

    if (dest === 'knowledge') {
      const item = {
        content: text.trim(),
        summary: summary || null,
        type: summary?.contentType || 'note',
      };
      onKnowledgeCapture?.(item);
      setText('');
      setSummary(null);
      onClose();
      return;
    }

    const capture = { text: text.trim(), destination: dest, timestamp: new Date().toISOString() };

    if (dest === 'task') {
      try {
        const res = await fetch(API.todoist, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add', content: text.trim() }),
        });
        if (!res.ok) throw new Error('Failed to create task');
      } catch {
        setSubmitError('Could not create task in Todoist. Saved locally.');
      }
    }

    onCapture(capture);
    setText('');
    if (!submitError) onClose();
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={handleClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: colors.bgElevated, borderRadius: `${radius.lg}px ${radius.lg}px 0 0`, padding: '24px 20px 32px', animation: 'slideUp 0.3s ease' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: colors.textGhost, margin: '0 auto 20px' }} />
        <div style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 16 }}>Quick Capture</div>

        {submitError && (
          <div style={{ padding: '10px 14px', background: colors.dangerBg, borderRadius: radius.md, marginBottom: 12, fontSize: 13, color: colors.danger }}>
            {submitError}
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setSummary(null); }}
          placeholder={dest === 'knowledge' ? 'Paste a URL or type content...' : "What's on your mind?"}
          autoFocus
          style={{
            width: '100%', minHeight: 100, padding: 16, borderRadius: radius.md,
            border: `1px solid ${colors.border}`, background: colors.bgCard,
            color: colors.text, fontSize: 16, lineHeight: 1.5, resize: 'none',
            fontFamily: fonts.body, outline: 'none', boxSizing: 'border-box',
          }}
        />

        {/* Destination chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          {DESTINATIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => { setDest(d.id); setSummary(null); }}
              style={{
                padding: '8px 14px', borderRadius: radius.full, cursor: 'pointer', fontSize: 13, minHeight: 36,
                border: dest === d.id ? `1px solid ${colors.primaryBorder}` : `1px solid ${colors.borderActive}`,
                background: dest === d.id ? colors.primaryBg : 'transparent',
                color: dest === d.id ? colors.primary : colors.textDim,
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* AI Summary preview for knowledge */}
        {dest === 'knowledge' && text.trim() && !summary && (
          <button
            onClick={handleSummarize}
            disabled={summarizing}
            style={{
              width: '100%', padding: '10px', borderRadius: radius.sm,
              border: `1px solid ${colors.secondaryBorder}`,
              background: colors.secondaryBg,
              color: colors.secondary, fontSize: 13, fontWeight: 500,
              cursor: summarizing ? 'wait' : 'pointer', marginBottom: 12,
              minHeight: 44,
            }}
          >
            {summarizing ? '\u{1F504} Generating AI summary...' : '\u{2728} Generate AI Summary'}
          </button>
        )}

        {/* Summary preview */}
        {summary && (
          <div style={{
            padding: `${spacing.md}px`, borderRadius: radius.md,
            border: `1px solid ${colors.successBorder}`,
            background: colors.successBg, marginBottom: 12,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
              {summary.title}
            </div>
            {summary.keyPoints?.slice(0, 3).map((p, i) => (
              <div key={i} style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.5 }}>
                {'\u2022'} {p}
              </div>
            ))}
            {summary.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {summary.tags.map((t) => (
                  <span key={t} style={{ fontSize: 10, padding: '2px 6px', borderRadius: radius.full, background: 'rgba(108,255,184,0.15)', color: colors.success }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={listening ? stopVoice : startVoice}
            aria-label={listening ? 'Stop voice input' : 'Start voice input'}
            style={{
              width: 52, height: 52, borderRadius: '50%', cursor: 'pointer', fontSize: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: listening ? `2px solid ${colors.danger}` : `2px solid ${colors.textGhost}`,
              background: listening ? colors.dangerBg : colors.bgCard,
              color: listening ? colors.danger : colors.textMuted,
              animation: listening ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}
          >
            {'\u{1F399}\uFE0F'}
          </button>
          <button
            onClick={submit}
            style={{
              flex: 1, height: 52, borderRadius: radius.md, border: 'none', fontSize: 16, fontWeight: 600,
              cursor: text.trim() ? 'pointer' : 'default',
              background: text.trim() ? colors.gradient : colors.bgCardHover,
              color: text.trim() ? '#fff' : colors.textFaint,
            }}
          >
            {dest === 'knowledge' ? 'Save to Knowledge' : 'Capture'}
          </button>
        </div>
      </div>
    </div>
  );
}

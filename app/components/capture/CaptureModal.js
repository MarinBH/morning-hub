'use client';
import { useState, useRef, useEffect } from 'react';
import { colors, radius, fonts } from '../../lib/theme';
import { API } from '../../lib/constants';

const DESTINATIONS = [
  { id: 'inbox', label: '\u{1F4E5} inbox' },
  { id: 'note', label: '\u{1F4DD} note' },
  { id: 'task', label: '\u{1F4CC} task' },
];

export default function CaptureModal({ open, onClose, onCapture }) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [dest, setDest] = useState('inbox');
  const [submitError, setSubmitError] = useState(null);
  const recRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setText('');
      setDest('inbox');
      setSubmitError(null);
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

  const submit = async () => {
    if (!text.trim()) return;
    stopVoice();
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
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          autoFocus
          style={{
            width: '100%', minHeight: 100, padding: 16, borderRadius: radius.md,
            border: `1px solid ${colors.border}`, background: colors.bgCard,
            color: colors.text, fontSize: 16, lineHeight: 1.5, resize: 'none',
            fontFamily: fonts.body, outline: 'none', boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 16 }}>
          {DESTINATIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDest(d.id)}
              style={{
                padding: '8px 16px', borderRadius: radius.full, cursor: 'pointer', fontSize: 13,
                border: dest === d.id ? `1px solid ${colors.primaryBorder}` : `1px solid ${colors.borderActive}`,
                background: dest === d.id ? colors.primaryBg : 'transparent',
                color: dest === d.id ? colors.primary : colors.textDim,
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={listening ? stopVoice : startVoice}
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
            Capture
          </button>
        </div>
      </div>
    </div>
  );
}

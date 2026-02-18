"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────
const HABITS = [
  { id: "h1", label: "Drink water", icon: "💧" },
  { id: "h2", label: "Stretch / move", icon: "🧘" },
  { id: "h3", label: "No phone first 30m", icon: "📵" },
  { id: "h4", label: "Review today's plan", icon: "📋" },
  { id: "h5", label: "Gratitude moment", icon: "✨" },
];

const PROMPTS = [
  "What's the one thing that would make today a win?",
  "What am I grateful for right now?",
  "What's weighing on me that I can release?",
  "What would my best self do today?",
  "What did I learn yesterday that I want to carry forward?",
  "Where am I holding back, and what would happen if I didn't?",
  "What's one thing I've been avoiding that deserves 10 minutes today?",
];

const todayKey = () => new Date().toISOString().split("T")[0];
const getPrompt = () => {
  const d = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return PROMPTS[d % PROMPTS.length];
};

// ─── Local Storage helpers ────────────────────────────────────
function loadLocal(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveLocal(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── Time formatting ──────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
function fmtDuration(start, end) {
  if (!start || !end) return "";
  const ms = new Date(end) - new Date(start);
  const m = Math.round(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}m` : ""}` : `${m}m`;
}

const EVENT_COLORS = ["#6C9BFF", "#FF8F6C", "#8B6CFF", "#6CFFB8", "#FFD76C", "#FF6B9D", "#6CFFF0"];

// ─── Calendar Panel ───────────────────────────────────────────
function CalendarPanel() {
  const [events, setEvents] = useState([]);
  const [configured, setConfigured] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/calendar")
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setConfigured(d.configured); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={S.label}>TODAY</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#F0EDE6", letterSpacing: -0.5 }}>{dateStr}</div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(240,237,230,0.3)" }}>Loading events...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {events.map((ev, i) => (
            <div key={ev.id} style={{ display: "flex", alignItems: "stretch", gap: 12, background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "14px 16px", borderLeft: `3px solid ${ev.color || EVENT_COLORS[i % EVENT_COLORS.length]}` }}>
              <div style={{ minWidth: 70 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#F0EDE6" }}>{fmtTime(ev.start)}</div>
                <div style={{ fontSize: 12, color: "rgba(240,237,230,0.4)", marginTop: 2 }}>{fmtDuration(ev.start, ev.end)}</div>
              </div>
              <div>
                <div style={{ fontSize: 15, color: "rgba(240,237,230,0.85)", lineHeight: 1.4 }}>{ev.summary}</div>
                {ev.location && <div style={{ fontSize: 12, color: "rgba(240,237,230,0.3)", marginTop: 3 }}>📍 {ev.location}</div>}
              </div>
            </div>
          ))}
          {events.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "rgba(240,237,230,0.3)" }}>No events today</div>}
        </div>
      )}

      {configured === false && (
        <div style={{ marginTop: 24, padding: "16px 18px", background: "rgba(108,155,255,0.08)", borderRadius: 14, border: "1px dashed rgba(108,155,255,0.2)" }}>
          <div style={{ fontSize: 13, color: "rgba(108,155,255,0.7)", fontWeight: 500 }}>🔗 Connect Google Calendar</div>
          <div style={{ fontSize: 12, color: "rgba(240,237,230,0.35)", marginTop: 4 }}>Set GOOGLE_CALENDAR_CREDENTIALS env var in Vercel</div>
        </div>
      )}
    </div>
  );
}

// ─── Tasks Panel (Live Todoist) ───────────────────────────────
function TasksPanel() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState({});
  const [completing, setCompleting] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTasks = useCallback(async () => {
    try {
      const [taskRes, projRes] = await Promise.all([
        fetch("/api/todoist?endpoint=tasks&filter=today%7Coverdue"),
        fetch("/api/todoist?endpoint=projects"),
      ]);
      const taskData = await taskRes.json();
      const projData = await projRes.json();

      if (taskData.error) { setError(taskData.error); setLoading(false); return; }

      const projMap = {};
      (projData.results || []).forEach(p => { projMap[p.id] = p.name; });
      setProjects(projMap);

      // Sort: higher priority first, then by due date
      const sorted = (taskData.results || []).sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        const aDate = a.due?.date || "9999";
        const bDate = b.due?.date || "9999";
        return aDate.localeCompare(bDate);
      });

      // Filter out Todoist template/onboarding tasks
      const filtered = sorted.filter(t =>
        !t.content.startsWith("💬 ") &&
        !t.content.startsWith("📅 ") &&
        !t.content.startsWith("🚩 ") &&
        !t.content.startsWith("💭 ") &&
        !t.content.startsWith("Helpful hint:")
      );

      setTasks(filtered);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const completeTask = async (taskId) => {
    setCompleting(prev => new Set(prev).add(taskId));
    try {
      await fetch("/api/todoist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action: "complete" }),
      });
      // Animate out then remove
      setTimeout(() => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setCompleting(prev => { const n = new Set(prev); n.delete(taskId); return n; });
      }, 600);
    } catch {
      setCompleting(prev => { const n = new Set(prev); n.delete(taskId); return n; });
    }
  };

  const priorityColors = { 4: "#FF6B6B", 3: "#FFB86C", 2: "#6C9BFF", 1: "rgba(240,237,230,0.3)" };
  const completedCount = completing.size;

  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={S.label}>TODAY&apos;S TASKS</div>
        <div style={{ fontSize: 14, color: "rgba(240,237,230,0.4)" }}>
          {loading ? "Loading..." : `${tasks.length} tasks · tap to complete`}
        </div>
      </div>

      {error && (
        <div style={{ padding: "16px 18px", background: "rgba(255,107,107,0.08)", borderRadius: 14, border: "1px solid rgba(255,107,107,0.2)", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#FF6B6B" }}>⚠️ {error}</div>
          <div style={{ fontSize: 12, color: "rgba(240,237,230,0.35)", marginTop: 4 }}>Check TODOIST_API_TOKEN in Vercel env vars</div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(240,237,230,0.3)" }}>Loading tasks...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tasks.map((task) => {
            const done = completing.has(task.id);
            const isOverdue = task.due?.date && task.due.date < todayKey();
            return (
              <div key={task.id} onClick={() => !done && completeTask(task.id)} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: done ? "rgba(108,255,184,0.04)" : "rgba(255,255,255,0.04)",
                borderRadius: 14, padding: "14px 16px", cursor: "pointer",
                transition: "all 0.5s", opacity: done ? 0.3 : 1,
                transform: done ? "translateX(20px)" : "none",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                  border: done ? "2px solid #6CFFB8" : `2px solid ${priorityColors[task.priority] || priorityColors[1]}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? "rgba(108,255,184,0.15)" : "transparent",
                  transition: "all 0.3s",
                }}>
                  {done && <span style={{ fontSize: 13, color: "#6CFFB8" }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 15, lineHeight: 1.4,
                    color: done ? "rgba(240,237,230,0.4)" : "#F0EDE6",
                    textDecoration: done ? "line-through" : "none",
                  }}>
                    {task.content}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "rgba(240,237,230,0.25)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {projects[task.project_id] || "Inbox"}
                    </span>
                    {isOverdue && <span style={{ fontSize: 10, color: "#FF6B6B", background: "rgba(255,107,107,0.1)", padding: "1px 6px", borderRadius: 4 }}>overdue</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {tasks.length === 0 && !error && (
            <div style={{ textAlign: "center", padding: 40, color: "rgba(240,237,230,0.3)" }}>All clear for today! 🎉</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Breath Timer ─────────────────────────────────────────────
function BreathTimer() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [count, setCount] = useState(0);
  const [cycle, setCycle] = useState(0);
  const totalCycles = 4;
  const intervalRef = useRef(null);
  const refs = useRef({ phase: "idle", count: 0, cycle: 0 });
  const PHASES = { inhale: 4, hold: 4, exhale: 6 };

  const labels = { inhale: "Breathe in", hold: "Hold", exhale: "Breathe out", idle: "Ready", done: "Complete" };
  const colors = { inhale: "#6C9BFF", hold: "#8B6CFF", exhale: "#6CFFB8", idle: "rgba(240,237,230,0.3)", done: "#FFD76C" };

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActive(false); setPhase("idle"); setCount(0); setCycle(0);
    refs.current = { phase: "idle", count: 0, cycle: 0 };
  }, []);

  const start = useCallback(() => {
    setActive(true);
    refs.current = { phase: "inhale", count: PHASES.inhale, cycle: 0 };
    setPhase("inhale"); setCount(PHASES.inhale); setCycle(0);

    intervalRef.current = setInterval(() => {
      const r = refs.current;
      r.count -= 1;
      if (r.count <= 0) {
        if (r.phase === "inhale") { r.phase = "hold"; r.count = PHASES.hold; }
        else if (r.phase === "hold") { r.phase = "exhale"; r.count = PHASES.exhale; }
        else if (r.phase === "exhale") {
          r.cycle += 1;
          if (r.cycle >= totalCycles) {
            clearInterval(intervalRef.current);
            r.phase = "done"; setPhase("done"); setActive(false); return;
          }
          r.phase = "inhale"; r.count = PHASES.inhale;
        }
        setCycle(r.cycle);
      }
      setPhase(r.phase); setCount(r.count);
    }, 1000);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const maxT = PHASES[phase] || 1;
  const progress = phase === "done" ? 1 : phase === "idle" ? 0 : count / maxT;
  const scale = phase === "inhale" ? 1 + (1 - progress) * 0.15 : phase === "exhale" ? 1 + progress * 0.15 : phase === "hold" ? 1.15 : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0" }}>
      <div style={{ position: "relative", width: 140, height: 140, marginBottom: 20 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle, ${colors[phase]}15, transparent)`, transform: `scale(${scale})`, transition: "transform 1s ease-in-out, background 0.5s" }} />
        <div style={{ position: "absolute", inset: 8, borderRadius: "50%", border: `2px solid ${colors[phase]}40`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: phase === "idle" || phase === "done" ? 16 : 36, fontWeight: 300, color: colors[phase], fontVariantNumeric: "tabular-nums" }}>
            {phase === "idle" ? "4-4-6" : phase === "done" ? "🙏" : count}
          </div>
          <div style={{ fontSize: 11, color: colors[phase], opacity: 0.7, marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{labels[phase]}</div>
        </div>
      </div>
      {active && <div style={{ fontSize: 12, color: "rgba(240,237,230,0.3)", marginBottom: 12 }}>Cycle {cycle + 1} of {totalCycles}</div>}
      <button onClick={active ? stop : start} style={{ padding: "10px 32px", borderRadius: 100, border: `1px solid ${active ? "rgba(255,107,107,0.3)" : "rgba(108,155,255,0.3)"}`, background: active ? "rgba(255,107,107,0.1)" : "rgba(108,155,255,0.1)", color: active ? "#FF6B6B" : "#6C9BFF", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
        {phase === "done" ? "Again" : active ? "Stop" : "Begin"}
      </button>
    </div>
  );
}

// ─── Practice Panel ───────────────────────────────────────────
function PracticePanel({ habits, journalEntry, onHabitToggle, onJournalChange }) {
  const [showBreath, setShowBreath] = useState(false);
  const prompt = getPrompt();

  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={S.label}>MORNING PRACTICE</div>
        <div style={{ fontSize: 14, color: "rgba(240,237,230,0.4)" }}>
          {habits.length}/{HABITS.length} habits · {journalEntry ? "✍️ written" : "📝 journal"}
        </div>
      </div>

      {/* Habits */}
      <div style={{ marginBottom: 28 }}>
        <div style={S.sub}>Habits</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {HABITS.map(h => {
            const done = habits.includes(h.id);
            return (
              <button key={h.id} onClick={() => onHabitToggle(h.id)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 100,
                border: done ? "1px solid rgba(108,255,184,0.3)" : "1px solid rgba(240,237,230,0.1)",
                background: done ? "rgba(108,255,184,0.08)" : "rgba(255,255,255,0.03)",
                cursor: "pointer", transition: "all 0.2s", fontSize: 14,
                color: done ? "#6CFFB8" : "rgba(240,237,230,0.6)",
              }}>
                <span>{h.icon}</span><span>{h.label}</span>{done && <span style={{ fontSize: 12 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Breathwork */}
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => setShowBreath(!showBreath)} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px", borderRadius: 14, border: "1px solid rgba(139,108,255,0.15)",
          background: "rgba(139,108,255,0.06)", cursor: "pointer", fontSize: 14, color: "#8B6CFF", fontWeight: 500,
        }}>
          <span>🌬️ Breathwork — Box Breathing</span>
          <span style={{ fontSize: 18, transition: "transform 0.2s", transform: showBreath ? "rotate(180deg)" : "none" }}>⌄</span>
        </button>
        {showBreath && <BreathTimer />}
      </div>

      {/* Journal */}
      <div>
        <div style={S.sub}>Journal</div>
        <div style={{ fontSize: 15, color: "rgba(240,237,230,0.6)", fontStyle: "italic", marginBottom: 12, lineHeight: 1.5, fontFamily: "'Playfair Display', Georgia, serif" }}>
          &ldquo;{prompt}&rdquo;
        </div>
        <textarea
          value={journalEntry}
          onChange={e => onJournalChange(e.target.value)}
          placeholder="Write freely..."
          style={{
            width: "100%", minHeight: 120, padding: 16, borderRadius: 14,
            border: "1px solid rgba(240,237,230,0.08)", background: "rgba(255,255,255,0.03)",
            color: "#F0EDE6", fontSize: 15, lineHeight: 1.6, resize: "vertical",
            fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}

// ─── Capture Modal ────────────────────────────────────────────
function CaptureModal({ open, onClose, onCapture }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [dest, setDest] = useState("inbox");
  const recRef = useRef(null);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice not supported. Use Chrome on Android."); return; }
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = "en-US";
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setText(t);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start(); recRef.current = r; setListening(true);
  };

  const stopVoice = () => { if (recRef.current) recRef.current.stop(); setListening(false); };

  const submit = async () => {
    if (!text.trim()) return;
    const capture = { text: text.trim(), destination: dest, timestamp: new Date().toISOString() };

    // If destination is "task", also add to Todoist
    if (dest === "task") {
      try {
        await fetch("/api/todoist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add", content: text.trim() }),
        });
      } catch {}
    }

    onCapture(capture);
    setText(""); onClose();
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 480, background: "#1A1917", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px", animation: "slideUp 0.3s ease" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(240,237,230,0.15)", margin: "0 auto 20px" }} />
        <div style={{ fontSize: 18, fontWeight: 600, color: "#F0EDE6", marginBottom: 16 }}>Quick Capture</div>

        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What's on your mind?" autoFocus
          style={{ width: "100%", minHeight: 100, padding: 16, borderRadius: 14, border: "1px solid rgba(240,237,230,0.08)", background: "rgba(255,255,255,0.04)", color: "#F0EDE6", fontSize: 16, lineHeight: 1.5, resize: "none", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 16 }}>
          {["inbox", "note", "task"].map(d => (
            <button key={d} onClick={() => setDest(d)} style={{
              padding: "8px 16px", borderRadius: 100, cursor: "pointer", textTransform: "capitalize", fontSize: 13,
              border: dest === d ? "1px solid rgba(108,155,255,0.4)" : "1px solid rgba(240,237,230,0.1)",
              background: dest === d ? "rgba(108,155,255,0.12)" : "transparent",
              color: dest === d ? "#6C9BFF" : "rgba(240,237,230,0.4)",
            }}>{d === "task" ? "📌 task" : d === "note" ? "📝 note" : "📥 inbox"}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={listening ? stopVoice : startVoice} style={{
            width: 52, height: 52, borderRadius: "50%", cursor: "pointer", fontSize: 22,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: listening ? "2px solid #FF6B6B" : "2px solid rgba(240,237,230,0.15)",
            background: listening ? "rgba(255,107,107,0.15)" : "rgba(255,255,255,0.04)",
            color: listening ? "#FF6B6B" : "rgba(240,237,230,0.6)",
            animation: listening ? "pulse 1.5s ease-in-out infinite" : "none",
          }}>🎙️</button>
          <button onClick={submit} style={{
            flex: 1, height: 52, borderRadius: 14, border: "none", fontSize: 16, fontWeight: 600, cursor: text.trim() ? "pointer" : "default",
            background: text.trim() ? "linear-gradient(135deg, #6C9BFF, #8B6CFF)" : "rgba(255,255,255,0.06)",
            color: text.trim() ? "#fff" : "rgba(240,237,230,0.3)",
          }}>Capture</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function MorningHub() {
  const [tab, setTab] = useState("practice");
  const [habits, setHabits] = useState([]);
  const [journal, setJournal] = useState("");
  const [captures, setCaptures] = useState([]);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load today's state
  useEffect(() => {
    const key = `hub-${todayKey()}`;
    const saved = loadLocal(key, null);
    if (saved) {
      setHabits(saved.habits || []);
      setJournal(saved.journal || "");
      setCaptures(saved.captures || []);
    }
    setLoaded(true);
  }, []);

  // Save on change
  useEffect(() => {
    if (!loaded) return;
    saveLocal(`hub-${todayKey()}`, { habits, journal, captures });
  }, [habits, journal, captures, loaded]);

  const toggleHabit = (id) => setHabits(p => p.includes(id) ? p.filter(h => h !== id) : [...p, id]);

  const tabs = [
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "tasks", label: "Tasks", icon: "✅" },
    { id: "practice", label: "Practice", icon: "🌅" },
  ];

  if (!loaded) return (
    <div style={{ ...S.container, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 32, animation: "pulse 1.5s ease-in-out infinite" }}>🌅</div>
    </div>
  );

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(240,237,230,0.06)" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#F0EDE6", fontFamily: "'Playfair Display', Georgia, serif" }}>Morning Hub</div>
          <div style={{ fontSize: 12, color: "rgba(240,237,230,0.3)", marginTop: 2 }}>
            {habits.length}/{HABITS.length} habits · {tab === "tasks" ? "live from Todoist" : journal ? "journal ✍️" : "start your practice"}
          </div>
        </div>
        {captures.length > 0 && (
          <div style={{ padding: "4px 12px", borderRadius: 100, background: "rgba(108,155,255,0.1)", fontSize: 12, color: "#6C9BFF" }}>
            {captures.length} captured
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", paddingTop: 20, animation: "fadeUp 0.3s ease" }}>
        {tab === "calendar" && <CalendarPanel />}
        {tab === "tasks" && <TasksPanel />}
        {tab === "practice" && <PracticePanel habits={habits} journalEntry={journal} onHabitToggle={toggleHabit} onJournalChange={setJournal} />}
      </div>

      {/* Floating Capture */}
      <button onClick={() => setCaptureOpen(true)} style={{
        position: "fixed", bottom: 80, right: 20, width: 56, height: 56, borderRadius: "50%",
        border: "none", background: "linear-gradient(135deg, #6C9BFF, #8B6CFF)", color: "#fff",
        fontSize: 24, cursor: "pointer", boxShadow: "0 4px 20px rgba(108,155,255,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
      }}>+</button>

      {/* Bottom Tabs */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center",
        background: "rgba(18,17,16,0.95)", backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(240,237,230,0.06)", padding: "8px 0", paddingBottom: "max(8px, env(safe-area-inset-bottom))", zIndex: 99,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, maxWidth: 120, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "8px 0", border: "none", background: "transparent", cursor: "pointer",
            color: tab === t.id ? "#F0EDE6" : "rgba(240,237,230,0.3)", transition: "color 0.2s",
          }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 11, fontWeight: tab === t.id ? 600 : 400, letterSpacing: 0.3 }}>{t.label}</span>
            {tab === t.id && <div style={{ width: 4, height: 4, borderRadius: 2, background: "#6C9BFF", marginTop: -2 }} />}
          </button>
        ))}
      </div>

      <CaptureModal open={captureOpen} onClose={() => setCaptureOpen(false)} onCapture={(c) => setCaptures(p => [...p, c])} />
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────
const S = {
  container: {
    background: "#121110", color: "#F0EDE6", minHeight: "100vh",
    maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", position: "relative",
  },
  label: { fontSize: 11, fontWeight: 600, color: "rgba(240,237,230,0.3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 },
  sub: { fontSize: 13, fontWeight: 600, color: "rgba(240,237,230,0.5)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
};

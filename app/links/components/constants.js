export const STEPS = [
  { key: "detecting", label: "Detecting content type", detail: "Identifying URL type..." },
  { key: "extracting", label: "Extracting content", detail: "Pulling content from source..." },
  { key: "summarizing", label: "AI analysis", detail: "Analyzing with Claude..." },
  { key: "saving", label: "Saving & organizing", detail: "Filing into your knowledge base..." },
];

export const CONTENT_FORMAT_LABELS = {
  tutorial: "Tutorial", opinion: "Opinion", research: "Research",
  interview: "Interview", review: "Review", explainer: "Explainer",
  motivational: "Motivational", news: "News", "case-study": "Case Study", other: "Other",
};

export const DIFFICULTY_STYLES = {
  beginner: { bg: "rgba(108, 255, 184, 0.1)", text: "#6CFFB8", border: "rgba(108, 255, 184, 0.2)" },
  intermediate: { bg: "rgba(108, 155, 255, 0.1)", text: "#6C9BFF", border: "rgba(108, 155, 255, 0.2)" },
  advanced: { bg: "rgba(255, 214, 102, 0.1)", text: "#FFD666", border: "rgba(255, 214, 102, 0.2)" },
};

export const SOURCE_TYPE_STYLES = {
  quote: { bg: "rgba(108, 155, 255, 0.1)", text: "#6C9BFF" },
  anecdote: { bg: "rgba(108, 255, 184, 0.1)", text: "#6CFFB8" },
  analogy: { bg: "rgba(255, 214, 102, 0.1)", text: "#FFD666" },
  "data-point": { bg: "rgba(255, 107, 107, 0.1)", text: "#FF6B6B" },
  example: { bg: "rgba(180, 160, 255, 0.1)", text: "#B4A0FF" },
};

export function extractDomain(urlStr) {
  try { return new URL(urlStr).hostname.replace("www.", ""); } catch { return null; }
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

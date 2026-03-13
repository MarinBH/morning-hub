"use client";

function formatInline(text) {
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-text">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="text-[11px] bg-bg-elevated px-1.5 py-0.5 rounded text-accent/80 font-mono border border-border-subtle">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function MarkdownRenderer({ content }) {
  const stripped = content.replace(/^---[\s\S]*?---\n*/, "");
  const lines = stripped.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("# ")) { i++; continue; }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-sm font-semibold text-text uppercase tracking-wider mt-8 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-accent rounded-full" />{line.slice(3)}
        </h2>
      );
      i++; continue;
    }
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-accent/30 pl-4 my-3 py-1">
          <p className="text-sm text-text-muted italic leading-relaxed">{line.slice(2)}</p>
        </blockquote>
      );
      i++; continue;
    }
    if (line.startsWith("- ")) {
      elements.push(
        <div key={i} className="flex gap-2.5 text-sm text-text/85 my-1.5 leading-relaxed">
          <span className="text-accent/60 mt-1 flex-shrink-0 text-[8px]">&#9679;</span>
          <span>{formatInline(line.slice(2))}</span>
        </div>
      );
      i++; continue;
    }
    if (line.trim() === "---") { elements.push(<hr key={i} className="border-border my-6" />); i++; continue; }
    if (line.trim() === "") { i++; continue; }
    elements.push(<p key={i} className="text-sm text-text/75 my-2 leading-relaxed">{formatInline(line)}</p>);
    i++;
  }
  return <div>{elements}</div>;
}

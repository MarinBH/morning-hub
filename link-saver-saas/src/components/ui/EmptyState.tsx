import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
}

export function EmptyState({ icon: Icon, title, description, ctaLabel, ctaHref, onCtaClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-accent/8 flex items-center justify-center mb-4">
        <Icon size={24} className="text-accent/60" />
      </div>
      <h3 className="font-heading text-base font-semibold text-text-primary mb-1.5">{title}</h3>
      <p className="text-sm text-muted max-w-xs mb-5 leading-relaxed">{description}</p>
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className="btn btn-primary btn-sm">
          {ctaLabel}
        </Link>
      )}
      {ctaLabel && onCtaClick && !ctaHref && (
        <button onClick={onCtaClick} className="btn btn-primary btn-sm">
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

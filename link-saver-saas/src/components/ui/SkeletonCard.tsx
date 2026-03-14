export function KnowledgeSkeleton() {
  return (
    <div className="bg-surface rounded-[--radius-lg] border border-border overflow-hidden animate-pulse">
      {/* Thumbnail placeholder */}
      <div className="w-full h-40 bg-surface-hover" />
      <div className="p-3.5 space-y-2.5">
        {/* Label */}
        <div className="h-3 w-24 rounded bg-surface-hover" />
        {/* Title */}
        <div className="h-4 w-full rounded bg-surface-hover" />
        <div className="h-4 w-3/4 rounded bg-surface-hover" />
        {/* Summary */}
        <div className="h-3 w-full rounded bg-surface-hover" />
        <div className="h-3 w-5/6 rounded bg-surface-hover" />
        {/* Tags */}
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 w-14 rounded-full bg-surface-hover" />
          <div className="h-5 w-16 rounded-full bg-surface-hover" />
          <div className="h-5 w-12 rounded-full bg-surface-hover" />
        </div>
        {/* Meta */}
        <div className="h-3 w-32 rounded bg-surface-hover" />
      </div>
    </div>
  );
}

export function PlaceSkeleton() {
  return (
    <div className="bg-surface rounded-[--radius-lg] border border-border overflow-hidden animate-pulse">
      <div className="p-3.5 space-y-2.5">
        {/* Type label */}
        <div className="h-3 w-20 rounded bg-surface-hover" />
        {/* Title */}
        <div className="h-4 w-3/4 rounded bg-surface-hover" />
        {/* Rating + price */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-10 rounded bg-surface-hover" />
          <div className="h-3 w-6 rounded bg-surface-hover" />
        </div>
        {/* Address */}
        <div className="h-3 w-full rounded bg-surface-hover" />
        {/* Summary */}
        <div className="h-3 w-full rounded bg-surface-hover" />
        <div className="h-3 w-4/5 rounded bg-surface-hover" />
        {/* Meta */}
        <div className="h-3 w-24 rounded bg-surface-hover" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto pb-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="h-5 w-5 rounded bg-surface-hover" />
        <div className="flex gap-2">
          <div className="h-5 w-5 rounded bg-surface-hover" />
          <div className="h-5 w-5 rounded bg-surface-hover" />
          <div className="h-5 w-5 rounded bg-surface-hover" />
        </div>
      </div>
      {/* Thumbnail */}
      <div className="w-full h-48 bg-surface-hover" />
      {/* Content */}
      <div className="px-4 pt-4 space-y-3">
        <div className="h-3 w-40 rounded bg-surface-hover" />
        <div className="h-5 w-full rounded bg-surface-hover" />
        <div className="h-5 w-2/3 rounded bg-surface-hover" />
        {/* Tags */}
        <div className="flex gap-1.5 pt-2">
          <div className="h-5 w-16 rounded-full bg-surface-hover" />
          <div className="h-5 w-14 rounded-full bg-surface-hover" />
          <div className="h-5 w-18 rounded-full bg-surface-hover" />
        </div>
        {/* TLDR block */}
        <div className="mt-4 p-3 rounded-[--radius-md] bg-surface space-y-2">
          <div className="h-3 w-12 rounded bg-surface-hover" />
          <div className="h-4 w-full rounded bg-surface-hover" />
          <div className="h-4 w-5/6 rounded bg-surface-hover" />
        </div>
        {/* Takeaways */}
        <div className="space-y-2 mt-4">
          <div className="h-3 w-28 rounded bg-surface-hover" />
          <div className="h-3 w-full rounded bg-surface-hover" />
          <div className="h-3 w-full rounded bg-surface-hover" />
          <div className="h-3 w-3/4 rounded bg-surface-hover" />
        </div>
      </div>
    </div>
  );
}

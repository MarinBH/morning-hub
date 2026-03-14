"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, MapPin, Search, User, Plus } from "lucide-react";

const navItems = [
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/places", label: "Places", icon: MapPin },
  { href: "/search", label: "Search", icon: Search },
  { href: "/settings", label: "Settings", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 h-dvh bg-surface/50 border-r border-border-subtle sticky top-0">
      <div className="p-4 pb-3">
        <span className="font-display text-[15px] font-bold tracking-tight text-text-primary">Keepmark</span>
      </div>

      <div className="px-3 mb-1">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-save-modal"))}
          className="btn btn-primary btn-sm w-full"
        >
          <Plus size={15} strokeWidth={2.5} />
          Save Link
        </button>
      </div>

      <nav className="flex-1 px-3 pt-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-[--radius-sm] text-[13px] font-medium font-heading mb-px transition-colors ${
                isActive
                  ? "bg-accent-subtle text-accent"
                  : "text-muted hover:text-text-secondary hover:bg-surface-hover"
              }`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

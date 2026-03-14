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
    <aside className="hidden md:flex flex-col w-56 h-dvh bg-surface border-r border-border sticky top-0">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold tracking-tight">Link Saver</h1>
      </div>

      <div className="p-3">
        <Link
          href="/save"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[--radius-md] bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} />
          Save Link
        </Link>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-[--radius-sm] text-sm font-medium mb-0.5 transition-colors ${
                isActive
                  ? "bg-accent-subtle text-accent"
                  : "text-muted hover:text-text-secondary hover:bg-surface-hover"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Search, User, Plus } from "lucide-react";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/places", label: "Places", icon: MapPin },
  { href: "/search", label: "Search", icon: Search },
  { href: "/settings", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-50 bg-surface/80 glass border-t border-border-subtle md:hidden">
      <div className="flex justify-around items-center py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1 text-[10px] font-medium font-heading transition-colors ${
                isActive ? "text-accent" : "text-muted"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Center FAB - Save */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-save-modal"))}
          aria-label="Save a link"
          className="flex items-center justify-center w-11 h-11 -mt-4 rounded-full bg-accent shadow-lg shadow-accent/30 text-white active:scale-95 transition-transform"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>

        {navItems.slice(2).map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1 text-[10px] font-medium font-heading transition-colors ${
                isActive ? "text-accent" : "text-muted"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

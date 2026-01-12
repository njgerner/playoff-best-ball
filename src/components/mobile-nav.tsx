"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Navigation tabs for sub-header
const navTabs = [
  { href: "/", label: "Live" },
  { href: "/projections", label: "EV" },
  { href: "/schedule", label: "Bracket" },
  { href: "/rosters", label: "Rosters" },
  { href: "/scoring", label: "Rules" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden overflow-x-auto scrollbar-hide border-b border-[var(--chalk-muted)]/30 bg-[var(--background)]">
      <div className="flex min-w-max px-2">
        {navTabs.map((tab) => {
          const isActive =
            pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "text-[var(--chalk-pink)]"
                  : "text-[var(--chalk-muted)] active:text-[var(--chalk-white)]"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--chalk-pink)] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// All navigation links for desktop
const allNavLinks = [
  { href: "/", label: "Live" },
  { href: "/projections", label: "Projections" },
  { href: "/schedule", label: "Schedule" },
  { href: "/rosters", label: "Rosters" },
  { href: "/scoring", label: "Scoring" },
  { href: "/admin", label: "Admin" },
];

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex items-center space-x-1">
      {allNavLinks.map((link) => {
        const isActive =
          pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 text-sm font-medium transition-colors chalk-text min-h-[44px] flex items-center ${
              isActive
                ? "text-[var(--chalk-pink)]"
                : "text-[var(--chalk-white)] hover:text-[var(--chalk-pink)]"
            }`}
            style={{ fontFamily: "var(--font-chalk)" }}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

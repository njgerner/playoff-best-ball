"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Main navigation tabs (shown in bottom bar)
const mainTabs = [
  {
    href: "/",
    label: "Live",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    href: "/projections",
    label: "EV",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    href: "/schedule",
    label: "Bracket",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    href: "/rosters",
    label: "Rosters",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    href: "/scoring",
    label: "Rules",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--background)] border-t-2 border-dashed border-[var(--chalk-yellow)] safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {mainTabs.map((tab) => {
          const isActive =
            pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors ${
                isActive
                  ? "text-[var(--chalk-pink)]"
                  : "text-[var(--chalk-muted)] active:text-[var(--chalk-white)]"
              }`}
            >
              <span className={isActive ? "text-[var(--chalk-pink)]" : ""}>{tab.icon}</span>
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
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

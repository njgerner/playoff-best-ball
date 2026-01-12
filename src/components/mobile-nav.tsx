"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Live" },
  { href: "/projections", label: "Projections" },
  { href: "/schedule", label: "Schedule" },
  { href: "/rosters", label: "Rosters" },
  { href: "/scoring", label: "Scoring" },
  { href: "/admin", label: "Admin" },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const closeMenu = () => setIsOpen(false);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger button - visible only on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center justify-center w-11 h-11 text-[var(--chalk-white)] hover:text-[var(--chalk-pink)] transition-colors"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={`md:hidden fixed top-0 right-0 z-50 h-full w-64 bg-[var(--background)] border-l-2 border-dashed border-[var(--chalk-yellow)] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close button */}
        <div className="flex justify-end p-4">
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-11 h-11 text-[var(--chalk-white)] hover:text-[var(--chalk-pink)] transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="px-4">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={`block py-4 px-4 text-lg font-medium transition-colors chalk-text border-b border-dashed border-[var(--chalk-muted)]/30 ${
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
        </nav>
      </div>
    </>
  );
}

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex items-center space-x-1">
      {navLinks.map((link) => {
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

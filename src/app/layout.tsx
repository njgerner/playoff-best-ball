import type { Metadata } from "next";
import { Fredoka, Patrick_Hand } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-chalk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const patrickHand = Patrick_Hand({
  variable: "--font-chalk-mono",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Playoff Best Ball",
  description: "NFL Playoff Best Ball Fantasy Football",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${patrickHand.variable} antialiased`}>
        {/* Navigation */}
        <nav className="border-b-2 border-dashed border-[var(--chalk-yellow)] bg-[rgba(0,0,0,0.2)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link
                  href="/"
                  className="text-2xl font-bold text-[var(--chalk-yellow)] chalk-text hover:text-[var(--chalk-pink)] transition-colors"
                  style={{ fontFamily: "var(--font-chalk)" }}
                >
                  Playoff Best Ball
                </Link>
              </div>
              <div className="flex items-center space-x-1">
                <NavLink href="/">Standings</NavLink>
                <NavLink href="/rosters">Rosters</NavLink>
                <NavLink href="/scoring">Scoring</NavLink>
                <NavLink href="/admin">Admin</NavLink>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          style={{ fontFamily: "var(--font-chalk)" }}
        >
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t-2 border-dashed border-[var(--chalk-muted)] mt-12 py-6 text-center">
          <p
            className="text-[var(--chalk-muted)] text-sm"
            style={{ fontFamily: "var(--font-chalk-mono)" }}
          >
            2025 Playoff Best Ball
          </p>
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[var(--chalk-white)] hover:text-[var(--chalk-pink)] px-3 py-2 text-sm font-medium transition-colors chalk-text"
      style={{ fontFamily: "var(--font-chalk)" }}
    >
      {children}
    </Link>
  );
}

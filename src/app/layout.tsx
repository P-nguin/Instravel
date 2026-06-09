import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instravel",
  description: "Collaborative trip planning from shared travel inspiration."
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trips", label: "Trips" },
  { href: "/trips/new", label: "New trip" }
];

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-stone-200 bg-paper/95">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Link className="text-lg font-bold text-ink" href="/">
                Instravel
              </Link>
              <nav className="flex flex-wrap gap-2">
                {navItems.map((item) => (
                  <Link
                    className="rounded-md px-3 py-2 text-sm font-medium text-stone-700 hover:bg-white hover:text-ink"
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}

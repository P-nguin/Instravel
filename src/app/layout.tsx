import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Instravel",
  description: "Collaborative trip planning from shared travel inspiration.",
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trips", label: "Trips" },
  { href: "/trips/new", label: "New trip" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          {/* Dynamic Header with Login / Profile Session State */}
          <Header />
          <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}

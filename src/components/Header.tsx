import { auth } from "@/auth";
import SignInButton from "./SignInButton";
import SignOutButton from "./SignOutButton";
import Image from "next/image";
import Link from "next/link";

// Bring back the navigation items
const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trips", label: "Trips" },
  { href: "/trips/new", label: "New trip" },
];

export default async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-stone-200 bg-paper/95">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Side: Logo and Navigation Links */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <Link className="text-lg font-bold text-ink" href="/">
            Instravel
          </Link>

          {/* We only show the navigation links if the user is logged in, since those pages are now protected! */}
          {session?.user && (
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
          )}
        </div>

        {/* Right Side: Auth State */}
        <div>
          {session?.user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700 hidden sm:block">
                {session.user.name}
              </span>
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={36}
                  height={36}
                  className="rounded-full border border-stone-200"
                />
              )}
              <SignOutButton />
            </div>
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </header>
  );
}

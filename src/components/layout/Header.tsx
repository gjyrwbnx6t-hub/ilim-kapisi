"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/departments/usul-al-fiqh", label: "Fıkıh Usûlü" },
  { href: "/departments/usul-al-din", label: "Din Usûlü" },
];

export default function Header() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="flex items-center justify-between bg-ink px-[5%] py-4 text-white shadow-md">
      <Link
        href="/"
        className="text-xl font-bold tracking-wide text-gold transition-colors hover:text-gold-light"
      >
        İlim Kapısı
      </Link>

      <nav>
        <ul className="flex gap-6 max-md:flex-col max-md:gap-2 max-md:text-right">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={`relative font-medium transition-colors ${
                    active ? "text-gold" : "text-slate-200 hover:text-gold"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-gold" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

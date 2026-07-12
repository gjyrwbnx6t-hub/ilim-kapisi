"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";

const baseLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/departments/usul-al-fiqh", label: "Fıkıh Usûlü" },
  { href: "/departments/usul-al-din", label: "Din Usûlü" },
];

interface NavLinksProps {
  isAuthed: boolean;
  isTeacher: boolean;
}

export default function NavLinks({ isAuthed, isTeacher }: NavLinksProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const links = [...baseLinks];
  if (isTeacher) links.push({ href: "/panel", label: "Panel" });
  if (isAuthed) links.push({ href: "/profil", label: "Profilim" });

  return (
    <nav>
      <ul className="flex items-center gap-6 max-md:flex-col max-md:items-end max-md:gap-2 max-md:text-right">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <li key={link.href}>
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

        <li>
          {isAuthed ? (
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-white/25 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:border-white/50 hover:text-white"
              >
                Çıkış
              </button>
            </form>
          ) : (
            <Link
              href="/giris"
              className="rounded-lg bg-gold px-4 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-light"
            >
              Giriş
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}

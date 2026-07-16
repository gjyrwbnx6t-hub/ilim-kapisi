"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Menu, X } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { useSitePreferences } from "@/components/settings/SitePreferencesProvider";

const baseLinks = [
  { href: "/", labelKey: "home" },
  { href: "/departments/usul-al-fiqh", labelKey: "fiqh" },
  { href: "/departments/usul-al-din", labelKey: "din" },
  { href: "/rearapca", labelKey: "rearapca" },
  { href: "/kariyer", labelKey: "career" },
  { href: "/ayarlar", labelKey: "settings" },
] as const;

type NavLabelKey = (typeof baseLinks)[number]["labelKey"] | "panel" | "profile";

interface NavLinksProps {
  isAuthed: boolean;
  isTeacher: boolean;
}

export default function NavLinks({ isAuthed, isTeacher }: NavLinksProps) {
  const pathname = usePathname();
  const { copy, direction, language } = useSitePreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [isSigningOut, startSignOut] = useTransition();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const links: Array<{ href: string; labelKey: NavLabelKey }> = [...baseLinks];
  if (isTeacher) links.push({ href: "/panel", labelKey: "panel" });
  if (isAuthed && !isTeacher) links.push({ href: "/profil", labelKey: "profile" });

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !signOutConfirmOpen) setMenuOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, signOutConfirmOpen]);

  useEffect(() => {
    if (!signOutConfirmOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSigningOut) setSignOutConfirmOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [signOutConfirmOpen, isSigningOut]);

  const handleConfirmSignOut = () => {
    startSignOut(async () => {
      await signOut();
    });
  };

  const navClassName = language === "ar" ? "font-arabic" : "";
  const drawerPositionClass = direction === "rtl" ? "right-0" : "left-0";
  const drawerClosedClass =
    direction === "rtl" ? "translate-x-full" : "-translate-x-full";

  const renderLinks = (onNavigate?: () => void, stacked = false) =>
    links.map((link) => {
      const active = isActive(link.href);
      const label = copy.nav[link.labelKey];
      return (
        <li key={link.href}>
          <Link
            href={link.href}
            onClick={onNavigate}
            className={`relative block font-medium transition-colors ${
              stacked ? "py-3 text-lg" : ""
            } ${active ? "text-gold" : "text-slate-200 hover:text-gold"}`}
          >
            {label}
            {active && !stacked && (
              <span className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-gold" />
            )}
          </Link>
        </li>
      );
    });

  const renderAuthAction = (fullWidth = false) =>
    isAuthed ? (
      <button
        type="button"
        onClick={() => setSignOutConfirmOpen(true)}
        className={
          fullWidth
            ? "w-full rounded-lg bg-red-500 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-red-600"
            : "rounded-lg border border-white/25 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:border-white/50 hover:text-white"
        }
      >
        {copy.nav.signOut}
      </button>
    ) : (
      <Link
        href="/giris"
        onClick={() => setMenuOpen(false)}
        className={
          fullWidth
            ? "block w-full rounded-lg bg-gold px-4 py-3 text-center text-base font-semibold text-ink transition-colors hover:bg-gold-light"
            : "rounded-lg bg-gold px-4 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-light"
        }
      >
        {copy.nav.signIn}
      </Link>
    );

  return (
    <>
      <nav
        dir={direction}
        className={`hidden md:block ${navClassName}`}
        aria-label="Ana menü"
      >
        <ul className="flex items-center gap-6">
          {renderLinks()}
          <li>{renderAuthAction()}</li>
        </ul>
      </nav>

      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-white transition-colors hover:border-white/40 hover:bg-white/10 md:hidden"
        aria-label="Menüyü aç"
        aria-expanded={menuOpen}
        aria-controls="mobile-nav-drawer"
        onClick={() => setMenuOpen(true)}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div
        className={`fixed inset-0 z-50 md:hidden ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Menüyü kapat"
          onClick={() => setMenuOpen(false)}
        />

        <aside
          id="mobile-nav-drawer"
          dir={direction}
          className={`fixed inset-y-0 z-10 flex w-[min(85vw,320px)] flex-col bg-ink px-5 py-5 text-white shadow-2xl transition-transform duration-300 ease-out ${drawerPositionClass} ${navClassName} ${
            menuOpen ? "translate-x-0" : drawerClosedClass
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobil menü"
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-bold uppercase tracking-wide text-gold">
              İlim Kapısı
            </p>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-white transition-colors hover:border-white/40 hover:bg-white/10"
              aria-label="Menüyü kapat"
              onClick={() => setMenuOpen(false)}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto" aria-label="Mobil menü bağlantıları">
            <ul className="divide-y divide-white/10">
              {renderLinks(() => setMenuOpen(false), true)}
            </ul>
          </nav>

          <div className="mt-6 border-t border-white/10 pt-4">
            {renderAuthAction(true)}
          </div>
        </aside>
      </div>

      {signOutConfirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4"
          dir={direction}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-out-confirm-title"
            className={`w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl ${navClassName}`}
          >
            <h2
              id="sign-out-confirm-title"
              className="text-lg font-bold text-slate-900"
            >
              {copy.nav.signOutConfirmTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {copy.nav.signOutConfirmDescription}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={isSigningOut}
                onClick={() => setSignOutConfirmOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {copy.nav.signOutConfirmCancel}
              </button>
              <button
                type="button"
                disabled={isSigningOut}
                onClick={handleConfirmSignOut}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {isSigningOut
                  ? copy.nav.signOutConfirmPending
                  : copy.nav.signOutConfirmAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

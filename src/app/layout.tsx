import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import SitePreferencesProvider from "@/components/settings/SitePreferencesProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "İlim Kapısı | Çalışma Portalı",
    template: "%s | İlim Kapısı",
  },
  description:
    "Üniversite derslerini düzenli takip etmek, kaynakları tek bir yerde toplamak ve Arapça pratiğini geliştirmek için ortak çalışma alanı.",
};

const preferenceScript = `
(() => {
  try {
    const language = localStorage.getItem("ilim-kapisi-language") === "ar" ? "ar" : "tr";
    const theme = localStorage.getItem("ilim-kapisi-theme") === "dark" ? "dark" : "light";
    const root = document.documentElement;
    root.lang = language;
    root.dataset.siteLanguage = language;
    root.classList.toggle("theme-dark", theme === "dark");
    root.style.colorScheme = theme;
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: preferenceScript }} />
        <SitePreferencesProvider>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
        </SitePreferencesProvider>
      </body>
    </html>
  );
}

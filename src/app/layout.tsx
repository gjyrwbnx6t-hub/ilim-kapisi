import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "İlim Kapısı | Çalışma Portalı",
    template: "%s | İlim Kapısı",
  },
  description:
    "Üniversite derslerini düzenli takip etmek, kaynakları tek bir yerde toplamak ve Arapça pratiğini geliştirmek için ortak çalışma alanı.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}

import Link from "next/link";
import NavLinks from "@/components/layout/NavLinks";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Üst çubuk. Oturum durumunu sunucuda okur; giriş varsa "Profilim/Çıkış",
 * öğretmense "Panel" linkini gösterir. Supabase kurulu değilse yalnızca
 * "Giriş" gösterilir (tıklanınca kurulum notu görünür).
 */
export default async function Header() {
  let isAuthed = false;
  let isTeacher = false;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      isAuthed = true;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isTeacher = (profile as { role?: string } | null)?.role === "teacher";
    }
  }

  return (
    <header className="flex items-center justify-between bg-ink px-[5%] py-4 text-white shadow-md">
      <Link
        href="/"
        className="text-xl font-bold tracking-wide text-gold transition-colors hover:text-gold-light"
      >
        İlim Kapısı
      </Link>

      <NavLinks isAuthed={isAuthed} isTeacher={isTeacher} />
    </header>
  );
}

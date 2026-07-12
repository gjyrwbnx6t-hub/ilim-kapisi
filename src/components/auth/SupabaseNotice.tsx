import Link from "next/link";

/**
 * Supabase henüz yapılandırılmadığında (env yok) gösterilen nazik uyarı.
 */
export default function SupabaseNotice() {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-8 text-center">
      <h1 className="mb-2 text-xl font-bold text-amber-800">
        Hesap sistemi henüz kurulmadı
      </h1>
      <p className="text-sm text-amber-700">
        Giriş ve profil özelliklerinin çalışması için Supabase bağlantısı
        gerekiyor. Proje kökündeki <code className="font-mono">.env.example</code>{" "}
        dosyasını <code className="font-mono">.env.local</code> olarak kopyalayıp
        Supabase anahtarlarını girin, ardından{" "}
        <code className="font-mono">supabase/schema.sql</code> dosyasını Supabase
        SQL editöründe çalıştırın.
      </p>
      <Link
        href="/"
        className="mt-5 inline-block text-sm font-semibold text-primary hover:underline"
      >
        Ana sayfaya dön
      </Link>
    </div>
  );
}

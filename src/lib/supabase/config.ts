/**
 * Supabase env değişkenleri tanımlı ve gerçek (placeholder değil) mi?
 * Henüz kurulmadıysa auth/profil UI'ı nazik bir "yapılandırma gerekli"
 * durumu gösterir; site geri kalanı çalışmaya devam eder.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) return false;
  if (url.includes("YOUR_PROJECT_REF") || anon.includes("YOUR_ANON")) {
    return false;
  }
  return true;
}

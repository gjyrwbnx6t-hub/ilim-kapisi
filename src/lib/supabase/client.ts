import { createBrowserClient } from "@supabase/ssr";

/**
 * Tarayıcı (client component) tarafında kullanılacak Supabase istemcisi.
 * Yalnızca public anon key kullanır; asıl güvenlik veritabanı RLS
 * politikalarındadır.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

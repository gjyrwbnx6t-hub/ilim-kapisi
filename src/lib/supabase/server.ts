import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Sunucu (server component / route handler / server action) tarafında
 * kullanılacak Supabase istemcisi. Oturum çerezlerini Next.js cookie
 * deposundan okur/yazar.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server component içinden çağrıldığında set() hata verebilir;
            // oturum yenileme middleware tarafından yapıldığı için güvenle
            // yok sayılır.
          }
        },
      },
    },
  );
}

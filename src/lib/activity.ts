import type { ActivityInput } from "@/lib/supabase/types";

/**
 * İstemci tarafından aktivite olayı gönderir. "Ateşle-unut" mantığıyla
 * çalışır: başarısızlık site akışını bozmaz (giriş yoksa sunucu 204 döner).
 */
export function logActivity(input: ActivityInput): void {
  try {
    void fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // yok say
  }
}

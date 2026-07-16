import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CareerSnapshotSummary } from "@/lib/supabase/types";

function isCareerSummary(value: unknown): value is CareerSnapshotSummary {
  if (!value || typeof value !== "object") return false;
  const summary = value as Partial<CareerSnapshotSummary>;
  return (
    typeof summary.universityCount === "number" &&
    typeof summary.termCount === "number" &&
    typeof summary.courseCount === "number" &&
    Array.isArray(summary.atRiskCourses) &&
    Array.isArray(summary.terms)
  );
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return new NextResponse(null, { status: 204 });
  }

  let body: { summary?: unknown };
  try {
    body = (await request.json()) as { summary?: unknown };
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  if (!isCareerSummary(body.summary)) {
    return NextResponse.json({ error: "Geçersiz kariyer özeti" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(null, { status: 204 });
  }

  const { error } = await supabase.from("career_snapshots").upsert(
    {
      user_id: user.id,
      summary: body.summary,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

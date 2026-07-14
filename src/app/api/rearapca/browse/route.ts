import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ActivityEvent } from "@/lib/supabase/types";
import { getRearapcaWordPool } from "@/lib/rearapca-data";
import { buildProgressSnapshots } from "@/lib/rearapca-progress-events";
import {
  buildBrowseWordList,
  type BrowseWordStatus,
} from "@/lib/rearapca-browse-flashcards";

const VALID_STATUSES = new Set<BrowseWordStatus>([
  "new",
  "learning",
  "due",
  "mastered",
  "already_known",
]);

interface BrowseRequestBody {
  courseSlugs?: string[];
  statusFilters?: BrowseWordStatus[];
}

function parseStatusFilters(value: unknown): BrowseWordStatus[] {
  if (!Array.isArray(value)) return ["due"];
  const filters = value.filter(
    (item): item is BrowseWordStatus =>
      typeof item === "string" && VALID_STATUSES.has(item as BrowseWordStatus),
  );
  return filters.length > 0 ? filters : ["due"];
}

export async function POST(request: NextRequest) {
  let body: BrowseRequestBody;
  try {
    body = (await request.json()) as BrowseRequestBody;
  } catch {
    body = {};
  }

  const now = new Date();
  const pool = getRearapcaWordPool(body.courseSlugs);
  const statusFilters = parseStatusFilters(body.statusFilters);
  const wordIds = new Set(pool.map((word) => word.key));

  if (pool.length === 0) {
    return NextResponse.json({ words: [] });
  }

  if (!isSupabaseConfigured()) {
    const words = buildBrowseWordList({
      pool,
      progresses: [],
      filters: statusFilters,
      now,
    });
    return NextResponse.json({ words });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const words = buildBrowseWordList({
      pool,
      progresses: [],
      filters: statusFilters,
      now,
    });
    return NextResponse.json({ words });
  }

  const { data, error } = await supabase
    .from("activity_events")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", "vocab")
    .order("created_at", { ascending: true })
    .limit(10000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const events = (data ?? []) as ActivityEvent[];
  const progresses = buildProgressSnapshots(events).filter((progress) =>
    wordIds.has(progress.word_id),
  );

  const words = buildBrowseWordList({
    pool,
    progresses,
    filters: statusFilters,
    now,
  });

  return NextResponse.json({ words });
}

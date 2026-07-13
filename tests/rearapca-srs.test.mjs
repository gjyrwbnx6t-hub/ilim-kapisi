import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  advanceSuccessfulReview,
  buildSessionQueue,
  createAlreadyKnownProgress,
  createInitialProgress,
  isAnswerCorrect,
  recordIncorrectReview,
  requeueWord,
} from "../src/lib/rearapca-srs.mjs";

const baseNow = new Date("2026-07-13T00:00:00.000Z");
const userId = "00000000-0000-0000-0000-000000000001";

const pool = [
  { key: "course:u1:alpha", front: "alpha" },
  { key: "course:u1:beta", front: "beta" },
  { key: "course:u1:gamma", front: "gamma" },
  { key: "course:u1:delta", front: "delta" },
  { key: "course:u1:epsilon", front: "epsilon" },
];

function progress(word_id, overrides = {}) {
  return {
    id: `id:${word_id}`,
    user_id: userId,
    word_id,
    status: "learning",
    review_stage: 0,
    next_review_at: "2026-07-13T00:00:00.000Z",
    first_learned_at: "2026-07-12T00:00:00.000Z",
    last_reviewed_at: "2026-07-12T00:00:00.000Z",
    correct_count: 1,
    incorrect_count: 0,
    ...overrides,
  };
}

describe("Rearapça spaced repetition", () => {
  it("ilk kez öğrenilen kelime 30 dakika sonrasına planlanır", () => {
    const result = createInitialProgress(baseNow);
    assert.equal(result.review_stage, 0);
    assert.equal(result.status, "learning");
    assert.equal(result.next_review_at, "2026-07-13T00:30:00.000Z");
    assert.equal(result.firstLearned, true);
  });

  it("ilk başarılı tekrar 1 gün sonrasına planlanır", () => {
    const result = advanceSuccessfulReview(progress("course:u1:alpha"), baseNow);
    assert.equal(result.review_stage, 1);
    assert.equal(result.next_review_at, "2026-07-14T00:00:00.000Z");
  });

  it("sonraki aşamalar 3, 7, 21 ve 60 gün ilerler", () => {
    const expected = [
      [1, 2, "2026-07-16T00:00:00.000Z"],
      [2, 3, "2026-07-20T00:00:00.000Z"],
      [3, 4, "2026-08-03T00:00:00.000Z"],
      [4, 5, "2026-09-11T00:00:00.000Z"],
    ];

    for (const [fromStage, toStage, nextReview] of expected) {
      const result = advanceSuccessfulReview(
        progress("course:u1:alpha", { review_stage: fromStage }),
        baseNow,
      );
      assert.equal(result.review_stage, toStage);
      assert.equal(result.next_review_at, nextReview);
    }
  });

  it("altıncı tekrar tamamlanınca kelime mastered olur", () => {
    const result = advanceSuccessfulReview(
      progress("course:u1:alpha", { review_stage: 5 }),
      baseNow,
    );
    assert.equal(result.review_stage, 6);
    assert.equal(result.status, "mastered");
    assert.equal(result.next_review_at, null);
    assert.equal(result.mastered, true);
  });

  it("yanlış cevap aşamayı ilerletmez", () => {
    const current = progress("course:u1:alpha", { review_stage: 3 });
    const result = recordIncorrectReview(current, baseNow);
    assert.equal(result.review_stage, 3);
    assert.equal(result.next_review_at, current.next_review_at);
    assert.equal(result.incorrect_count_delta, 1);
  });

  it("yanlış cevaplanan kelime aynı oturumda birkaç kart sonra tekrar gösterilir", () => {
    const result = requeueWord(pool, pool[0], 3);
    assert.deepEqual(
      result.map((word) => word.key),
      ["course:u1:beta", "course:u1:gamma", "course:u1:delta", "course:u1:alpha", "course:u1:epsilon"],
    );
  });

  it("henüz zamanı gelmemiş kelime tekrar listesine girmez", () => {
    const queue = buildSessionQueue({
      pool,
      progresses: [
        progress("course:u1:alpha", {
          next_review_at: "2026-07-13T01:00:00.000Z",
        }),
      ],
      mode: "review",
      now: baseNow,
      dailyGoal: 15,
    });
    assert.equal(queue.length, 0);
  });

  it("zamanı gelmiş kelime tekrar listesine girer", () => {
    const queue = buildSessionQueue({
      pool,
      progresses: [progress("course:u1:alpha")],
      mode: "review",
      now: baseNow,
      dailyGoal: 15,
    });
    assert.equal(queue.length, 1);
    assert.equal(queue[0].key, "course:u1:alpha");
  });

  it("mastered kelime normal tekrar listesine girmez", () => {
    const queue = buildSessionQueue({
      pool,
      progresses: [
        progress("course:u1:alpha", {
          status: "mastered",
          review_stage: 6,
          next_review_at: null,
        }),
      ],
      mode: "review",
      now: baseNow,
      dailyGoal: 15,
    });
    assert.equal(queue.length, 0);
  });

  it("önceden bilinen kelime yeni kelime kuyruğuna girmez", () => {
    const result = createAlreadyKnownProgress(baseNow);
    assert.equal(result.status, "mastered");
    assert.equal(result.review_stage, 6);
    assert.equal(result.first_learned_at, null);
    assert.equal(result.skipped, true);

    const queue = buildSessionQueue({
      pool,
      progresses: [
        progress("course:u1:alpha", {
          status: "mastered",
          review_stage: 6,
          next_review_at: null,
          first_learned_at: null,
        }),
      ],
      mode: "new",
      now: baseNow,
      dailyGoal: 15,
    });
    assert.equal(queue.some((word) => word.key === "course:u1:alpha"), false);
  });

  it("öğrenmeye başlanan kelime tanıtım yerine öğrenme kuyruğunda kalır", () => {
    const queue = buildSessionQueue({
      pool,
      progresses: [
        progress("course:u1:alpha", {
          first_learned_at: null,
          next_review_at: null,
        }),
      ],
      mode: "new",
      now: baseNow,
      dailyGoal: 15,
    });

    assert.equal(queue[0].key, "course:u1:alpha");
    assert.equal(queue[0].sessionKind, "new");
    assert.equal(queue[0].progress.first_learned_at, null);
    assert.equal(queue[1].key, "course:u1:beta");
    assert.equal(queue[1].progress, null);
  });

  it("birden fazla anlamdan yalnızca biri yazıldığında cevap doğru kabul edilir", () => {
    assert.equal(isAnswerCorrect("mükâfat", "جزاء (ödül / mükâfat / karşılık)"), true);
    assert.equal(isAnswerCorrect(" ödül! ", "جزاء (ödül / mükâfat / karşılık)"), true);
  });

  it("API artık eksik vocabulary_progress tablosuna bağımlı değildir", () => {
    const sessionRoute = fs.readFileSync(
      "src/app/api/rearapca/session/route.ts",
      "utf-8",
    );
    const reviewRoute = fs.readFileSync(
      "src/app/api/rearapca/review/route.ts",
      "utf-8",
    );
    assert.equal(sessionRoute.includes("vocabulary_progress"), false);
    assert.equal(reviewRoute.includes("vocabulary_progress"), false);
  });

  it("Rearapça ilerlemesi mevcut activity_events RLS ve kullanıcı filtresiyle okunur", () => {
    const schema = fs.readFileSync("supabase/schema.sql", "utf-8");
    const sessionRoute = fs.readFileSync(
      "src/app/api/rearapca/session/route.ts",
      "utf-8",
    );
    assert.match(schema, /activity_select_own_or_teacher/);
    assert.match(schema, /for insert with check \(user_id = auth\.uid\(\)\)/);
    assert.match(sessionRoute, /\.eq\("user_id", user\.id\)/);
  });

  it("günlük yeni kelime sayısı tekrar cevaplarında artacak yeni kelime kuyruğuna dönmez", () => {
    const queue = buildSessionQueue({
      pool,
      progresses: [progress("course:u1:alpha")],
      mode: "new",
      now: baseNow,
      dailyGoal: 15,
    });
    assert.equal(queue.some((word) => word.key === "course:u1:alpha"), false);
  });

  it("sayfa yenilendiğinde persist edilmiş zamanı gelen ilerleme tekrar kuyruğuna girer", () => {
    const queue = buildSessionQueue({
      pool,
      progresses: [progress("course:u1:alpha")],
      mode: "review",
      now: baseNow,
      dailyGoal: 15,
    });
    assert.equal(queue[0].key, "course:u1:alpha");
  });
});

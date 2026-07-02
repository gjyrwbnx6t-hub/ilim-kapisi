# Copilot instructions for ilim-kapisi

This file collects repository-specific guidance for future Copilot CLI sessions. Keep updates here when repository structure or developer workflows change.

---

## Quick commands

- Install dependencies: `npm install`
- Development server: `npm run dev`  (Next.js dev server, open http://localhost:3000)
- Build production bundle: `npm run build`
- Run production server locally: `npm run start`
- Lint: `npm run lint` (uses Next.js ESLint config via `next lint`)

Notes: There is no test runner configured in this repository (no `test` script). To run a single test there is currently no standard; add a test framework and script if needed.

---

## High-level architecture (big picture)

- Framework: Next.js 15 with the App Router (source under `src/app`).
- Language/tooling: TypeScript + Tailwind CSS. Global CSS lives at `src/app/globals.css`.
- Content layer:
  - Canonical JSON content in `content/` (e.g., `content/categories.json`).
  - Canonical runtime data in `src/data/*.ts` (courses, departments, domains, etc.). These are the primary sources used by the pages.
- Pages & routing:
  - App Router pages live under `src/app/` (top-level `page.tsx`, `layout.tsx`, and dynamic routes such as `src/app/courses/[slug]/page.tsx`).
  - Dynamic routes rely on arrays in `src/data` and use `generateStaticParams()` to create pages.
- Components & libs:
  - UI components: `src/components/ui/`
  - Layout components: `src/components/layout/`
  - Feature components (curriculum, course): `src/components/*`
  - Helpers and data utilities: `src/lib/` (e.g., `content.ts`, `search.ts`, `types.ts`).
- Data-driven static pages: add or edit entries in `src/data` (and `content/` where appropriate) to expose new pages — code reads these files directly.

---

## Key conventions and patterns

- Data-first approach: site content and canonical lists come from `content/*.json` and `src/data/*.ts`. Avoid scattering hard-coded content in page components.

- Status and visibility conventions:
  - Course status values used in code include `coming-soon`, `empty`, `in-progress`, `ready` (UI components also use `ready` checks). Category status type: `active | coming-soon`.
  - Shared courses are identified by `course.departments.length > 1`.

- Routing / slugs:
  - Slugs used in `src/data/courses.ts` map directly to the dynamic route `src/app/courses/[slug]/page.tsx` via `generateStaticParams()`.
  - When adding a new course, update `src/data/courses.ts` (and any related department lists). The static route will be generated from that data.

- Client vs Server components:
  - Files with `"use client"` are client-side interactive components (e.g., `CurriculumBrowser`). Keep stateful UI and browser-only APIs inside these.
  - Most pages and layout are server components unless `"use client"` is present.

- i18n / RTL:
  - UI is primarily Turkish with Arabic course titles. Code uses `dir="rtl"` and `font-arabic` classes where appropriate. Keep Arabic strings and direction attributes together in components that render Arabic titles.

- Search: `src/lib/search.ts` builds searchable haystacks used by the curriculum browser — update this when adding new searchable fields.

- Styling: Tailwind utility classes are used across components. Theme tokens (primary, accent) are referenced via classes; colors noted in README can be used for design alignment.

---

## Files to check before making content changes

- `content/*` — canonical JSON content
- `src/data/*` — authoritative data arrays (courses, departments, domains)
- `src/lib/*` — utility logic (content loading, search)
- `src/app/*` and `src/components/*` — routing and UI

---

## Existing assistant / AI configs

No assistant-specific config files were found (CLAUDE.md, AGENTS.md, .cursorrules, .clinerules, .windsurfrules, CONVENTIONS.md, etc.). This file acts as the primary Copilot guidance for the repo.

---

If anything here should be expanded (e.g., a note on tests, CI steps, or common refactors), update this file so future Copilot sessions pick up the change.
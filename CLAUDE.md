# Reference

@docs/DESIGN.md
@docs/IMPLEMENTATION_PLAN.md

## MCP reference

- Context7 for docs (Next.js 16, Turbopack, Astro 6)
- Many mcp and ui-ux-pro-max skill for UI/UX design.

## Status - Keep this minimal and direct. Self Update after each phase

- Phase 1 Completed (Deferred - Multi-language admin UI → carried to Phase 4)
- Phase 2 Completed (Deferred - Real Cloudflare Pages provisioning → replaced by Phase 4 GitHub integration)
- Phase 3 Completed (Deferred - Cloudflare Worker for Save-Data, multi-language admin UI → carried to Phase 4)
- Phase 4 Completed (Deferred - Per-chapter folder architecture/GitHub provisioning → Phase 5 scope. Implemented: events calendar, centralized email, resources page, certification tracking, client orgs management, multi-language admin UI, 10-page chapter sites)
- Phase 5 Completed: AI editing via GitHub Actions + OpenCode (Gemini API), smart coach matching with Gemini reranking, enhanced deployment tracking with AI columns
- Phase 6 Planned (Deferred): Payments (Stripe Connect + PayPal), analytics dashboard, email campaigns — UI mocked with sample data

## Next.js 16 Migration Notes

- `middleware.ts` renamed to `proxy.ts`, export `proxy()` not `middleware()`. Runtime is `nodejs` only (no edge).
- `config.matcher` still works in proxy.ts.
- Config flags renamed: `skipMiddlewareUrlNormalize` -> `skipProxyUrlNormalize`.
- Supabase SSR `updateSession` works the same, just rename file and function.

## Astro 6 Migration Notes

- `output: "static"` is still valid but now the default.
- Legacy content collections removed. Must use Content Layer API. Config file is `src/content.config.ts` (not `src/content/config.ts`). Every collection needs a `loader`.
- `Astro.site` removed from `getStaticPaths` — use `import.meta.env.SITE`.
- `legacy.collections` flag removed.
- No `src/content/config.ts` needed if not using content collections.

## Architecture Notes (Phase 4+)

- Deploy hooks retired. Per-chapter folders (`apps/chapter-{slug}/`) extend `packages/template-core/`.
- Cloudflare Pages auto-deploys via GitHub integration with build watch paths: `apps/chapter-{slug}/**` + `packages/**`.
- Base template changes in `packages/template-core/` trigger ALL chapter rebuilds automatically.
- AI editing (Phase 5): Session-based iterative flow. Start session → creates branch via GitHub API (no workflow). Each prompt → triggers `ai-edit.yml` on the existing branch (Gemini API edits chapter folder, commits, pushes). User sees Cloudflare branch preview, can send follow-up prompts on the same branch. Deploy → squash-merge to main. Discard → delete branch. Rate limited to 1 session/chapter. API routes: `/api/ai-edit/start`, `/api/ai-edit/prompt`, `/api/ai-edit/approve`. Edge Functions: `trigger-ai-edit` (start only), `approve-ai-edit`.
- Smart coach matching (Phase 5): `find-coach-match` Edge Function embeds query (Gemini text-embedding-004) → vector search (768 dim) → Gemini reranks top 5 with explanations. Controlled by `ai_coach_matching_enabled` content block per chapter. OpenAI dependency eliminated — all AI uses Gemini API only.
- Email: centralized `packages/email/` with Resend, branded templates per chapter.
- External systems: LMS (don't touch), Credly badges (don't touch), we only track certification levels.
- 10 chapter pages (was 8): added Events Calendar and Resources & Library.
- Payments deferred but UI mocked — Stripe Connect + PayPal, SRD pricing ($50 enrollment, $30 certification).

## Test Creds

- Email: admin@wial-test.com
- Password: TestAdmin123!

# WIAL Global Chapter Network Platform

## Team "Team KK"

- [Ashwanth Balakrishnan](https://github.com/ashwanthbk)
- [Keerthana Jayaraman](https://github.com/keerthanajayaraman)

**Slack:** [#team-05-team-kk](https://opportunity-hack.slack.com/app_redirect?channel=team-05-team-kk)

---

## The Nonprofit

**[World Institute for Action Learning (WIAL)](https://wial.org)** is a global nonprofit that certifies Action Learning Coaches and helps organizations solve real business challenges while developing leaders. They operate 20+ chapters across the USA, Nigeria, Brazil, Philippines, and more, and each chapter needs local control without losing global brand consistency.

---

## The Problem

WIAL came to us with three overlapping problems they had not solved together:

- **No shared chapter infrastructure**: each affiliate manages its own site independently, branding drifts, and HQ cannot roll out improvements globally
- **No payment operations**: WIAL wants to collect chapter-level enrollment, certification, dues, and event payments, but had no connected payment workflow
- **No cross-language coach discovery**: clients searching in one language cannot reliably find coaches whose profiles were written in another

---

## What We Built

A multi-tenant platform with three layers:

1. **Admin dashboard** for WIAL Global and chapter leads to manage chapters, coaches, content, AI edits, deployments, payments, campaigns, and analytics
2. **Per-chapter static websites** generated from one shared Astro template and delivered through Cloudflare Pages
3. **Supabase backend + AI services** handling auth, RLS, payments, search, GitHub/Cloudflare orchestration, and email automation

---

## Live Links

|                       | URL                                |
| --------------------- | ---------------------------------- |
| Admin Dashboard       | https://wial.ashwanthbk.com        |
| Chapter Site - Brazil | https://brazil.wial.ashwanthbk.com |
| Chapter Site - India  | https://india.wial.ashwanthbk.com  |

**Demo credentials:**

| Role                   | Email                      | Password      |
| ---------------------- | -------------------------- | ------------- |
| Super Admin            | admin@wial-test.com        | TestAdmin123! |
| Chapter Lead - USA     | usa-lead@wial-demo.com     | Demo1234!     |
| Chapter Lead - Nigeria | nigeria-lead@wial-demo.com | Demo1234!     |
| Chapter Lead - Brazil  | brazil-lead@wial-demo.com  | Demo1234!     |
| Chapter Lead - India   | india-lead@wial-demo.com   | Demo1234!     |

---

## Tech Stack

|               |                                                          |
| ------------- | -------------------------------------------------------- |
| Admin         | Next.js 16, Tailwind CSS, shadcn/ui, next-intl           |
| Chapter Sites | Astro 6 static sites                                     |
| Backend       | Supabase PostgreSQL, Auth, RLS, Edge Functions, Realtime |
| AI            | Gemini `text-embedding-004` + Gemini Flash               |
| Vector Search | pgvector + HNSW                                          |
| Payments      | Stripe Connect Express                                   |
| Email         | Resend                                                   |
| Deployment    | Vercel for admin, Cloudflare Pages for chapter sites     |
| Monorepo      | Turborepo + Yarn workspaces                              |

---

## One-Click Chapter Provisioning And Deployment

This is the operational feature that makes the platform scalable for WIAL Global.

**Feature value**

- A super admin can create a chapter once in the dashboard and provision a real production-ready chapter site without manually creating folders, Cloudflare projects, or DNS records
- Shared template improvements can roll out to every chapter while preserving chapter-specific content
- Chapter leads can redeploy their site from the dashboard without touching GitHub

**Technical flow**

1. A super admin clicks provision in the admin dashboard.
2. `apps/admin/app/api/chapters/provision/route.ts` calls the `provision-chapter` Supabase Edge Function.
3. `supabase/functions/provision-chapter/index.ts` uses the GitHub API to scaffold `apps/chapter-{slug}/` directly in the repo from `packages/template-core/scaffold/pages/`, then creates and merges a temporary `provision/{slug}` branch into `main`.
4. The same function creates a dedicated Cloudflare Pages project (`wial-{slug}`), sets GitHub as the source, configures build commands, preview deployments, environment variables, and build watch paths.
5. It attaches the custom domain, creates or updates the chapter CNAME in Cloudflare DNS, stores the Cloudflare project name and GitHub folder path in the `chapters` table, and pushes an initial `.deploy-trigger` commit so the first site build starts automatically.
6. After that initial setup, normal redeploys use `apps/admin/app/api/deployments/trigger/route.ts` or `supabase/functions/trigger-deployment/index.ts`, which create a lightweight commit touching `apps/chapter-{slug}/.deploy-trigger` on `main`.
7. Cloudflare Pages watches that chapter folder and `packages/**`, rebuilds only the affected chapter site, and serves the result on the chapter domain.

**Why this matters**

- Provisioning is not just a folder generator; it automates GitHub repo updates, Cloudflare Pages project creation, DNS setup, and first deployment from one admin action.
- Standard chapter deploys do not need GitHub Actions. They rely on GitHub API commits plus Cloudflare Pages Git integration and watch paths.

---

## AI Editing Workflow

We separated AI editing from normal deployment because it has a different control model: branch previews, human approval, then merge.

**Feature value**

- Chapter leads can request site edits in natural language instead of editing Astro files directly
- Every AI change stays isolated to that chapter's folder
- Nothing goes live until a human reviews the preview and approves it

**Technical flow**

1. The chapter lead starts a session from the admin UI.
2. `apps/admin/app/api/ai-edit/start/route.ts` creates a dedicated GitHub branch named `ai-edit/{slug}/{timestamp}` and inserts a `deployments` record with `approval_status = pending`.
3. When the user submits a prompt, `apps/admin/app/api/ai-edit/prompt/route.ts` stores the prompt, validates the branch belongs to that chapter, and dispatches `.github/workflows/ai-edit.yml`.
4. The `ai-edit.yml` GitHub Actions workflow checks out the branch, installs OpenCode, writes a temporary config that only allows edits inside `apps/chapter-{slug}/`, and runs Gemini against that chapter folder.
5. The workflow blocks any out-of-scope writes, commits only chapter-folder changes, pushes the branch, and writes the Cloudflare Pages preview URL back into the `deployments` table.
6. Cloudflare Pages automatically builds a preview deployment for that branch because preview deployments are enabled for all branches.
7. If the chapter lead approves the preview, `apps/admin/app/api/ai-edit/approve/route.ts` creates a PR, squash-merges it into `main`, deletes the AI branch, and the merge triggers the production Cloudflare deploy.
8. If the lead rejects the change, the same route deletes the branch and marks the session as rejected without touching production.

**Safety controls**

- One active AI edit session per chapter
- Branch naming is validated against the chapter slug
- The GitHub Action rejects writes outside `apps/chapter-{slug}/`
- Approval is required before anything reaches production

---

## AI Search And Content Features

### Cross-Lingual Coach Matching

**Feature value**

- A client can search in Portuguese, English, or another language and still find the best coach across the global directory
- Results come back with short explanations, not just raw profile cards

**Technical implementation**

- Coach profile text is embedded into 768-dimensional vectors and stored in Postgres with `pgvector`
- `supabase/functions/find-coach-match/index.ts` embeds the incoming query with Gemini, runs vector similarity search through the `search_coaches_by_embedding` RPC, then sends top candidates back to Gemini Flash for reranking and match explanations
- If vector search or reranking fails, the function falls back gracefully instead of returning nothing

### AI Content Generation

**Feature value**

- A chapter lead can generate launch-ready copy for the full chapter site from structured inputs instead of writing ten pages from scratch

**Technical implementation**

- Supabase Edge Functions such as `generate-content` and `translate-content` use Gemini to create or adapt chapter copy
- The generated content feeds the same shared Astro page system used by every chapter site, so AI output still lands inside a controlled template

---

## Other Platform Features

| Feature                 | What it does for WIAL                                                                                     | How we built it                                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Role-based admin        | Lets HQ, chapter leads, content creators, and coaches work in one dashboard with different permissions    | Supabase Auth + `user_roles` table + Row Level Security across chapter-scoped tables                                                           |
| Shared chapter template | Gives every chapter the same 10-page structure while allowing local branding and content                  | `packages/template-core` holds shared Astro layouts, components, styles, and scaffold pages used by `apps/chapter-{slug}`                      |
| Payments                | Lets each chapter collect enrollment, certification, dues, and event payments into its own Stripe account | Stripe Connect Express + `create-checkout` Edge Function + `stripe-connect-webhook` for status sync, receipts, refunds, and onboarding updates |
| Coach profiles          | Makes certified coaches searchable, reviewable, and chapter-linked                                        | Supabase tables for coaches and chapters, certification approval workflow, multilingual directory pages, and per-coach profile routes          |
| Events and resources    | Gives each chapter a real public site with more than a landing page                                       | Astro pages for events, resources, testimonials, contact, coaches, and membership, backed by shared data loaders in `packages/template-core`   |
| Email campaigns         | Lets HQ or chapters send newsletters from inside the platform                                             | `send-campaign` Edge Function pulls active newsletter subscribers and sends batched Resend emails with chapter/global audience filters         |
| Automated reminders     | Reduces manual operations for recertification, dues, and events                                           | Postgres `pg_cron` jobs call Supabase Edge Functions on schedule                                                                               |
| Analytics               | Gives admins real operating metrics instead of mock dashboards                                            | SQL RPCs such as `get_chapter_payment_metrics`, `get_chapter_business_metrics`, and `get_global_revenue_metrics` power the dashboard           |

---

## Accessibility

Accessibility was treated as part of the platform design, not a final pass after the UI was built.

**What users get**

- Public chapter sites support keyboard-first navigation and clearer structure for screen reader users
- The admin dashboard supports multilingual operation for a global nonprofit team
- Low-bandwidth users benefit from the static-site architecture and reduced page-weight targets

**How we built it**

- The shared chapter layout includes a real skip link and a `main` landmark so keyboard users can jump directly to content
- The Astro templates use semantic navigation, labeled sections, `aria-label`, and `aria-required` patterns across navigation, forms, filters, and coach contact actions
- Focus states are explicitly styled in the chapter templates and admin UI instead of relying on browser defaults
- The HTML `lang` attribute is set from the active locale in both the chapter sites and the Next.js admin app
- External links use safe and predictable behavior with `rel="noopener noreferrer"`, and the template includes save-data-aware behavior to reduce unnecessary page weight
- The shared template approach means accessibility improvements propagate to every provisioned chapter instead of being fixed one site at a time

---

## Security

Security is built around least privilege, scoped automation, and approval gates instead of trusting the client.

**Core protections**

- Authentication runs through Supabase Auth, and sensitive admin flows resolve the current user server-side before any privileged action is taken
- Authorization is enforced with chapter-aware role checks in the app layer and Row Level Security in Postgres, so chapter data is isolated at the database boundary as well as in the UI
- Sensitive writes such as payment state updates and some deployment records use backend service-role access only, not direct client writes
- Stripe webhooks are verified with HMAC-SHA256, timing-safe comparison, and five-minute replay protection before payment records are updated
- AI editing is operationally sandboxed: the GitHub Actions workflow only permits writes inside `apps/chapter-{slug}/`, rejects out-of-scope diffs, and requires explicit human approval before merge to `main`
- Deployment safety includes one active AI session per chapter, validation that the AI branch matches the chapter slug, and explicit approve/reject controls before production release
- The Supabase function deployment workflow separates public and protected functions, and protected functions keep JWT verification enabled by default

**Why this matters**

- Chapter leads can manage their own chapter without gaining access to global data
- Payment and webhook logic cannot be spoofed by a browser-only caller
- AI assistance remains useful without being allowed to silently ship arbitrary code to production

---

## Architecture

```text
apps/
  admin/                  -> Next.js 16 admin app on Vercel
  chapter-template/       -> Astro reference chapter
  chapter-{slug}/         -> provisioned chapter Astro apps on Cloudflare Pages
packages/
  template-core/          -> shared Astro layouts, components, scaffold pages
  ui/                     -> shared shadcn/ui components
  supabase/               -> shared server/client helpers
  types/                  -> generated database types
  email/                  -> email templates
supabase/
  functions/              -> AI, deployment, payment, search, and email functions
  migrations/             -> Postgres schema, pgvector, pg_cron, analytics RPCs
.github/workflows/
  ai-edit.yml             -> AI edit workflow on chapter branches
  deploy-supabase-functions.yml
scripts/
  scaffold-chapter.ts     -> local chapter scaffold script
  clean-db.ts             -> local cleanup utility
```

Template propagation is handled through Cloudflare Pages watch paths. Changes in `packages/template-core/**` or a specific chapter folder trigger the relevant site rebuild without overwriting chapter-owned content.

---

## Running Locally

**Prerequisites:** Node 18+, Yarn, Supabase CLI

```bash
git clone https://github.com/2026-ASU-WiCS-Opportunity-Hack/05-team-kk.git
cd 05-team-kk
yarn install
```

Create `apps/admin/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_ADMIN_URL=http://localhost:3000
```

Create `apps/chapter-template/.env`:

```env
PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CHAPTER_SLUG=usa
```

```bash
supabase start
supabase db push

yarn workspace @repo/admin dev
yarn workspace @repo/chapter-template dev
```

To scaffold a new chapter locally:

```bash
yarn scaffold-chapter kenya
```

---

## What's Next

- Cloudflare Analytics API integration for real chapter traffic reporting
- Additional payment options beyond Stripe Connect
- Deeper AI knowledge features on top of WIAL content and chapter data

---

## Links

- [Hackathon](https://www.ohack.dev/hack/2026_spring_wics_asu)
- [DevPost](https://wics-ohack-sp26-hackathon.devpost.com/)
- [Team Slack](https://opportunity-hack.slack.com/app_redirect?channel=team-05-team-kk)
- [WIAL](https://wial.org)

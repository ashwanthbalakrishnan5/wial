# Repository Guidelines

## Project Structure & Module Organization

This is a Turborepo monorepo (`yarn` workspaces) with apps and shared packages.

- `apps/admin/`: Next.js 16 admin dashboard (multi-language, chapter management, AI editing UI).
- `apps/chapter-template/`: Astro 6 reference chapter site.
- `packages/template-core/`: shared Astro layouts/components/styles used by chapter sites.
- `packages/ui/`, `packages/types/`, `packages/supabase/`, `packages/email/`: shared UI, types, Supabase helpers, and email templates.
- `supabase/functions/` and `supabase/migrations/`: Edge Functions and SQL migrations.
- `docs/`: product spec, design system, and implementation plan.

## Build, Test, and Development Commands

Run commands from repo root unless noted.

- `yarn dev`: starts all workspace dev tasks via Turbo.
- `yarn build`: builds all workspaces (`turbo run build`).
- `yarn lint`: runs lint checks across lint-enabled packages/apps.
- `yarn scaffold-chapter <slug>`: creates `apps/chapter-<slug>/` from scaffold pages.
- `yarn workspace @repo/admin dev`: run only the admin app.
- `yarn workspace @repo/chapter-template build`: build the Astro template.
- `node apps/chapter-template/scripts/check-page-weight.mjs`: verify low-bandwidth page budgets after Astro build.

## Coding Style & Naming Conventions

- TypeScript strict mode is enabled through shared configs in `packages/typescript-config/`.
- Follow existing ESLint configs (`@repo/eslint-config/*`); fix warnings before opening PRs.
- Naming: `kebab-case` files, `PascalCase` React/Astro components, `snake_case` database columns.
- Prefer shared package abstractions over duplicating logic across apps.
- Validate external inputs at boundaries (forms, API routes, Edge Functions), and keep secrets in environment variables only.

## Commit & Pull Request Guidelines

- Follow Conventional Commit style used in history (example: `feat: add chapter scaffold validation`).
- Keep commits focused and small; avoid bundling unrelated refactors.
- Open PRs from feature branches with: clear summary, impacted paths (e.g., `apps/admin`, `supabase/functions`), validation steps run, and screenshots for UI changes.
- Link relevant spec/plan sections in `docs/` when implementing phased features.

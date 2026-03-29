# WIAL Global Chapter Network Platform

A high-scale monorepo designed for the World Institute for Action Learning (WIAL) to manage a global network of regional chapters, each with its own provisioned website, content management, and AI-driven features.

## Project Overview

The platform is built as a **Turborepo monorepo**, orchestrating multiple specialized applications and shared packages. It leverages a modern tech stack focused on performance, scalability, and AI integration.

### Core Architecture

- **`apps/admin`**: A **Next.js 16** dashboard (using Turbopack and Tailwind CSS 4) for Super Admins and Chapter Leads to manage chapters, coaches, content, and certifications.
- **`apps/chapter-template`**: An **Astro 6** base template used to provision regional chapter websites (e.g., `apps/chapter-nigeria/`). These sites are static-first for maximum performance and low-bandwidth accessibility.
- **`packages/template-core`**: Shared core logic, layouts, and components for all Astro-based chapter sites.
- **`packages/ui`**: A centralized design system built with **Tailwind CSS 4**, **Radix UI**, and **Lucide icons**, ensuring visual consistency ("Rooted Growth" aesthetic) across the platform.
- **`packages/supabase`**: Shared Supabase client, SSR, and middleware integration.
- **`packages/email`**: Centralized email service using **Resend** with branded templates.
- **`packages/types`**: Shared TypeScript definitions and auto-generated Supabase database types.
- **`supabase/`**: Contains database migrations and **Edge Functions** for complex logic like AI processing, provisioning, and search.

### Key Technologies

- **Backend**: Supabase (PostgreSQL, Auth, Storage, Vector Search).
- **AI Integration**: **Gemini API** is the exclusive AI provider, used for:
  - **AI-Led Editing**: An iterative, session-based flow where Gemini edits chapter folder files via GitHub Actions.
  - **Smart Coach Matching**: Vector embeddings (text-embedding-004) and Gemini-powered reranking.
  - **Content Management**: Automated translation and content generation.
- **Deployment**: Cloudflare Pages for web applications, integrated with GitHub for automatic provisioning and branch previews.
- **Design**: "Rooted Growth" philosophy—warm, professional, and accessible.

---

## Building and Running

The project uses `yarn` (v1.22.22) and `turbo` for task orchestration.

### Prerequisites

- **Node.js**: >= 18
- **Yarn**: v1.x
- **Supabase CLI**: For local database development and Edge Functions.

### Key Commands

- **Install Dependencies**:
  ```bash
  yarn install
  ```
- **Development Mode**:
  ```bash
  yarn dev
  ```
  *Runs all applications and packages in parallel.*
- **Build the Project**:
  ```bash
  yarn build
  ```
- **Linting**:
  ```bash
  yarn lint
  ```
- **Scaffold a New Chapter**:
  ```bash
  yarn scaffold-chapter
  ```
  *Internal script to provision a new chapter folder and database entries.*

---

## Development Conventions

### Architecture & Frameworks

- **Next.js 16 Migration**: Follow the pattern in `apps/admin/proxy.ts` (formerly `middleware.ts`). Use the `nodejs` runtime for middleware/proxies.
- **Astro 6 Content Layer**: All content collections must use the **Content Layer API** in `src/content.config.ts`.
- **UI/UX Standards**: Adhere to `docs/DESIGN.md`. Prioritize "warmth over sterility" and "clarity over cleverness."
- **Styling**: Use **Tailwind CSS 4** utility classes. Prefer semantic tokens for colors (e.g., `primary`, `surface`, `text-secondary`).

### AI & Data

- **Gemini Only**: Do not introduce OpenAI or other AI providers. All AI features must use the Gemini API via Supabase Edge Functions or GitHub Actions.
- **Database Safety**: Types in `packages/types/src/database.ts` are auto-generated. Do not edit them manually; regenerate them using the Supabase CLI after migration changes.
- **Vector Search**: Use `pgvector` (768 dimensions) for embeddings, calibrated for `text-embedding-004`.

### Performance & Accessibility

- **Low-Bandwidth Optimization**: Chapter sites must be optimized for regions with constrained connectivity (e.g., Nigeria, Philippines).
  - Use **system fonts** where possible.
  - Implement **AVIF/WebP** image formats.
  - Minimize JavaScript on public-facing pages.
- **Accessibility**: All UI components must meet WCAG AA contrast requirements and support keyboard navigation.

### Collaboration

- **Git Flow**: AI-led edits happen on separate branches via GitHub API/Actions.
- **Commit Style**: Use clear, concise commit messages focusing on "why" rather than "what."

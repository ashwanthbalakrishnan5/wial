#!/usr/bin/env node

/**
 * Scaffold a new per-chapter Astro app from the template-core scaffold pages.
 *
 * Usage:
 *   npx ts-node scripts/scaffold-chapter.ts <chapter-slug>
 *   node --loader ts-node/esm scripts/scaffold-chapter.ts <chapter-slug>
 *
 * Or via the package.json script:
 *   yarn scaffold-chapter <chapter-slug>
 *
 * This creates apps/chapter-<slug>/ with:
 *   - package.json
 *   - astro.config.mjs
 *   - tsconfig.json
 *   - .env.example (template)
 *   - src/pages/ (copied from packages/template-core/scaffold/pages/)
 */

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: scaffold-chapter <chapter-slug>");
    process.exit(1);
  }

  const chapterDir = join(ROOT, "apps", `chapter-${slug}`);

  if (existsSync(chapterDir)) {
    console.error(`Error: ${chapterDir} already exists.`);
    process.exit(1);
  }

  console.log(`Scaffolding apps/chapter-${slug}/...`);

  // Create directory structure
  mkdirSync(join(chapterDir, "src", "pages"), { recursive: true });

  // package.json
  writeFileSync(
    join(chapterDir, "package.json"),
    JSON.stringify(
      {
        name: `@repo/chapter-${slug}`,
        version: "0.0.0",
        private: true,
        type: "module",
        scripts: {
          dev: "astro dev",
          build: "astro build",
          preview: "astro preview",
        },
        dependencies: {
          "@repo/template-core": "*",
          "@repo/types": "*",
          "@supabase/supabase-js": "^2.49.4",
          astro: "^6.0.0",
        },
        devDependencies: {
          "@tailwindcss/vite": "^4.1.0",
          tailwindcss: "^4.1.0",
          typescript: "5.5.4",
        },
      },
      null,
      2
    ) + "\n"
  );

  // astro.config.mjs
  writeFileSync(
    join(chapterDir, "astro.config.mjs"),
    `import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  image: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
`
  );

  // tsconfig.json
  writeFileSync(
    join(chapterDir, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "astro/tsconfigs/strict",
        include: [".astro/types.d.ts", "**/*"],
        exclude: ["dist"],
      },
      null,
      2
    ) + "\n"
  );

  // .env.example (template — real values set by Cloudflare or CI)
  writeFileSync(
    join(chapterDir, ".env.example"),
    `CHAPTER_SLUG=${slug}
PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
`
  );

  // Copy scaffold pages from template-core
  const scaffoldSrc = join(ROOT, "packages", "template-core", "scaffold", "pages");
  const pagesDest = join(chapterDir, "src", "pages");

  if (!existsSync(scaffoldSrc)) {
    console.error(`Error: Scaffold source not found at ${scaffoldSrc}`);
    process.exit(1);
  }

  cpSync(scaffoldSrc, pagesDest, { recursive: true });

  console.log(`Done! Created apps/chapter-${slug}/`);
  console.log("");
  console.log("Next steps:");
  console.log(
    `  1. Copy apps/chapter-${slug}/.env.example to .env.local and set values`
  );
  console.log(`  2. Run 'yarn install' from the monorepo root`);
  console.log(`  3. Run 'yarn workspace @repo/chapter-${slug} dev' to test locally`);
}

main();

# The Holmatrix — Claude Code Review Guide

## Project Summary

Family organization app at theholmatrix.com. Multi-tenant (tenant_id on every table). Two core users plus external collaborators via magic link sharing. Built with Next.js App Router + Supabase + CSS custom properties (no Tailwind).

## What to Check in Reviews

### Security (Critical)
- Every Supabase query must respect tenant boundaries — check that RLS is not bypassed
- No secrets or API keys in client-side code
- Auth middleware protects all routes under `(app)/`
- Magic link sharing checks `shares` table + permission level + expiration
- File uploads validate mime type and size before storing

### Brand Consistency
- Colors use `var(--hm-*)` tokens from `holmatrix-theme.css` — flag any hardcoded hex values
- Typography: DM Serif Display for headings, DM Sans for body — no other fonts
- Only font-weight 400 and 500 — flag 600 or 700
- Component helpers (`.hm-card`, `.hm-input`, `.hm-btn-primary`) should be used where applicable

### Architecture
- Server Components by default — `"use client"` only when necessary (hooks, event handlers, browser APIs)
- Database queries go through `@/lib/supabase/server` in Server Components, `@/lib/supabase/client` in Client Components
- Types in `@/lib/types/database.ts` match the Supabase schema
- No raw SQL in components — use Supabase query builder

### Code Quality
- TypeScript strict mode — no `any` types, no `@ts-ignore`
- Props interfaces for all components
- Named exports for components, default export only for page.tsx
- CSS Modules referencing theme variables — no inline styles for colors
- No unused imports or dead code

### Mobile
- All table views must handle column collapsing for screens < 768px
- Navigation should switch to bottom tab bar on mobile
- Touch targets minimum 44px for interactive elements
- Grocery list optimized for one-handed mobile use

## Branch Strategy
- Never commit directly to `main`
- Work on `dev` or feature branches (e.g., `feature/grocery-list`)
- PRs merge into `main` after review
- Vercel auto-deploys from `main`

## Key Files
- `src/styles/holmatrix-theme.css` — all design tokens
- `src/lib/supabase/` — Supabase client configuration
- `src/lib/types/database.ts` — TypeScript types for all tables
- `src/middleware.ts` — auth redirect logic
- `src/components/tables/DataTable.tsx` — reusable table with Excel-style column filtering

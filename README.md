# CGP Frontend Monorepo

A monorepo for CGP frontend applications, managed with [Nx](https://nx.dev) and [pnpm](https://pnpm.io) workspaces.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Workspace Structure](#workspace-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Running Tasks](#running-tasks)
  - [Development Server](#development-server)
  - [Build](#build)
  - [Testing](#testing)
  - [Linting & Formatting](#linting--formatting)
- [Routing Architecture](#routing-architecture)
  - [Shell Router](#shell-router)
  - [ATS Module Routes](#ats-module-routes)
  - [Standalone Development Mode](#standalone-development-mode)
- [Creating a New Project](#creating-a-new-project)
  - [New Application](#new-application)
  - [New Library / Package](#new-library--package)
- [Packages Reference](#packages-reference)
- [Nx Concepts (Primer for New Developers)](#nx-concepts-primer-for-new-developers)
- [Dependency Graph](#dependency-graph)
- [CI & Caching](#ci--caching)
- [Code Style](#code-style)

---

## Project Overview

This monorepo hosts the CGP frontend codebase. It currently contains:

| Location | Name | Description |
|---|---|---|
| `apps/cooperate-portal-shell` | `cooperate-portal-shell` | Main React SPA for cooperates |
| `packages/ui-kit` | `@cgp/ui-kit` | Shared component library (shadcn/ui + Radix) |
| `packages/data-access` | `@cgp/data-access` | Shared data fetching (Axios + TanStack Query) |
| `packages/eslint-config` | `@cgp/eslint-config` | Shared ESLint configuration |
| `packages/tsconfig` | `@cgp/tsconfig` | Shared TypeScript base configs |

---

## Workspace Structure

```
cgp-frontend-monorepo/
├── apps/
│   └── cooperate-portal-shell/  # React app (shell / entry point)
│       ├── src/
│       │   ├── components/      # App-specific components
│       │   ├── test/            # Test setup and globals
│       │   └── App.tsx
│       ├── .env                 # Default env vars (committed, localhost values)
│       ├── .env.local           # Developer overrides (gitignored)
│       ├── .env.example         # Template – copy to .env.local to get started
│       ├── vite.config.ts       # Vite build config
│       ├── vitest.config.ts     # Vitest test config (separate from vite to avoid version conflicts)
│       └── package.json
├── packages/
│   ├── data-access/             # Shared data-fetching layer (Axios + TanStack Query)
│   │   └── src/
│   │       ├── http-client.ts   # Axios instance (reads VITE_API_BASE_URL)
│   │       ├── query-client.ts  # TanStack QueryClient singleton
│   │       └── index.ts         # Public API re-exports
│   ├── ui-kit/                  # Shared UI component library
│   │   └── src/
│   │       ├── components/
│   │       │   └── ui/          # shadcn/ui base components
│   │       ├── hooks/
│   │       ├── lib/
│   │       └── styles/
│   ├── eslint-config/           # Shared ESLint rules
│   └── tsconfig/                # Shared TS configs
├── nx.json                      # Nx workspace configuration
├── pnpm-workspace.yaml          # pnpm workspace definition
└── package.json                 # Root scripts & devDependencies
```

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [React 19](https://react.dev) | UI framework |
| [Vite 8](https://vite.dev) | Build tool & dev server |
| [TypeScript 6](https://www.typescriptlang.org) | Type safety |
| [Tailwind CSS v4](https://tailwindcss.com) | Styling |
| [shadcn/ui](https://ui.shadcn.com) | Component primitives |
| [Radix UI](https://www.radix-ui.com) | Headless UI primitives |
| [React Hook Form](https://react-hook-form.com) | Form management |
| [Vitest](https://vitest.dev) | Unit testing |
| [Testing Library](https://testing-library.com) | Component testing utilities |
| [Nx 22](https://nx.dev) | Monorepo tooling (task running, caching, generators) |
| [pnpm 10](https://pnpm.io) | Package manager |

---

## Prerequisites

- **Node.js** v20 or later — [download](https://nodejs.org)
- **pnpm** v10 — install via `npm install -g pnpm@10`
- **Nx CLI** (optional but recommended) — `npm install -g nx@latest`

> You can run all Nx commands with `pnpm nx` without installing the global CLI.

---

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd cgp-frontend-monorepo

# 2. Install dependencies (installs for all apps and packages at once)
pnpm install

# 3. Configure environment (per-app, not at root)
cp apps/cooperate-portal-shell/.env.example apps/cooperate-portal-shell/.env.local
# then edit .env.local with your local API URL

# 4. Start the cooperate portal dev server
pnpm nx serve cooperate-portal-shell
```

Open http://localhost:5173 in your browser.

---

## Running Tasks

All tasks should be run via Nx so that caching, dependency ordering, and affected-project detection work correctly.

### Development Server

```bash
# Start the cooperate-portal-shell dev server
pnpm nx serve cooperate-portal-shell
```

### Build

```bash
# Build a single project
pnpm nx build cooperate-portal-shell

# Build all projects (respects build order)
pnpm nx run-many -t build

# Build only projects affected by your changes
pnpm nx affected -t build
```

### Testing

```bash
# Run tests for a single project (runs once, no watch)
pnpm nx test cooperate-portal-shell

# Run tests for a single project in watch mode
pnpm nx vite:test cooperate-portal-shell

# Run tests with coverage
pnpm nx test:coverage cooperate-portal-shell

# Run tests for all projects
pnpm nx run-many -t test

# Run tests only for projects affected by your changes
pnpm nx affected -t test
```

### Linting & Formatting

```bash
# Lint a single project
pnpm nx eslint:lint cooperate-portal-shell

# Lint all projects
pnpm nx run-many -t eslint:lint

# Format all files
pnpm format

# Check formatting without writing
pnpm format:check
```

Root-level convenience scripts (defined in the root `package.json`):

```bash
pnpm format        # formats all files with Prettier
pnpm format:check  # checks formatting without writing
```

---

## Routing Architecture

This project uses a **micro-frontend (MFE) routing** pattern via [Module Federation](https://github.com/originjs/vite-plugin-federation). The shell owns the top-level router; each remote module owns its own nested routes.

### Shell Router

`apps/cooperate-portal-shell` creates the single `createBrowserRouter` for the entire application. It defines top-level layout and delegates feature segments to remote modules via a wildcard route.

```
/dashboard              → MainLayout (shell)
  /dashboard/ats/*      → AtsRoutes  (lazy-loaded from ats-module remote)
/not-found              → NotFoundPage
*                       → NotFoundPage
```

The shell sets `window.__POWERED_BY_SHELL__ = true` before mounting so remote modules can detect whether they are embedded or running standalone.

### ATS Module Routes

`apps/ats-module` exposes an `AtsRoutes` component (a nested `<Routes>`) that handles all feature navigation under `/dashboard/ats`. Paths are **relative** to the shell's mount point.

| Full URL | Component |
|---|---|
| `/dashboard/ats` | `VacanciesPage` (index) |
| `/dashboard/ats/vacancies` | `VacanciesPage` |
| `/dashboard/ats/vacancies/new` | `NewVacancyPage` |
| `/dashboard/ats/vacancies/:id/edit` | `VacancyIdNewPage` |
| `/dashboard/ats/find-candidate` | Find Candidate |
| `/dashboard/ats/**` (no match) | Redirects to `/not-found` |

Page components live in `src/app/vacancy/pages/` and are exported through barrel files:

```
src/app/
└── vacancy/
    ├── index.ts              ← barrel (re-exports pages)
    └── pages/
        ├── index.ts          ← barrel
        ├── vacancies-page.tsx
        ├── new-vacancy-page.tsx
        └── vacancy-id-new-page.tsx
```

### Standalone Development Mode

Each remote module can run independently without the shell. The `ats-module` detects this with:

```ts
const standalone = !window.__POWERED_BY_SHELL__;
```

When `standalone` is `true`, `main.tsx` mounts its own `createBrowserRouter` with the same absolute paths (`/dashboard/ats/...`). The `AtsRoutes` component is **not** used in this mode.

```bash
# Start ats-module in standalone mode (port 5173)
pnpm nx serve ats-module

# Start the shell (port 5174) — loads ats-module as a remote
pnpm nx serve cooperate-portal-shell
```

> **Shared singletons** — `react`, `react-dom`, `react-router-dom`, and `@tanstack/react-query` are listed in `shared` in both Vite federation configs so that only one instance of each library is loaded at runtime.

---

## Creating a New Project

### New Application

1. Use the Nx Vite/React generator to scaffold a new app:

   ```bash
   pnpm nx g @nx/react:app apps/my-new-app
   ```

2. When prompted, choose your preferred options (bundler: Vite, style: Tailwind, etc.).

3. Add shared packages as dependencies in the new app's `package.json`:

   ```json
   {
     "dependencies": {
       "@cgp/ui-kit": "workspace:*"
     },
     "devDependencies": {
       "@cgp/eslint-config": "workspace:*",
       "@cgp/tsconfig": "workspace:*"
     }
   }
   ```

4. Run `pnpm install` to link the workspace packages.

5. Follow the patterns in `apps/cooperate-portal` for ESLint config (`eslint.config.js`), TypeScript config (`tsconfig.json`), and Vite config (`vite.config.ts`).

### New Library / Package

1. Scaffold a new library:

   ```bash
   pnpm nx g @nx/js:lib packages/my-lib --bundler=vite
   ```

2. Set the package name in `package.json` following the `@cgp/` namespace convention.

3. Export your public API from `src/index.ts`.

4. Add `"workspace:*"` as the version in any app that depends on it, then run `pnpm install`.

---

## Packages Reference

### `@cgp/data-access`

Shared data-fetching layer. Wraps Axios and TanStack Query with workspace-wide defaults.

```ts
import { useQuery, useMutation, httpClient } from '@cgp/data-access';

// Use the pre-configured Axios instance
function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => httpClient.get('/jobs').then((r) => r.data),
  });
}
```

The `httpClient` base URL is read from `VITE_API_BASE_URL` — configured per-app in `.env` / `.env.local`.

### `@cgp/ui-kit`

Shared component library. Import paths follow the `exports` map defined in `packages/ui-kit/package.json`:

```ts
// shadcn/ui base components
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Input }  from '@cgp/ui-kit/components/ui/input';

// Custom composite components
import { MultipleSelector }      from '@cgp/ui-kit/components/multiple-selector';
import { PhoneInput }            from '@cgp/ui-kit/components/phone-input';
import { LocationAutocomplete }  from '@cgp/ui-kit/components/location-autocomplete';

// Hooks
import { useDeviceOrientation } from '@cgp/ui-kit/hooks/use-device-orientation';

// Utilities
import { cn } from '@cgp/ui-kit/lib/utils';

// Global CSS (import once in your app entry)
import '@cgp/ui-kit/globals.css';
```

### `@cgp/eslint-config`

Shared ESLint flat config. Reference it in your app's `eslint.config.js`:

```js
import baseConfig  from '@cgp/eslint-config/base';
import reactConfig from '@cgp/eslint-config/react';

export default [...baseConfig, ...reactConfig];
```

### `@cgp/tsconfig`

Shared TypeScript base configs. Extend in your `tsconfig.json`:

```json
{
  "extends": "@cgp/tsconfig/app.json",
  "compilerOptions": { ... }
}
```

Available presets: `base.json`, `app.json`, `library.json`, `node.json`.

---

## Nx Concepts (Primer for New Developers)

> Already familiar with Nx? Skip to [Running Tasks](#running-tasks).

### What is Nx?

Nx is a build system built for monorepos. It sits on top of your existing tools (Vite, Vitest, ESLint) and adds:

- **Smart caching** — if nothing changed, task output is replayed instantly from cache.
- **Affected commands** — only rebuild/retest what was impacted by your changes.
- **Dependency graph** — understands which projects depend on which.
- **Generators** — scaffold new apps and libraries with consistent structure.

### How Nx knows about projects

Nx auto-detects projects by reading every `package.json` in the `apps/` and `packages/` directories (defined in `pnpm-workspace.yaml`).

### How Nx knows about targets (tasks)

The plugins listed in `nx.json` inspect your config files and infer targets automatically:

| Plugin | Inferred targets |
|---|---|
| `@nx/vite/plugin` | `serve`, `vite:build`, `vite:test`, `vite:preview` |
| `@nx/eslint/plugin` | `eslint:lint` |
| `@nx/vitest` | `vitest:test` |

Package.json `scripts` are also exposed as Nx targets (e.g., a `test` script becomes `nx test <project>`).

### Running a target

```
pnpm nx <target> <project>
# or
pnpm nx run <project>:<target>
```

Examples:
```bash
pnpm nx serve cooperate-portal-shell
pnpm nx vite:build cooperate-portal-shell
pnpm nx eslint:lint cooperate-portal-shell
```

### Caching

Nx caches task outputs locally in `.nx/cache`. If you run `nx build cooperate-portal` twice with no file changes, the second run is instant. To force a fresh run:

```bash
pnpm nx build cooperate-portal --skip-nx-cache
```

### Affected commands

When working in a branch, only run tasks for projects touched by your changes:

```bash
pnpm nx affected -t test
pnpm nx affected -t build
```

Nx compares your working tree against the `defaultBase` branch (set to `develop` in `nx.json`).

---

## Dependency Graph

Visualize how projects relate to each other:

```bash
pnpm nx graph
```

This opens an interactive graph in your browser showing all project dependencies.

---

## CI & Caching

For CI pipelines, use `nx affected` to minimize work:

```bash
# In CI, set the base to the target branch
pnpm nx affected -t build,test,eslint:lint --base=origin/main --head=HEAD
```

Enable [Nx Cloud](https://nx.app) for distributed remote caching across CI runs (see `nx.json` to add `nxCloudAccessToken`).

---

## Code Style

- **Prettier** — all files formatted on commit via `lint-staged` + `husky` pre-commit hook.
- **ESLint** — using shared `@cgp/eslint-config` rules (TypeScript + React hooks + React Refresh).
- **Import order** — managed by `@trivago/prettier-plugin-sort-imports`.
- **Tailwind class order** — managed by `prettier-plugin-tailwindcss`.

Run `pnpm format` before pushing if you bypass the pre-commit hook.

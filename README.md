# MediaForge — Headless Media Ecosystem

MediaForge is a modular headless media SDK ecosystem built around the Pexels API. It provides framework-agnostic core logic, React/React Native adapters, independent headless UI behavior primitives, and a demonstration web application.

---

## 🏛️ Ecosystem Architecture

```text
                                  Pexels API
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │     media-core      │
                           │ (Framework-Agnostic)│
                           └──────────┬──────────┘
                                      │
                          ┌───────────┴───────────┐
                          ▼                       ▼
                  ┌──────────────┐        ┌──────────────┐
                  │ media-react  │        │ media-native │
                  └───────┬──────┘        └──────────────┘
                          │
                          ▼
                  ┌──────────────┐  ◄───── ┌─────────────────┐
                  │     web      │         │  media-ui-react │
                  │ (Application)│         │ (Headless UI)   │
                  └──────────────┘         └─────────────────┘

                  ┌─────────────────┐
                  │ media-ui-native │  (Independent Headless UI)
                  └─────────────────┘
```

---

## 📦 Package Summary

| Package | Role & Responsibility | Allowed Imports | Forbidden Imports |
|---|---|---|---|
| **`media-core`** | Domain models, Pexels API fetching, TTL caching, request deduplication, typed errors, event emitter. | TypeScript, Web-Standard APIs | React, React Native, DOM APIs, downstream packages |
| **`media-react`** | React Context (`MediaProvider`), `useMediaSearch`, `useMediaItem`, `useMediaEvents` hooks. | `media-core`, `react` | `media-ui-react`, `media-native`, `web` |
| **`media-native`** | React Native Context (`MediaProvider`), `useMediaSearch`, `useMediaItem`, `useMediaEvents` hooks. | `media-core`, `react`, `react-native` | `media-react`, `media-ui-native`, `web` |
| **`media-ui-react`** | Headless UI hooks for web (`useMediaGrid`, `useLightbox`, `useReelSwiper`, ARIA roles, focus trap). | `react` | `media-core`, `media-react`, CSS, Pexels |
| **`media-ui-native`** | Headless UI hooks for RN (`useMediaGrid`, `useLightbox`, `useReelSwiper`, Android back dismiss). | `react`, `react-native` | `media-core`, `media-native`, DOM, CSS |
| **`apps/web`** | Vite + React web application orchestrating SDK hooks, headless UI behavior, CSS styling, and telemetry. | `media-react`, `media-ui-react` | `media-native`, `media-ui-native` |

---

## 📐 Mandatory Architectural Invariants

MediaForge strictly enforces architectural package boundaries via automated static checks (`node scripts/check-architecture.cjs`):

1. **`media-core`**: Pure framework-agnostic TypeScript. Zero React, React Native, or DOM dependencies.
2. **`media-ui-react` & `media-ui-native`**: Genuinely headless behavioral primitives. Zero SDK imports, zero CSS styling.
3. **`media-react` & `media-native`**: Framework adapters over `media-core`. Own React/RN lifecycle without duplicating fetching or caching.
4. **`web`**: Presentation and composition root combining SDK hooks, headless UI behavior, and CSS design tokens.

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- Corepack / pnpm >= 8.0.0

### Installation & Environment Setup

```bash
# Clone repository & install dependencies
corepack pnpm install

# Copy environment variable template
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env to set your VITE_PEXELS_API_KEY
```

### Complete Verification Suite (Typecheck + Architecture Check + Tests + Build)

```bash
# Run full automated validation suite across all workspace packages
corepack pnpm validate
```

### Individual Development Commands

```bash
# Typecheck all packages
corepack pnpm typecheck

# Run architecture boundary check script
node scripts/check-architecture.cjs

# Run unit & integration tests (119 tests)
corepack pnpm test

# Build production bundles
corepack pnpm build

# Start local web development server
corepack pnpm --filter web dev
```

---

## 📖 System & Architectural Documentation

- [Architecture Overview](docs/architecture.md)
- [TypeScript API Design](docs/api-design.md)
- [Headless UI Architecture](docs/ui-architecture.md)
- [SDK Architecture Skill Guidelines](skills/media-sdk/SKILL.md)
- [Headless UI Skill Guidelines](skills/media-ui/SKILL.md)

---

## 🤖 AI-Assisted vs Hand-Written Breakdown

### Hand-Written & Architected Elements
- **Ecosystem Architecture & Package Boundaries**: Monorepo structure design separating framework-agnostic core (`media-core`), SDK adapters (`media-react`, `media-native`), and headless UI primitives (`media-ui-react`, `media-ui-native`).
- **Architectural Validation Script**: Custom AST/import boundary enforcer (`scripts/check-architecture.cjs`) validating imports across all 6 packages.
- **Contract & API Specs**: TypeScript interfaces, event emitter contracts, TTL cache eviction algorithms, and HTTP transport abstractions.
- **Headless UI State Machines**: Focus trapping, keyboard accessibility navigation (`ArrowLeft`, `ArrowRight`, `Escape`), and ARIA role attributes.

### AI-Assisted Implementation Elements
- **Test Suite Coverage**: Generating multi-case unit tests and Vitest integration suites for edge cases (cache hits, deduplication, error handling).
- **Vite & Monorepo Build Scripts**: Monorepo `pnpm-workspace.yaml` setup, `tsup`/`tsc` build targets, and Netlify deployment configuration (`netlify.toml` + `_redirects`).
- **Web App Editorial Design System**: Glassmorphic search interface, 12-card continuous camera cassette stream, and responsive CSS token system in `apps/web`.

### Utilization & Validation of Skill Docs (`skills/media-sdk` & `skills/media-ui`)
The two AI agent skill documents were utilized throughout development:
- **`skills/media-sdk/SKILL.md`**: Used to guide subagents when writing SDK hooks to ensure zero DOM/CSS leakage into `media-core` and prevent direct Pexels fetching in React adapters.
- **`skills/media-ui/SKILL.md`**: Used to validate that `media-ui-react` and `media-ui-native` primitives remain 100% style-agnostic and consume zero SDK data structures.

---

## 🔗 Evaluator Submission Links

- **GitHub Repository**: `https://github.com/your-username/MediaForge`
- **Live Deployed App (Netlify)**: `https://mediaforge-app.netlify.app`
- **SDK Documentation**: [docs/api-design.md](docs/api-design.md)
- **Components & Headless UI Documentation**: [docs/ui-architecture.md](docs/ui-architecture.md)
- **AI Conversation Transcripts**: `.system_generated/logs/transcript.jsonl`

# Yntra Platform

Yntra is a **Dynamic Modular Workspace Engine** designed for organizations that need a tailored operational OS without the rigidity of traditional ERPs. It bridges the gap between workforce coordination, internal communication, and administrative management.

## 🚀 The Vision: Modular Operations

Unlike fixed software, Yntra allows administrators to define the exact structure of their workspace.

- **Industry Templates:** Blueprints for Construction, Healthcare, Education, and more.
- **Block-Based Customization:** Admins can compose their own operations tool by selecting functional blocks (Messaging, Scheduling, Daily Notes, Time Reporting) based on real employee needs.
- **Agentic Foundation:** Designed to integrate AI-driven task coordination and automated operational insights.

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Vite.
- **Styling:** Tailwind CSS with `class-variance-authority` (CVA) for a robust design system.
- **Data/State:** TanStack Query (v5) for efficient server-state management.
- **Backend:** Supabase (Auth, Postgres, RLS, Realtime, Edge Functions).
- **PWA:** Fully installable Progressive Web App with offline-first capabilities via `vite-plugin-pwa`.
- **Internationalization:** Multi-language support via `i18next`.

## 💻 Local Development

This project uses **Bun** for maximum performance.

### Install dependencies:

```bash
bun install
```

### Run the dev server:

```bash
bun dev
```

### Run tests:

```bash
# Unit tests
bun test

# E2E tests (Playwright)
bun test:e2e
```

### Build for production:

```bash
bun run build
```

## 🏗 Backend / Data Model

The app uses Supabase for core infrastructure. The schema contract is maintained in `supabase_schema.sql`.

- **Workspace Awareness:** Every data point is strictly partitioned by `workspace_id`.
- **Role-Based Security:** Row-Level Security (RLS) ensures that Assistants, Admins, and Clients only see what they are permitted to.
- **Realtime Sync:** Critical modules (like Messaging) use Supabase Realtime for instant updates.

## 🌟 Recommended Direction

Yntra is positioned as the **Operational OS** for team-based organizations. Future development focuses on:

1. Expanding the "Block" library for more industries.
2. Enhancing the PWA offline data synchronization.
3. Integrating agentic AI for automated scheduling and report auditing.

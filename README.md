# Yntra Platform

Yntra is a workspace-based internal operations platform for organizations that coordinate people, teams, schedules, notes, and internal communication.

In practical terms, it sits somewhere between an intranet, a workforce operations tool, and a lightweight ERP. It is not a full ERP in the classic finance/procurement/inventory sense, but it does have ERP-like traits because it centralizes core operational data and workflows in one system.

## What This App Is

The product is built around day-to-day operational management for multi-team organizations, especially where scheduling, team coordination, notes, and staff administration are tightly connected.

Current app areas include:

- authentication and workspace-aware access
- directory management for workspaces, teams, members, and roles
- calendar and scheduling workflows
- internal inbox / messaging
- work notes / handoff documentation
- time reports and approval flows
- workspace and account settings

The current shape of the app suggests a strong fit for assistance, care, staffing, or other service organizations where team coordination matters more than traditional back-office ERP modules.

## Product Framing

If you want a short description:

`Yntra is an internal operations ERP-style platform for team-based service organizations.`

If you want a more precise description:

`Yntra is a workspace-based operations platform that combines scheduling, team management, internal messaging, notes, and time reporting in one system.`

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Radix UI / shadcn-style component setup
- TanStack Query
- Supabase
- React Router
- i18next

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Backend / Data Model

The app uses Supabase for:

- authentication
- database storage
- row-level security
- edge functions
- realtime-style update flows in some modules

The checked-in schema lives in [supabase_schema.sql](/C:/Users/hellich/Desktop/Yntra_Plattform/supabase_schema.sql), but it should be treated as the repo’s current schema contract, not as a substitute for proper migrations.

## Current Caveats

- The project has been evolving from a prototype/template base into a product-specific application.
- Some parts of the frontend and database contract were previously out of sync and have been tightened, but this is still an area to watch carefully.
- The architecture is moving toward a more coherent multi-module business app, but some feature areas are still more mature than others.

## Recommended Direction

If the product keeps moving in its current direction, the cleanest positioning is:

- not a generic website
- not just a calendar app
- not a full ERP
- an operations platform with ERP-like scope for team-based service work

That framing is narrow enough to be honest and broad enough to guide future features.

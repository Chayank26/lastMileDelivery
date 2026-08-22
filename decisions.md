# Architectural Decisions Log (`decisions.md`)

This file logs every meaningful architectural, technological, and design decision taken during the development of the **Last-Mile Delivery Management Platform**. Each entry documents the rationale, trade-offs, and justification for the decision.

---

## Phase 1: Monorepo Architecture Blueprint & Base Setup

### 1. Decision: Monorepo Structure (`npm` Workspaces with `/server` & `/client`)
* **Context:** The project requires a Node.js backend API, a React client frontend, shared TypeScript types/logic (like Turf.js schemas and rate calculation formulas), and unified script orchestration.
* **Why this approach?**
  * Keeping client and server in a unified repository simplifies local evaluator setup: a single `npm install` and `npm run dev` boots the entire stack.
  * Shared dependencies (like `@turf/turf` for geospatial calculations) can be managed cleanly without duplicative configuration across separate git repos.
* **Alternatives Considered:** Separate repositories (harder for evaluators to review and clone) or Next.js fullstack (adds serverless dynamic state limitations for persistent Socket.io connections).

### 2. Decision: Node.js + Express + TypeScript for Backend Service
* **Context:** Need an asynchronous, lightweight server capable of handling RESTful endpoints, ACID transactions, geospatial computations, and Socket.io WebSockets seamlessly.
* **Why this approach?**
  * TypeScript provides compile-time safety across complex domain models (GeoJSON features, rate card structures, state machines).
  * Express is robust, highly predictable, and supported by every deployment target (Render, Railway, AWS, Vercel).
* **Alternatives Considered:** Fastify (slightly higher performance, but Express has wider compatibility with Swagger/Nodemailer middlewares).

### 3. Decision: Vite + React + Tailwind CSS (Dark Slate Palette) for Frontend
* **Context:** Need a fast-loading SPA with instant feedback, interactive Leaflet maps, live timeline socket listeners, and an industrial fintech design aesthetic.
* **Why this approach?**
  * Vite provides sub-second Hot Module Replacement (HMR) and lightning-fast build speeds.
  * Tailwind CSS enables rapid visual styling matching the modern dark slate `#09090b` aesthetic expected by enterprise software evaluators (like Unthinkable Solutions).
* **Alternatives Considered:** Create React App (deprecated/slow), Vanilla JS (lacks state component abstractions needed for complex order tracking).

### 4. Decision: Living Documentation System (`decisions.md`, `flow.md`, `tech.md`)
* **Context:** The user requested full auditability of the engineering process after each phase.
* **Why this approach?**
  * Provides evaluators with deep visibility into engineering trade-offs, call hierarchies, and technology selection logic.

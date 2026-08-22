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

---

## Phase 2: Database Connection & Core Data Models (MongoDB + GeoJSON + Mongoose)

### 5. Decision: MongoDB + Mongoose with 2dsphere Spatial Indexing for GeoJSON Polygons
* **Context:** Zones are drawn as custom spatial polygons on an interactive map. We need to test whether an address coordinate falls inside a polygon boundary ($geoIntersects).
* **Why this approach?**
  * MongoDB natively supports GeoJSON `Polygon` and `Point` geometries with high-performance `2dsphere` spatial indexing.
  * Mongoose models enforce schema validation while allowing spatial indexing directly via `zoneSchema.index({ boundary: '2dsphere' })`.
* **Alternatives Considered:** Relational SQL with PostGIS (adds deployment complexity for evaluators who would need PostgreSQL + PostGIS extension installed locally).

### 6. Decision: ACID Session Transactions (`runInTransaction`) via MongoDB Sessions
* **Context:** When assigning orders to delivery agents, multiple concurrent requests (or automated triggers) could attempt to assign the same agent beyond their `maxConcurrentOrders` threshold.
* **Why this approach?**
  * `mongoose.startSession()` and `session.startTransaction()` provide ACID transaction guarantees across documents.
  * If an assignment condition fails or throws, all database mutations across `AgentProfile` and `Order` are atomically rolled back.

### 7. Decision: Immutable Event-Sourced `OrderAuditLog` Collection
* **Context:** Logistics platforms require an immutable, tamper-proof history of status changes for accountability.
* **Why this approach?**
  * Standard in-place document updates overwrite past state history.
  * By creating an append-only `OrderAuditLog` collection, every state transition logs the actor ID, actor role, IP address, payload snapshot, and cryptographic timestamp.


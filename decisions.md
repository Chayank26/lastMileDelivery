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

---

## Phase 3: Authentication System & Evaluator Demo Role Switcher

### 8. Decision: Stateless JWT Access Tokens over Session Cookies
* **Context:** Evaluators and clients need seamless API access across local, staging, and hosted production environments (Vercel/Render).
* **Why this approach?**
  * Stateless JWTs pass via standard `Authorization: Bearer <token>` HTTP headers without CORS cookie credential issues across domain boundaries.
  * Tokens store `userId`, `email`, and `role` claims, allowing instant middleware role verification without hitting the database on every check.

### 9. Decision: Evaluator 1-Click Demo Role Switcher Endpoint (`/api/auth/demo-login`)
* **Context:** Evaluators spend less than 3 minutes reviewing candidate submissions and find registering 3 different accounts to test Admin, Agent, and Customer flows tedious.
* **Why this approach?**
  * Exposing `/api/auth/demo-login` with `{ role: 'ADMIN' | 'AGENT' | 'CUSTOMER' }` automatically seeds demo accounts on demand and returns valid JWTs immediately.
  * Enables evaluators to test complete end-to-end delivery lifecycles in under 60 seconds without manually remembering or filling in credentials.

### 10. Decision: RBAC Guard Middleware Factory (`requireRole(...allowedRoles)`)
* **Context:** Different API routes require different permissions (e.g. creating zones is restricted to ADMIN, updating status is restricted to AGENT/ADMIN, placing orders is permitted for CUSTOMER/ADMIN).
* **Why this approach?**
  * A reusable middleware factory `requireRole(UserRole.ADMIN)` cleanly intercepts unauthorized requests before reaching controller logic, returning standard `403 Forbidden` responses.

---

## Phase 4: Geospatial Zone Management API & Turf.js Integration

### 11. Decision: In-Memory Turf.js Spatial Point-in-Polygon Matching alongside MongoDB `$geoIntersects`
* **Context:** Address coordinates pinned on a map or sent by users must be evaluated against active zone boundaries.
* **Why this approach?**
  * Turf.js (`turf.booleanPointInPolygon`) provides pure in-memory spatial calculation that can execute directly within Node.js memory without requiring database roundtrips for every preview calculation.
  * Ensures zero database dependency overhead when performing fast rate calculations on the frontend or backend.

### 12. Decision: GeoJSON Polygon Linear Ring Closure Validation Rule
* **Context:** Geometries received from raw map polygon drawings or API requests must conform to official RFC 7946 GeoJSON specifications.
* **Why this approach?**
  * A GeoJSON Polygon linear ring must contain at least 4 position arrays, where the first position `[lng, lat]` is strictly equal to the final position `[lng, lat]`.
  * Enforcing `validateGeoJsonPolygon()` before database writes prevents corrupted spatial polygons from causing 2dsphere indexing exceptions.

### 13. Decision: Auto-Seeding Sample Enterprise Delivery Zones (`POST /api/zones/seed`)
* **Context:** Evaluators testing the application need realistic pre-configured delivery zones (e.g. Gurgaon, Delhi, Noida) out of the box.
* **Why this approach?**
  * Providing an automated seed helper ensures evaluators can immediately render interactive Leaflet maps and test intra vs. inter-zone rate rules without drawing polygons manually from scratch.




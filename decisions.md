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

---

## Phase 5: Dynamic Rate Calculation Engine (Pure Core Logic)

### 14. Decision: Pure Functional Rate Calculation Engine Architecture
* **Context:** Rate calculation logic involves multi-variable rules (dimensions, actual weight, volumetric divisor, zone tiering, B2B/B2C rates, COD surcharges).
* **Why this approach?**
  * Building `calculateOrderPrice` as a pure, side-effect-free function accepting `IRateCalculationParams` ensures 100% deterministic mathematical outcomes.
  * Allows both pre-order cost previews, backend order placement endpoints, and admin rate sandbox simulators to consume the exact same underlying formula without duplicating pricing logic.

### 15. Decision: Billable Weight Selection Rule ($\max(\text{Actual Weight}, \text{Volumetric Weight})$)
* **Context:** Light bulky packages (e.g. large styrofoam boxes) take up significant cargo volume in delivery vans despite low physical weight.
* **Why this approach?**
  * Standard industry volumetric formula $\frac{L \times B \times H}{5000}$ computes equivalent volumetric mass.
  * Billing on the higher value ensures logistics cost recovery while providing full breakdown transparency (`actualWeightKg`, `volumetricWeightKg`, `billableWeightKg`) to customers before order confirmation.

---

## Phase 6: Rate Card Management API & Admin Pricing Sandbox

### 16. Decision: Ephemeral Rate Parameter Overrides in Pricing Sandbox (`POST /api/rates/simulate`)
* **Context:** Admins and logistics managers need an interactive sandbox widget to tweak B2B/B2C sliders, base fees, and volumetric divisors ($5000 \to 4000$) to observe margin impact across sample routes without altering live production rate cards.
* **Why this approach?**
  * Accepting an optional `rateCardOverrides` payload in `/api/rates/simulate` merges incoming slider parameters over the stored default `RateCard` in memory.
  * Evaluators can experiment with pricing variations dynamically in the Admin Sandbox without corrupting real customer order pricing.

### 17. Decision: Auto-Enforced Single Default Rate Card Constraint
* **Context:** Multiple rate cards can exist in the system, but only one active card should serve as the system-wide default.
* **Why this approach?**
  * When creating or updating a rate card with `isDefault: true`, the controller atomically executes `RateCard.updateMany({ _id: { $ne: targetId } }, { isDefault: false })`.
  * Prevents configuration ambiguity when customers request pre-order price previews.

---

## Phase 7: Order Creation API with ACID & Initial Status Assignment

### 18. Decision: Atomic Dual-Write Session Transaction for Order & Audit Log
* **Context:** Creating an order must simultaneously write the primary `Order` entity and seed its first `OrderAuditLog` event record (`action: 'ORDER_CREATED'`).
* **Why this approach?**
  * Wrapping both write operations inside `runInTransaction(session => ...)` ensures that if audit log creation fails or database connection drops mid-request, the order creation is fully rolled back.
  * Guarantees 100% data integrity between live order states and immutable event history ledger.

### 19. Decision: Public Collision-Resistant `trackingId` Format (`ORD-YYYY-XXXXXX`)
* **Context:** Customers and evaluators need a clean, human-readable identifier to look up live shipment status without exposing database internal MongoDB ObjectIDs.
* **Why this approach?**
  * Combining year prefix `ORD-2026-` with 6 uppercase crypto-random hexadecimal characters creates non-sequential, memorable tracking codes suitable for public tracking URLs (`/track/ORD-2026-K92A8F`).

### 20. Decision: Role-Scoped Query Filtering in Order Search Endpoint
* **Context:** `GET /api/orders` is used by Customers, Delivery Agents, and Admins.
* **Why this approach?**
  * Customers are automatically filtered to `customer: req.user._id`.
  * Delivery Agents are automatically filtered to `assignedAgent: req.user._id`.
  * Admins receive full visibility with multi-filter query params (`status`, `zoneId`, `agentId`, `orderType`).

---

## Phase 8: Haversine Nearest-Neighbor Agent Auto-Assignment Engine (ACID Protected)

### 21. Decision: Greedy Haversine Nearest-Neighbor Solver with Primary Zone Bias
* **Context:** Logistics dispatching requires auto-assigning orders to the optimal available delivery agent.
* **Why this approach?**
  * Haversine distance (`calculateHaversineDistanceKm`) measures exact spherical distance from agent location to pickup location.
  * Adding a 2.0 km bonus score for agents assigned to the order's primary pickup zone prioritizes local zone familiarity before falling back to outer agents.

### 22. Decision: Concurrency-Bounded Agent State Machine (`MAX_CAPACITY`)
* **Context:** Overloading a single delivery agent with 10 packages leads to delayed customer deliveries.
* **Why this approach?**
  * Enforces `maxConcurrentOrders` limit (e.g. 3 active shipments).
  * Automatically transitions agent status to `MAX_CAPACITY` when limit is reached, filtering them out of future auto-assignment solver queries until current deliveries complete.

### 23. Decision: ACID Session Lock for Agent Assignment to Prevent Race Conditions
* **Context:** Two simultaneous order placements or admin triggers could attempt to assign the same agent at `currentActiveOrderCount = 2`, driving count to 4 (exceeding max capacity 3).
* **Why this approach?**
  * Executing assignment inside `runInTransaction(session => ...)` checks `currentActiveOrderCount < maxConcurrentOrders` under database transaction isolation, preventing duplicate concurrent agent assignments.

---

## Phase 9: Order Status Lifecycle & State Machine Enforcement

### 24. Decision: Directed Graph State Machine Validation (`isValidStatusTransition`)
* **Context:** Preventing illegal state transitions (e.g. jumping from `CREATED` directly to `DELIVERED` without `PICKED_UP` or `OUT_FOR_DELIVERY`).
* **Why this approach?**
  * Defining a strict directed adjacency list `PERMITTED_STATUS_TRANSITIONS` enforces valid real-world physical delivery lifecycles (`CREATED` $\to$ `PICKED_UP` $\to$ `IN_TRANSIT` $\to$ `OUT_FOR_DELIVERY` $\to$ `DELIVERED` / `FAILED`).
  * Rejects illegal state skips with an immediate `422 Unprocessable Entity` response.

### 25. Decision: Automatic Agent Capacity Release on Terminal & Failed States
* **Context:** When an order completes (`DELIVERED`), is `CANCELLED`, or fails (`FAILED`), the assigned agent frees up capacity to accept new shipments.
* **Why this approach?**
  * The transition controller automatically decrements `currentActiveOrderCount` on `AgentProfile`.
  * If the agent was previously locked in `MAX_CAPACITY` status, the controller automatically restores their status to `EN_ROUTE_PICKUP` or `IDLE`, bringing them back into the auto-assignment pool.









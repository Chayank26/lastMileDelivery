# System Flow & Execution Architecture (`flow.md`)

This file details the runtime flow, entrypoints, sequence of execution, and call graphs for the codebase as built up to the current phase.

---

## Phase 1 Execution Flow

```
[System Boot]
     │
     ├── Server Entrypoint: server/src/index.ts
     │     ├── Loads Config: server/src/config/env.ts (Reads .env variables)
     │     ├── Instantiates Express App: server/src/app.ts
     │     │     ├── Registers Middlewares: cors(), express.json()
     │     │     ├── Binds Healthcheck Routes: GET /health, GET /
     │     │     └── Registers Global Error Handlers & 404 Catchers
     │     └── Binds HTTP Listener on Port 5000
     │
     └── Client Entrypoint: client/src/main.tsx
           ├── Mounts DOM Root: index.html (#root)
           └── Renders Root Component: client/src/App.tsx
                 └── Pings Backend Healthcheck (/api/health)
```

### Entry Points
1. **Server Entry Point:** [server/src/index.ts](file:///Users/chayankbhargava/Projects/lastMileDelivery/server/src/index.ts)
   * Execution Order: `dotenv.config` $\rightarrow$ `config/env.ts` $\rightarrow$ `app.ts` $\rightarrow$ `http.createServer` $\rightarrow$ `listen(5000)`
2. **Client Entry Point:** [client/src/main.tsx](file:///Users/chayankbhargava/Projects/lastMileDelivery/client/src/main.tsx)
   * Execution Order: `index.html` $\rightarrow$ `main.tsx` $\rightarrow$ `App.tsx`

### Function & Module Call Graph (Phase 1)
* `server/src/index.ts` calls:
  * `config` from `server/src/config/env.ts` to retrieve `port`, `nodeEnv`, and `clientUrl`.
  * `app` from `server/src/app.ts` to attach to `http.createServer()`.
* `server/src/app.ts` calls:
  * `cors()` middleware to allow cross-origin requests from `http://localhost:5173`.
  * `express.json()` middleware to parse body payloads up to 10MB.
* `client/src/App.tsx` calls:
  * `fetch('/api/health')` to query server health and display active phase status.

---

## Phase 2 Execution & Database Architecture Flow

```
[Server Entrypoint: index.ts]
        │
        ▼
[connectDatabase(): config/db.ts]
        │
        ├── Mongoose Connects to MONGODB_URI
        ├── Registers Connection Lifecycle Events (connected, error, disconnected)
        │
        ▼
[Data Models Registered: server/src/models/]
        │
        ├── User.ts ─────────► RBAC Roles (CUSTOMER, AGENT, ADMIN) & bcrypt password hashing
        ├── Zone.ts ─────────► GeoJSON Polygons + 2dsphere Spatial Index
        ├── RateCard.ts ─────► Dynamic Pricing rules (Volumetric Divisor, Base Fee, Intra/Inter Rates)
        ├── AgentProfile.ts ─► Agent Status Machine, Location Point + 2dsphere, Concurrency limit
        ├── Order.ts ────────► Addresses, Package dimensions, Price Breakdown, Failure diagnostics
        └── OrderAuditLog.ts ► Immutable Append-Only Event Ledger
```

### Database & Model Dependencies (Phase 2)
1. **[User.ts](file:///Users/chayankbhargava/Projects/lastMileDelivery/server/src/models/User.ts):**
   * Referenced by `Order.ts` (`customer`, `createdByAdmin`, `assignedAgent`) and `AgentProfile.ts` (`user`).
2. **[Zone.ts](file:///Users/chayankbhargava/Projects/lastMileDelivery/server/src/models/Zone.ts):**
   * Indexed via `2dsphere` spatial boundary. Referenced by `Order.ts` (`pickupZone`, `dropZone`) and `AgentProfile.ts` (`assignedZone`).
3. **[AgentProfile.ts](file:///Users/chayankbhargava/Projects/lastMileDelivery/server/src/models/AgentProfile.ts):**
   * Indexed via `2dsphere` on `currentLocation`. Enforces concurrency bounds (`currentActiveOrderCount <= maxConcurrentOrders`).
4. **[OrderAuditLog.ts](file:///Users/chayankbhargava/Projects/lastMileDelivery/server/src/models/OrderAuditLog.ts):**
   * Append-only ledger written whenever an `Order` status transitions.


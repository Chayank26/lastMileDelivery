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
1. **Server Entry Point:** `server/src/index.ts`
   * Execution Order: `dotenv.config` $\rightarrow$ `config/env.ts` $\rightarrow$ `app.ts` $\rightarrow$ `http.createServer` $\rightarrow$ `listen(5000)`
2. **Client Entry Point:** `client/src/main.tsx`
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
[Server Entrypoint: server/src/index.ts]
        │
        ▼
[connectDatabase(): server/src/config/db.ts]
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
1. **`server/src/models/User.ts`:**
   * Referenced by `Order.ts` (`customer`, `createdByAdmin`, `assignedAgent`) and `AgentProfile.ts` (`user`).
2. **`server/src/models/Zone.ts`:**
   * Indexed via `2dsphere` spatial boundary. Referenced by `Order.ts` (`pickupZone`, `dropZone`) and `AgentProfile.ts` (`assignedZone`).
3. **`server/src/models/AgentProfile.ts`:**
   * Indexed via `2dsphere` on `currentLocation`. Enforces concurrency bounds (`currentActiveOrderCount <= maxConcurrentOrders`).
4. **`server/src/models/OrderAuditLog.ts`:**
   * Append-only ledger written whenever an `Order` status transitions.

---

## Phase 3 Execution & Authentication Flow

```
[HTTP Request: POST /api/auth/demo-login]
        │
        ▼
[Router: server/src/routes/authRoutes.ts]
        │
        ▼
[Controller: demoLogin in server/src/controllers/authController.ts]
        │
        ├── Evaluates requested role: 'ADMIN' | 'AGENT' | 'CUSTOMER'
        ├── Checks if demo user account exists in MongoDB (`server/src/models/User.ts`)
        ├── Seeds user account & AgentProfile (if AGENT role and missing)
        ├── Signs JWT access token via `generateToken()` (`server/src/utils/jwt.ts`)
        └── Returns HTTP 200 { token, user } payload

[HTTP Request to Protected Endpoint (e.g. GET /api/auth/me)]
        │
        ▼
[Middleware: authenticate in server/src/middleware/auth.ts]
        │
        ├── Extracts 'Authorization: Bearer <token>' header
        ├── Verifies JWT via `verifyToken()` (`server/src/utils/jwt.ts`)
        ├── Fetches user from DB & attaches to `req.user`
        │
        ▼
[Middleware: requireRole(allowedRoles) in server/src/middleware/auth.ts]
        │
        ├── Compares `req.user.role` against `allowedRoles`
        ├── If unauthorized: Returns HTTP 403 Forbidden
        └── If permitted: Calls `next()` to execute target Controller
```

### Module Call Graph (Phase 3)
* `server/src/routes/authRoutes.ts` maps:
  * `POST /register` $\rightarrow$ `register` in `server/src/controllers/authController.ts`
  * `POST /login` $\rightarrow$ `login` in `server/src/controllers/authController.ts`
  * `POST /demo-login` $\rightarrow$ `demoLogin` in `server/src/controllers/authController.ts`
  * `GET /me` $\rightarrow$ `authenticate` middleware $\rightarrow$ `getMe` in `server/src/controllers/authController.ts`

---

## Phase 4 Execution & Geospatial Zone Detection Flow

```
[HTTP Request: POST /api/zones/detect]
        │
        ▼
[Router: server/src/routes/zoneRoutes.ts]
        │
        ▼
[Controller: detectZoneByPoint in server/src/controllers/zoneController.ts]
        │
        ├── Fetches active Zone document boundaries from MongoDB (`server/src/models/Zone.ts`)
        ├── Invokes `detectZoneForCoordinates(lng, lat, activeZones)` in `server/src/utils/geo.ts`
        │     │
        │     ├── Constructs Turf.js Point feature: `turf.point([lng, lat])`
        │     ├── Loops through active zones and constructs Turf.js Polygon features
        │     └── Evaluates `turf.booleanPointInPolygon(point, polygon)`
        │
        └── Returns HTTP 200 { isUnzoned: boolean, matchedZone: { id, name, code, colorHex } }
```

### Module Call Graph (Phase 4)
* `server/src/routes/zoneRoutes.ts` maps:
  * `GET /` $\rightarrow$ `getAllZones` in `server/src/controllers/zoneController.ts`
  * `POST /detect` $\rightarrow$ `detectZoneByPoint` in `server/src/controllers/zoneController.ts` $\rightarrow$ `detectZoneForCoordinates` in `server/src/utils/geo.ts`
  * `POST /` $\rightarrow$ `authenticate` $\rightarrow$ `requireRole(ADMIN)` $\rightarrow$ `createZone` in `server/src/controllers/zoneController.ts` $\rightarrow$ `validateGeoJsonPolygon` in `server/src/utils/geo.ts`
  * `POST /seed` $\rightarrow$ `authenticate` $\rightarrow$ `requireRole(ADMIN)` $\rightarrow$ `seedSampleZones` in `server/src/controllers/zoneController.ts`



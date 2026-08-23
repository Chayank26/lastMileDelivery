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

---

## Phase 5 Execution & Rate Engine Calculation Flow

```
[Inputs: Dimensions (L×B×H), Actual Weight, Order Type (B2B/B2C), Payment Type (Prepaid/COD), Pickup Zone, Drop Zone, RateCard]
        │
        ▼
[calculateOrderPrice() in server/src/services/rateEngine.ts]
        │
        ├── 1. Calculate Volumetric Weight: (Length × Width × Height) / rateCard.volumetricDivisor
        ├── 2. Determine Billable Weight: Max(Actual Weight, Volumetric Weight)
        ├── 3. Determine Zone Tier: (pickupZoneId === dropZoneId) ? Intra-Zone : Inter-Zone
        ├── 4. Select Rate per Kg:
        │        ├── Intra-Zone B2B ──► rateCard.intraZoneB2BRatePerKg
        │        ├── Intra-Zone B2C ──► rateCard.intraZoneB2CRatePerKg
        │        ├── Inter-Zone B2B ──► rateCard.interZoneB2BRatePerKg
        │        └── Inter-Zone B2C ──► rateCard.interZoneB2CRatePerKg
        ├── 5. Calculate Weight Fee: Billable Weight × Rate per Kg
        ├── 6. Calculate COD Surcharge: (PaymentType === COD) ? (Flat Surcharge + codAmount * PercentageFee) : 0
        └── 7. Calculate Total Charge: Base Fee + Weight Fee + COD Surcharge
```

### Module Call Graph (Phase 5)
* `server/src/services/rateEngine.ts` exports:
  * `calculateOrderPrice(params)`: Pure pricing calculation function.
* `server/src/services/rateEngine.test.ts` exports:
  * `runRateEngineTests()`: Verification test suite executing math assertions.

---

## Phase 6 Execution & Rate Card Simulator Flow

```
[HTTP Request: POST /api/rates/simulate]
        │
        ▼
[Router: server/src/routes/rateCardRoutes.ts]
        │
        ▼
[Controller: simulateRate in server/src/controllers/rateCardController.ts]
        │
        ├── Reads Dimensions, Actual Weight, Order Type, Payment Type, Coordinates / Zone IDs
        ├── If coordinates provided: Runs Turf.js spatial matching (`server/src/utils/geo.ts`) to infer Pickup & Drop Zones
        ├── Fetches active default RateCard from MongoDB (`server/src/models/RateCard.ts`)
        ├── Merges any `rateCardOverrides` from request body (ephemeral sandbox sliders)
        ├── Invokes `calculateOrderPrice()` in `server/src/services/rateEngine.ts`
        └── Returns HTTP 200 { simulation: { pickupZoneId, dropZoneId, isInterZone, priceBreakdown } }
```

### Module Call Graph (Phase 6)
* `server/src/routes/rateCardRoutes.ts` maps:
  * `GET /active` $\rightarrow$ `getActiveRateCard` in `server/src/controllers/rateCardController.ts`
  * `POST /simulate` $\rightarrow$ `simulateRate` in `server/src/controllers/rateCardController.ts` $\rightarrow$ `detectZoneForCoordinates` & `calculateOrderPrice`
  * `GET /` $\rightarrow$ `authenticate` $\rightarrow$ `requireRole(ADMIN)` $\rightarrow$ `getAllRateCards` in `server/src/controllers/rateCardController.ts`
  * `POST /` $\rightarrow$ `authenticate` $\rightarrow$ `requireRole(ADMIN)` $\rightarrow$ `createRateCard` in `server/src/controllers/rateCardController.ts`
  * `PUT /:id` $\rightarrow$ `authenticate` $\rightarrow$ `requireRole(ADMIN)` $\rightarrow$ `updateRateCard` in `server/src/controllers/rateCardController.ts`
  * `POST /seed` $\rightarrow$ `authenticate` $\rightarrow$ `requireRole(ADMIN)` $\rightarrow$ `seedDefaultRateCard` in `server/src/controllers/rateCardController.ts`

---

## Phase 7 Execution & Order Creation Flow

```
[HTTP Request: POST /api/orders]
        │
        ▼
[Middleware: authenticate in server/src/middleware/auth.ts]
        │
        ▼
[Controller: createOrder in server/src/controllers/orderController.ts]
        │
        ├── Detects Pickup & Drop Zones via `detectZoneForCoordinates` (`server/src/utils/geo.ts`)
        ├── Fetches active default `RateCard` from MongoDB (`server/src/models/RateCard.ts`)
        ├── Evaluates rate formula via `calculateOrderPrice()` (`server/src/services/rateEngine.ts`)
        ├── Generates tracking code: `generateTrackingId()` (`server/src/utils/trackingId.ts`)
        │
        ▼
[ACID Transaction: runInTransaction in server/src/config/db.ts]
        │
        ├── 1. Creates `Order` document (status: 'CREATED') (`server/src/models/Order.ts`)
        ├── 2. Writes append-only `OrderAuditLog` entry (`server/src/models/OrderAuditLog.ts`)
        └── Commits MongoDB session transaction
```

### Module Call Graph (Phase 7)
* `server/src/routes/orderRoutes.ts` maps:
  * `POST /` $\rightarrow$ `authenticate` $\rightarrow$ `createOrder` in `server/src/controllers/orderController.ts` $\rightarrow$ `detectZoneForCoordinates`, `calculateOrderPrice`, `runInTransaction`
  * `GET /` $\rightarrow$ `authenticate` $\rightarrow$ `getAllOrders` in `server/src/controllers/orderController.ts`
  * `GET /:id` $\rightarrow$ `authenticate` $\rightarrow$ `getOrderById` in `server/src/controllers/orderController.ts`
  * `GET /track/:trackingId` $\rightarrow$ `trackOrderByTrackingId` in `server/src/controllers/orderController.ts`

---

## Phase 8 Execution & Agent Auto-Assignment Flow

```
[HTTP Request: POST /api/orders/:id/auto-assign]
        │
        ▼
[Router: server/src/routes/orderRoutes.ts]
        │
        ▼
[Controller: autoAssignOrder in server/src/controllers/orderController.ts]
        │
        ▼
[ACID Session Transaction: runInTransaction in server/src/config/db.ts]
        │
        ▼
[Engine: executeAutoAssignment() in server/src/services/assignmentEngine.ts]
        │
        ├── 1. Queries active AgentProfiles (`server/src/models/AgentProfile.ts`)
        ├── 2. Filters out agents where `currentActiveOrderCount >= maxConcurrentOrders` or status is `OFFLINE` / `MAX_CAPACITY`
        ├── 3. Calculates Haversine distance (`calculateHaversineDistanceKm`) from agent location to pickup location
        ├── 4. Selects optimal agent (minimum distance with zone bonus score)
        ├── 5. Increments `currentActiveOrderCount` (transitions to `MAX_CAPACITY` if limit reached)
        ├── 6. Binds `assignedAgent` and `assignedAt` on `Order` (`server/src/models/Order.ts`)
        └── 7. Appends immutable `OrderAuditLog` entry (`action: AGENT_ASSIGNED`)
```

### Module Call Graph (Phase 8)
* `server/src/routes/orderRoutes.ts` maps:
  * `POST /:id/auto-assign` $\rightarrow$ `authenticate` $\rightarrow$ `requireRole(ADMIN)` $\rightarrow$ `autoAssignOrder` in `server/src/controllers/orderController.ts` $\rightarrow$ `executeAutoAssignment` in `server/src/services/assignmentEngine.ts`
  * `POST /:id/assign` $\rightarrow$ `authenticate` $\rightarrow$ `requireRole(ADMIN)` $\rightarrow$ `manualAssignOrder` in `server/src/controllers/orderController.ts`
* `server/src/routes/agentRoutes.ts` maps:
  * `GET /` $\rightarrow$ `authenticate` $\rightarrow$ `requireRole(ADMIN)` $\rightarrow$ `getAllAgents` in `server/src/controllers/agentController.ts`
  * `PUT /status` $\rightarrow$ `authenticate` $\rightarrow$ `requireRole(AGENT, ADMIN)` $\rightarrow$ `updateAgentStatus` in `server/src/controllers/agentController.ts`

---

## Phase 9 Execution & Order Status Lifecycle Flow

```
[HTTP Request: PATCH /api/orders/:id/status]
        │
        ▼
[Middleware: authenticate & requireRole(AGENT, ADMIN) in server/src/middleware/auth.ts]
        │
        ▼
[Controller: updateOrderStatus in server/src/controllers/orderController.ts]
        │
        ├── 1. Verifies Delivery Agent ownership (Agent can only update assigned orders)
        ├── 2. Validates transition: `isValidStatusTransition()` (`server/src/utils/stateMachine.ts`)
        ├── 3. If target is FAILED: Enforces mandatory `failureReasonCode` payload
        │
        ▼
[ACID Session Transaction: runInTransaction in server/src/config/db.ts]
        │
        ├── 1. Updates Order status in MongoDB (`server/src/models/Order.ts`)
        ├── 2. If DELIVERED / CANCELLED / FAILED: Decrements `currentActiveOrderCount` on `AgentProfile`
        └── 3. Appends immutable `OrderAuditLog` entry (`action: STATUS_UPDATED`)
```

### Module Call Graph (Phase 9)
* `server/src/routes/orderRoutes.ts` maps:
  * `PATCH /:id/status` $\rightarrow$ `authenticate` $\rightarrow$ `requireRole(AGENT, ADMIN)` $\rightarrow$ `updateOrderStatus` in `server/src/controllers/orderController.ts` $\rightarrow$ `isValidStatusTransition` in `server/src/utils/stateMachine.ts`

---

## Phase 10 Execution & Smart Reschedule Flow

```
[HTTP Request: POST /api/orders/:id/reschedule]
        │
        ▼
[Middleware: authenticate in server/src/middleware/auth.ts]
        │
        ▼
[Controller: rescheduleOrder in server/src/controllers/orderController.ts]
        │
        ├── 1. Verifies order is in FAILED or RESCHEDULED status
        ├── 2. If updatedDropAddress provided: Runs Turf.js re-zoning (`detectZoneForCoordinates`)
        ├── 3. If switchPaymentToPrepaid requested: Zeroes COD surcharge
        ├── 4. If address/payment changed: Re-evaluates Rate Engine (`calculateOrderPrice()`)
        │
        ▼
[ACID Session Transaction: runInTransaction in server/src/config/db.ts]
        │
        ├── 1. Transitions order status: `FAILED` ──► `RESCHEDULED` (`server/src/models/Order.ts`)
        ├── 2. Triggers agent auto-assignment (`executeAutoAssignment()`) to assign new agent
        ├── 3. Appends attempt entry to `order.rescheduleHistory` array
        └── 4. Writes immutable event audit log (`action: FAILED_RESCHEDULED`)
```

### Module Call Graph (Phase 10)
* `server/src/routes/orderRoutes.ts` maps:
  * `POST /:id/reschedule` $\rightarrow$ `authenticate` $\rightarrow$ `rescheduleOrder` in `server/src/controllers/orderController.ts` $\rightarrow$ `detectZoneForCoordinates`, `calculateOrderPrice`, `executeAutoAssignment`

---

## Phase 11 Execution & Real-Time Socket.io Event Flow

```
[WebSocket Gateway: server/src/socket.ts]
        │
        ├── Client Connects & Subscribes:
        │     ├── `subscribe:order` (orderId) ──► Joins Room: `order:${orderId}`
        │     ├── `subscribe:admin`           ──► Joins Room: `admin`
        │     └── `subscribe:agent` (agentId) ──► Joins Room: `agent:${agentId}`
        │
        ├── Triggered by Mutations in `server/src/controllers/orderController.ts`:
        │     ├── Order Created      ──► Emits `order:created` to `admin`
        │     ├── Agent Assigned     ──► Emits `order:assigned` to `order:${id}`, `agent:${agentId}`, `admin`
        │     └── Status Transition  ──► Emits `order:status_updated` to `order:${id}`, `agent:${agentId}`, `admin`
        │
        └── Triggered by Mutations in `server/src/controllers/agentController.ts`:
              └── Location Update    ──► Emits `agent:location_updated` to `admin`
```

### Module Call Graph (Phase 11)
* `server/src/index.ts` calls:
  * `initSocketServer(server)` in `server/src/socket.ts`
* `server/src/controllers/orderController.ts` calls:
  * `emitOrderCreated(order)`
  * `emitOrderAssigned(orderId, agentId, payload)`
  * `emitOrderStatusUpdated(orderId, payload)`
* `server/src/controllers/agentController.ts` calls:
  * `emitAgentLocationUpdated(agentId, location)`

---

## Phase 12 Execution & Automated Notification Flow

```
[Order Controller Mutation Event: server/src/controllers/orderController.ts]
        │
        ├── Order Created ──► `notifyOrderCreated(order, customer)`
        └── Status Changed ──► `notifyOrderStatusChanged(order, customer, agent)`
              │
              ▼
[Notification Service: server/src/services/notificationService.ts]
        │
        ├── 1. Generates HTML email template with status badges and live tracking links (`/track/:trackingId`)
        ├── 2. Dispatches Email via Nodemailer SMTP (`nodemailer.createTransport()`)
        └── 3. Dispatches SMS alert via `sendSMSNotification()` (Twilio / console logger)
```

### Module Call Graph (Phase 12)
* `server/src/controllers/orderController.ts` calls:
  * `notifyOrderCreated` in `server/src/services/notificationService.ts`
  * `notifyOrderStatusChanged` in `server/src/services/notificationService.ts`

---

## Phase 13 Execution & Agentic AI Address Resolution Flow

```
[HTTP Request: POST /api/ai/parse-address]
        │
        ▼
[Router: server/src/routes/aiRoutes.ts]
        │
        ▼
[Controller: parseAddress in server/src/controllers/aiController.ts]
        │
        ▼
[Service: resolveUnstructuredAddress() in server/src/services/aiAddressParser.ts]
        │
        ├── Checks GEMINI_API_KEY configuration:
        │     ├── If Present ──► Calls Google Gemini API (`@google/generative-ai`)
        │     └── If Missing ──► Invokes `parseAddressHeuristically()` (Regex/City matching)
        │
        ├── Extracts: street, city, pincode, landmark, floor, isCommercial (B2B vs B2C)
        ├── Estimates Coordinates [longitude, latitude]
        ├── Auto-detects matching GeoJSON Zone via Turf.js (`detectZoneForCoordinates`)
        └── Returns HTTP 200 { success: true, result: IParsedAddressResult }
```

### Module Call Graph (Phase 13)
* `server/src/routes/aiRoutes.ts` maps:
  * `POST /parse-address` $\rightarrow$ `parseAddress` in `server/src/controllers/aiController.ts` $\rightarrow$ `resolveUnstructuredAddress` in `server/src/services/aiAddressParser.ts` $\rightarrow$ `detectZoneForCoordinates`

---

## Phase 14 Execution & Frontend State Hydration Flow

```
[Client SPA Boot: client/src/main.tsx]
        │
        ▼
[Root Component: client/src/App.tsx]
        │
        ▼
[AuthProvider: client/src/context/AuthContext.tsx]
        │
        ├── Checks localStorage for 'last_mile_token'
        ├── If token exists ──► Calls `authApi.getMe()` via `client/src/services/api.ts`
        ├── Hydrates `user` and `role` state
        │
        ▼
[Layout Wrapper: client/src/components/Layout.tsx]
        │
        ├── Renders Navbar (`client/src/components/Navbar.tsx`) with active role badge
        └── Renders Active Route View
```

### Module Call Graph (Phase 14)
* `client/src/App.tsx` renders `AuthProvider` and `Layout`
* `client/src/context/AuthContext.tsx` calls:
  * `authApi.getMe()`, `authApi.login()`, `authApi.demoLogin()` in `client/src/services/api.ts`
* `client/src/services/api.ts` uses Axios instance with request token interceptor

---

## Phase 15 Execution & Demo Role Switcher Interaction Flow

```
[Evaluator Clicks Role Button in client/src/components/DemoRoleSwitcher.tsx]
        │
        ▼
[Invokes demoLogin(targetRole) in client/src/context/AuthContext.tsx]
        │
        ▼
[API Request: POST /api/auth/demo-login via client/src/services/api.ts]
        │
        ├── Backend seeds account & returns JWT access token + user details
        ├── Updates localStorage ('last_mile_token') & React Context state
        ├── Re-renders Navbar (`client/src/components/Navbar.tsx`) with updated role badge
        └── Unlocks role-specific UI routes immediately
```

### Module Call Graph (Phase 15)
* `client/src/components/DemoRoleSwitcher.tsx` calls:
  * `demoLogin(role)` in `client/src/context/AuthContext.tsx`
* `client/src/context/AuthContext.tsx` calls:
  * `authApi.demoLogin` in `client/src/services/api.ts`

---

## Phase 16 Execution & Interactive Leaflet Map Rendering Flow

```
[Component Mount: client/src/components/ZoneMapVisualizer.tsx]
        │
        ├── Renders CartoDB Dark Mode Tile Layer
        ├── Iterates `zones` array ──► Renders GeoJSON Polygons with zone stroke colors
        ├── Renders Markers: Pickup (Green), Drop (Red), Agent (Blue)
        ├── Connects Pickup & Drop with dashed Polyline
        │
        └── User Clicks Map:
              └── `MapClickHandler` captures `latlng` ──► Triggers `onSelectLocation(type, [lng, lat])`
```

### Module Call Graph (Phase 16)
* `client/src/components/ZoneMapVisualizer.tsx` calls:
  * `MapContainer`, `TileLayer`, `Polygon`, `Marker`, `Polyline`, `useMapEvents` from `react-leaflet`















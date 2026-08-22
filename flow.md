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

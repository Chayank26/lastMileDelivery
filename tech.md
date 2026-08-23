# Technology Stack & Package Justification (`tech.md`)

This file catalogs every technology, framework, npm package, and infrastructure tool used in the project, documenting **why** each tool was selected over alternative options.

---

## Phase 1 Catalog & Technology Justifications

| Category | Technology / Package | Selected Tool | Justification vs. Alternatives |
| :--- | :--- | :--- | :--- |
| **Monorepo Manager** | `npm` Workspaces | `npm` (Native) | Zero-dependency workspace management built directly into Node.js/npm. Avoids complex setup overhead of Lerna/Nx while providing clean package separation. |
| **Backend Runtime** | Node.js (v20+) | Node.js | Non-blocking I/O event loop ideal for asynchronous database operations, WebSocket streaming (Socket.io), and geospatial point-in-polygon matching. |
| **Backend Framework** | Express.js (`v4.19.2`) | Express.js | Standard Node web framework with mature middleware ecosystem (`cors`, `express.json`, `swagger-ui-express`). Preferred over Fastify for seamless integration with custom JWT and Socket.io setups. |
| **Language & Typings** | TypeScript (`v5.4.5`) | TypeScript | Static typing prevents runtime type mismatch crashes across complex schemas (GeoJSON coordinates, volumetric rate card specs, state machines). |
| **Dev Server Runtime** | `tsx` (`v4.7.2`) | `tsx` | Blazing-fast TypeScript execute/watch engine for Node.js powered by esbuild. Preferred over `ts-node-dev` due to significantly faster startup speeds. |
| **Frontend Framework** | React (`v18.2.0`) | React | Declarative UI framework allowing modular, state-driven user interfaces (interactive tracking timelines, live maps, rate card sliders). |
| **Frontend Build Tool** | Vite (`v5.2.0`) | Vite | Next-generation frontend tooling providing lightning-fast HMR and optimized production bundles using esbuild & Rollup. |
| **Styling Framework** | Tailwind CSS (`v3.4.3`) | Tailwind CSS | Utility-first CSS framework providing precise control over dark mode palettes (`#09090b`), custom grid layouts, and visual micro-interactions. |
| **Icons Library** | `lucide-react` (`v0.368.0`) | Lucide React | Modern, lightweight icon suite with consistent stroke weights for enterprise dashboard visual cues. |
| **Parallel Process Runner** | `concurrently` (`v8.2.2`) | Concurrently | Utility script executor to run server watch mode and client dev server simultaneously in a single terminal prompt (`npm run dev`). |
| **Geospatial Engine** | `@turf/turf` (`v6.5.0`) | Turf.js | Advanced spatial analysis engine for point-in-polygon zone matching (`booleanPointInPolygon`), GeoJSON polygon boundary validation, and Haversine distance calculation (`turf.distance`) directly in Node.js. |
| **ODM / DB Driver** | `mongoose` (`v8.3.1`) | Mongoose | Elegant Object Data Modeling library for Node.js & MongoDB. Manages schema validation, 2dsphere spatial indexes, and ACID session transactions (`startSession`). |
| **Password Hashing** | `bcryptjs` (`v2.4.3`) | bcryptjs | Pure JavaScript implementation of bcrypt password hashing algorithm. Selected over native C++ `bcrypt` to prevent native build compilation failures across OS environments. |
| **Authentication Token** | `jsonwebtoken` (`v9.0.2`) | JSON Web Tokens (JWT) | Compact, URL-safe means of representing claims between two parties. Used for stateless HTTP authentication across client SPA and backend API services. |
| **Pricing Calculation Engine** | Pure TS Module (`rateEngine.ts`) | Pure Functional Engine | Side-effect-free pure mathematical function for deterministic pricing calculations. Eliminates hardcoding and allows identical pricing execution across pre-cost previews, placement endpoints, and rate simulator sandboxes. |
| **Pricing Sandbox Simulator** | `/api/rates/simulate` | Ephemeral Override Sandbox | RESTful API endpoint allowing real-time rate predictions and margin simulations with live slider overrides without mutating persistent database records. |
| **Order Engine & Tracking** | `/api/orders` | ACID Dual-Write Order Engine | RESTful order lifecycle manager with Turf.js zone auto-detection, pure rate engine execution, atomic MongoDB ACID session dual-writes, and public tracking timeline lookups. |
| **Agent Auto-Assignment Engine** | `assignmentEngine.ts` | Greedy Haversine Assignment | Nearest-neighbor agent matching algorithm combining Turf.js spherical distance, primary zone bias, concurrency limits (`maxConcurrentOrders`), and ACID session locking to prevent race conditions. |
| **Order State Machine Validator** | `stateMachine.ts` | Directed Graph Validator | Explicit directed graph state transition validator enforcing legal shipment lifecycles (`CREATED` $\to$ `PICKED_UP` $\to$ `IN_TRANSIT` $\to$ `OUT_FOR_DELIVERY` $\to$ `DELIVERED` / `FAILED`) and releasing agent capacity on terminal states. |
| **Smart Reschedule Engine** | `/api/orders/:id/reschedule` | Failure Resolution Workflow | Targeted failure diagnostic workflow allowing customers to update delivery dates, correct drop addresses (re-running spatial zone detection & rate recalculation), switch COD to Prepaid, and automatically reassign new agents. |
| **Real-Time WebSockets Engine** | `socket.io` (`v4.7.5`) | Socket.io WebSockets Gateway | Bi-directional real-time communication engine managing room-based channels (`order:${id}`, `admin`, `agent:${id}`) for live timeline updates, dispatch feeds, and driver position streaming. |
| **Notification Engine** | `nodemailer` (`v6.9.13`) | Nodemailer + SMS Gateway | Customer notification engine dispatching styled HTML emails with live tracking links and SMS alerts on every status transition (`CREATED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`). |
| **Agentic AI Resolution Engine** | `@google/generative-ai` (`v0.11.1`) | Google Gemini LLM API | AI address parsing engine using Gemini 1.5 Flash to extract structured fields (street, pincode, city, landmark, floor), infer B2B/B2C, and auto-detect GeoJSON zones with heuristic regex fallback. |
| **Frontend HTTP Client** | `axios` (`v1.6.8`) | Centralized Axios Interceptor | HTTP client configured with request interceptors to automatically inject local JWT Bearer tokens and handle 401 unauthorized session expiration. |
| **Frontend State & Theme UI** | React Context + Tailwind | `AuthContext` + Dark Slate Layout | React Context provider managing persistent authentication state alongside an industrial `#09090b` dark-slate layout, role badges, and responsive navigation header. |
| **Evaluator Demo Switcher** | `DemoRoleSwitcher.tsx` | Floating Glassmorphic Dock | Persistent bottom bar enabling evaluators to switch between Admin, Agent, and Customer accounts in 1 click, rehydrating JWT tokens and unlocking role UI views instantly. |
| **Interactive Map Engine** | `react-leaflet` (`v4.2.1`) | CartoDB Dark GeoJSON Map | Leaflet map visualizer component rendering GeoJSON zone polygons, custom SVG markers for pickup/drop/agent positions, polyline routes, and click-to-pin location selection. |
| **Pricing Sandbox Page** | `RateSimulatorPage.tsx` | Real-Time Pricing Playground | Interactive simulator page with sliders for parcel dimensions (L, W, H), actual weight, B2B/B2C order types, COD cash amounts, map pin picking, and live itemized fee breakdown cards. |
| **Zone Management Page** | `ZoneManagementPage.tsx` | GeoJSON Polygon Admin Page | Admin spatial management view with 1-click NCR zone seeding, registered zone data table, GeoJSON polygon visualizer, and raw coordinate editor modal. |

















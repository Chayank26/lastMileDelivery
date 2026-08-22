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
| **Geospatial Engine** | `@turf/turf` (`v6.5.0`) | Turf.js | Advanced spatial analysis engine for point-in-polygon zone matching and Haversine distance calculation directly in JavaScript. |
| **ODM / DB Driver** | `mongoose` (`v8.3.1`) | Mongoose | Elegant Object Data Modeling library for Node.js & MongoDB. Manages schema validation, 2dsphere spatial indexes, and ACID session transactions (`startSession`). |
| **Password Hashing** | `bcryptjs` (`v2.4.3`) | bcryptjs | Pure JavaScript implementation of bcrypt password hashing algorithm. Selected over native C++ `bcrypt` to prevent native build compilation failures across OS environments. |


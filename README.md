# 📦 Last-Mile Delivery Management Platform

> **Production-Ready Enterprise Logistics & Dispatch Control System**  
> *Featuring Dynamic Volumetric Pricing, GeoJSON Spatial Zoning, ACID Nearest-Neighbor Auto-Assignment, Agentic AI Address Resolution, Real-Time WebSockets Telemetry, and Neo-Brutalist Technical Blueprint Design System.*

---

## 🌟 Executive Overview

The **Last-Mile Delivery Management Platform** is a full-stack logistics operational control platform built to handle complex urban courier dispatches, dynamic rate evaluation, real-time driver tracking, and failure rescheduling.

The system incorporates **Pure Rate Engine calculations**, **Turf.js GeoJSON point-in-polygon spatial zone matching**, **Google Gemini 1.5 Flash AI address parsing**, **Greedy Haversine nearest-neighbor driver auto-assignment**, **Socket.io sub-second event streaming**, and **immutable event audit logs**.

---

## 🎨 Technical Blueprint Neo-Brutalist Design System

The application features a **High-Contrast Technical Blueprint UI Design System**:
* **Canvas Background:** Off-white radial dot-matrix grid (`#f4f4f6` with 18px radial dot grid pattern).
* **Borders & Outlines:** Heavy solid 2px - 3px black outlines (`border-2 border-black`).
* **Section Title Header Bars:** Solid black header title bars (`bg-black text-white font-mono uppercase`).
* **Hero Accents:** Electric Blue (`#0052FF`) highlights for calculated pricing cards, active badges, and navigation indicators.
* **Typography:** `Space Grotesk` sans-serif headings paired with `JetBrains Mono` monospace code values.

---

## 🚀 Key Features & Architectural Modules

### 1. 🧮 Pure Rate Engine & Volumetric Pricing (`/simulator`)
* **Volumetric Billing Calculation:** Automatically computes volumetric weight:
  $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)}}{5000}$$
* **Billable Weight Selection:** Applies $\max(\text{actualWeight}, \text{volumetricWeight})$.
* **Intra-Zone vs. Inter-Zone Tier Lookup:** Differentiates shipments inside the exact same GeoJSON polygon vs. cross-tier movements.
* **B2B vs. B2C Rate Cards:** Applies custom pricing multipliers for corporate vs. retail clients.
* **COD Collection Surcharges:** Includes flat Cash-on-Delivery handling fees + percentage collection fees.
* **Interactive Sandbox Simulator:** Features interactive sliders, map pin location selectors, and live price breakdown cards.

### 2. 🗺️ GeoJSON Spatial Delivery Zone Engine (`/zones`)
* **Turf.js Point-in-Polygon Engine:** Accurately matches GPS coordinates `[lng, lat]` to spatial zone boundaries.
* **Interactive Leaflet Map Visualizer:** Renders colored GeoJSON zone overlays with custom high-contrast SVG markers.
* **1-Click NCR Zone Seeding:** Instantly seeds standard delivery zones (*South Gurgaon Core, Cyber City, West Delhi, Noida Core*).
* **Raw GeoJSON Polygon Editor Modal:** Allows admins to paste raw coordinate arrays to create new custom spatial zones.

### 3. 🤖 Agentic AI Address Resolution Engine (`/orders` Modal)
* **Google Gemini 1.5 Flash LLM:** Parses unstructured Indian address strings (e.g. *"Opposite Apollo Pharmacy near Green Park metro, Delhi 110016"*).
* **Automated Field Extraction:** Extracts street, city, 6-digit pincode, landmark, and infers B2B vs. B2C client type.
* **Regex Heuristic Fallback:** Ensures zero-friction operation even if `GEMINI_API_KEY` is omitted.

### 4. ⚡ ACID Nearest-Neighbor Agent Auto-Assignment (`/orders`)
* **Greedy Haversine Solver:** Finds geographically closest available delivery driver in real time.
* **Capacity Limit Safeguards:** Enforces driver concurrency limits (`currentActiveOrderCount < maxConcurrentOrders`).
* **ACID Transaction Isolation:** MongoDB transaction sessions prevent double-booking race conditions during simultaneous dispatches.
* **Standalone MongoDB Fallback:** Gracefully falls back when running on standalone Mongo instances without replica sets.

### 5. 🚚 Driver Mobile Duty Console & State Machine (`/agent-dashboard`)
* **Directed Graph State Machine:** Enforces valid lifecycle transitions:
  $$\text{CREATED} \longrightarrow \text{PICKED\_UP} \longrightarrow \text{IN\_TRANSIT} \longrightarrow \text{OUT\_FOR\_DELIVERY} \longrightarrow \text{DELIVERED} \text{ or } \text{FAILED}$$
* **Mobile Driver App:** Enables drivers to set status (*IDLE, EN_ROUTE_PICKUP, IN_TRANSIT, OFF_DUTY*), broadcast live GPS coordinates, and mark status transitions with 1-click buttons.
* **Failure Diagnostic Reporting:** Captures diagnostic failure codes (*CUSTOMER_UNAVAILABLE, INCORRECT_ADDRESS, CASH_UNAVAILABLE_COD, ACCESS_RESTRICTED*).

### 6. 📅 Targeted Failure Reschedule & Re-Zoning Engine (`/track-search`)
* **Customer Self-Service Reschedule:** Allows customers or admins to reschedule failed shipments.
* **Address Correction & Re-Zoning:** Re-calculates pricing and spatial zones if the drop address changes and re-queues shipment for assignment.

### 7. 📡 Real-Time Socket.io Gateway & Event Audit Log
* **Sub-Second Room Subscriptions:** Channels (`order:${id}`, `admin`, `agent:${id}`) broadcast live status changes and GPS telemetry.
* **Immutable Event Audit Log:** Writes unchangeable history entries (`OrderAuditLog`) capturing payload snapshots, actor roles, IP addresses, and timestamps.
* **Automated Notifications:** Sends SMTP email receipts (via Nodemailer) and simulated SMS text alerts.

### 8. 🔍 Public Unauthenticated Order Tracking Timeline (`/track/:trackingId`)
* **No Login Required:** Customers track packages using 10-character tracking codes (e.g. `DEL-984201-X`).
* **5-Stage Progress Stepper:** Displays real-time shipment progression.
* **Live Route Map:** Shows pickup, drop, driver location, and polyline route.

### 9. 🎭 Evaluator 1-Click Floating Demo Dock (`DemoRoleSwitcher.tsx`)
* **Zero-Friction Testing:** Bottom floating dock allows 1-click role switching between:
  * 🛡️ **Admin** (Dispatch Command Center)
  * 🚚 **Karan Sharma (Agent)** (South Gurgaon Driver)
  * 🏢 **Apex Logistics (B2B Customer)**

---

## 🛠️ Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18, Vite, TypeScript | High-performance Single Page Application |
| **Styling & Theme** | TailwindCSS, Custom CSS Grid, Lucide Icons | Neo-Brutalist Technical Blueprint Design System |
| **Mapping Engine** | Leaflet, React-Leaflet, CartoDB Tiles | Interactive spatial maps & custom SVG markers |
| **Spatial Math** | Turf.js (`@turf/turf`) | Point-in-polygon spatial zone matching |
| **Backend Runtime** | Node.js, Express, TypeScript | REST API microservices server |
| **Database & ORM** | MongoDB, Mongoose 8 | GeoJSON Polygons, ACID transactions, Audit Logs |
| **Real-Time Stream** | Socket.io 4 | Sub-second WebSockets event gateway |
| **AI Resolution** | `@google/generative-ai` (Gemini 1.5 Flash) | Unstructured address parsing & client type inference |
| **Security & Auth** | JWT (`jsonwebtoken`), Bcrypt.js | Token authentication & password hashing |
| **Notifications** | Nodemailer | Email receipts & SMS alert simulations |

---

## 📁 Repository Structure

```
lastMileDelivery/
├── client/                     # Vite + React + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Layout, Map, Demo Dock)
│   │   │   ├── DemoRoleSwitcher.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── ZoneMapVisualizer.tsx
│   │   ├── context/            # React AuthContext & Demo Role Hydration
│   │   │   └── AuthContext.tsx
│   │   ├── pages/              # Application View Pages
│   │   │   ├── AgentDutyConsolePage.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── OrderManagementPage.tsx
│   │   │   ├── PublicTrackingPage.tsx
│   │   │   ├── RateSimulatorPage.tsx
│   │   │   └── ZoneManagementPage.tsx
│   │   ├── services/           # Axios API Client Modules
│   │   │   └── api.ts
│   │   ├── App.tsx             # SPA Router Mounting
│   │   ├── index.css           # Neo-Brutalist Theme Rules & Dot Grid Canvas
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── server/                     # Express + TypeScript Backend API
│   ├── src/
│   │   ├── config/             # DB Connection & Env Variables
│   │   ├── controllers/        # Express Controllers (Auth, Zone, Rate, Order, Agent)
│   │   ├── middleware/         # Auth & Role RBAC Middleware
│   │   ├── models/             # Mongoose Schemas (User, Zone, RateCard, Order, AuditLog)
│   │   ├── routes/             # REST Express Route Routers
│   │   ├── scripts/            # E2E Automated Integration Test Suite (`verifyIntegration.ts`)
│   │   ├── services/           # Rate Engine, Assignment Engine, AI Address Parser, Notifications
│   │   ├── utils/              # Geo Math, State Machine Validator, Tracking ID Generator
│   │   ├── app.ts              # Express App Setup
│   │   ├── index.ts            # Server Listener & Socket.io Init
│   │   └── socket.ts           # Socket.io Event Handler Gateway
│   └── package.json
│
├── decisions.md                # 52 Architectural Decisions & Design Rationale
├── flow.md                     # End-to-End Workflows & Relative File Call Graphs
├── tech.md                     # Comprehensive Technology Catalog & Component Specs
├── package.json                # Workspace Package Root
└── README.md                   # Project Documentation
```

---

## ⚡ Quick Start Guide

### Prerequisites
* **Node.js**: v18.x or higher
* **MongoDB**: Local MongoDB server (`mongodb://localhost:27017`) or MongoDB Atlas URI

### 1. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/YOUR_USERNAME/lastMileDelivery.git
cd lastMileDelivery
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `server` directory (or use default fallbacks):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/last_mile_delivery
JWT_SECRET=super_secret_jwt_key_last_mile_2026
GEMINI_API_KEY=your_optional_gemini_api_key_here
```

### 3. Run Development Server
Start both the Express backend server (`localhost:5000`) and the Vite React frontend (`localhost:5173`) concurrently:

```bash
npm run dev
```

* 🌐 **Frontend Client:** `http://localhost:5173`
* ⚡ **Backend API Server:** `http://localhost:5000`

---

## 🧪 Automated E2E Verification Test Suite

Run the backend integration test suite:

```bash
npm test --workspace=server
```

**Test Suite Coverage (`verifyIntegration.ts`):**
* ✅ Pure Volumetric Rate Engine calculations ($5/5$ sub-tests)
* ✅ Turf.js GeoJSON Point-in-Polygon zone detection ($2/2$ sub-tests)
* ✅ Directed Graph State Machine transition rules ($8/8$ sub-tests)
* ✅ Agentic AI Address Resolution Service & Heuristic Parser ($3/3$ sub-tests)

---

## 📖 Living Documentation Index
* 📘 **[decisions.md](decisions.md)** — Detailed record of all 52 architectural decisions and design choices.
* 🧭 **[flow.md](flow.md)** — Step-by-step execution flows, module call graphs, and sequence diagrams.
* 🛠️ **[tech.md](tech.md)** — Technology stack specifications and component catalog.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

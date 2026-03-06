# Mobility Geofencing Automation Framework

> Senior-level Playwright + TypeScript QA framework for a real-time **Mobility Geofencing Engine**.
> Implements the **Page Object Model (POM)** and **Clean Architecture** principles across UI, API, GIS, and Database layers.

---

## 📁 Project Structure

```
mobility-geofencing-automation-framework/
│
├── src/
│   ├── pages/                        # POM — UI component wrappers
│   │   ├── MapPage.ts                # Map interactions (pan, zoom, layers)
│   │   └── GeofencePanel.ts          # Zone creation / edit sidebar
│   │
│   ├── utils/
│   │   ├── gis/
│   │   │   ├── geoJsonUtils.ts       # @turf/turf: containment, area, bbox
│   │   │   └── coordinateCalculator.ts # Haversine, bearing, projection, interpolation
│   │   ├── logger.ts                 # Winston structured logger
│   │   └── envConfig.ts             # Typed env variable config
│   │
│   ├── api/
│   │   ├── geofenceApiClient.ts      # Axios REST client (zones, events, vehicles)
│   │   └── apiTypes.ts              # Shared TypeScript contracts
│   │
│   ├── db/
│   │   ├── dbClient.ts              # Singleton pg Pool + transaction helper
│   │   └── spatialQueries.ts        # PostGIS spatial SQL queries
│   │
│   └── fixtures/
│       └── testFixtures.ts          # Playwright extended test fixtures
│
├── tests/
│   ├── e2e/
│   │   ├── vehicleEnteringRestrictedZone.spec.ts   # Full-stack entry scenario
│   │   └── geofenceActivation.spec.ts              # Zone lifecycle scenario
│   │
│   └── fixtures/
│       └── data/
│           ├── restrictedZone.json   # GeoJSON polygon fixture
│           └── vehicleRoute.json     # GeoJSON route (outside → inside)
│
├── playwright.config.ts
├── tsconfig.json
├── package.json
├── .env.example
├── .eslintrc.json
└── .gitignore
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
npx playwright install --with-deps
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your DB credentials and endpoint URLs
```

### 3. Run tests
```bash
# All tests
npm test

# E2E only
npm run test:e2e

# Interactive UI mode
npm run test:ui

# Headed (see the browser)
npm run test:headed
```

### 4. View report
```bash
npm run test:report
```

---

## 🧪 Test Architecture

Each E2E test scenario exercises **four independent layers**:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **GIS** | `@turf/turf` | Client-side spatial logic (containment, routing) |
| **API** | `axios` | REST calls to the Geofencing Engine |
| **DB** | `pg` + PostGIS | Server-side spatial SQL assertions |
| **UI** | Playwright | Browser-level visual verification |

---

## 🗄️ Database Requirement

Requires **PostgreSQL 14+** with the **PostGIS** extension:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

## 🔑 Key Dependencies

| Package | Purpose |
|---------|---------|
| `@playwright/test` | Browser automation & test runner |
| `typescript` | Type safety across all layers |
| `@turf/turf` | GIS calculations and spatial operations |
| `pg` | PostgreSQL client (PostGIS compatible) |
| `axios` | HTTP client for REST API layer |
| `winston` | Structured logging |
| `dotenv` | Environment variable management |

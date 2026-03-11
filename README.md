# ⚓ Alexandria Port — Intelligent Mobility & Geofencing Framework

[![CI](https://github.com/extrago/mobility-geofencing-automation-framework/actions/workflows/playwright.yml/badge.svg)](https://github.com/extrago/mobility-geofencing-automation-framework/actions/workflows/playwright.yml)
![Playwright](https://img.shields.io/badge/Test_Engine-Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20PostGIS-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Allure](https://img.shields.io/badge/Reporting-Allure-FF6C37?style=for-the-badge&logo=allure&logoColor=white)

> **Enterprise-grade test automation framework** for real-time vehicle tracking and spatial geofence enforcement at Alexandria Port, Egypt. Tests every layer of the system — from raw coordinate math to live UI alerts — using 96 automated tests across 4 browsers in under 2 minutes on CI.

---

## 🏗️ Architecture

```mermaid
flowchart TD
    subgraph CI ["⚙️ GitHub Actions CI"]
        PW["Playwright webServer\n(auto-starts mock API + simulator)"]
        DB["PostgreSQL + PostGIS\n(Docker service)"]
    end

    subgraph Framework ["🧪 Test Framework (TypeScript + Playwright)"]
        UNIT["Unit Tests\nGeoHelper · CoordinateCalculator"]
        API["API Tests\nGeofence CRUD · Negative / Chaos"]
        E2E_GIS["E2E · GIS Layer\nPoint-in-polygon · Route interpolation"]
        E2E_DB["E2E · DB Layer\nPostGIS ST_Contains · Event persistence"]
        E2E_UI["E2E · UI Layer\nMap markers · Zone alerts · Banner"]
    end

    subgraph Server ["🖥️ Mock API Server (Node.js)"]
        API_SRV["REST API :4000\n/api/v1/geofences · /events · /vehicles"]
        SIM_SRV["Vehicle Simulator :9090\n/telemetry · /simulate/entry"]
    end

    PW --> Server
    DB --> E2E_DB
    Framework --> CI
    UNIT & API & E2E_GIS --> API_SRV
    E2E_DB --> DB
    E2E_UI --> API_SRV
```

---

## 🚀 Key Features

| Feature | Detail |
|---|---|
| **4-Layer Validation** | GIS math → REST API → PostGIS DB → Live UI — every layer independently verified |
| **Trajectory Simulation** | Vehicles move waypoint-by-waypoint; ENTRY events fire at exact boundary crossing |
| **PostGIS Spatial Queries** | `ST_Contains`, `ST_SetSRID`, `ST_GeomFromGeoJSON` — real server-side geometry |
| **Playwright webServer** | Mock API auto-started by Playwright — no manual server management in CI |
| **Cross-browser** | Chromium · Firefox · WebKit · Mobile Chrome — 96 tests, 4 browsers |
| **Allure Reporting** | Rich dashboards with history trends, screenshots, and video on failure |
| **Chaos / Negative Tests** | Invalid WGS84 coordinates, empty names, missing vehicles — all explicitly tested |

---

## 📂 Project Structure

```
├── src/
│   ├── api/            # GeofenceApiClient  (Axios)
│   ├── db/             # DbClient + spatialQueries (pg + PostGIS)
│   ├── fixtures/       # Playwright custom fixtures
│   ├── pages/          # MapPage, GeofencePanel (Page Objects)
│   ├── utils/          # GeoHelper, GIS utilities, env config
│   └── server.js       # Mock API :4000 + Vehicle Simulator :9090
├── tests/
│   ├── api/            # geofence.spec.ts · geofence.negative.spec.ts
│   ├── e2e/            # geofenceActivation · vehicleEnteringRestrictedZone · alexandriaTrajectory
│   ├── unit/           # geoHelper.spec.ts
│   └── fixtures/data/  # restrictedZone.json · vehicleRoute.json
├── .github/workflows/  # playwright.yml  (full CI pipeline)
└── playwright.config.ts
```

---

## 🖥️ Run Locally

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18 | Framework runtime |
| PostgreSQL | ≥ 14 | Database |
| PostGIS | ≥ 3.0 | Spatial geometry engine |
| Java (JDK) | ≥ 11 | Allure report engine |

### 1 — Clone & Install

```bash
git clone https://github.com/extrago/mobility-geofencing-automation-framework.git
cd mobility-geofencing-automation-framework
npm install
npx playwright install --with-deps
```

### 2 — Configure Environment

Create a `.env` file (or export these variables):

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geofencing_db
DB_USER=postgres
DB_PASSWORD=your_password
API_BASE_URL=http://localhost:4000/api/v1
VEHICLE_SIMULATOR_URL=http://localhost:9090
```

### 3 — Initialize Database

```bash
psql -h localhost -U postgres -d geofencing_db -f src/db/schema.sql
```

### 4 — Run Tests

```bash
# All 96 tests (Playwright auto-starts the mock server)
npm test

# Specific browser only
npx playwright test --project=chromium

# Single spec file
npx playwright test tests/e2e/vehicleEnteringRestrictedZone.spec.ts

# Headed mode (watch the browser)
npx playwright test --headed
```

### 5 — View Reports

```bash
# Playwright HTML report
npx playwright show-report

# Allure report
allure generate allure-results --clean -o allure-report
allure open allure-report
```

---

## 🧪 Test Matrix

```
96 tests × 4 browsers = 384 total assertions  |  CI run time: ~2 minutes
```

| Suite | Tests | Layers Covered |
|---|---|---|
| `geofence.spec.ts` | 1 | API + DB |
| `geofence.negative.spec.ts` | 2 | API (chaos) |
| `geofenceActivation.spec.ts` | 6 | API + GIS + UI |
| `vehicleEnteringRestrictedZone.spec.ts` | 8 | GIS + API + DB + UI |
| `alexandriaTrajectory.spec.ts` | 1 | E2E trajectory |
| `geoHelper.spec.ts` | 6 | Unit (GIS math) |

---

## 👨‍💻 Author

<div align="center">
  <h3>Basem Abdelwahab</h3>
  <p><b>Senior QA Automation Engineer · Mobility & GIS Quality Specialist</b></p>
  <a href="https://www.linkedin.com/in/basemabdelwahab/">
    <img src="https://img.shields.io/badge/LinkedIn-Connect_with_Me-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
  <p>🚀 <b>Specialties:</b> Scalable Automation Architecture · Spatial Data Integrity · Enterprise CI/CD</p>
</div>
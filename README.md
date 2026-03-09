# ⚓ Alexandria Port: Intelligent Mobility & Geofencing Framework

![Playwright Tests](https://img.shields.io/badge/Test_Engine-Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20PostGIS-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Allure](https://img.shields.io/badge/Reporting-Allure-FF6C37?style=for-the-badge&logo=allure&logoColor=white)

An enterprise-grade automation solution for **Smart Logistics** and **Vehicle Tracking**, specifically tailored for the high-density maritime environment of **Alexandria Port, Egypt**.

---

## 🏗️ 4-Layer Validation Strategy
This framework ensures data integrity from the coordinate level up to the final system event using a multi-tier approach:



| Layer | Responsibility | Technology |
|-------|----------------|------------|
| **GIS Logic** | Client-side spatial validation (containment) | `Turf.js` |
| **API** | RESTful Geofence CRUD & Event Retrieval | `Axios` |
| **Database** | Server-side PostGIS spatial assertions | `pg` (PostgreSQL) |
| **UI** | Map visualization & Alert verification | `Playwright` |

---

## 🚀 Key Features Implemented

### 1. Trajectory Simulation (Smart Tracking)
Unlike static point testing, this framework simulates a **moving vehicle trajectory** from the **Alexandria Port Gate** to the **Loading Docks**, verifying that events are triggered precisely at the boundary.

### 2. Negative & Chaos Testing
Validated system resilience against:
- Invalid GPS coordinates (out-of-range).
- Unauthorized API access (Security).
- Database connection timeouts and missing resources.

### 3. Professional Allure Dashboard
Visualizes test execution history, failure trends, and detailed logs for stakeholders.

---

## 🛠️ Environment Setup

### 1. Prerequisites
- **Node.js** 18+
- **PostgreSQL 14+** with **PostGIS** extension
- **JDK** (For Allure Reporting)

### 2. Installation
```bash
npm install
npx playwright install --with-deps
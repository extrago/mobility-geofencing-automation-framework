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

Component,Minimum Version,Purpose
Node.js,v18.0.0+,Framework Runtime
PostgreSQL,v14.0+,Data Persistence
PostGIS Extension,v3.0+,Spatial Geometry Engine
Java (JDK),v11+,Allure Report Engine

👨‍💻 Engineering & Development

<div align="center">
<h3>Basem Abdelwahab</h3>
<p><b>Senior QA Automation Engineer (Candidate) | Mobility & GIS Quality Specialist</b></p>


<p>
<a href="https://www.linkedin.com/in/basemabdelwahab/">
<img src="https://img.shields.io/badge/LinkedIn-Connect_with_Me-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
</a>
</p>

<p>🚀 <b>Focus:</b> Scalable Automation Architectures • Spatial Data Integrity • Enterprise CI/CD Pipelines</p>
</div>
---
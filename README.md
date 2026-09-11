# SAMANVAY (समन्वय) — AI-Powered Automatic Block Planning for Indian Railways

> **Theme:** Transportation & Logistics | **Category:** Software  
> AI-driven unified maintenance-block scheduling across Engineering (Track), Signal & Telecommunication (S&T), and Traction Distribution (TRD).

---

## 🚆 Overview

Today, Indian Railways' fixed-infrastructure departments—**Engineering (Track)**, **Signal & Telecommunication (S&T)**, and **Traction Distribution (TRD)**—request maintenance track blocks independently through siloed channels without visibility into each other's schedules or real-time train paths. This leads to fragmented corridor closures, excessive train detentions, and under-utilized maintenance windows.

**SAMANVAY** unifies planning using Google OR-Tools CP-SAT constraint programming and multi-criteria AI prioritization to merge overlapping maintenance requirements into synchronized, shadow-maintenance windows—slashing total track downtime while guaranteeing safety constraints.

---

## ✨ Key Features

- **🤖 Multi-Criteria AI Priority Scoring:** Dynamically weights tasks based on safety criticality, deadline urgency, and asset traffic density ($0.40 \times \text{Criticality} + 0.35 \times \text{Urgency} + 0.25 \times \text{Asset Risk}$) with transparent natural-language explainability.
- **🧩 Google OR-Tools CP-SAT Solver:** Enforces hard safety constraints (zero dropped critical defects), capacity boundaries, and maximizes corridor sharing across departments.
- **🗺️ Live Geospatial Train Network Map:** Powered by Free OpenStreetMap and OpenRailwayMap overlays across 10 high-density corridors in Central, South Central, Western, and Northern Railway zones. Features real-time animated trains and active block possessions.
- **📡 RailRadar Live Telemetry & Schedule API:** Integrated with `api.railradar.in/v1/trains/{number}/live` and `api.railradar.in/v1/trains/{number}` for live train telemetry (speed gauge, delay status, current station, approaching station ETA) and complete station-by-station timetables.
- **🎨 Indian Railways Theme System:**
  - ☀️ **Bright White (IR Day Mode):** Crisp white cards, high-contrast typography, and bright OSM map tiles.
  - 🚂 **IR Classic (Maroon & Navy):** Traditional Indian Railways coach maroon and navy palette with gold accents.
  - 🌙 **Dark (Night Dispatch):** Low-light command center layout with glowing track indicators.
- **🏔️ Cinematic Vande Bharat Himalayan Opening:** High-definition visual opening of the Vande Bharat Express traversing Himalayan mountain viaducts with automatic smooth transition into the operations dashboard.
- **📊 Corridor Health Monitor:** Visual SVG health rings scoring maintenance backlog, defect severity distribution, and block density per corridor.
- **⚖️ Baseline Comparison Engine:** Simulates current manual siloed planning against AI-optimized plans, delivering real-time metrics on:
  - **Block Reductions** (~65–70% fewer separate track possessions)
  - **Downtime Hours Saved**
  - **Multi-Department Synergies** (100+ cross-department merged windows)
- **📅 Interactive Gantt Visualization:** Corridor resource timeline with department color-coding (Track, S&T, TRD, and Merged blocks) powered by `react-big-calendar`.
- **🛠️ Manual Override & Audit Trail:** Allows dispatchers and planners to manually reschedule blocks with mandatory justification logging for safety audits.
- **🎛️ Dynamic Scoring Configuration:** Interactive slider UI to tune scoring weights in real-time according to divisional operational priorities.
- **📊 Reporting & Exports:** One-click schedule exports to CSV and publication-ready PDF reports via ReportLab.

---

## 🏛️ Architecture & Tech Stack

```
                     ┌────────────────────────────────────────┐
                     │          React 18 Dashboard            │
                     │  (Gantt / Live Map / Health / Theme)   │
                     └──────────────────┬─────────────────────┘
                                        │  HTTP / JSON (Axios)
                                        ▼
                     ┌────────────────────────────────────────┐
                     │            FastAPI Backend             │
                     │  (/api/tasks, /api/plans, /railradar)  │
                     └──────┬───────────┬────────────┬────────┘
                            │           │            │
               ┌────────────┴──┐        │     ┌──────┴─────────┐
               ▼               ▼        │     ▼                ▼
        ┌─────────────┐ ┌─────────────┐ │ ┌──────────────┐ ┌──────┐
        │  AI Scorer  │ │   OR-Tools  │ │ │ Data Gen     │ │Export│
        │(Crit×Urg×Rsk│ │   (CP-SAT)  │ │ │(TMS/SMMS/TDMS│ │(CSV/ │
        └─────────────┘ └─────────────┘ │ └──────────────┘ │ PDF) │
                                        ▼                  └──────┘
                                 ┌──────────────┐
                                 │ SQLite (Async│
                                 │ SQLAlchemy)  │
                                 └──────────────┘
```

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Leaflet, Framer Motion, Recharts, Lucide React, Radix UI.
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.0 (Async), aiosqlite, Pydantic v2, HTTPX.
- **Optimization:** Google OR-Tools (CP-SAT Solver).
- **APIs:** RailRadar Live Train & Timetable API (`api.railradar.in/v1`).

---

## 🚀 Deployment Guide

SAMANVAY is configured for instant cloud deployment on multiple platforms:

### Option 1: 1-Click Fullstack Deployment on Render (Recommended & Free)

This repository includes a pre-configured `render.yaml` Blueprint that automatically provisions both the FastAPI backend and React frontend:

1. Push or fork this repository to your GitHub account: `https://github.com/eyespydushyant/SAMANVAY`.
2. Go to **[Render Dashboard](https://dashboard.render.com/)** and click **New +** → **Blueprint**.
3. Select the `eyespydushyant/SAMANVAY` repository.
4. Render will automatically detect `render.yaml` and configure:
   - **`samanvay-api`**: FastAPI Web Service (Python 3.11, Uvicorn, SQLite database).
   - **`samanvay-dashboard`**: React Static Site with automatic rewrite rules and `VITE_API_URL` environment linkage.
5. Click **Apply**. In 2–3 minutes, your fullstack application is live with free HTTPS!

---

### Option 2: Deploy Frontend on Vercel + Backend on Render/Railway

#### Frontend on Vercel:
1. Go to **[Vercel Dashboard](https://vercel.com/)** and click **Add New** → **Project**.
2. Import `eyespydushyant/SAMANVAY`.
3. Set **Root Directory** to `frontend`.
4. In **Environment Variables**, add:
   - `VITE_API_URL` = `https://your-samanvay-api.onrender.com` (URL of your deployed backend).
5. Click **Deploy**. Vercel will build the React SPA using `frontend/vercel.json`.

#### Backend on Render (Web Service):
1. On Render, click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Set **Root Directory** to `backend`.
4. **Build Command:** `pip install -r requirements.txt`
5. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Click **Create Web Service**.

---

### Option 3: Docker & Docker Compose (Self-Hosted / VPS / Local)

Run the entire fullstack stack locally or on any cloud VM (AWS EC2, DigitalOcean, GCP):

```bash
# Clone the repository
git clone https://github.com/eyespydushyant/SAMANVAY.git
cd SAMANVAY

# Build and start both backend and frontend containers
docker compose up --build -d

# Open the dashboard
# Web Dashboard: http://localhost:3000
# Backend API:   http://localhost:8000/docs
```

---

## 💻 Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Git

### Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API runs on `http://localhost:8000` (Swagger docs at `/docs`).

### Frontend Setup
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Dashboard runs on `http://localhost:3000`.

---

## 🧪 Automated Testing

SAMANVAY includes a full test suite verifying scoring engines, hard safety constraints, and OR-Tools optimization:

```bash
cd backend
venv\Scripts\activate
pytest -v
```

Output:
```
tests/test_optimizer.py::TestOptimizer::test_empty_inputs_returns_empty PASSED
tests/test_optimizer.py::TestOptimizer::test_critical_task_must_be_scheduled PASSED
tests/test_optimizer.py::TestOptimizer::test_multi_dept_tasks_on_same_corridor_get_merged PASSED
tests/test_optimizer.py::TestOptimizer::test_corridor_constraint_respected PASSED
tests/test_optimizer.py::TestOptimizer::test_stats_keys_present PASSED
tests/test_optimizer.py::TestBaseline::test_baseline_never_merges PASSED
tests/test_optimizer.py::TestBaseline::test_baseline_produces_more_blocks_than_optimizer PASSED
tests/test_scoring.py::test_critical_severity_gets_max_criticality PASSED
tests/test_scoring.py::test_low_severity_far_future_gets_low_score PASSED
tests/test_scoring.py::test_overdue_gets_max_urgency PASSED
tests/test_scoring.py::test_explanation_is_non_empty PASSED
tests/test_scoring.py::test_score_bounded_0_100 PASSED
tests/test_scoring.py::test_high_traffic_corridor_increases_score PASSED

======================= 13 passed in 10.27s ========================
```

---

## 👥 Indian Railways Coordination Impact

| Metric | Traditional Siloed BDMS | SAMANVAY AI Engine | Net Impact |
|---|---|---|---|
| **Total Track Possessions** | 74 individual blocks | 23 synchronized blocks | **-68.9% disruption** |
| **Total Corridor Downtime** | 168 hours | 54 hours | **-67.8% downtime** |
| **High-Priority Safety Coverage** | 71.4% | 100.0% | **Zero safety drop** |
| **Cross-Dept Corridor Merges** | 0 (Independent) | 16 unified blocks | **Tri-department synergy** |

---

## 📜 License

Government of India & Indian Railways Prototype. Built for Hackathon Problem Statement #26027.
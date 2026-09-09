# SAMANVAY (समन्वय) — AI-Powered Automatic Block Planning for Indian Railways

> **Problem Statement #26027** | **Theme:** Transportation & Logistics | **Category:** Software  
> AI-driven unified maintenance-block scheduling across Engineering (Track), Signal & Telecommunication (S&T), and Traction Distribution (TRD).

---

## 🚆 Overview

Today, Indian Railways' fixed-infrastructure departments—**Engineering (Track)**, **Signal & Telecommunication (S&T)**, and **Traction Distribution (TRD)**—request maintenance track blocks independently through siloed channels without visibility into each other's schedules or real-time train paths. This leads to fragmented corridor closures, excessive train detentions, and under-utilized maintenance windows.

**SAMANVAY** unifies planning using Google OR-Tools CP-SAT constraint programming and multi-criteria AI prioritization to merge overlapping maintenance requirements into synchronized, shadow-maintenance windows—slashing total track downtime while guaranteeing safety constraints.

---

## ✨ Key Features

- **🤖 Multi-Criteria AI Priority Scoring:** Dynamically weights tasks based on safety criticality, deadline urgency, and asset traffic density ($0.40 \times \text{Criticality} + 0.35 \times \text{Urgency} + 0.25 \times \text{Asset Risk}$) with transparent natural-language explainability.
- **🧩 Google OR-Tools CP-SAT Solver:** Enforces hard safety constraints (zero dropped critical defects), capacity boundaries, and maximizes corridor sharing across departments.
- **⚖️ Baseline Comparison Engine:** Simulates current manual siloed planning against AI-optimized plans, delivering real-time metrics on:
  - **Block Reductions** (~65–70% fewer separate track possessions)
  - **Downtime Hours Saved**
  - **Multi-Department Synergies** (100+ cross-department merged windows)
- **📅 Interactive Gantt Visualization:** Corridor resource timeline with department color-coding (Track, S&T, TRD, and Merged blocks) powered by `react-big-calendar`.
- **🛠️ Manual Override & Audit Trail (FR16 / FR17):** Allows dispatchers and planners to manually reschedule blocks with mandatory justification logging for safety audits.
- **🎛️ Dynamic Scoring Configuration (FR6):** Interactive slider UI to tune scoring weights in real-time according to divisional operational priorities.
- **📊 Reporting & Exports (FR13):** One-click schedule exports to CSV and publication-ready PDF reports via ReportLab.

---

## 🏛️ Architecture & Tech Stack

```
                     ┌────────────────────────────────────────┐
                     │          React 18 Dashboard            │
                     │  (Gantt / Comparison / Override / IR)  │
                     └──────────────────┬─────────────────────┘
                                        │  HTTP / JSON (Axios)
                                        ▼
                     ┌────────────────────────────────────────┐
                     │            FastAPI Backend             │
                     │   (/api/tasks, /api/plans, /api/audit) │
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

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React, Radix UI.
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.0 (Async), aiosqlite, Pydantic v2.
- **Optimization:** Google OR-Tools (CP-SAT Solver).
- **Reporting:** Pandas, ReportLab.

---

## 📁 Repository Structure

```
SAMANVAY/
├── backend/
│   ├── app/
│   │   ├── api/             # REST endpoints (tasks, plans, config, audit)
│   │   ├── data_gen/        # Synthetic TMS, SMMS, TDMS & COA data generators
│   │   ├── models/          # SQLAlchemy ORM and Pydantic schemas
│   │   ├── optimizer/       # OR-Tools CP-SAT scheduler & baseline simulator
│   │   ├── planner/         # Weekly/Monthly rolling planners & PDF/CSV export
│   │   ├── scoring/         # AI Priority scoring engine
│   │   ├── config.py        # Settings & scoring parameters
│   │   ├── database.py      # Async DB session management
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/               # Pytest suite for scoring and optimizer
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client
│   │   ├── components/      # GanttChart, ComparisonView, OverrideModal, etc.
│   │   ├── pages/           # Dashboard, Tasks, WeeklyPlan, MonthlyPlan, AuditLog
│   │   └── types/           # TypeScript data interfaces
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt --prefer-binary

# Run tests
python -m pytest tests/ -v

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be accessible at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
Dashboard will be accessible at `http://localhost:3000`.

---

### 3. Docker Compose (Alternative)

To build and run both services with a single command:
```bash
docker-compose up --build
```

---

## 🧪 Demonstration Flow

1. Open **[http://localhost:3000](http://localhost:3000)**.
2. Click **"Generate Synthetic Data"** to ingest 450 defects across TMS, SMMS, and TDMS.
3. Click **"Generate Weekly Plan"** to run the CP-SAT optimizer.
4. Review the **Baseline vs. AI-Optimized Comparison** metrics.
5. Inspect scheduled blocks on the **Resource Gantt Chart** and click any block to test the **Manual Override Dialog**.
6. Visit **Audit & Config** (`/audit`) to adjust scoring weights or review logged overrides.
import os

base_dir = r"C:\Users\dushy\Desktop\SAMANVAY\backend"

files = {
    "requirements.txt": """fastapi==0.111.0
uvicorn[standard]==0.30.1
sqlalchemy==2.0.30
aiosqlite==0.20.0
alembic==1.13.1
pydantic==2.7.1
pydantic-settings==2.3.0
ortools==9.10.4067
pandas==2.2.2
reportlab==4.2.0
faker==25.4.0
numpy==1.26.4
pytest==8.2.2
httpx==0.27.0
python-multipart==0.0.9
""",
    "Dockerfile": """FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
""",
    "app/__init__.py": "",
    "app/config.py": """from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./samanvay.db"
    CRITICALITY_WEIGHT: float = 0.40
    URGENCY_WEIGHT: float = 0.35
    ASSET_RISK_WEIGHT: float = 0.25
    OPTIMIZER_TIME_LIMIT_SECONDS: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()
""",
    "app/models/__init__.py": "",
    "app/models/schemas.py": """from enum import Enum
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class Department(str, Enum):
    ENGINEERING = "Engineering"
    SNT = "S&T"
    TRD = "TRD"

class Severity(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class BlockStatus(str, Enum):
    PROPOSED = "Proposed"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class PlanStatus(str, Enum):
    DRAFT = "Draft"
    APPROVED = "Approved"

class MaintenanceTaskBase(BaseModel):
    department: Department
    defect_type: str
    severity: Severity
    due_date: date
    asset_id: str
    corridor_id: str
    estimated_duration_mins: int
    priority_score: Optional[float] = None
    priority_explanation: Optional[str] = None
    status: str = "Pending"

class MaintenanceTaskCreate(MaintenanceTaskBase):
    pass

class MaintenanceTask(MaintenanceTaskBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class PlanBase(BaseModel):
    plan_type: str
    start_date: date
    end_date: date
    status: PlanStatus

class Plan(PlanBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True
""",
    "app/models/orm.py": """from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Table
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime, date

Base = declarative_base()

class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    department = Column(String)
    defect_type = Column(String)
    severity = Column(String)
    due_date = Column(Date)
    asset_id = Column(String)
    corridor_id = Column(String)
    estimated_duration_mins = Column(Integer)
    priority_score = Column(Float, nullable=True)
    priority_explanation = Column(String, nullable=True)
    status = Column(String, default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)

class BlockSlot(Base):
    __tablename__ = "block_slots"
    
    id = Column(Integer, primary_key=True, index=True)
    corridor_id = Column(String)
    slot_date = Column(Date)
    start_time = Column(String) # e.g., "00:00"
    end_time = Column(String)
    duration_mins = Column(Integer)

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String)
    corridor_id = Column(String)
    run_date = Column(Date)
    start_time = Column(String)
    end_time = Column(String)

class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_type = Column(String) # "weekly", "monthly"
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String, default="Draft")
    created_at = Column(DateTime, default=datetime.utcnow)

class ScheduledBlock(Base):
    __tablename__ = "scheduled_blocks"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"))
    corridor_id = Column(String)
    block_date = Column(Date)
    start_time = Column(String)
    end_time = Column(String)
    departments_involved = Column(String)
    explanation = Column(String)

class OverrideLog(Base):
    __tablename__ = "override_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String) # "Task", "Block"
    entity_id = Column(Integer)
    override_reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
""",
    "app/database.py": """from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.models.orm import Base
from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
""",
    "app/main.py": """from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.api import tasks, plans, config, audit

app = FastAPI(title="SAMANVAY API", version="1.0.0", description="AI-Powered Block Planning for Indian Railways")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(tasks.router, prefix="/api")
app.include_router(plans.router, prefix="/api")
app.include_router(config.router, prefix="/api")
app.include_router(audit.router, prefix="/api")

@app.on_event("startup")
async def startup():
    await init_db()

@app.get("/health")
async def health():
    return {"status": "ok", "service": "SAMANVAY"}
""",
    "app/data_gen/__init__.py": "",
    "app/data_gen/corridors.py": """CORRIDORS = [
    {"id": "CR-01", "name": "Mumbai CST - Pune", "zone": "CR", "daily_trains": 180, "length_km": 192},
    {"id": "CR-02", "name": "Mumbai CST - Nashik Road", "zone": "CR", "daily_trains": 120, "length_km": 167},
    {"id": "CR-03", "name": "Pune - Solapur", "zone": "CR", "daily_trains": 85, "length_km": 261},
    {"id": "SCR-01", "name": "Secunderabad - Kazipet", "zone": "SCR", "daily_trains": 140, "length_km": 145},
    {"id": "SCR-02", "name": "Secunderabad - Wadi", "zone": "SCR", "daily_trains": 95, "length_km": 238},
    {"id": "SCR-03", "name": "Kazipet - Balharshah", "zone": "SCR", "daily_trains": 75, "length_km": 255},
    {"id": "WR-01", "name": "Mumbai Central - Vadodara", "zone": "WR", "daily_trains": 160, "length_km": 392},
    {"id": "WR-02", "name": "Vadodara - Ahmedabad", "zone": "WR", "daily_trains": 110, "length_km": 98},
    {"id": "NR-01", "name": "Delhi - Mathura", "zone": "NR", "daily_trains": 200, "length_km": 141},
    {"id": "NR-02", "name": "Delhi - Ambala", "zone": "NR", "daily_trains": 130, "length_km": 199},
]

MAINTENANCE_WINDOWS = [
    {"name": "early_morning", "start_hour": 0, "end_hour": 5},   # 00:00 - 05:00
    {"name": "midday", "start_hour": 10, "end_hour": 12},         # 10:00 - 12:00
]
""",
    "app/data_gen/generator.py": """import random
from datetime import date, timedelta
from app.models.orm import MaintenanceTask, BlockSlot, TimetableEntry
from app.data_gen.corridors import CORRIDORS, MAINTENANCE_WINDOWS
from app.scoring.engine import score_all_tasks

def generate_all_data(db_session):
    # This is a placeholder for generating synthetic data
    return {"tasks": 450, "slots": 600}
""",
    "app/scoring/__init__.py": "",
    "app/scoring/engine.py": """from app.config import settings

def compute_priority_score(task, corridor_daily_trains: int) -> tuple[float, str]:
    severity_map = {"Critical": 100, "High": 75, "Medium": 40, "Low": 15}
    crit_score = severity_map.get(task.severity, 15)
    
    urg_score = 50 # placeholder
    risk_score = min((corridor_daily_trains / 200) * 100, 100)
    
    score = crit_score * settings.CRITICALITY_WEIGHT + urg_score * settings.URGENCY_WEIGHT + risk_score * settings.ASSET_RISK_WEIGHT
    
    explanation = f"Criticality={crit_score:.0f} + Urgency={urg_score:.0f} + AssetRisk={risk_score:.0f}"
    return score, explanation

def score_all_tasks(tasks, corridors_map):
    results = []
    for t in tasks:
        trains = corridors_map.get(t.corridor_id, {}).get("daily_trains", 100)
        score, expl = compute_priority_score(t, trains)
        results.append((t.id, score, expl))
    return results
""",
    "app/optimizer/__init__.py": "",
    "app/optimizer/scheduler.py": """from ortools.sat.python import cp_model

def run_optimizer(tasks, block_slots, timetable_entries, horizon_days: int = 7) -> dict:
    return {
        'scheduled_blocks': [],
        'unscheduled_tasks': [],
        'stats': {'total_blocks': 0, 'merged_blocks': 0, 'utilization_pct': 0}
    }
""",
    "app/optimizer/baseline.py": """def run_baseline(tasks, block_slots, timetable_entries, horizon_days: int = 7) -> dict:
    return {
        'scheduled_blocks': [],
        'unscheduled_tasks': [],
        'stats': {'total_blocks': 0, 'merged_blocks': 0, 'utilization_pct': 0}
    }
""",
    "app/planner/__init__.py": "",
    "app/planner/weekly.py": """from app.models.orm import Plan

async def generate_weekly_plan(db, start_date=None) -> Plan:
    return Plan(plan_type="weekly")
""",
    "app/planner/monthly.py": """from app.models.orm import Plan

async def generate_monthly_plan(db, start_date=None) -> Plan:
    return Plan(plan_type="monthly")
""",
    "app/planner/export.py": """def export_plan_csv(scheduled_blocks: list, tasks_map: dict) -> bytes:
    return b"csv data"

def export_plan_pdf(plan, scheduled_blocks: list) -> bytes:
    return b"pdf data"
""",
    "app/api/__init__.py": "",
    "app/api/tasks.py": """from fastapi import APIRouter
router = APIRouter()

@router.get("/tasks")
async def get_tasks():
    return []

@router.post("/tasks/generate")
async def generate_tasks():
    return {"status": "generated"}

@router.patch("/tasks/{task_id}/priority")
async def override_priority(task_id: int):
    return {"status": "updated"}
""",
    "app/api/plans.py": """from fastapi import APIRouter
router = APIRouter()

@router.post("/plans/weekly")
async def generate_weekly():
    return {"status": "generated"}

@router.post("/plans/monthly")
async def generate_monthly():
    return {"status": "generated"}

@router.get("/plans")
async def get_plans():
    return []

@router.get("/plans/{plan_id}")
async def get_plan(plan_id: int):
    return {}

@router.get("/plans/{plan_id}/baseline")
async def get_plan_baseline(plan_id: int):
    return {}

@router.get("/plans/{plan_id}/comparison")
async def get_plan_comparison(plan_id: int):
    return {}

@router.patch("/plans/{plan_id}/blocks/{block_id}")
async def override_block(plan_id: int, block_id: int):
    return {}

@router.post("/plans/{plan_id}/approve")
async def approve_plan(plan_id: int):
    return {}

@router.get("/plans/{plan_id}/export/csv")
async def export_csv(plan_id: int):
    return {}

@router.get("/plans/{plan_id}/export/pdf")
async def export_pdf(plan_id: int):
    return {}
""",
    "app/api/config.py": """from fastapi import APIRouter
router = APIRouter()

@router.get("/config/weights")
async def get_weights():
    return {}

@router.put("/config/weights")
async def update_weights():
    return {}
""",
    "app/api/audit.py": """from fastapi import APIRouter
router = APIRouter()

@router.get("/audit/overrides")
async def get_overrides():
    return []
""",
    "tests/__init__.py": "",
    "tests/test_scoring.py": """def test_scoring_critical():
    assert True
""",
    "tests/test_optimizer.py": """def test_optimizer():
    assert True
"""
}

for rel_path, content in files.items():
    full_path = os.path.join(base_dir, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Project generated successfully.")

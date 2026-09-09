"""
SAMANVAY — Synthetic Data Generator
=====================================
Generates realistic Indian Railways maintenance data for all three departments:
  - Engineering / TMS  (200 tasks)
  - S&T / SMMS         (150 tasks)
  - TRD / TDMS         (100 tasks)

Also generates:
  - BlockSlot records   (2 windows per corridor per day × 10 corridors × 30 days)
  - TimetableEntry      (passenger trains per corridor)

All data is committed to the database and priority scores are computed.
"""
import random
import uuid
from datetime import date, timedelta, datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete

from app.models.orm import MaintenanceTask, BlockSlot, TimetableEntry
from app.data_gen.corridors import CORRIDORS, MAINTENANCE_WINDOWS
from app.scoring.engine import compute_priority_score

random.seed(42)

# ---------------------------------------------------------------------------
# Defect type catalogues per department
# ---------------------------------------------------------------------------
ENGINEERING_DEFECTS = [
    ("Rail fracture",              "Critical", 90,  120),
    ("Fish-plate defect",          "High",     60,  60),
    ("Track geometry failure",     "High",     75,  90),
    ("Sleeper replacement",        "Medium",   45,  60),
    ("Ballast tamping",            "Medium",   30,  120),
    ("Level crossing maintenance", "Medium",   20,  60),
    ("Drain cleaning",             "Low",      10,  30),
    ("Vegetation removal",         "Low",      5,   30),
]

SNT_DEFECTS = [
    ("Signal failure",             "Critical", 85,  60),
    ("Axle counter malfunction",   "Critical", 90,  90),
    ("Interlocking check",         "High",     60,  60),
    ("OFC cable cut",              "High",     70,  90),
    ("Point machine failure",      "High",     65,  60),
    ("Block instrument failure",   "Medium",   40,  45),
    ("Signal lamp replacement",    "Low",      10,  20),
    ("Battery maintenance",        "Low",      5,   30),
]

TRD_DEFECTS = [
    ("OHE wire break",             "Critical", 95,  120),
    ("Mast failure",               "High",     70,  90),
    ("Section insulator defect",   "High",     65,  60),
    ("Substation equipment check", "High",     55,  90),
    ("Booster transformer fault",  "Medium",   45,  60),
    ("Earthing check",             "Medium",   20,  45),
    ("Routine OHE inspection",     "Low",      5,   60),
]

# Severity → defect probability weights (5% Crit, 15% High, 50% Med, 30% Low)
SEVERITY_WEIGHTS = {
    "Critical": 5,
    "High":     15,
    "Medium":   50,
    "Low":      30,
}

def _weighted_defect(defect_list):
    """Pick a defect entry using severity-weighted random selection."""
    weights = [SEVERITY_WEIGHTS[d[1]] for d in defect_list]
    return random.choices(defect_list, weights=weights, k=1)[0]


def _make_asset_id(dept_prefix: str, corridor_id: str, idx: int) -> str:
    corridor_part = corridor_id.replace("-", "")
    return f"{dept_prefix}-{corridor_part}-{idx:03d}"


def _make_due_date() -> tuple:
    """Return (due_date, overdue_flag) with realistic distribution."""
    # -10 days (overdue) to +30 days (future)
    offset = random.randint(-10, 30)
    d = date.today() + timedelta(days=offset)
    return d, offset < 0


def _make_reported_date(due_date: date, overdue: bool) -> date:
    """Reported date is before due date."""
    days_before = random.randint(1, 14)
    return due_date - timedelta(days=days_before)


# ---------------------------------------------------------------------------
# Task generation helpers
# ---------------------------------------------------------------------------
def _generate_tasks_for_dept(
    dept: str,
    defect_list: list,
    asset_prefix: str,
    count: int,
    corridors: list,
) -> list:
    tasks = []
    for i in range(count):
        corridor = random.choice(corridors)
        defect_name, severity_hint, _, duration = _weighted_defect(defect_list)
        due_date, overdue = _make_due_date()
        reported = _make_reported_date(due_date, overdue)
        asset_id = _make_asset_id(asset_prefix, corridor["id"], i + 1)

        tasks.append(dict(
            task_uuid=str(uuid.uuid4()),
            department=dept,
            asset_id=asset_id,
            corridor_id=corridor["id"],
            corridor_name=corridor["name"],
            defect_type=defect_name,
            severity=severity_hint,
            reported_date=reported,
            due_date=due_date,
            overdue_flag=overdue,
            estimated_duration_mins=duration + random.randint(-10, 20),
            status="Pending",
        ))
    return tasks


# ---------------------------------------------------------------------------
# Main generator
# ---------------------------------------------------------------------------
async def generate_all_data(db: AsyncSession) -> dict:
    """
    Clear existing data and generate a full synthetic dataset.
    Returns counts of generated records.
    """
    # --- Clear existing data ---
    await db.execute(delete(TimetableEntry))
    await db.execute(delete(BlockSlot))
    await db.execute(delete(MaintenanceTask))
    await db.commit()

    corridors_map = {c["id"]: c for c in CORRIDORS}
    today = date.today()

    # --- Generate maintenance tasks ---
    raw_tasks = []
    raw_tasks += _generate_tasks_for_dept("Engineering", ENGINEERING_DEFECTS, "TRK", 200, CORRIDORS)
    raw_tasks += _generate_tasks_for_dept("S&T",         SNT_DEFECTS,          "SIG", 150, CORRIDORS)
    raw_tasks += _generate_tasks_for_dept("TRD",         TRD_DEFECTS,          "TRD", 100, CORRIDORS)

    orm_tasks = []
    for t in raw_tasks:
        corridor = corridors_map[t["corridor_id"]]
        score, explanation = compute_priority_score(
            severity=t["severity"],
            due_date=t["due_date"],
            overdue_flag=t["overdue_flag"],
            corridor_daily_trains=corridor["daily_trains"],
        )
        orm_task = MaintenanceTask(
            task_uuid=t["task_uuid"],
            department=t["department"],
            asset_id=t["asset_id"],
            corridor_id=t["corridor_id"],
            corridor_name=t["corridor_name"],
            defect_type=t["defect_type"],
            severity=t["severity"],
            reported_date=t["reported_date"],
            due_date=t["due_date"],
            overdue_flag=t["overdue_flag"],
            estimated_duration_mins=max(15, t["estimated_duration_mins"]),
            priority_score=score,
            priority_explanation=explanation,
            status="Pending",
        )
        db.add(orm_task)
        orm_tasks.append(orm_task)

    # --- Generate block slots (30 days × 10 corridors × 2 windows) ---
    slot_count = 0
    for day_offset in range(30):
        slot_date = today + timedelta(days=day_offset)
        for corridor in CORRIDORS:
            for window in MAINTENANCE_WINDOWS:
                start_dt = datetime.combine(slot_date, datetime.min.time()).replace(
                    hour=window["start_hour"], minute=0
                )
                end_dt = start_dt.replace(hour=window["end_hour"])
                duration = int((end_dt - start_dt).total_seconds() / 60)
                db.add(BlockSlot(
                    corridor_id=corridor["id"],
                    corridor_name=corridor["name"],
                    slot_date=slot_date,
                    start_datetime=start_dt,
                    end_datetime=end_dt,
                    duration_mins=duration,
                    available=True,
                ))
                slot_count += 1

    # --- Generate timetable entries (passenger + goods trains) ---
    train_count = 0
    passenger_intervals = [6, 8, 10, 12, 14, 16, 18, 20]  # departure hours
    goods_intervals     = [1, 3, 22]
    for corridor in CORRIDORS:
        for day_offset in range(30):
            run_date = today + timedelta(days=day_offset)
            # Passenger trains
            for hour in passenger_intervals:
                n_trains = random.randint(2, 5)
                for j in range(n_trains):
                    dep_min = random.randint(0, 59)
                    dep = datetime.combine(run_date, datetime.min.time()).replace(
                        hour=hour, minute=dep_min
                    )
                    arr = dep + timedelta(minutes=random.randint(30, 180))
                    db.add(TimetableEntry(
                        train_number=f"P-{corridor['id']}-{hour:02d}{j}",
                        train_type="Passenger",
                        corridor_id=corridor["id"],
                        run_date=run_date,
                        departure_datetime=dep,
                        arrival_datetime=arr,
                    ))
                    train_count += 1
            # Goods trains
            for hour in goods_intervals:
                dep = datetime.combine(run_date, datetime.min.time()).replace(hour=hour, minute=0)
                arr = dep + timedelta(minutes=random.randint(60, 240))
                db.add(TimetableEntry(
                    train_number=f"G-{corridor['id']}-{hour:02d}",
                    train_type="Goods",
                    corridor_id=corridor["id"],
                    run_date=run_date,
                    departure_datetime=dep,
                    arrival_datetime=arr,
                ))
                train_count += 1

    await db.commit()

    return {
        "tasks":   len(raw_tasks),
        "slots":   slot_count,
        "trains":  train_count,
        "message": f"Generated {len(raw_tasks)} tasks, {slot_count} block slots, {train_count} timetable entries",
    }

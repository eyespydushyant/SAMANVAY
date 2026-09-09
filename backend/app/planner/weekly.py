"""SAMANVAY — Weekly Plan Generator (7-day rolling horizon)"""
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.orm import MaintenanceTask, BlockSlot, TimetableEntry, Plan
from app.optimizer.scheduler import run_optimizer
from app.optimizer.baseline import run_baseline
from app.planner.utils import save_plan_to_db


async def generate_weekly_plan(db: AsyncSession, start_date: date = None) -> Plan:
    """Generate and persist a 7-day rolling block plan."""
    start = start_date or date.today()
    end   = start + timedelta(days=6)

    # Load pending tasks (priority-ordered)
    tasks_result = await db.execute(
        select(MaintenanceTask)
        .where(MaintenanceTask.status == "Pending")
        .order_by(MaintenanceTask.priority_score.desc())
    )
    tasks = tasks_result.scalars().all()

    # Load block slots within the horizon
    slots_result = await db.execute(
        select(BlockSlot).where(
            BlockSlot.slot_date >= start,
            BlockSlot.slot_date <= end,
            BlockSlot.available == True,
        )
    )
    slots = slots_result.scalars().all()

    # Run both planners
    optimized = run_optimizer(tasks, slots, horizon_days=7)
    baseline  = run_baseline(tasks, slots, horizon_days=7)

    return await save_plan_to_db(db, "weekly", start, end, optimized, baseline)

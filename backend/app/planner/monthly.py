"""SAMANVAY — Monthly Plan Generator (30-day rolling horizon)"""
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.orm import MaintenanceTask, BlockSlot, Plan
from app.optimizer.scheduler import run_optimizer
from app.optimizer.baseline import run_baseline
from app.planner.utils import save_plan_to_db


async def generate_monthly_plan(db: AsyncSession, start_date: date = None) -> Plan:
    """Generate and persist a 30-day rolling block plan."""
    start = start_date or date.today()
    end   = start + timedelta(days=29)

    tasks_result = await db.execute(
        select(MaintenanceTask)
        .where(MaintenanceTask.status == "Pending")
        .order_by(MaintenanceTask.priority_score.desc())
    )
    tasks = tasks_result.scalars().all()

    slots_result = await db.execute(
        select(BlockSlot).where(
            BlockSlot.slot_date >= start,
            BlockSlot.slot_date <= end,
            BlockSlot.available == True,
        )
    )
    slots = slots_result.scalars().all()

    optimized = run_optimizer(tasks, slots, horizon_days=30)
    baseline  = run_baseline(tasks, slots, horizon_days=30)

    return await save_plan_to_db(db, "monthly", start, end, optimized, baseline)

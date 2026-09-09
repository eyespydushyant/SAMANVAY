"""SAMANVAY — Plans API Router"""
import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.orm import Plan, ScheduledBlock, MaintenanceTask, OverrideLog
from app.planner.weekly import generate_weekly_plan
from app.planner.monthly import generate_monthly_plan
from app.planner.utils import build_plan_response
from app.planner.export import export_plan_csv, export_plan_pdf

router = APIRouter(tags=["Plans"])


@router.post("/plans/weekly")
async def create_weekly_plan(db: AsyncSession = Depends(get_db)):
    """Generate a 7-day rolling AI-optimized block plan."""
    plan = await generate_weekly_plan(db)
    return await build_plan_response(db, plan)


@router.post("/plans/monthly")
async def create_monthly_plan(db: AsyncSession = Depends(get_db)):
    """Generate a 30-day rolling AI-optimized block plan."""
    plan = await generate_monthly_plan(db)
    return await build_plan_response(db, plan)


@router.get("/plans")
async def list_plans(db: AsyncSession = Depends(get_db)):
    """List all plans with summary stats."""
    result = await db.execute(
        select(Plan).order_by(Plan.created_at.desc())
    )
    plans = result.scalars().all()
    return [
        {
            "plan_id":    p.id,
            "plan_type":  p.plan_type,
            "status":     p.status,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "end_date":   p.end_date.isoformat() if p.end_date else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "approved_by": p.approved_by,
            "stats":      json.loads(p.stats_json or "{}"),
        }
        for p in plans
    ]


@router.get("/plans/{plan_id}")
async def get_plan(plan_id: int, db: AsyncSession = Depends(get_db)):
    """Get a plan with full block and task detail."""
    plan = await db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return await build_plan_response(db, plan)


@router.get("/plans/{plan_id}/comparison")
async def get_plan_comparison(plan_id: int, db: AsyncSession = Depends(get_db)):
    """Return side-by-side comparison of optimized vs baseline stats."""
    plan = await db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    optimized_stats = json.loads(plan.stats_json or "{}")
    baseline_stats  = json.loads(plan.baseline_stats_json or "{}")

    def pct_improvement(baseline_val, optimized_val, lower_is_better=True):
        if not baseline_val:
            return 0.0
        if lower_is_better:
            return round((baseline_val - optimized_val) / baseline_val * 100, 1)
        else:
            return round((optimized_val - baseline_val) / max(baseline_val, 1) * 100, 1)

    improvements = {
        "blocks_reduction_pct":   pct_improvement(baseline_stats.get("total_blocks", 0),   optimized_stats.get("total_blocks", 0)),
        "downtime_reduction_pct": pct_improvement(baseline_stats.get("total_downtime_hours", 0), optimized_stats.get("total_downtime_hours", 0)),
        "hp_coverage_gain_pct":   pct_improvement(baseline_stats.get("high_priority_scheduled_pct", 0), optimized_stats.get("high_priority_scheduled_pct", 0), lower_is_better=False),
        "merged_blocks_gained":   optimized_stats.get("merged_blocks", 0) - baseline_stats.get("merged_blocks", 0),
    }

    return {
        "plan_id":    plan.id,
        "plan_type":  plan.plan_type,
        "optimized":  optimized_stats,
        "baseline":   baseline_stats,
        "improvements": improvements,
    }


@router.patch("/plans/{plan_id}/blocks/{block_id}")
async def override_block(
    plan_id:   int,
    block_id:  int,
    new_start: Optional[str] = None,
    new_end:   Optional[str] = None,
    reason:    str = "Manual override",
    changed_by: str = "Planner",
    db:        AsyncSession = Depends(get_db),
):
    """Override a scheduled block's time window."""
    block = await db.get(ScheduledBlock, block_id)
    if not block or block.plan_id != plan_id:
        raise HTTPException(status_code=404, detail="Block not found in this plan")

    old_start = block.start_datetime
    old_end   = block.end_datetime

    if new_start:
        block.start_datetime = datetime.fromisoformat(new_start)
    if new_end:
        block.end_datetime = datetime.fromisoformat(new_end)

    # Log the override
    log = OverrideLog(
        block_id=block_id,
        plan_id=plan_id,
        changed_by=changed_by,
        reason=reason,
        old_start=old_start,
        old_end=old_end,
        new_start=block.start_datetime,
        new_end=block.end_datetime,
    )
    db.add(log)
    await db.commit()

    return {
        "block_id":    block.id,
        "corridor_id": block.corridor_id,
        "new_start":   block.start_datetime.isoformat() if block.start_datetime else None,
        "new_end":     block.end_datetime.isoformat() if block.end_datetime else None,
        "message":     "Block overridden and logged successfully",
    }


@router.post("/plans/{plan_id}/approve")
async def approve_plan(
    plan_id:     int,
    approved_by: str = "Divisional Controller",
    db:          AsyncSession = Depends(get_db),
):
    """Approve a plan."""
    plan = await db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan.status     = "Approved"
    plan.approved_by = approved_by
    await db.commit()
    return {"plan_id": plan.id, "status": "Approved", "approved_by": approved_by}


@router.get("/plans/{plan_id}/export/csv")
async def export_csv(plan_id: int, db: AsyncSession = Depends(get_db)):
    """Download the plan as CSV."""
    plan = await db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    blocks_result = await db.execute(
        select(ScheduledBlock).where(ScheduledBlock.plan_id == plan_id, ScheduledBlock.is_baseline == False)
    )
    blocks = blocks_result.scalars().all()

    # Build tasks map
    all_task_ids = set()
    for b in blocks:
        all_task_ids.update(json.loads(b.task_ids_json or "[]"))
    tasks_result = await db.execute(select(MaintenanceTask).where(MaintenanceTask.id.in_(list(all_task_ids))))
    tasks_map = {t.id: t for t in tasks_result.scalars().all()}

    csv_bytes = export_plan_csv(plan, blocks, tasks_map)
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=samanvay_plan_{plan_id}.csv"},
    )


@router.get("/plans/{plan_id}/export/pdf")
async def export_pdf(plan_id: int, db: AsyncSession = Depends(get_db)):
    """Download the plan as PDF."""
    plan = await db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    blocks_result = await db.execute(
        select(ScheduledBlock).where(ScheduledBlock.plan_id == plan_id)
    )
    blocks = blocks_result.scalars().all()

    all_task_ids = set()
    for b in blocks:
        all_task_ids.update(json.loads(b.task_ids_json or "[]"))
    tasks_result = await db.execute(select(MaintenanceTask).where(MaintenanceTask.id.in_(list(all_task_ids))))
    tasks_map = {t.id: t for t in tasks_result.scalars().all()}

    pdf_bytes = export_plan_pdf(plan, list(blocks), tasks_map)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=samanvay_plan_{plan_id}.pdf"},
    )

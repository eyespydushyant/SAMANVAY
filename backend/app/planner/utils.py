"""
SAMANVAY — Shared Plan Generation Utilities
=============================================
Contains shared logic for saving optimizer results to the database
and building API response dicts.
"""
import json
from datetime import date
from typing import Dict, Any, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.orm import Plan, ScheduledBlock, MaintenanceTask


async def save_plan_to_db(
    db: AsyncSession,
    plan_type: str,
    start_date: date,
    end_date: date,
    optimized_result: Dict[str, Any],
    baseline_result: Dict[str, Any],
) -> Plan:
    """Persist plan + all scheduled blocks (optimized + baseline) to database."""
    plan = Plan(
        plan_type=plan_type,
        start_date=start_date,
        end_date=end_date,
        status="Draft",
        stats_json=json.dumps(optimized_result["stats"]),
        baseline_stats_json=json.dumps(baseline_result["stats"]),
    )
    db.add(plan)
    await db.flush()  # get plan.id

    # Save optimized blocks
    for block_data in optimized_result["scheduled_blocks"]:
        block = ScheduledBlock(
            block_uuid=block_data["block_uuid"],
            plan_id=plan.id,
            corridor_id=block_data["corridor_id"],
            corridor_name=block_data["corridor_name"],
            block_date=block_data["block_date"],
            start_datetime=block_data["start_datetime"],
            end_datetime=block_data["end_datetime"],
            departments_involved=block_data["departments_involved"],
            task_ids_json=block_data["task_ids_json"],
            status=block_data["status"],
            explanation=block_data["explanation"],
            is_baseline=False,
        )
        db.add(block)
        # Mark tasks as Scheduled
        task_ids = json.loads(block_data["task_ids_json"])
        for tid in task_ids:
            task = await db.get(MaintenanceTask, tid)
            if task:
                task.status = "Scheduled"

    # Save baseline blocks
    for block_data in baseline_result["scheduled_blocks"]:
        block = ScheduledBlock(
            block_uuid=block_data["block_uuid"],
            plan_id=plan.id,
            corridor_id=block_data["corridor_id"],
            corridor_name=block_data["corridor_name"],
            block_date=block_data["block_date"],
            start_datetime=block_data["start_datetime"],
            end_datetime=block_data["end_datetime"],
            departments_involved=block_data["departments_involved"],
            task_ids_json=block_data["task_ids_json"],
            status=block_data["status"],
            explanation=block_data["explanation"],
            is_baseline=True,
        )
        db.add(block)

    await db.commit()
    await db.refresh(plan)
    return plan


async def build_plan_response(
    db: AsyncSession,
    plan: Plan,
    include_baseline: bool = False,
) -> Dict[str, Any]:
    """Build a full API response dict for a plan."""
    # Load all optimized blocks for this plan
    result = await db.execute(
        select(ScheduledBlock).where(
            ScheduledBlock.plan_id == plan.id,
            ScheduledBlock.is_baseline == False,
        )
    )
    opt_blocks = result.scalars().all()

    blocks_out = []
    for block in opt_blocks:
        task_ids = json.loads(block.task_ids_json or "[]")
        tasks_result = await db.execute(
            select(MaintenanceTask).where(MaintenanceTask.id.in_(task_ids))
        )
        tasks = tasks_result.scalars().all()
        blocks_out.append({
            "block_id":            block.id,
            "block_uuid":          block.block_uuid,
            "corridor_id":         block.corridor_id,
            "corridor_name":       block.corridor_name,
            "block_date":          block.block_date.isoformat() if block.block_date else None,
            "start_datetime":      block.start_datetime.isoformat() if block.start_datetime else None,
            "end_datetime":        block.end_datetime.isoformat() if block.end_datetime else None,
            "departments_involved": block.departments_involved.split(",") if block.departments_involved else [],
            "status":              block.status,
            "explanation":         block.explanation,
            "tasks": [
                {
                    "task_id":               t.id,
                    "task_uuid":             t.task_uuid,
                    "department":            t.department,
                    "asset_id":              t.asset_id,
                    "corridor_id":           t.corridor_id,
                    "corridor_name":         t.corridor_name,
                    "defect_type":           t.defect_type,
                    "severity":              t.severity,
                    "due_date":              t.due_date.isoformat() if t.due_date else None,
                    "overdue_flag":          t.overdue_flag,
                    "estimated_duration_mins": t.estimated_duration_mins,
                    "priority_score":        t.priority_score,
                    "priority_explanation":  t.priority_explanation,
                }
                for t in tasks
            ],
        })

    stats = json.loads(plan.stats_json or "{}")

    out = {
        "plan_id":    plan.id,
        "plan_type":  plan.plan_type,
        "status":     plan.status,
        "start_date": plan.start_date.isoformat() if plan.start_date else None,
        "end_date":   plan.end_date.isoformat() if plan.end_date else None,
        "created_at": plan.created_at.isoformat() if plan.created_at else None,
        "approved_by": plan.approved_by,
        "stats":      stats,
        "scheduled_blocks": blocks_out,
    }

    if include_baseline:
        baseline_stats = json.loads(plan.baseline_stats_json or "{}")
        out["baseline_stats"] = baseline_stats

    return out

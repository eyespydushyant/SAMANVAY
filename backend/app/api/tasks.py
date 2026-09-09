"""SAMANVAY — Tasks API Router"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.orm import MaintenanceTask
from app.data_gen.generator import generate_all_data

router = APIRouter(tags=["Tasks"])


@router.post("/tasks/generate")
async def generate_tasks(db: AsyncSession = Depends(get_db)):
    """Generate synthetic maintenance task data for all 3 departments."""
    result = await generate_all_data(db)
    return result


@router.get("/tasks")
async def get_tasks(
    department: Optional[str] = Query(None),
    severity:   Optional[str] = Query(None),
    overdue:    Optional[bool] = Query(None),
    status:     Optional[str] = Query(None),
    page:       int = Query(1, ge=1),
    limit:      int = Query(50, ge=1, le=200),
    db:         AsyncSession = Depends(get_db),
):
    """List all maintenance tasks with optional filters."""
    query = select(MaintenanceTask).order_by(MaintenanceTask.priority_score.desc())

    if department:
        query = query.where(MaintenanceTask.department == department)
    if severity:
        query = query.where(MaintenanceTask.severity == severity)
    if overdue is not None:
        query = query.where(MaintenanceTask.overdue_flag == overdue)
    if status:
        query = query.where(MaintenanceTask.status == status)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Paginate
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    tasks = result.scalars().all()

    return {
        "total": total,
        "page":  page,
        "limit": limit,
        "tasks": [_task_to_dict(t) for t in tasks],
    }


@router.get("/tasks/summary")
async def get_tasks_summary(db: AsyncSession = Depends(get_db)):
    """Get task counts by department and severity for the dashboard."""
    result = await db.execute(select(MaintenanceTask))
    all_tasks = result.scalars().all()

    if not all_tasks:
        return {"total": 0, "by_department": {}, "by_severity": {}, "overdue_count": 0}

    by_dept: dict = {}
    by_sev: dict = {}
    overdue = 0

    for t in all_tasks:
        by_dept.setdefault(t.department, {"total": 0, "Critical": 0, "High": 0, "Medium": 0, "Low": 0})
        by_dept[t.department]["total"] += 1
        by_dept[t.department][t.severity] = by_dept[t.department].get(t.severity, 0) + 1

        by_sev[t.severity] = by_sev.get(t.severity, 0) + 1

        if t.overdue_flag:
            overdue += 1

    return {
        "total":         len(all_tasks),
        "by_department": by_dept,
        "by_severity":   by_sev,
        "overdue_count": overdue,
        "pending_count": sum(1 for t in all_tasks if t.status == "Pending"),
        "scheduled_count": sum(1 for t in all_tasks if t.status == "Scheduled"),
    }


@router.patch("/tasks/{task_id}/priority")
async def override_task_priority(
    task_id: int,
    priority_score: float,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Manually override a task's priority score."""
    task = await db.get(MaintenanceTask, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.priority_score = min(max(priority_score, 0), 100)
    task.priority_explanation = reason or f"Manually overridden to {priority_score}"
    await db.commit()
    return _task_to_dict(task)


def _task_to_dict(t: MaintenanceTask) -> dict:
    return {
        "task_id":               t.id,
        "task_uuid":             t.task_uuid,
        "department":            t.department,
        "asset_id":              t.asset_id,
        "corridor_id":           t.corridor_id,
        "corridor_name":         t.corridor_name,
        "defect_type":           t.defect_type,
        "severity":              t.severity,
        "reported_date":         t.reported_date.isoformat() if t.reported_date else None,
        "due_date":              t.due_date.isoformat() if t.due_date else None,
        "overdue_flag":          t.overdue_flag,
        "estimated_duration_mins": t.estimated_duration_mins,
        "priority_score":        round(t.priority_score, 2) if t.priority_score else None,
        "priority_explanation":  t.priority_explanation,
        "status":                t.status,
        "created_at":            t.created_at.isoformat() if t.created_at else None,
    }

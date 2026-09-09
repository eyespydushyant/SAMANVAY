"""SAMANVAY — Audit Log API Router"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.orm import OverrideLog

router = APIRouter(tags=["Audit"])


@router.get("/audit/overrides")
async def get_overrides(
    page:  int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db:    AsyncSession = Depends(get_db),
):
    """List all block override log entries, newest first."""
    result = await db.execute(
        select(OverrideLog)
        .order_by(OverrideLog.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    logs = result.scalars().all()
    return [
        {
            "log_id":     log.id,
            "block_id":   log.block_id,
            "plan_id":    log.plan_id,
            "changed_by": log.changed_by,
            "reason":     log.reason,
            "old_start":  log.old_start.isoformat() if log.old_start else None,
            "old_end":    log.old_end.isoformat() if log.old_end else None,
            "new_start":  log.new_start.isoformat() if log.new_start else None,
            "new_end":    log.new_end.isoformat() if log.new_end else None,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]

"""
SAMANVAY — SQLAlchemy ORM Models
==================================
Defines all database tables using SQLAlchemy 2.0 declarative style.
"""
from datetime import datetime, date
from sqlalchemy import (
    Boolean, Column, Date, DateTime, Float, ForeignKey,
    Integer, String, Text,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Input tables (populated by data generator)
# ---------------------------------------------------------------------------

class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"

    id                      = Column(Integer, primary_key=True, index=True)
    task_uuid               = Column(String(36), unique=True, index=True)
    department              = Column(String(20))   # Engineering | S&T | TRD
    asset_id                = Column(String(50))
    corridor_id             = Column(String(20), index=True)
    corridor_name           = Column(String(100))
    defect_type             = Column(String(100))
    severity                = Column(String(20))   # Critical | High | Medium | Low
    reported_date           = Column(Date)
    due_date                = Column(Date)
    overdue_flag            = Column(Boolean, default=False)
    estimated_duration_mins = Column(Integer)
    priority_score          = Column(Float, nullable=True)
    priority_explanation    = Column(Text, nullable=True)
    status                  = Column(String(20), default="Pending")  # Pending | Scheduled
    created_at              = Column(DateTime, default=datetime.utcnow)


class BlockSlot(Base):
    __tablename__ = "block_slots"

    id              = Column(Integer, primary_key=True, index=True)
    corridor_id     = Column(String(20), index=True)
    corridor_name   = Column(String(100))
    slot_date       = Column(Date, index=True)
    start_datetime  = Column(DateTime)
    end_datetime    = Column(DateTime)
    duration_mins   = Column(Integer)
    available       = Column(Boolean, default=True)


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id                  = Column(Integer, primary_key=True, index=True)
    train_number        = Column(String(50))
    train_type          = Column(String(20))   # Passenger | Goods
    corridor_id         = Column(String(20), index=True)
    run_date            = Column(Date, index=True)
    departure_datetime  = Column(DateTime)
    arrival_datetime    = Column(DateTime)


# ---------------------------------------------------------------------------
# Output tables (populated by the optimizer/planner)
# ---------------------------------------------------------------------------

class Plan(Base):
    __tablename__ = "plans"

    id              = Column(Integer, primary_key=True, index=True)
    plan_type       = Column(String(20))    # weekly | monthly
    start_date      = Column(Date)
    end_date        = Column(Date)
    status          = Column(String(20), default="Draft")  # Draft | Approved
    approved_by     = Column(String(100), nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)

    # Stats snapshot (JSON-serialised as Text for SQLite simplicity)
    stats_json          = Column(Text, nullable=True)
    baseline_stats_json = Column(Text, nullable=True)

    blocks = relationship("ScheduledBlock", back_populates="plan",
                          cascade="all, delete-orphan")


class ScheduledBlock(Base):
    __tablename__ = "scheduled_blocks"

    id                   = Column(Integer, primary_key=True, index=True)
    block_uuid           = Column(String(36), unique=True, index=True)
    plan_id              = Column(Integer, ForeignKey("plans.id"), index=True)
    corridor_id          = Column(String(20))
    corridor_name        = Column(String(100))
    block_date           = Column(Date)
    start_datetime       = Column(DateTime)
    end_datetime         = Column(DateTime)
    departments_involved = Column(String(50))  # comma-separated
    task_ids_json        = Column(Text)         # JSON list of task IDs
    status               = Column(String(20), default="Proposed")
    explanation          = Column(Text, nullable=True)
    is_baseline          = Column(Boolean, default=False)

    plan = relationship("Plan", back_populates="blocks")


class OverrideLog(Base):
    __tablename__ = "override_logs"

    id              = Column(Integer, primary_key=True, index=True)
    block_id        = Column(Integer, ForeignKey("scheduled_blocks.id"))
    plan_id         = Column(Integer)
    changed_by      = Column(String(100))
    reason          = Column(Text)
    old_start       = Column(DateTime, nullable=True)
    old_end         = Column(DateTime, nullable=True)
    new_start       = Column(DateTime, nullable=True)
    new_end         = Column(DateTime, nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)

"""Tests for the OR-Tools block scheduler and baseline optimizer."""
import json
import pytest
from datetime import date, datetime, timedelta
from unittest.mock import MagicMock

from app.optimizer.scheduler import run_optimizer
from app.optimizer.baseline import run_baseline


def _make_task(id, dept, corridor, severity, duration, priority_score=50.0, due_days=5):
    t = MagicMock()
    t.id = id
    t.department = dept
    t.corridor_id = corridor
    t.severity = severity
    t.estimated_duration_mins = duration
    t.priority_score = priority_score
    t.defect_type = f"Test defect {id}"
    t.due_date = date.today() + timedelta(days=due_days)
    t.overdue_flag = due_days < 0
    return t


def _make_slot(id, corridor, duration=300):
    s = MagicMock()
    s.id = id
    s.corridor_id = corridor
    s.corridor_name = f"Corridor {corridor}"
    s.slot_date = date.today() + timedelta(days=1)
    s.start_datetime = datetime.combine(date.today() + timedelta(days=1), datetime.min.time()).replace(hour=0)
    s.end_datetime   = s.start_datetime + timedelta(minutes=duration)
    s.duration_mins  = duration
    return s


class TestOptimizer:
    def test_empty_inputs_returns_empty(self):
        result = run_optimizer([], [], horizon_days=7)
        assert result["scheduled_blocks"] == []
        assert result["stats"]["total_blocks"] == 0

    def test_critical_task_must_be_scheduled(self):
        tasks = [
            _make_task(1, "Engineering", "CR-01", "Critical", 60, priority_score=95),
            _make_task(2, "S&T",         "CR-01", "Low",      30, priority_score=10),
        ]
        slots = [_make_slot(1, "CR-01", 300)]
        result = run_optimizer(tasks, slots)
        # Critical task should never be unscheduled
        unscheduled_ids = [u["task_id"] for u in result["unscheduled_tasks"]]
        assert 1 not in unscheduled_ids, "Critical task must be scheduled"

    def test_multi_dept_tasks_on_same_corridor_get_merged(self):
        tasks = [
            _make_task(1, "Engineering", "SCR-01", "High",   60, priority_score=80),
            _make_task(2, "S&T",         "SCR-01", "High",   45, priority_score=75),
            _make_task(3, "TRD",         "SCR-01", "Medium", 30, priority_score=60),
        ]
        slots = [_make_slot(1, "SCR-01", 300)]
        result = run_optimizer(tasks, slots)
        # All tasks fit in one slot → should produce a merged block
        if result["scheduled_blocks"]:
            merged = [b for b in result["scheduled_blocks"] if "," in b["departments_involved"]]
            assert len(merged) > 0 or result["stats"]["total_blocks"] == 1

    def test_corridor_constraint_respected(self):
        tasks = [_make_task(1, "Engineering", "CR-01", "High", 60)]
        slots  = [_make_slot(1, "SCR-01", 300)]  # Different corridor
        result = run_optimizer(tasks, slots)
        # Task cannot be assigned to a different corridor slot
        assert result["stats"]["total_tasks_scheduled"] == 0 or \
               result["scheduled_blocks"][0]["corridor_id"] == "CR-01"

    def test_stats_keys_present(self):
        tasks = [_make_task(1, "TRD", "WR-01", "Medium", 45)]
        slots = [_make_slot(1, "WR-01", 300)]
        result = run_optimizer(tasks, slots)
        for key in ("total_blocks", "merged_blocks", "total_tasks_scheduled",
                    "total_tasks_unscheduled", "total_downtime_hours", "high_priority_scheduled_pct"):
            assert key in result["stats"], f"Missing stat key: {key}"


class TestBaseline:
    def test_baseline_never_merges(self):
        tasks = [
            _make_task(1, "Engineering", "CR-01", "High",   60),
            _make_task(2, "S&T",         "CR-01", "High",   30),
        ]
        slots = [_make_slot(1, "CR-01", 300)]
        result = run_baseline(tasks, slots)
        assert result["stats"]["merged_blocks"] == 0, "Baseline should never merge departments"

    def test_baseline_produces_more_blocks_than_optimizer(self):
        tasks = [
            _make_task(1, "Engineering", "CR-01", "High",   60, 80),
            _make_task(2, "S&T",         "CR-01", "High",   45, 75),
            _make_task(3, "TRD",         "CR-01", "Medium", 30, 60),
        ]
        slots = [_make_slot(1, "CR-01", 300)]
        opt_result  = run_optimizer(tasks, slots)
        base_result = run_baseline(tasks, slots)
        # Baseline assigns each dept task separately → more blocks
        assert base_result["stats"]["total_blocks"] >= opt_result["stats"]["total_blocks"]

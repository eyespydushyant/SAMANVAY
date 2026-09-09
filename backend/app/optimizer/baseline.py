"""
SAMANVAY — Baseline (Siloed Manual) Planner
=============================================
Simulates how each department plans blocks independently:
  - No cross-department coordination
  - First-come-first-served within each department
  - Result: more total blocks, more corridor downtime, missed high-priority tasks

Used as the "before" comparison against the AI-optimized plan.
"""
import json
import uuid
from typing import Dict, Any, List


DEPT_ORDER = ["Engineering", "S&T", "TRD"]


def run_baseline(
    tasks: list,
    block_slots: list,
    horizon_days: int = 7,
) -> Dict[str, Any]:
    """
    Simulate siloed manual scheduling.

    Each department claims its own block slot independently — no merging.
    Tasks are sorted by due_date (earliest first, simulating manual urgency).
    """
    if not tasks or not block_slots:
        return {
            "scheduled_blocks":  [],
            "unscheduled_tasks": [{"task_id": t.id, "severity": t.severity, "reason": "No slots"} for t in tasks],
            "stats": {"total_blocks": 0, "merged_blocks": 0, "utilization_pct": 0.0,
                      "total_tasks_scheduled": 0, "total_tasks_unscheduled": len(tasks),
                      "total_downtime_hours": 0.0, "high_priority_scheduled_pct": 0.0},
        }

    # Each department sorts by due_date only (no AI score)
    dept_tasks: Dict[str, list] = {d: [] for d in DEPT_ORDER}
    for t in tasks:
        dept_tasks.get(t.department, dept_tasks["Engineering"]).append(t)

    for dept in DEPT_ORDER:
        dept_tasks[dept].sort(key=lambda t: t.due_date)

    # Track slot usage per (corridor, slot_id) per department SEPARATELY
    # In baseline, dept A and dept B on same corridor/time each get their OWN block
    slot_remaining: Dict[str, int] = {}  # key = f"{dept}:{slot_id}"
    for slot in block_slots:
        for dept in DEPT_ORDER:
            slot_remaining[f"{dept}:{slot.id}"] = slot.duration_mins

    scheduled_blocks = []
    unscheduled = []
    total_mins = 0.0

    for dept in DEPT_ORDER:
        for task in dept_tasks[dept]:
            assigned = False
            for slot in block_slots:
                if slot.corridor_id != task.corridor_id:
                    continue
                key = f"{dept}:{slot.id}"
                if slot_remaining.get(key, 0) >= task.estimated_duration_mins:
                    slot_remaining[key] -= task.estimated_duration_mins
                    total_mins += task.estimated_duration_mins

                    # Each task gets its own block entry in the baseline
                    scheduled_blocks.append({
                        "block_uuid":          str(uuid.uuid4()),
                        "corridor_id":         slot.corridor_id,
                        "corridor_name":       slot.corridor_name,
                        "block_date":          slot.slot_date,
                        "start_datetime":      slot.start_datetime,
                        "end_datetime":        slot.end_datetime,
                        "departments_involved": dept,
                        "task_ids_json":       json.dumps([task.id]),
                        "status":              "Proposed",
                        "explanation":         f"Siloed {dept} block: {task.defect_type}",
                        "is_baseline":         True,
                        "_tasks":              [task],
                    })
                    assigned = True
                    break

            if not assigned:
                unscheduled.append({
                    "task_id":  task.id,
                    "severity": task.severity,
                    "reason":   "No capacity in baseline siloed planning",
                })

    total_slot_mins = sum(s.duration_mins for s in block_slots)
    hp_tasks = [t for t in tasks if t.severity in ("Critical", "High")]
    unsched_ids = {u["task_id"] for u in unscheduled}
    hp_sched = [t for t in hp_tasks if t.id not in unsched_ids]

    stats = {
        "total_blocks":                len(scheduled_blocks),
        "merged_blocks":               0,   # baseline never merges
        "utilization_pct":             round(total_mins / max(total_slot_mins, 1) * 100, 1),
        "total_tasks_scheduled":       len(tasks) - len(unscheduled),
        "total_tasks_unscheduled":     len(unscheduled),
        "total_downtime_hours":        round(total_mins / 60, 2),
        "high_priority_scheduled_pct": round(len(hp_sched) / max(len(hp_tasks), 1) * 100, 1),
    }

    return {
        "scheduled_blocks":  scheduled_blocks,
        "unscheduled_tasks": unscheduled,
        "stats":             stats,
    }

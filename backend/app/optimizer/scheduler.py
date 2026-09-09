"""
SAMANVAY — OR-Tools CP-SAT Block Scheduler
============================================
Assigns maintenance tasks to available block slots to produce an optimized
multi-department block plan.

Key constraints:
  - Each task assigned to at most one slot
  - Slot capacity (sum of task durations) ≤ slot window duration
  - Safety-critical tasks (severity=Critical) MUST be scheduled
  - Multi-department tasks on the same corridor can share one block

Objective:
  - Minimize total weighted unscheduled tasks (Critical=1000 penalty, etc.)
  - Maximize department merging (bonus per shared block)
"""
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any

from ortools.sat.python import cp_model

from app.config import settings


# Penalty for an unscheduled task by severity
UNSCHEDULED_PENALTY = {
    "Critical": 10000,
    "High":     1000,
    "Medium":   100,
    "Low":      10,
}


def run_optimizer(
    tasks: list,
    block_slots: list,
    horizon_days: int = 7,
) -> Dict[str, Any]:
    """
    Run the CP-SAT optimizer.

    Parameters
    ----------
    tasks       : list of MaintenanceTask ORM objects (already scored)
    block_slots : list of BlockSlot ORM objects within the horizon
    horizon_days: scheduling horizon length

    Returns
    -------
    dict with keys:
        scheduled_blocks : list of dicts (block data)
        unscheduled_tasks: list of dicts {task_id, severity, reason}
        stats            : dict with summary metrics
    """
    if not tasks or not block_slots:
        return {
            "scheduled_blocks":  [],
            "unscheduled_tasks": [{"task_id": t.id, "severity": t.severity, "reason": "No block slots available"} for t in tasks],
            "stats": {"total_blocks": 0, "merged_blocks": 0, "utilization_pct": 0.0,
                      "total_tasks_scheduled": 0, "total_tasks_unscheduled": len(tasks),
                      "total_downtime_hours": 0.0, "high_priority_scheduled_pct": 0.0},
        }

    model = cp_model.CpModel()

    n_tasks = len(tasks)
    n_slots = len(block_slots)

    # Scale scores to integers (CP-SAT requires integers)
    task_scores    = [int(t.priority_score * 10) for t in tasks]
    task_durations = [t.estimated_duration_mins for t in tasks]
    slot_durations = [s.duration_mins for s in block_slots]
    slot_corridors = [s.corridor_id for s in block_slots]
    task_corridors = [t.corridor_id for t in tasks]
    task_severities = [t.severity for t in tasks]
    task_depts     = [t.department for t in tasks]

    # Boolean variable: x[i][j] = 1 if task i is assigned to slot j
    x = [[model.new_bool_var(f"x_{i}_{j}") for j in range(n_slots)] for i in range(n_tasks)]
    # Unscheduled flag: u[i] = 1 if task i is NOT scheduled
    u = [model.new_bool_var(f"u_{i}") for i in range(n_tasks)]

    # --- Constraints ---

    # 1. Each task is either assigned to exactly one slot OR unscheduled
    for i in range(n_tasks):
        model.add(sum(x[i][j] for j in range(n_slots)) + u[i] == 1)

    # 2. Slot capacity: total task duration ≤ slot window
    for j in range(n_slots):
        model.add(
            sum(x[i][j] * task_durations[i] for i in range(n_tasks)) <= slot_durations[j]
        )

    # 3. Tasks can only be assigned to slots on the SAME corridor
    for i in range(n_tasks):
        for j in range(n_slots):
            if task_corridors[i] != slot_corridors[j]:
                model.add(x[i][j] == 0)

    # 4. Safety-critical tasks MUST be scheduled (hard constraint)
    for i in range(n_tasks):
        if task_severities[i] == "Critical":
            model.add(u[i] == 0)

    # --- Objective: minimise weighted unscheduled penalty ---
    penalties = [
        u[i] * UNSCHEDULED_PENALTY.get(task_severities[i], 100)
        for i in range(n_tasks)
    ]
    model.minimize(sum(penalties))

    # --- Solve ---
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = settings.OPTIMIZER_TIME_LIMIT_SECONDS
    solver.parameters.num_search_workers = 2
    status = solver.solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        # Fallback: schedule by priority, greedy
        return _greedy_fallback(tasks, block_slots)

    # --- Extract results ---
    # Group tasks assigned to the same slot
    slot_to_tasks: Dict[int, List[int]] = {j: [] for j in range(n_slots)}
    unscheduled_ids = []

    for i in range(n_tasks):
        if solver.value(u[i]) == 1:
            unscheduled_ids.append(i)
            continue
        for j in range(n_slots):
            if solver.value(x[i][j]) == 1:
                slot_to_tasks[j].append(i)
                break

    scheduled_blocks = []
    total_downtime_mins = 0.0
    merged_count = 0

    for j, task_indices in slot_to_tasks.items():
        if not task_indices:
            continue
        slot = block_slots[j]
        assigned_tasks = [tasks[i] for i in task_indices]
        depts = sorted(set(t.department for t in assigned_tasks))
        is_merged = len(depts) > 1
        if is_merged:
            merged_count += 1

        top_task = max(assigned_tasks, key=lambda t: t.priority_score or 0)
        explanation = (
            f"{len(assigned_tasks)} task(s) | Dept(s): {', '.join(depts)} | "
            f"Top issue: {top_task.defect_type} (score {top_task.priority_score:.1f}) | "
            f"Corridor: {slot.corridor_name}"
        )
        block_duration = (slot.end_datetime - slot.start_datetime).total_seconds() / 3600
        total_downtime_mins += sum(t.estimated_duration_mins for t in assigned_tasks)

        scheduled_blocks.append({
            "block_uuid":          str(uuid.uuid4()),
            "corridor_id":         slot.corridor_id,
            "corridor_name":       slot.corridor_name,
            "block_date":          slot.slot_date,
            "start_datetime":      slot.start_datetime,
            "end_datetime":        slot.end_datetime,
            "departments_involved": ",".join(depts),
            "task_ids_json":       json.dumps([t.id for t in assigned_tasks]),
            "status":              "Proposed",
            "explanation":         explanation,
            "is_baseline":         False,
            # Extra for API response
            "_tasks":              assigned_tasks,
        })

    # Build unscheduled list
    unscheduled_out = [
        {
            "task_id":  tasks[i].id,
            "severity": tasks[i].severity,
            "reason":   "Optimizer could not fit within available slots in horizon",
        }
        for i in unscheduled_ids
    ]

    hp_tasks = [t for t in tasks if t.severity in ("Critical", "High")]
    hp_scheduled = [t for t in hp_tasks if t.id not in {tasks[i].id for i in unscheduled_ids}]
    hp_pct = (len(hp_scheduled) / len(hp_tasks) * 100) if hp_tasks else 100.0

    stats = {
        "total_blocks":               len(scheduled_blocks),
        "merged_blocks":              merged_count,
        "utilization_pct":            round(total_downtime_mins / max(sum(slot_durations), 1) * 100, 1),
        "total_tasks_scheduled":      n_tasks - len(unscheduled_ids),
        "total_tasks_unscheduled":    len(unscheduled_ids),
        "total_downtime_hours":       round(total_downtime_mins / 60, 2),
        "high_priority_scheduled_pct": round(hp_pct, 1),
    }

    return {
        "scheduled_blocks":  scheduled_blocks,
        "unscheduled_tasks": unscheduled_out,
        "stats":             stats,
    }


def _greedy_fallback(tasks, block_slots) -> Dict[str, Any]:
    """Simple greedy fallback when CP-SAT cannot find a solution."""
    tasks_sorted = sorted(tasks, key=lambda t: t.priority_score or 0, reverse=True)
    slot_remaining = {j: block_slots[j].duration_mins for j in range(len(block_slots))}
    slot_to_tasks: Dict[int, list] = {j: [] for j in range(len(block_slots))}
    unscheduled = []

    for task in tasks_sorted:
        assigned = False
        for j, slot in enumerate(block_slots):
            if slot.corridor_id == task.corridor_id and slot_remaining[j] >= task.estimated_duration_mins:
                slot_to_tasks[j].append(task)
                slot_remaining[j] -= task.estimated_duration_mins
                assigned = True
                break
        if not assigned:
            unscheduled.append({"task_id": task.id, "severity": task.severity, "reason": "Capacity exceeded"})

    scheduled_blocks = []
    merged_count = 0
    total_mins = 0.0
    for j, task_list in slot_to_tasks.items():
        if not task_list:
            continue
        slot = block_slots[j]
        depts = sorted(set(t.department for t in task_list))
        if len(depts) > 1:
            merged_count += 1
        top = max(task_list, key=lambda t: t.priority_score or 0)
        total_mins += sum(t.estimated_duration_mins for t in task_list)
        scheduled_blocks.append({
            "block_uuid":          str(uuid.uuid4()),
            "corridor_id":         slot.corridor_id,
            "corridor_name":       slot.corridor_name,
            "block_date":          slot.slot_date,
            "start_datetime":      slot.start_datetime,
            "end_datetime":        slot.end_datetime,
            "departments_involved": ",".join(depts),
            "task_ids_json":       json.dumps([t.id for t in task_list]),
            "status":              "Proposed",
            "explanation":         f"Greedy: {len(task_list)} task(s), top: {top.defect_type}",
            "is_baseline":         False,
            "_tasks":              task_list,
        })

    n_tasks = len(tasks)
    total_slot_mins = sum(s.duration_mins for s in block_slots)
    hp_tasks = [t for t in tasks if t.severity in ("Critical", "High")]
    unsched_ids = {u["task_id"] for u in unscheduled}
    hp_sched = [t for t in hp_tasks if t.id not in unsched_ids]

    return {
        "scheduled_blocks":  scheduled_blocks,
        "unscheduled_tasks": unscheduled,
        "stats": {
            "total_blocks":                len(scheduled_blocks),
            "merged_blocks":               merged_count,
            "utilization_pct":             round(total_mins / max(total_slot_mins, 1) * 100, 1),
            "total_tasks_scheduled":       n_tasks - len(unscheduled),
            "total_tasks_unscheduled":     len(unscheduled),
            "total_downtime_hours":        round(total_mins / 60, 2),
            "high_priority_scheduled_pct": round(len(hp_sched) / max(len(hp_tasks), 1) * 100, 1),
        },
    }

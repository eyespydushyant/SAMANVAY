"""
SAMANVAY — AI Priority Scoring Engine
======================================
Scores maintenance tasks on a 0–100 scale using three weighted components:
  - Criticality  (severity of the defect)
  - Urgency      (days overdue / days until due)
  - Asset Risk   (corridor traffic density)

Weights are configurable via settings.
"""
from datetime import date
from typing import List, Tuple

from app.config import settings


# ---------------------------------------------------------------------------
# Component score maps
# ---------------------------------------------------------------------------
CRITICALITY_SCORES = {
    "Critical": 100.0,
    "High":     75.0,
    "Medium":   40.0,
    "Low":      15.0,
}

def _criticality_score(severity: str) -> float:
    """Return 0–100 score based on defect severity."""
    return CRITICALITY_SCORES.get(severity, 15.0)


def _urgency_score(due_date: date, overdue_flag: bool) -> float:
    """
    Return 0–100 urgency score.
    - Overdue tasks: 100 (maximum urgency)
    - Due in 1 day:  95
    - Due in 7 days: 75
    - Due in 14 days: 50
    - Due in 30+ days: 10
    """
    if overdue_flag:
        return 100.0
    days_left = (due_date - date.today()).days
    if days_left <= 0:
        return 100.0
    elif days_left <= 1:
        return 95.0
    elif days_left <= 3:
        return 85.0
    elif days_left <= 7:
        return 75.0
    elif days_left <= 14:
        return 50.0
    elif days_left <= 21:
        return 30.0
    else:
        return max(10.0, 30.0 - (days_left - 21) * 0.5)


def _asset_risk_score(corridor_daily_trains: int) -> float:
    """
    Return 0–100 asset risk score based on corridor traffic density.
    Busiest corridor (NR-01 Delhi-Mathura, 200 trains/day) = 100.
    """
    return min((corridor_daily_trains / 200.0) * 100.0, 100.0)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def compute_priority_score(
    severity: str,
    due_date: date,
    overdue_flag: bool,
    corridor_daily_trains: int,
) -> Tuple[float, str]:
    """
    Compute priority score for a single task.

    Returns
    -------
    (score, explanation)
        score: float in [0, 100]
        explanation: human-readable breakdown string
    """
    crit  = _criticality_score(severity)
    urg   = _urgency_score(due_date, overdue_flag)
    risk  = _asset_risk_score(corridor_daily_trains)

    score = (
        crit * settings.CRITICALITY_WEIGHT
        + urg  * settings.URGENCY_WEIGHT
        + risk * settings.ASSET_RISK_WEIGHT
    )
    score = min(round(score, 2), 100.0)

    days_left = (due_date - date.today()).days
    days_str = "OVERDUE" if overdue_flag or days_left <= 0 else f"{days_left}d left"

    explanation = (
        f"Criticality({severity}={crit:.0f}) × {settings.CRITICALITY_WEIGHT:.0%} "
        f"+ Urgency({days_str}={urg:.0f}) × {settings.URGENCY_WEIGHT:.0%} "
        f"+ AssetRisk({corridor_daily_trains}/day={risk:.0f}) × {settings.ASSET_RISK_WEIGHT:.0%} "
        f"= {score:.1f}"
    )
    return score, explanation


def score_all_tasks(tasks: list, corridors_map: dict) -> List[Tuple[int, float, str]]:
    """
    Score a list of ORM MaintenanceTask objects.

    Parameters
    ----------
    tasks : list of MaintenanceTask ORM objects
    corridors_map : dict  {corridor_id -> corridor_dict with 'daily_trains'}

    Returns
    -------
    list of (task.id, score, explanation)
    """
    results = []
    for task in tasks:
        daily_trains = corridors_map.get(task.corridor_id, {}).get("daily_trains", 100)
        score, expl = compute_priority_score(
            severity=task.severity,
            due_date=task.due_date,
            overdue_flag=task.overdue_flag,
            corridor_daily_trains=daily_trains,
        )
        results.append((task.id, score, expl))
    return results

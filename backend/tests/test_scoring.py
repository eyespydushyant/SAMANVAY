"""Tests for the AI priority scoring engine."""
import pytest
from datetime import date, timedelta
from app.scoring.engine import compute_priority_score, _urgency_score, _criticality_score


def test_critical_severity_gets_max_criticality():
    score, expl = compute_priority_score("Critical", date.today() + timedelta(days=5), False, 100)
    assert score > 60, f"Critical task should score > 60, got {score}"
    assert "Critical" in expl


def test_low_severity_far_future_gets_low_score():
    score, expl = compute_priority_score("Low", date.today() + timedelta(days=30), False, 50)
    assert score < 40, f"Low+far-future task should score < 40, got {score}"


def test_overdue_gets_max_urgency():
    score, expl = compute_priority_score("Medium", date.today() - timedelta(days=3), True, 100)
    assert score > 50, f"Overdue task should score > 50, got {score}"
    assert "OVERDUE" in expl


def test_explanation_is_non_empty():
    score, expl = compute_priority_score("High", date.today() + timedelta(days=7), False, 150)
    assert len(expl) > 10


def test_score_bounded_0_100():
    for sev in ["Critical", "High", "Medium", "Low"]:
        score, _ = compute_priority_score(sev, date.today(), True, 200)
        assert 0 <= score <= 100, f"Score {score} out of range for {sev}"


def test_high_traffic_corridor_increases_score():
    low_traffic_score, _  = compute_priority_score("Medium", date.today() + timedelta(days=10), False, 50)
    high_traffic_score, _ = compute_priority_score("Medium", date.today() + timedelta(days=10), False, 200)
    assert high_traffic_score > low_traffic_score, "High-traffic corridor should yield higher score"

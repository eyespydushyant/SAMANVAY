"""SAMANVAY — Config API Router (AI Scoring Weights)"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.config import settings

router = APIRouter(tags=["Config"])


class WeightsUpdate(BaseModel):
    criticality_weight: float = Field(..., ge=0, le=1)
    urgency_weight:     float = Field(..., ge=0, le=1)
    asset_risk_weight:  float = Field(..., ge=0, le=1)


@router.get("/config/weights")
async def get_weights():
    """Get current AI priority scoring weights."""
    return {
        "criticality_weight": settings.CRITICALITY_WEIGHT,
        "urgency_weight":     settings.URGENCY_WEIGHT,
        "asset_risk_weight":  settings.ASSET_RISK_WEIGHT,
        "note": "Weights should sum to 1.0 for a normalized 0–100 score.",
    }


@router.put("/config/weights")
async def update_weights(weights: WeightsUpdate):
    """Update AI priority scoring weights (in-memory for this session)."""
    total = weights.criticality_weight + weights.urgency_weight + weights.asset_risk_weight
    if abs(total - 1.0) > 0.01:
        return {
            "error": f"Weights must sum to 1.0 (got {total:.2f}). Adjust and retry."
        }
    settings.CRITICALITY_WEIGHT = weights.criticality_weight
    settings.URGENCY_WEIGHT     = weights.urgency_weight
    settings.ASSET_RISK_WEIGHT  = weights.asset_risk_weight
    return {
        "criticality_weight": settings.CRITICALITY_WEIGHT,
        "urgency_weight":     settings.URGENCY_WEIGHT,
        "asset_risk_weight":  settings.ASSET_RISK_WEIGHT,
        "message":            "Weights updated. Re-generate a plan to apply.",
    }

from enum import Enum
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class Department(str, Enum):
    ENGINEERING = "Engineering"
    SNT = "S&T"
    TRD = "TRD"

class Severity(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class BlockStatus(str, Enum):
    PROPOSED = "Proposed"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class PlanStatus(str, Enum):
    DRAFT = "Draft"
    APPROVED = "Approved"

class MaintenanceTaskBase(BaseModel):
    department: Department
    defect_type: str
    severity: Severity
    due_date: date
    asset_id: str
    corridor_id: str
    estimated_duration_mins: int
    priority_score: Optional[float] = None
    priority_explanation: Optional[str] = None
    status: str = "Pending"

class MaintenanceTaskCreate(MaintenanceTaskBase):
    pass

class MaintenanceTask(MaintenanceTaskBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class PlanBase(BaseModel):
    plan_type: str
    start_date: date
    end_date: date
    status: PlanStatus

class Plan(PlanBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

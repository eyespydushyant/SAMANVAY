export type Department = 'Engineering' | 'S&T' | 'TRD';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type BlockStatus = 'Proposed' | 'Approved' | 'Rejected';
export type PlanType = 'weekly' | 'monthly';
export type PlanStatus = 'Draft' | 'Approved';

export interface MaintenanceTask {
  task_id: number;
  task_uuid: string;
  department: Department;
  asset_id: string;
  corridor_id: string;
  corridor_name: string;
  defect_type: string;
  severity: Severity;
  reported_date: string;
  due_date: string;
  overdue_flag: boolean;
  estimated_duration_mins: number;
  priority_score: number;
  priority_explanation: string;
  status: string;
  created_at: string;
}

export interface ScheduledBlock {
  block_id: number;
  block_uuid: string;
  corridor_id: string;
  corridor_name: string;
  block_date: string;
  start_datetime: string;
  end_datetime: string;
  tasks: MaintenanceTask[];
  departments_involved: string[];
  status: BlockStatus;
  explanation: string;
}

export interface PlanStats {
  total_blocks: number;
  total_tasks_scheduled: number;
  total_tasks_unscheduled: number;
  merged_blocks: number;
  total_downtime_hours: number;
  high_priority_scheduled_pct: number;
  utilization_pct?: number;
}

export interface Plan {
  plan_id: number;
  plan_type: PlanType;
  status: PlanStatus;
  start_date: string;
  end_date: string;
  created_at: string;
  approved_by?: string;
  scheduled_blocks: ScheduledBlock[];
  stats: PlanStats;
}

export interface TaskListResponse {
  total: number;
  page: number;
  limit: number;
  tasks: MaintenanceTask[];
}

export interface ComparisonResponse {
  plan_id: number;
  plan_type: string;
  optimized: PlanStats;
  baseline: PlanStats;
  improvements: {
    blocks_reduction_pct: number;
    downtime_reduction_pct: number;
    hp_coverage_gain_pct: number;
    merged_blocks_gained: number;
  };
}

export interface ComparisonData {
  optimized: PlanStats;
  baseline: PlanStats;
}

export interface ScoringWeights {
  criticality_weight: number;
  urgency_weight: number;
  asset_risk_weight: number;
}

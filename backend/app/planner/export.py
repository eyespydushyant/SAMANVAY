"""
SAMANVAY — Plan Export Utilities
==================================
CSV export via pandas, PDF export via ReportLab.
"""
import io
import json
from datetime import datetime
from typing import List

import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
)


def export_plan_csv(plan, blocks: list, tasks_map: dict) -> bytes:
    """
    Export plan as CSV bytes.
    Each row = one (block, task) pair.
    """
    rows = []
    for block in blocks:
        task_ids = json.loads(block.task_ids_json or "[]")
        for tid in task_ids:
            task = tasks_map.get(tid)
            rows.append({
                "block_id":            block.id,
                "corridor_id":         block.corridor_id,
                "corridor_name":       block.corridor_name,
                "block_date":          block.block_date,
                "start_time":          block.start_datetime.strftime("%H:%M") if block.start_datetime else "",
                "end_time":            block.end_datetime.strftime("%H:%M") if block.end_datetime else "",
                "departments":         block.departments_involved,
                "status":              block.status,
                "task_id":             tid,
                "department":          task.department if task else "",
                "asset_id":            task.asset_id if task else "",
                "defect_type":         task.defect_type if task else "",
                "severity":            task.severity if task else "",
                "due_date":            task.due_date if task else "",
                "priority_score":      task.priority_score if task else "",
                "duration_mins":       task.estimated_duration_mins if task else "",
            })
    df = pd.DataFrame(rows)
    buf = io.BytesIO()
    df.to_csv(buf, index=False)
    return buf.getvalue()


def export_plan_pdf(plan, blocks: list, tasks_map: dict) -> bytes:
    """Export plan as a formatted PDF using ReportLab."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4), rightMargin=1*cm, leftMargin=1*cm,
                            topMargin=1*cm, bottomMargin=1*cm)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    title = Paragraph(
        f"<b>SAMANVAY Block Plan Report</b><br/>"
        f"<font size=10>Type: {plan.plan_type.upper()} | "
        f"Period: {plan.start_date} to {plan.end_date} | "
        f"Generated: {plan.created_at.strftime('%Y-%m-%d %H:%M') if plan.created_at else 'N/A'}</font>",
        styles["Title"],
    )
    elements.append(title)
    elements.append(Spacer(1, 0.5*cm))

    # Stats
    stats = json.loads(plan.stats_json or "{}")
    stats_data = [
        ["Metric", "Value"],
        ["Total Blocks", str(stats.get("total_blocks", 0))],
        ["Merged (Multi-Dept) Blocks", str(stats.get("merged_blocks", 0))],
        ["Tasks Scheduled", str(stats.get("total_tasks_scheduled", 0))],
        ["Tasks Unscheduled", str(stats.get("total_tasks_unscheduled", 0))],
        ["High-Priority Scheduled %", f"{stats.get('high_priority_scheduled_pct', 0):.1f}%"],
        ["Total Downtime (hrs)", f"{stats.get('total_downtime_hours', 0):.1f}h"],
    ]
    stats_table = Table(stats_data, colWidths=[8*cm, 4*cm])
    stats_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A5F")),
        ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
        ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID",       (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#EEF2FF")]),
    ]))
    elements.append(stats_table)
    elements.append(Spacer(1, 0.5*cm))

    # Blocks table
    elements.append(Paragraph("<b>Scheduled Blocks</b>", styles["Heading2"]))
    header = ["Block ID", "Corridor", "Date", "Start", "End", "Departments", "Tasks", "Status"]
    table_data = [header]
    for block in blocks:
        if block.is_baseline:
            continue
        task_ids = json.loads(block.task_ids_json or "[]")
        task_summaries = []
        for tid in task_ids:
            t = tasks_map.get(tid)
            if t:
                task_summaries.append(f"{t.defect_type} ({t.severity})")
        table_data.append([
            str(block.id),
            block.corridor_name or block.corridor_id,
            str(block.block_date),
            block.start_datetime.strftime("%H:%M") if block.start_datetime else "",
            block.end_datetime.strftime("%H:%M") if block.end_datetime else "",
            block.departments_involved or "",
            "\n".join(task_summaries[:3]) + ("..." if len(task_summaries) > 3 else ""),
            block.status,
        ])

    col_widths = [2*cm, 5*cm, 2.5*cm, 2*cm, 2*cm, 4*cm, 7*cm, 2.5*cm]
    blocks_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    blocks_table.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0), colors.HexColor("#1E3A5F")),
        ("TEXTCOLOR",    (0, 0), (-1, 0), colors.white),
        ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, -1), 7),
        ("GRID",         (0, 0), (-1, -1), 0.3, colors.grey),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#EEF2FF")]),
        ("WORDWRAP",     (6, 1), (6, -1), True),
    ]))
    elements.append(blocks_table)

    doc.build(elements)
    return buf.getvalue()

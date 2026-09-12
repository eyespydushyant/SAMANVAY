---
name: ralph-flow
description: Autonomous iterative self-correcting feedback loop. Executes task list, validates output, diagnoses failures, and loops until all requirements pass.
---

# Ralph Flow (Autonomous Self-Correction Loop)

The Ralph loop is an autonomous execution framework that continuously operates in a closed validation loop:

```
Plan -> Implement -> Automated Test -> Diagnose Diff -> Refine -> Repeat until 100% Pass
```

## Loop Guidelines
1. **Never Exit with Unverified Code**: Every change must be validated against automated test suites or build runners.
2. **Deterministic Assertions**: Run `pytest` for backend and `tsc && vite build` for frontend.
3. **Escalating Feedback**: If a test fails, inspect logs, locate the exact file and line number, patch the root cause, and re-run.

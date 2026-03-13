---
name: kanban-progress
description: Use the Watchtower Kanban board as a central place for AI agents to report and track work progress. Creates, updates, and completes tasks via direct Turso SQL. The board auto-refreshes every 3s so humans see live progress.
tags: [workflow, observability]
---

# Kanban Progress Tracking for AI Agents

## Overview

The Watchtower Kanban board at `/kanban` is the single source of truth for all in-flight work — both human and agent-driven. When you start meaningful work (feature implementation, bug fix, deployment, investigation), you **must** create or update a kanban task to track progress.

The board auto-refreshes every 3 seconds. Agent tasks (assigned to their model name, e.g., `gemini`) are highlighted distinctively and their active duration is tracked in real-time. Humans monitoring the board will see your updates instantly.

**Important**: Make your task titles, descriptions, and comments extremely concise. No verbose LLM-speak.

## When to Use

- **Starting any task** that takes more than a few minutes
- **Multi-step work** (deployments, migrations, refactors)
- **Long-running investigations** or debugging sessions
- **CI/CD pipeline work** (builds, test runs, deployments)

Do **NOT** use for trivial one-shot answers or quick questions.

## Interacting with the Board (REST API)

The Kanban board is driven by a REST API. **Always target production** (`watchtower.maua.app`) as it holds the live data and auto-refreshes on the team's TV dashboard.

> **Base URL:** `https://watchtower.maua.app`
> **Auth Header:** `-u admin:second.brains`

### 1. Read Current Focus
Always read the team's current weekly focus before starting work.
```bash
curl -s -u admin:second.brains "https://watchtower.maua.app/api/kanban/focus"
```

### 2. View Active Tasks
```bash
# List all active tasks
curl -s -u admin:second.brains "https://watchtower.maua.app/api/kanban/tasks" | python3 -m json.tool | grep -E '"id"|"title"|"status"|"assignee"'
```

### 3. Create a Task
```bash
curl -X POST "https://watchtower.maua.app/api/kanban/tasks" -u admin:second.brains \
  -H "Content-Type: application/json" \
  -d '{"title": "[Short title]", "description": "[Concise context]", "expected_outcome": "[What success looks like]", "status": "in_progress", "assignee": "gemini", "workstream": "DevOps / CI"}'
```

**Always set `expected_outcome`** — a concise statement of the desired end state. This appears on the task detail panel and helps humans understand the goal at a glance.

### 4. Add Progress Comments (Be Concise)
Use comments during an ongoing task to document significant milestones, roadblocks, or new discoveries. This helps humans follow along in real-time. Keep updates brief.
```bash
curl -X POST "https://watchtower.maua.app/api/kanban/tasks/<task_id>/comments" -u admin:second.brains \
  -H "Content-Type: application/json" \
  -d '{"author":"gemini","body":"Completed DB migration. Running tests."}'
```

### 5. Mark as Done (with Evidence)
```bash
curl -X PATCH "https://watchtower.maua.app/api/kanban/tasks/<task_id>" -u admin:second.brains \
  -H "Content-Type: application/json" \
  -d '{
    "status": "done",
    "commit_url": "https://github.com/Maua-Org/.../commit/abc1234",
    "work_summary": "Root cause was X, fixed by doing Y",
    "files_changed": ["src/app.ts", "package.json"],
    "follow_up_steps": ["Monitor memory usage", "Update docs"],
    "lessons_learnt": "SSH key path must be absolute; PM2 injects extra env vars"
  }'
```
*(Note: `files_changed` and `follow_up_steps` must be JSON arrays)*

### 6. Attach Screenshots (optional)
Upload a screenshot to the task as proof-of-work (e.g., Playwright capture, UI state, test output):
```bash
curl -X POST "https://watchtower.maua.app/api/kanban/tasks/<task_id>/attachments" \
  -u admin:second.brains \
  -F "file=@screenshot.png"
```
Attachments appear in the task detail panel. Use this for visual evidence of completed work.

## Evidence Fields Reference

| Field | Type | Description |
|---|---|---|
| `commit_url` | TEXT | Link to the commit (GitHub, GitLab, etc.) |
| `commit_message` | TEXT | The commit message |
| `work_summary` | TEXT | Human-readable summary of what was done |
| `follow_up_steps` | JSON Array | Next actions or manual checks (`["Watch logs","Tell product"]`) |
| `files_changed` | JSON Array | Relevant files touched (`["src/index.js"]`) |
| `lessons_learnt` | TEXT | Free-text retrospective: gotchas, insights, things to remember |

## Status Values and Assignees

**Statuses:**
- `backlog` - Planned but not started
- `todo` - Ready to start, queued
- `in_progress` - Actively being worked on
- `review_blocked` - Waiting on external input/approval
- `done` - Completed successfully

**Assignees:** Use your model name directly (e.g., `gemini`, `claude`, `o1`). Do NOT use an `agent:` prefix.


## Reporting Test Results (API/Web/Mobile/E2E)

Agents can and should report test results to the central Watchtower database via the **Test Results API**. This allows test outcomes from anywhere (GitHub Actions, local agent execution, Maestro, etc.) to show up on the Watchtower dashboards.

Use this endpoint when you manually run a suite of tests and want the results tracked.

**Endpoint:** `POST https://watchtower.maua.app/api/test-results`
**Auth Header:** `-H "x-api-key: <TEST_RESULTS_API_KEY>"` (Read this from the `.env` file first using `cat watchtower/.env | grep TEST`)

### Example Payload Structure

```json
{
  "project": "maua-ecommerce",
  "environment": "staging",
  "suite": "api-tests", /* e.g., api-tests, web-e2e, maestro-mobile, unit-tests */
  "branch": "main",     /* optional */
  "commit_sha": "abc12",/* optional */
  "tests": [
    {
      "name": "login works",
      "status": "passed",
      "duration_ms": 1200
    },
    {
      "name": "checkout fails without stock",
      "status": "failed",
      "error": "Expected 400 but got 200",
      "duration_ms": 500
    }
  ]
}
```

### Reporting Examples via cURL

**1. API Tests:**
```bash
curl -X POST "https://watchtower.maua.app/api/test-results" \
  -H "x-api-key: $TEST_RESULTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "maua-backend",
    "environment": "staging",
    "suite": "graphql-api",
    "tests": [{"name": "authQuery", "status": "passed"}]
  }'
```

**2. Web E2E (Playwright) Tests:**
```bash
curl -X POST "https://watchtower.maua.app/api/test-results" \
  -H "x-api-key: $TEST_RESULTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "maua-ecommerce",
    "environment": "production",
    "suite": "playwright-web-e2e",
    "tests": [{"name": "Vendor can login", "status": "passed"}]
  }'
```

**3. Mobile E2E (Maestro) Tests:**
```bash
curl -X POST "https://watchtower.maua.app/api/test-results" \
  -H "x-api-key: $TEST_RESULTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "maua-mobile",
    "environment": "staging",
    "suite": "maestro-mobile-buyer",
    "tests": [{"name": "Payment Flow", "status": "passed", "duration_ms": 45000}]
  }'
```

## Important Notes

- The board auto-refreshes every 3 seconds — humans see your updates automatically
- All data is stored in Turso (SQLite-compatible cloud database)
- `follow_up_steps` and `files_changed` must be JSON-stringified arrays
- Always set `updated_at = CURRENT_TIMESTAMP` when updating tasks
- Before creating a task, query for existing active tasks to avoid duplicates

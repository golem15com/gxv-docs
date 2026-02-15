# Dashboard API

The Dashboard API powers the Nuxt SPA frontend. All endpoints require JWT authentication and return a `{ data, meta? }` JSON envelope.

**Base URL**: `/_gxv/dashboard/api`
**Authentication**: `Authorization: Bearer <jwt-token>` (via `jwt.auth` middleware)

::: info
In the current single-tenant model, any authenticated user can access all active projects. Project-level access control can be added via the `getAccessibleProjectIds()` helper.
:::

## Messaging

### GET /messages

List messages for a project.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | integer | Yes | Project ID |
| `since` | string | No | ISO timestamp -- messages after this time |
| `before` | string | No | ISO timestamp -- messages before this time |
| `limit` | integer | No | Max results (default: 50, range: 1-100) |

```bash
curl -s "http://localhost:8080/_gxv/dashboard/api/messages?project_id=1&limit=20" \
  -H "Authorization: Bearer eyJ..."
```

### POST /messages

Send a message from the dashboard (human user). The sender name is formatted as `"{user.name} (human)"` to distinguish from agent messages.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project_id` | integer | Yes | Project ID |
| `content` | string | Yes | Message content (1-50,000 chars) |
| `to` | string | No | Agent name for DM, or omit for broadcast |

```bash
curl -X POST http://localhost:8080/_gxv/dashboard/api/messages \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"project_id": 1, "content": "Please prioritize the auth module", "to": "agent-swift-42"}'
```

**Response (201):**

```json
{ "data": { "id": 157, "uuid": "550e8400-..." } }
```

---

## Projects

### GET /projects

List all active projects with agent counts, last activity, and work areas.

```bash
curl -s http://localhost:8080/_gxv/dashboard/api/projects \
  -H "Authorization: Bearer eyJ..."
```

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "My App",
      "slug": "my-app",
      "description": "Main application",
      "repo_url": "/home/user/projects/my-app",
      "is_active": 1,
      "active_agents": 2,
      "last_activity_at": "2026-02-15T10:30:00",
      "has_api_key": true,
      "work_areas": [
        { "name": "Backend", "slug": "backend", "file_patterns": ["app/**"] }
      ],
      "notification_events": ["checkin", "checkout", "conflict"]
    }
  ]
}
```

### GET /projects/{slug}

Detailed project view including active agents, recent activity (50 entries), work areas, and linked GitHub repos.

```bash
curl -s http://localhost:8080/_gxv/dashboard/api/projects/my-app \
  -H "Authorization: Bearer eyJ..."
```

### POST /projects

Create a new project.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Project name (max 255) |
| `slug` | string | Yes | URL-safe identifier (unique, max 255) |
| `description` | string | No | Project description |
| `repo_url` | string | No | Repository path or URL |
| `work_areas` | array | No | Work area definitions |
| `notification_webhook_url` | string | No | Webhook URL for notifications |
| `notification_platform` | string | No | `mattermost` or `slack` |
| `notification_events` | string[] | No | Events to notify: `checkin`, `checkout`, `conflict`, `timeout` |

### POST /projects/{id}/api-key

Generate a new API key for a project. Returns the raw key (shown only once). Replaces any existing key.

**Response (201):**

```json
{ "data": { "api_key": "gxv_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6" } }
```

```bash
curl -X POST http://localhost:8080/_gxv/dashboard/api/projects/1/api-key \
  -H "Authorization: Bearer eyJ..."
```

---

## Agents

### POST /agents/spawn

Spawn a new Claude Code agent on a project. Creates a session record, launches the spawner process in the background, and returns the session details.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project_id` | integer | Yes | Target project ID |
| `prompt` | string | Yes | Task prompt for the agent (1-100,000 chars) |
| `model` | string | No | Model ID (default: `claude-sonnet-4-5-20250929`) |

**Response (201):**

```json
{
  "data": {
    "id": 44,
    "agent_name": "sdk-swift-456",
    "status": "spawning",
    "model": "claude-sonnet-4-5-20250929",
    "prompt": "Implement the user profile page",
    "centrifugo_channel": "gxv:agent:44",
    "project_name": "My App",
    "project_slug": "my-app"
  }
}
```

```bash
curl -X POST http://localhost:8080/_gxv/dashboard/api/agents/spawn \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"project_id": 1, "prompt": "Implement the user profile page", "model": "claude-sonnet-4-5-20250929"}'
```

### POST /agents/{id}/stop

Send SIGTERM to a running agent process.

### POST /agents/{id}/resume

Resume a completed or errored session by spawning a new agent with the original session's Claude session ID.

### POST /agents/{id}/message

Send an interactive message to a running agent. The message is written to a temp file that the spawner process polls.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Message content (max 50,000 chars) |

### GET /agents/config

Returns available projects, provider list, and model options for the spawn dialog.

**Response:**

```json
{
  "data": {
    "projects": [
      { "id": 1, "name": "My App", "slug": "my-app", "repo_url": "/home/user/my-app" }
    ],
    "models": [
      { "value": "claude-sonnet-4-5-20250929", "label": "Claude Sonnet 4.5" }
    ],
    "providers": [
      { "slug": "claude", "name": "Claude Code CLI", "models": [...], "available": true }
    ]
  }
}
```

---

## Task Management

### GET /tasks

List tasks for a project with filters and sorting.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | integer | Yes | Project ID |
| `status` | string | No | Filter by FSM status |
| `priority` | string | No | Filter by priority |
| `work_area` | string | No | Filter by work area domain |
| `assigned_agent_name` | string | No | Filter by assigned agent |
| `sort` | string | No | `priority` (default), `created_at`, or `status` |
| `limit` | integer | No | Max results (default: 50, range: 1-100) |

```bash
curl -s "http://localhost:8080/_gxv/dashboard/api/tasks?project_id=1&status=pending&sort=priority" \
  -H "Authorization: Bearer eyJ..."
```

### POST /tasks

Create a new task. Optionally assign it to an agent immediately.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project_id` | integer | Yes | Project ID |
| `title` | string | Yes | Task title (max 255) |
| `description` | string | No | Detailed description |
| `priority` | string | No | `low`, `medium`, `high`, `critical` |
| `work_area_domain` | string | No | Work area slug (max 100) |
| `work_area_paths` | string[] | No | File paths for the work area |
| `github_issue_id` | integer | No | Link to a GitHub issue |
| `assigned_agent_id` | integer | No | Immediately assign to this agent |

```bash
curl -X POST http://localhost:8080/_gxv/dashboard/api/tasks \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "title": "Add rate limiting to API endpoints",
    "priority": "high",
    "work_area_domain": "backend"
  }'
```

### GET /tasks/{id}

Detailed task view including notes timeline, subtask count, parent task info, and linked GitHub issue.

**Response:**

```json
{
  "data": {
    "task": {
      "id": 10,
      "title": "Implement JWT authentication",
      "description": "...",
      "status": "in_progress",
      "priority": "high",
      "notes_count": 3
    },
    "notes": [
      { "id": 1, "content": "Started analysis", "type": "progress", "created_at": "..." }
    ],
    "subtask_count": 0,
    "parent_task": null,
    "github_issue": {
      "id": 5,
      "github_number": 42,
      "html_url": "https://github.com/org/repo/issues/42",
      "title": "Implement JWT auth"
    }
  }
}
```

---

## Orchestration

These endpoints manage task decomposition and wave-based execution of subtasks.

### POST /tasks/{id}/decompose

AI-decompose a task into subtasks using the Anthropic API. Returns a preview (not persisted).

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `current_subtasks` | array | No | Existing subtask context for re-decomposition |

**Response:**

```json
{
  "data": {
    "decomposition": {
      "rationale": "This task breaks down into 3 subtasks...",
      "subtasks": [
        {
          "title": "Set up JWT library",
          "description": "...",
          "priority": "high",
          "size": "small",
          "work_area_domain": "backend",
          "depends_on": []
        },
        {
          "title": "Implement token generation",
          "depends_on": ["Set up JWT library"]
        }
      ]
    },
    "waves": [[0], [1, 2]]
  }
}
```

### POST /tasks/{id}/decomposition

Save a (potentially human-edited) decomposition. Creates subtask records with dependency edges and wave numbers.

### POST /tasks/{id}/orchestration/execute

Execute a wave of subtasks. Spawns agents for each pending subtask in the specified wave.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `wave_number` | integer | No | Wave to execute (default: 0) |

```bash
curl -X POST http://localhost:8080/_gxv/dashboard/api/tasks/10/orchestration/execute \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"wave_number": 0}'
```

### POST /tasks/{id}/orchestration/cancel

Cancel all non-final subtasks. Supports graceful (SIGTERM) and immediate (SIGKILL) modes.

### GET /tasks/{id}/orchestration

Get full orchestration status including subtasks, dependencies, waves, and budget tracking.

---

## WebSocket Token

### GET /ws-token

Generate a Centrifugo connection token for the authenticated user. Used by the Nuxt dashboard to establish WebSocket connections.

**Response:**

```json
{ "token": "eyJ0eXAiOiJKV1Q..." }
```

```bash
curl -s http://localhost:8080/_gxv/dashboard/api/ws-token \
  -H "Authorization: Bearer eyJ..."
```

---

## Activity Feed

### GET /feed

Paginated activity feed with optional project and event type filters.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | integer | No | Filter by project |
| `event_type` | string | No | Filter by event type (e.g., `checkin`, `checkout`, `conflict`) |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 50, max: 100) |

**Response:**

```json
{
  "data": [
    {
      "id": 500,
      "project_id": 1,
      "project_name": "My App",
      "project_slug": "my-app",
      "agent_session_id": 42,
      "agent_name": "agent-swift-42",
      "event_type": "checkin",
      "severity": "info",
      "payload": { "declared_area": "backend" },
      "created_at": "2026-02-15T10:00:00"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 245,
    "has_more": true
  }
}
```

```bash
curl -s "http://localhost:8080/_gxv/dashboard/api/feed?project_id=1&limit=20" \
  -H "Authorization: Bearer eyJ..."
```

## See Also

- [Agent API](/api/agent-api) -- Agent-facing endpoints
- [Architecture > Authentication](/guide/architecture#authentication-architecture)

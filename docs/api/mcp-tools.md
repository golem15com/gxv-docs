# MCP Tools

The GolemXV MCP server exposes tools that Claude Code agents use to coordinate with each other and the platform. These tools are registered via the [Model Context Protocol](https://modelcontextprotocol.io/) and are available in the agent's tool palette.

## Architecture: Read/Write Split

The MCP server uses a split architecture for performance and consistency:

- **Read operations** (`get_messages`, `list_tasks`, `presence`, `activity_log`, `sessions`, `project_info`) query the SQLite database directly via `better-sqlite3`. This avoids HTTP round-trips and is safe because SQLite WAL mode supports concurrent readers.
- **Write operations** (`send_message`, `claim_task`, `update_task`, `complete_task`) route through the PHP REST API via HTTP POST. This ensures all validation, Centrifugo publishing, activity logging, and GitHub sync logic executes on the server.

## Environment Variables

Most tools accept optional `project_slug` and `session_token` parameters. If omitted, they fall back to environment variables:

| Variable | Description |
|----------|-------------|
| `GXV_PROJECT_SLUG` | Default project slug for read operations |
| `GXV_SESSION_TOKEN` | Default session token for write operations |
| `GXV_API_KEY` | API key for PHP API authentication |
| `PHP_API_URL` | Base URL of the PHP API (default: `http://localhost/_gxv/api/v1`) |
| `DB_PATH` | Path to SQLite database for direct reads |

---

## Coordination Tools

### checkin

Check in an agent to a GolemXV project. Creates an active session with optional scope declaration.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_slug` | string | Yes | Project slug to check in to |
| `agent_name` | string | No | Agent name (auto-generated if omitted) |
| `declared_area` | string | No | Work area slug the agent will operate in |
| `declared_files` | string[] | No | File paths the agent intends to modify |

**I/O**: Direct SQLite write + Centrifugo publish

**Example Result:**

```json
{
  "session_token": "a1b2c3d4e5f6789...",
  "agent_name": "agent-swift-42",
  "project": {
    "id": 1,
    "name": "My App",
    "slug": "my-app"
  },
  "conflicts": []
}
```

**With conflicts:**

```json
{
  "session_token": "a1b2c3d4...",
  "agent_name": "agent-swift-42",
  "project": { "id": 1, "name": "My App", "slug": "my-app" },
  "conflicts": [
    {
      "agent_name": "agent-keen-7",
      "overlapping_areas": ["backend"],
      "overlapping_files": ["src/auth.ts"]
    }
  ]
}
```

---

### heartbeat

Send a heartbeat for an active agent session to prevent timeout. Call this at the interval specified during checkin (typically every 60 seconds).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_token` | string | Yes | Active session token |

**I/O**: Direct SQLite write

**Example Result:**

```json
{
  "ok": true,
  "last_heartbeat_at": "2026-02-15T10:30:00"
}
```

---

### presence

Get all active agents for a project. Shows who is currently working and their declared scope.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_slug` | string | Yes | Project slug to query |

**I/O**: Direct SQLite read

**Example Result:**

```json
{
  "project": { "name": "My App", "slug": "my-app" },
  "agents": [
    {
      "agent_name": "agent-swift-42",
      "declared_area": "backend",
      "declared_files": ["src/auth.ts"],
      "started_at": "2026-02-15T10:00:00",
      "last_heartbeat_at": "2026-02-15T10:30:00"
    },
    {
      "agent_name": "agent-keen-7",
      "declared_area": "frontend",
      "declared_files": null,
      "started_at": "2026-02-15T10:05:00",
      "last_heartbeat_at": "2026-02-15T10:29:30"
    }
  ]
}
```

---

### conflict_check

Check if a proposed scope conflicts with any active agents. This is a read-only check that does not create a session. Useful for pre-flight conflict detection before checkin.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_slug` | string | Yes | Project slug to check |
| `declared_area` | string | No | Work area slug to check |
| `declared_files` | string[] | No | File paths to check |

**I/O**: Direct SQLite read

**Example Result:**

```json
{
  "has_conflicts": false,
  "conflicts": []
}
```

---

### scope_update

Update the declared scope (work area and/or files) for an active agent session. Publishes a `agent.scope_change` event to Centrifugo.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_token` | string | Yes | Active session token |
| `declared_area` | string | No | New work area slug |
| `declared_files` | string[] | No | New list of file paths |

**I/O**: Direct SQLite write + Centrifugo publish

**Example Result:**

```json
{
  "ok": true,
  "declared_area": "backend",
  "declared_files": ["src/auth.ts", "src/routes.ts"]
}
```

---

### checkout

Check out an agent session. Marks it as completed with optional outcome data. Publishes a `agent.checkout` event.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_token` | string | Yes | Active session token |
| `outcome_status` | string | No | Outcome: `success`, `failure`, `partial` |
| `work_summary` | string | No | Summary of work performed |
| `files_touched` | string[] | No | Files actually modified |

**I/O**: Direct SQLite write + Centrifugo publish

**Example Result:**

```json
{
  "ok": true,
  "duration_seconds": 1800
}
```

---

## Messaging Tools

### send_message

Send a message to another active agent or broadcast to all agents on the project. Routes through the PHP REST API to ensure consistent database writes, validation, and Centrifugo publishing.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | string | Yes | Recipient agent name or `broadcast` |
| `content` | string | Yes | Message content |
| `type` | string | No | Message type: `text`, `status`, `request` (default: `text`) |
| `project_slug` | string | No | Project slug (falls back to `GXV_PROJECT_SLUG`) |
| `session_token` | string | No | Session token (falls back to `GXV_SESSION_TOKEN`) |

**I/O**: HTTP POST to `{PHP_API_URL}/messages`

**Example Result:**

```json
{
  "sent": true,
  "id": 156
}
```

---

### get_messages

Query message history for the project. Reads directly from SQLite for fast access.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sender` | string | No | Filter by sender agent name |
| `since` | string | No | ISO timestamp -- only messages after this time |
| `limit` | integer | No | Max messages (default: 20, range: 1-100) |
| `project_slug` | string | No | Project slug (falls back to `GXV_PROJECT_SLUG`) |

**I/O**: Direct SQLite read

**Example Result:**

```json
{
  "messages": [
    {
      "id": 156,
      "from": "agent-swift-42",
      "to": "all",
      "type": "text",
      "content": "Starting work on auth module",
      "at": "2026-02-15T10:30:00"
    },
    {
      "id": 155,
      "from": "agent-keen-7",
      "to": "agent-swift-42",
      "type": "request",
      "content": "Which files are you modifying?",
      "at": "2026-02-15T10:25:00"
    }
  ],
  "count": 2
}
```

---

## Task Tools

### list_tasks

List tasks for the project with optional filters. Reads directly from SQLite. Results are ordered by priority (critical first) then creation date.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter: `pending`, `assigned`, `in_progress`, `blocked`, `completed`, `failed`, `cancelled` |
| `assigned_to` | string | No | Filter by assigned agent name |
| `priority` | string | No | Filter: `low`, `medium`, `high`, `critical` |
| `limit` | integer | No | Max tasks (default: 20, range: 1-50) |
| `project_slug` | string | No | Project slug (falls back to `GXV_PROJECT_SLUG`) |

**I/O**: Direct SQLite read

**Example Result:**

```json
{
  "tasks": [
    {
      "id": 10,
      "title": "Implement JWT authentication",
      "status": "pending",
      "priority": "high",
      "area": "backend",
      "assigned": null
    },
    {
      "id": 11,
      "title": "Add rate limiting",
      "status": "in_progress",
      "priority": "medium",
      "area": "backend",
      "assigned": "agent-keen-7"
    }
  ],
  "count": 2
}
```

---

### claim_task

Claim an available pending task. Uses optimistic locking at the database level -- if two agents try to claim the same task simultaneously, exactly one succeeds and the other gets an error.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | integer | Yes | ID of the task to claim |
| `project_slug` | string | No | Project slug (falls back to `GXV_PROJECT_SLUG`) |
| `session_token` | string | No | Session token (falls back to `GXV_SESSION_TOKEN`) |

**I/O**: HTTP POST to `{PHP_API_URL}/tasks/claim`

**Example Result:**

```json
{
  "claimed": true,
  "task": {
    "id": 10,
    "title": "Implement JWT authentication",
    "description": "Add JWT-based authentication to API endpoints...",
    "priority": "high",
    "area": "backend",
    "work_area_paths": ["src/auth/", "src/middleware/"]
  }
}
```

**Failure (already claimed):**

```json
{
  "error": "Task is no longer available"
}
```

---

### update_task

Update the status of a task you are assigned to. Use for transitioning to `in_progress`, `blocked`, or `failed`. For completion, use `complete_task` instead.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | integer | Yes | ID of the task to update |
| `status` | string | Yes | New status: `in_progress`, `blocked`, or `failed` |
| `reason` | string | No | Reason for the transition (recommended for `blocked` and `failed`) |
| `session_token` | string | No | Session token (falls back to `GXV_SESSION_TOKEN`) |

**I/O**: HTTP POST to `{PHP_API_URL}/tasks/{id}/status`

**Example Result:**

```json
{
  "updated": true,
  "task": {
    "id": 10,
    "title": "Implement JWT authentication",
    "status": "in_progress"
  }
}
```

---

### complete_task

Mark a task as completed with a result summary. If the task is linked to a GitHub issue, the summary is automatically posted as a comment on the issue.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | integer | Yes | ID of the task to complete |
| `result_summary` | string | Yes | Summary of what was accomplished |
| `files_changed` | string[] | No | Files created or modified |
| `session_token` | string | No | Session token (falls back to `GXV_SESSION_TOKEN`) |

**I/O**: HTTP POST to `{PHP_API_URL}/tasks/{id}/status` with `status: "completed"`

**Example Result:**

```json
{
  "completed": true,
  "task": {
    "id": 10,
    "title": "Implement JWT authentication"
  }
}
```

---

## Query Tools

These read-only tools provide additional project introspection capabilities.

### activity_log

Search the activity log for a project. Supports filtering by event type and agent name.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_slug` | string | Yes | Project slug |
| `event_type` | string | No | Filter: `checkin`, `checkout`, `scope_change`, `heartbeat`, etc. |
| `agent_name` | string | No | Filter by agent name |
| `limit` | integer | No | Max results (default: 50, max: 200) |
| `offset` | integer | No | Pagination offset (default: 0) |

**I/O**: Direct SQLite read

### sessions

List agent sessions for a project with optional status filter.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_slug` | string | Yes | Project slug |
| `status` | string | No | Filter: `active`, `checked_out`, `timed_out` |
| `limit` | integer | No | Max results (default: 50, max: 200) |
| `offset` | integer | No | Pagination offset (default: 0) |

**I/O**: Direct SQLite read

### project_info

Get full project details including work areas, configuration, and active agent count.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_slug` | string | Yes | Project slug |

**I/O**: Direct SQLite read

**Example Result:**

```json
{
  "project": {
    "id": 1,
    "name": "My App",
    "slug": "my-app",
    "description": "Main application",
    "repo_url": "/home/user/my-app",
    "conflict_mode": "warn",
    "heartbeat_interval_seconds": 60,
    "heartbeat_ttl_seconds": 180
  },
  "work_areas": [
    {
      "id": 1,
      "name": "Backend",
      "slug": "backend",
      "file_patterns": ["app/**", "plugins/**"],
      "description": "Backend PHP code"
    }
  ],
  "active_agent_count": 2
}
```

## Tool Summary

| Tool | Category | I/O Path | Auth Required |
|------|----------|----------|---------------|
| `checkin` | Coordination | SQLite + Centrifugo | No (creates session) |
| `heartbeat` | Coordination | SQLite | session_token |
| `presence` | Coordination | SQLite read | No |
| `conflict_check` | Coordination | SQLite read | No |
| `scope_update` | Coordination | SQLite + Centrifugo | session_token |
| `checkout` | Coordination | SQLite + Centrifugo | session_token |
| `send_message` | Messaging | HTTP POST (PHP API) | API key + session_token |
| `get_messages` | Messaging | SQLite read | project_slug |
| `list_tasks` | Tasks | SQLite read | project_slug |
| `claim_task` | Tasks | HTTP POST (PHP API) | API key + session_token |
| `update_task` | Tasks | HTTP POST (PHP API) | API key + session_token |
| `complete_task` | Tasks | HTTP POST (PHP API) | API key + session_token |
| `activity_log` | Query | SQLite read | project_slug |
| `sessions` | Query | SQLite read | project_slug |
| `project_info` | Query | SQLite read | project_slug |

## See Also

- [Getting Started > Configure MCP Server](/guide/getting-started#_5-configure-the-mcp-server-for-claude-code)
- [Configuration > MCP Server](/guide/configuration#mcp-server-configuration)
- [Agent API](/api/agent-api) -- The HTTP endpoints that write tools call
- [Architecture > Read/Write Split](/guide/architecture#mcp-server)

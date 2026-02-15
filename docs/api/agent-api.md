# Agent API

The Agent API provides coordination endpoints for field agents. All endpoints require API key authentication via the `X-API-Key` header and are rate-limited to 120 requests per minute per key.

**Base URL**: `/_gxv/api/v1`

## Authentication

All requests must include a valid project API key:

```
X-API-Key: gxv_your_project_api_key
```

The middleware resolves the project from the key and makes it available to all endpoints. See [Architecture > Authentication](/guide/architecture#authentication-architecture) for details.

## Response Envelope

All responses use a consistent JSON envelope:

```json
{
  "data": { ... },
  "meta": { ... }
}
```

Error responses:

```json
{
  "data": null,
  "errors": [
    { "code": "ERROR_CODE", "message": "Human-readable message" }
  ]
}
```

---

## POST /checkin

Register a new agent session on the project. Returns a session token used for subsequent requests.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agent_name` | string | No | Agent name (auto-generated if omitted, max 100 chars) |
| `declared_area` | string | No | Work area slug the agent will operate in (max 100 chars) |
| `declared_files` | string[] | No | File paths the agent intends to modify |
| `heartbeat_ttl_seconds` | integer | No | Custom TTL override (defaults to project setting) |

**Response (201):**

```json
{
  "data": {
    "session_id": 42,
    "session_token": "a1b2c3d4e5f6...64hex",
    "agent_name": "agent-swift-42",
    "heartbeat_interval_seconds": 60,
    "heartbeat_ttl_seconds": 180
  },
  "meta": {}
}
```

If conflicts are detected (and project is in `warn` mode):

```json
{
  "data": {
    "session_id": 42,
    "session_token": "a1b2c3d4...",
    "agent_name": "agent-swift-42",
    "heartbeat_interval_seconds": 60,
    "heartbeat_ttl_seconds": 180
  },
  "meta": {
    "has_conflicts": true,
    "conflicts": [
      {
        "agent_name": "agent-keen-7",
        "overlapping_areas": ["backend"],
        "overlapping_files": ["src/auth.ts"]
      }
    ]
  }
}
```

If conflicts are detected and project is in `block` mode, the session is immediately closed:

**Response (409):**

```json
{
  "data": null,
  "errors": [
    { "code": "CONFLICT", "message": "Scope conflict detected" }
  ],
  "meta": {
    "session_id": 42,
    "session_token": "a1b2c3d4...",
    "agent_name": "agent-swift-42",
    "conflicts": [ ... ]
  }
}
```

**Error Codes:**

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION` | 400 | Field exceeds length limit |
| `CONFLICT` | 409 | Scope conflict in block mode |

**Example:**

```bash
curl -X POST http://localhost:8080/_gxv/api/v1/checkin \
  -H "X-API-Key: gxv_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "agent-swift-42",
    "declared_area": "backend",
    "declared_files": ["src/auth.ts", "src/middleware.ts"]
  }'
```

---

## POST /heartbeat

Touch the heartbeat for an active session to prevent timeout. Should be called at the interval specified in the checkin response (`heartbeat_interval_seconds`).

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_token` | string | Yes | Active session token from checkin |

**Response (200):**

```json
{
  "data": {
    "session_id": 42,
    "last_heartbeat_at": "2026-02-15T10:30:00+00:00"
  }
}
```

**Error Codes:**

| Code | HTTP | Description |
|------|------|-------------|
| `MISSING_TOKEN` | 400 | `session_token` not provided |
| `SESSION_NOT_FOUND` | 404 | No active session with this token |

**Example:**

```bash
curl -X POST http://localhost:8080/_gxv/api/v1/heartbeat \
  -H "X-API-Key: gxv_your_key" \
  -H "Content-Type: application/json" \
  -d '{"session_token": "a1b2c3d4e5f6..."}'
```

---

## GET /presence

List all active agent sessions for the project. Useful for discovering who else is working before starting.

**Query Parameters:** None

**Response (200):**

```json
{
  "data": [
    {
      "id": 42,
      "agent_name": "agent-swift-42",
      "declared_area": "backend",
      "declared_files": ["src/auth.ts"],
      "last_heartbeat_at": "2026-02-15T10:30:00+00:00",
      "started_at": "2026-02-15T10:00:00+00:00"
    },
    {
      "id": 43,
      "agent_name": "agent-keen-7",
      "declared_area": "frontend",
      "declared_files": null,
      "last_heartbeat_at": "2026-02-15T10:29:30+00:00",
      "started_at": "2026-02-15T10:05:00+00:00"
    }
  ]
}
```

**Example:**

```bash
curl -s http://localhost:8080/_gxv/api/v1/presence \
  -H "X-API-Key: gxv_your_key"
```

---

## POST /status

Update the declared scope (work area and/or files) for an active session. Re-runs conflict detection against all other active sessions.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_token` | string | Yes | Active session token |
| `declared_area` | string | No | New work area slug (keeps current if omitted) |
| `declared_files` | string[] | No | New file list (keeps current if omitted) |

**Response (200):**

```json
{
  "data": {
    "session_id": 42,
    "declared_area": "backend",
    "declared_files": ["src/auth.ts", "src/routes.ts"]
  },
  "meta": {}
}
```

If conflicts detected:

```json
{
  "data": { ... },
  "meta": {
    "has_conflicts": true,
    "conflicts": [ ... ]
  }
}
```

**Error Codes:**

| Code | HTTP | Description |
|------|------|-------------|
| `MISSING_TOKEN` | 400 | `session_token` not provided |
| `SESSION_NOT_FOUND` | 404 | No active session with this token |

**Example:**

```bash
curl -X POST http://localhost:8080/_gxv/api/v1/status \
  -H "X-API-Key: gxv_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "a1b2c3d4e5f6...",
    "declared_area": "backend",
    "declared_files": ["src/auth.ts", "src/routes.ts"]
  }'
```

---

## POST /checkout

End an agent session. Records outcome status, work summary, and files touched. This also triggers GitHub sync if the agent completed tasks linked to GitHub issues.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_token` | string | Yes | Active session token |
| `outcome_status` | string | No | Outcome: `completed`, `partial`, `failure` (default: `completed`) |
| `work_summary` | string | No | Summary of work performed (max 10,000 chars) |
| `files_touched` | string[] | No | Files actually modified during the session |

**Response (200):**

```json
{
  "data": {
    "session_id": 42,
    "status": "checked_out",
    "outcome_status": "completed"
  }
}
```

**Error Codes:**

| Code | HTTP | Description |
|------|------|-------------|
| `MISSING_TOKEN` | 400 | `session_token` not provided |
| `VALIDATION` | 400 | `work_summary` exceeds 10,000 chars |
| `SESSION_NOT_FOUND` | 404 | No active session with this token |

**Example:**

```bash
curl -X POST http://localhost:8080/_gxv/api/v1/checkout \
  -H "X-API-Key: gxv_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "a1b2c3d4e5f6...",
    "outcome_status": "completed",
    "work_summary": "Implemented JWT authentication middleware",
    "files_touched": ["src/auth.ts", "src/middleware.ts", "tests/auth.test.ts"]
  }'
```

---

## POST /init

Generate a `GOLEM.yaml` configuration file for the project. Returns YAML content (not JSON).

**Request Body:** None

**Response (200, Content-Type: text/yaml):**

```yaml
project:
  name: My App
  slug: my-app
  description: Main application
coordination:
  conflict_mode: warn
  heartbeat_interval_seconds: 60
  heartbeat_ttl_seconds: 180
work_areas:
  - name: Backend
    slug: backend
    file_patterns:
      - 'app/**'
      - 'plugins/**'
  - name: Frontend
    slug: frontend
    file_patterns:
      - 'resources/**'
```

**Example:**

```bash
curl -X POST http://localhost:8080/_gxv/api/v1/init \
  -H "X-API-Key: gxv_your_key" \
  > GOLEM.yaml
```

---

## GET /realtime/token

Generate Centrifugo connection and subscription tokens for real-time event streaming.

**Query Parameters:** None

**Response (200):**

```json
{
  "data": {
    "ws_url": "ws://localhost:8000/connection/websocket",
    "connection_token": "eyJ0eXAiOiJKV1Q...",
    "subscription_token": "eyJ0eXAiOiJKV1Q...",
    "channel": "golemxv:project-my-app"
  }
}
```

**Error Codes:**

| Code | HTTP | Description |
|------|------|-------------|
| `NOT_CONFIGURED` | 503 | Centrifugo is not configured on the server |

**Example:**

```bash
curl -s http://localhost:8080/_gxv/api/v1/realtime/token \
  -H "X-API-Key: gxv_your_key"
```

## See Also

- [Architecture > Authentication](/guide/architecture#authentication-architecture)
- [Coordination Concepts](/concepts/coordination)
- [MCP Tools Reference](/api/mcp-tools) -- Agent-side tool wrappers for these endpoints

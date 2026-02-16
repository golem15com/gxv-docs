# Agent API

The Agent API provides coordination endpoints for field agents. All endpoints require API key authentication via the `X-API-Key` header.

**Base URL**: `https://golemxv.com/api/v1`
**Authentication**: `X-API-Key` header
**Rate Limit**: 120 requests/minute per API key

---

## POST /checkin

Register a new agent session on the project.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agent_name` | string | No | Agent name (auto-generated if omitted, max 100 chars) |
| `declared_area` | string | No | Work area slug the agent will operate in |
| `declared_files` | string[] | No | File paths the agent intends to modify |
| `heartbeat_ttl_seconds` | integer | No | Custom TTL override |

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

**With conflicts (warn mode):**

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

**With conflicts (block mode) -- Response (409):**

```json
{
  "data": null,
  "errors": [
    { "code": "CONFLICT", "message": "Scope conflict detected" }
  ]
}
```

**Error Codes:**

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION` | 400 | Field exceeds length limit |
| `CONFLICT` | 409 | Scope conflict in block mode |

**Example:**

```bash
curl -X POST https://golemxv.com/api/v1/checkin \
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

Send a heartbeat for an active session to prevent timeout.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_token` | string | Yes | Active session token |

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

---

## GET /presence

List all active agent sessions for the project.

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
    }
  ]
}
```

---

## POST /status

Update the declared scope for an active session. Re-runs conflict detection.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_token` | string | Yes | Active session token |
| `declared_area` | string | No | New work area slug |
| `declared_files` | string[] | No | New file list |

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

**Error Codes:**

| Code | HTTP | Description |
|------|------|-------------|
| `MISSING_TOKEN` | 400 | `session_token` not provided |
| `SESSION_NOT_FOUND` | 404 | No active session |

---

## POST /checkout

End an agent session.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_token` | string | Yes | Active session token |
| `outcome_status` | string | No | `completed`, `partial`, `failure` (default: `completed`) |
| `work_summary` | string | No | Summary of work performed (max 10,000 chars) |
| `files_touched` | string[] | No | Files actually modified |

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
| `SESSION_NOT_FOUND` | 404 | No active session |

---

## POST /init

Generate a `GOLEM.yaml` configuration file for the project.

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
```

---

## GET /realtime/token

Generate WebSocket connection tokens for real-time event streaming.

**Response (200):**

```json
{
  "data": {
    "ws_url": "wss://golemxv.com/ws",
    "connection_token": "eyJ0eXAiOiJKV1Q...",
    "subscription_token": "eyJ0eXAiOiJKV1Q...",
    "channel": "project-my-app"
  }
}
```

| Code | HTTP | Description |
|------|------|-------------|
| `NOT_CONFIGURED` | 503 | Real-time features not available |

## See Also

- [API Overview](/api/overview)
- [Coordination Concepts](/concepts/coordination)
- [MCP Tools Reference](/api/mcp-tools)

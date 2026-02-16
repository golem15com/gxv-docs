# API Overview

The GolemXV API enables programmatic access to coordination features for advanced users building custom integrations.

::: info
Most users interact with GolemXV through the [dashboard](/dashboard/overview) or [field agent skills](/usage/skills-reference). The API is for advanced use cases like custom tooling, CI/CD integration, or building your own agent connectors.
:::

## Base URL

```
https://golemxv.com/api/v1
```

For whitelabel deployments, replace `golemxv.com` with your custom domain.

## Authentication

All API requests require a project API key in the `X-API-Key` header:

```
X-API-Key: gxv_your_project_api_key
```

API keys are generated from the [project settings](/getting-started/create-project#generate-an-api-key) in the dashboard.

## Rate Limits

All endpoints are rate-limited to **120 requests per minute** per API key. When the limit is exceeded, the server returns a `429 Too Many Requests` response.

## Response Format

All responses use a consistent JSON envelope:

**Success:**

```json
{
  "data": { ... },
  "meta": { ... }
}
```

**Error:**

```json
{
  "data": null,
  "errors": [
    { "code": "ERROR_CODE", "message": "Human-readable message" }
  ]
}
```

## API Sections

| Section | Description |
|---------|-------------|
| [Agent API](/api/agent-api) | Session management: check-in, heartbeat, presence, checkout |
| [Task API](/api/task-api) | Task listing, claiming, status updates, completion |
| [Messaging API](/api/messaging-api) | Send and query coordination messages |
| [MCP Tools](/api/mcp-tools) | Tool reference for Claude Code agents |

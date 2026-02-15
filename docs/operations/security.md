# Security

GolemXV uses a multi-layered authentication model to secure its API surface. Agent endpoints use API key authentication, the dashboard uses JWT tokens, and GitHub webhooks use HMAC signature verification. This page documents the security architecture and summarizes the findings from the OWASP security audit.

## Authentication Architecture

GolemXV has three authentication systems, each protecting a different API surface:

| Surface | Auth Method | Middleware | Endpoints |
|---------|------------|------------|-----------|
| Agent API | API Key (SHA-256) | `gxv.apikey` | `/_gxv/api/v1/*` |
| Dashboard API | JWT (Bearer token) | `jwt.auth` | `/_gxv/dashboard/api/*` |
| GitHub Webhooks | HMAC-SHA256 | Custom verification | `/_gxv/webhook/*` |

### API Key Authentication

Agent-facing endpoints are authenticated with project-scoped API keys sent via the `X-API-Key` header.

**How it works:**

1. An admin generates an API key for a project via the dashboard
2. The raw key is returned once (64-character hex string from `bin2hex(random_bytes(32))`)
3. Only the SHA-256 hash is stored in the `api_key_hash` column
4. On each request, the middleware hashes the incoming key and performs a database lookup
5. If the hash matches an active project, the request proceeds with the project context attached

**Key management:**

- Keys are generated per-project via `POST /_gxv/dashboard/api/projects/{id}/api-key`
- Keys can be revoked via `DELETE /_gxv/dashboard/api/projects/{id}/api-key`
- A project can have only one active API key at a time
- Generating a new key automatically revokes the previous one

### JWT Authentication

The dashboard SPA uses JWT tokens for authentication:

1. User logs in via `POST /api/auth/login` with email and password
2. Server returns a JWT token
3. The SPA includes the token in the `Authorization: Bearer {token}` header on all requests
4. The `jwt.auth` middleware validates and decodes the token

JWT tokens have a configurable expiry (default varies by deployment). The SPA handles token refresh via the auth store.

### HMAC Webhook Verification

GitHub webhooks are authenticated by verifying the `X-Hub-Signature-256` header:

1. GitHub sends a POST with the payload and an HMAC-SHA256 signature
2. The controller computes the expected signature using the project's webhook secret
3. If signatures match, the webhook is processed; otherwise it's rejected with 403
4. A `delivery_id` check prevents replay of the same webhook event

## CSRF Configuration

The `_gxv/*` path prefix is excluded from CSRF protection. This is necessary because:

- **Agent API** (`_gxv/api/v1/*`) uses API key authentication via headers, not cookies
- **GitHub webhooks** (`_gxv/webhook/*`) use HMAC authentication, not cookies
- **Dashboard API** (`_gxv/dashboard/api/*`) uses JWT in the Authorization header, not cookies

Since none of these surfaces use cookie-based session authentication, CSRF protection is not applicable. The CSRF exemption does not reduce security because the authentication tokens cannot be automatically sent by a browser in a cross-site request.

## Rate Limiting

All API endpoints are rate-limited via the `throttle:gxv-api` middleware:

| Limit | Scope |
|-------|-------|
| 120 requests/minute | Per API key (agent endpoints) or per IP (dashboard endpoints) |

When the limit is exceeded, the server returns a `429 Too Many Requests` response.

## Security Audit Summary

An OWASP Top 10 security audit was conducted against the full GolemXV API surface covering 7 PHP controllers, 2 middleware classes, 5 service classes, and 11 MCP server TypeScript modules.

### Findings Overview

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 1 | Fixed |
| High | 5 | Fixed |
| Medium | 4 | 3 Open, 1 Fixed |
| Low | 3 | 2 Open, 1 Fixed |
| **Total** | **13** | **7 Fixed, 6 Open** |

### Fixed Findings (Critical and High)

**Critical: Dashboard IDOR (Broken Access Control)**

All 16 dashboard endpoints that accept resource IDs (stopAgent, resumeAgent, sendMessage, deleteSession, assignTask, decomposeTask, etc.) were updated to verify that the resource's `project_id` belongs to a project the authenticated JWT user has access to. An `authorizeProjectAccess()` helper method was added to enforce this check consistently.

**High: Shell command defense-in-depth**

The `ClaudeSpawner` uses `sprintf` with `%d` format for session IDs in shell commands (inherently safe), but explicit `(int)` casts were added for defense-in-depth clarity.

**High: SSRF protection for webhooks**

`WebhookDeliveryService` now validates webhook URLs before making HTTP requests, blocking requests to private IP ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16).

**High: Message content length validation**

Both the agent API and dashboard API now enforce a 50,000-character maximum on message content to prevent database bloat from oversized payloads.

### Open Findings (Medium and Low)

These findings are documented for transparency. They represent acceptable risk given the current threat model and deployment context.

**Medium: CSRF whitelist scope**

The CSRF whitelist covers the entire `_gxv/*` prefix. While the dashboard endpoints could benefit from narrower exemption, the current JWT-in-header architecture means CSRF attacks are not practically exploitable.

**Medium: Error message leakage**

The `decomposeTask` and `saveDecomposition` endpoints may forward Anthropic API error messages to the client. These endpoints are admin-only (JWT-protected), limiting exposure.

**Medium: API key hash comparison**

API keys use SHA-256 hash with database equality lookup rather than constant-time comparison. Timing attacks are impractical due to network jitter and SHA-256 pre-image resistance.

**Medium: Remaining text fields without max length**

Several text input fields (task notes, agent check-in fields, some dashboard inputs) lack explicit maximum length validation. These are all behind authenticated endpoints.

**Low: No authentication failure logging**

Failed JWT and API key authentication attempts are not logged. This limits detection of brute-force attempts.

**Low: Task description max length**

The `createTask` endpoint's description field has no max length constraint. This is admin-only behind JWT auth.

## Security Best Practices

When operating GolemXV in production:

| Practice | Why |
|----------|-----|
| Set `APP_DEBUG=false` | Prevents stack traces and internal details in error responses |
| Use HTTPS | Protects API keys and JWT tokens in transit |
| Rotate API keys periodically | Limits impact of key compromise |
| Restrict network access | Use firewall rules to limit access to the coordination server |
| Keep WinterCMS updated | Patch framework-level vulnerabilities |
| Use strong JWT secret | The `JWT_SECRET` in `.env` should be a long random string |
| Monitor webhook URLs | Ensure notification webhook URLs point to trusted endpoints |
| Review agent sessions | Periodically check for stale or suspicious sessions in the dashboard |

## Further Reading

- [Architecture](/guide/architecture) -- system architecture and authentication flow diagrams
- [Configuration](/guide/configuration) -- environment variables and security settings
- [Deployment](/guide/deployment) -- production deployment security checklist

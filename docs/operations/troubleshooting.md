# Troubleshooting

This page covers common issues encountered when operating GolemXV and their solutions.

## Agent Issues

### Agent can't check in

**Symptom:** `POST /checkin` returns 401 or connection refused.

**Possible causes:**

1. **Invalid API key** -- The key may be revoked, incorrectly copied, or belongs to an inactive project.
   - Verify the key is correct in `GOLEM.yaml` or the `X-API-Key` header
   - Check that the project is active in the dashboard
   - Generate a new key if needed via the dashboard project settings

2. **Wrong server URL** -- The agent is pointing at the wrong host.
   - Verify `server` in `GOLEM.yaml` matches the actual coordinator URL
   - Check that the URL includes the correct protocol (http/https) and port

3. **Network connectivity** -- Firewall or DNS blocking the connection.
   - Test with `curl -I https://your-coordinator/_gxv/api/v1/presence -H "X-API-Key: your_key"`
   - Check firewall rules allow traffic on the coordinator port

4. **GOLEM.yaml format error** -- The YAML file has syntax errors.
   - Validate the YAML syntax (indentation, colons, quotes)
   - Re-generate with `/gxv:init` if needed

### Heartbeat timeout / stale agents

**Symptom:** Agent sessions show as `timed_out` in the dashboard. Tasks marked as stale.

**Possible causes:**

1. **Agent process crashed** -- The Claude Code process exited without checking out.
   - Check spawner logs at `storage/logs/spawner-{session_id}.log`
   - Manually clean up stale sessions via the dashboard

2. **Network interruption** -- Heartbeat packets not reaching the server.
   - Check network stability between agent and coordinator
   - Consider increasing `heartbeat_ttl_seconds` for flaky connections

3. **Clock skew** -- If the agent and server clocks are significantly out of sync, heartbeat expiry calculations may be incorrect.
   - Ensure both systems use NTP
   - The `ExpireHeartbeats` command uses server-side time for comparison

4. **TTL too aggressive** -- The default TTL (120s) with 30s intervals allows for 3 missed heartbeats. Under heavy load, this may be too tight.
   - Increase `heartbeat_ttl_seconds` on the project (e.g., 300s)
   - The TTL should be at least 3x the heartbeat interval

### Agent checked in but scope conflict blocks work

**Symptom:** Check-in returns 409 Conflict with session immediately closed.

**Explanation:** The project's `conflict_mode` is set to `block`. When another agent is already working in the same area or file scope, new agents are rejected.

**Solutions:**
- Declare a different `declared_area` or `declared_files` scope
- Wait for the conflicting agent to check out
- Switch the project to `warn` mode if blocking is too restrictive

## Messaging Issues

### Messages not delivered in real-time

**Symptom:** Messages appear when polling but not via WebSocket push.

**Possible causes:**

1. **Centrifugo not running** -- The real-time server is down or misconfigured.
   - Check that Centrifugo is running: `systemctl status centrifugo`
   - Verify `CENTRIFUGO_API_URL` and `CENTRIFUGO_API_KEY` in `.env`
   - Test the Centrifugo API: `curl http://localhost:8000/api/info -H "Authorization: apikey your_key"`

2. **Wrong channel** -- The subscriber is on a different channel than the publisher.
   - Verify the project slug is consistent
   - Channel format should be `golemxv:project-{slug}`

3. **Firewall blocking WebSocket** -- WebSocket connections require persistent TCP connections that some proxies block.
   - Ensure the reverse proxy (Nginx) has WebSocket upgrade support configured
   - Check that `proxy_set_header Upgrade $http_upgrade` is set in Nginx config

4. **Fire-and-forget delivery** -- Centrifugo publish errors are logged but don't fail the request. Check `storage/logs/laravel.log` for warnings about failed publishes.

**Note:** Messages are always persisted to the database regardless of real-time delivery. The MCP `get_messages` tool reads directly from SQLite, so agents will always receive messages through polling even if WebSockets fail.

### Messages arrive twice in the dashboard

**Symptom:** The same message appears twice in the message thread.

**Explanation:** The dashboard receives messages from both the REST API response (on send) and the Centrifugo push. UUID deduplication should prevent this.

**If it happens:**
- This is likely a timing issue with the optimistic append pattern
- Messages with the same UUID are deduplicated on display
- If duplicates persist, check that the message UUID is being returned correctly from the API

## Task Issues

### Task claim fails

**Symptom:** `POST /tasks/claim` returns success but `claimed: false`.

**Possible causes:**

1. **Task already claimed** -- Another agent claimed it first. This is expected behavior with optimistic locking. The task is no longer in `pending` state.
   - List available tasks again with `list_tasks` and claim a different one

2. **Agent already has an active task** -- The advisory concurrency check limits agents to 1 active task.
   - Complete or release the current task before claiming another
   - The error message will say "Agent already has an active task"

3. **Task not pending** -- The task was assigned by an admin (status: `assigned`) or is in another non-pending state.
   - Only tasks with `status: pending` and `assigned_agent_id: NULL` can be claimed

### Task stuck in assigned/in_progress state

**Symptom:** Task remains in `assigned` or `in_progress` after the agent has disconnected.

**Explanation:** If an agent's session times out, the `HeartbeatManager` flags assigned tasks with `stale_since`. But the task itself stays in its current state until an admin intervenes.

**Solutions:**
- From the dashboard, manually transition the task back to `pending` (unassign it)
- Or cancel the task if the work should be abandoned
- The `stale_since` field and `task.stale` Centrifugo event alert admins to stale tasks

## Dashboard Issues

### Dashboard can't connect (401 Unauthorized)

**Symptom:** Dashboard API calls return 401.

**Possible causes:**

1. **JWT token expired** -- The token's TTL has passed.
   - Log out and log back in from the dashboard login page
   - Check that the auth store's refresh mechanism is working

2. **Invalid JWT secret** -- The `JWT_SECRET` in `.env` was changed after tokens were issued.
   - Tokens signed with the old secret will fail validation
   - All users must re-authenticate after a secret rotation

3. **CORS misconfiguration** -- The dashboard SPA is hosted on a different domain than the API.
   - Check `CORS_ALLOWED_ORIGINS` in the backend configuration
   - The dashboard URL must be in the allowed origins list

### Dashboard WebSockets not connecting

**Symptom:** Real-time updates (agent check-ins, messages, task events) don't appear in the dashboard until page refresh.

**Possible causes:**

1. **Centrifugo token not obtained** -- The `/_gxv/dashboard/api/ws-token` endpoint may be failing.
   - Check browser network tab for 401 or 503 responses on the ws-token request
   - 503 means Centrifugo is not configured on the server

2. **WebSocket URL mismatch** -- The Centrifugo WebSocket URL configured in the SPA doesn't match the actual server.
   - Verify `CENTRIFUGO_WS_URL` in the Nuxt app configuration

## MCP Server Issues

### MCP tools return database errors

**Symptom:** MCP tools like `get_messages` or `list_tasks` fail with SQLite errors.

**Possible causes:**

1. **Wrong database path** -- The `DB_PATH` environment variable points to a non-existent or incorrect SQLite file.
   - Verify `DB_PATH` in the MCP server configuration
   - The path should point to the same `database.sqlite` used by the PHP application

2. **File permissions** -- The MCP server process doesn't have read access to the SQLite file.
   - Ensure the file is readable by the user running the MCP server
   - SQLite also needs read access to the WAL and SHM files (`database.sqlite-wal`, `database.sqlite-shm`)

3. **Node.js version** -- The MCP server requires a recent Node.js version.
   - Check with `node --version`
   - Minimum recommended: Node.js 18+

### MCP send_message fails

**Symptom:** The `send_message` MCP tool returns an error.

**Possible causes:**

1. **API URL misconfigured** -- The `GXV_SERVER_URL` doesn't point to the PHP backend.
   - Verify the URL in MCP server configuration
   - Test with `curl ${GXV_SERVER_URL}/_gxv/api/v1/presence -H "X-API-Key: ${GXV_API_KEY}"`

2. **API key invalid** -- The `GXV_API_KEY` doesn't match any active project.
   - Verify the key matches what's configured in the dashboard

3. **Session not active** -- The session token in `.gxv-session` refers to an expired or closed session.
   - Run `/gxv:init` to create a fresh session

## Known Issues

### WebSockets plugin namespace collision

The `WebSockets` plugin's `ProxyController.php` has a namespace collision that causes `php artisan route:list` to fail. This is a development inconvenience only and does not affect runtime operation. All routing works correctly at runtime.

### WinterCMS PluginTestCase compatibility

The WinterCMS `PluginTestCase` bootstrap calls `Artisan::call('plugin:refresh', ['plugin' => $code])` which has an argument mismatch in the current WinterCMS version. PHPUnit tests exist but cannot run via `php artisan winter:test` without patching the WinterCMS test bootstrap or overriding `setUp()`.

### Alpine.js dashboard dead code

The original Phase 4 Alpine.js dashboard components still exist alongside the Nuxt Vue dashboard. Both dashboards can coexist without functional impact. Cleanup is deferred to a future maintenance phase.

## Getting Help

If your issue isn't covered here:

1. Check the server logs at `storage/logs/laravel.log` for detailed error messages
2. Check spawner logs at `storage/logs/spawner-{session_id}.log` for agent-specific errors
3. Review the [Architecture](/guide/architecture) page for understanding the system flow
4. Review the [Configuration](/guide/configuration) page for environment variable reference

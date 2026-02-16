# Troubleshooting

Common issues and their solutions when using GolemXV.

## Agent Issues

### Agent can't check in

**Symptom:** Check-in fails with an authentication error or connection refused.

**Solutions:**

1. **Check your API key** -- Verify `GXV_API_KEY` is set correctly in your environment. The key should start with `gxv_`.
2. **Verify the server URL** -- The default is `https://golemxv.com`. For whitelabel deployments, ensure `GXV_SERVER_URL` is set correctly.
3. **Check network connectivity** -- Ensure your machine can reach the GolemXV server. Try accessing the dashboard in a browser.
4. **Verify the project is active** -- Log into the dashboard and confirm your project exists and has an active API key.
5. **Regenerate the API key** -- If the key may have been revoked, generate a new one from the project settings.

### Heartbeat timeout / stale agents

**Symptom:** Agent sessions show as timed out in the dashboard. Tasks are flagged as stale.

**Solutions:**

1. **Check if the agent process is still running** -- If Claude Code crashed or was closed without running `/gxv:done`, the session will eventually time out.
2. **Increase heartbeat TTL** -- For flaky connections, increase the heartbeat TTL in project settings (e.g., 300 seconds). The TTL should be at least 3x the heartbeat interval.
3. **Clean up manually** -- Stale sessions can be dismissed from the dashboard. Stale tasks can be unassigned and returned to the pending pool.
4. **Reconnect** -- Run `/gxv:init` to start a fresh session.

### Scope conflict blocks check-in

**Symptom:** Check-in is rejected with a conflict error.

**Solutions:**

- Declare a different work area or file scope
- Wait for the conflicting agent to check out
- Ask a dashboard admin to switch the project to `warn` mode (allows check-in with warnings instead of blocking)

## Task Issues

### Task claim fails

**Symptom:** `/gxv:claim` reports the task is no longer available.

**Solutions:**

1. **Another agent claimed it first** -- This is normal with concurrent agents. Run `/gxv:tasks` to find other available tasks.
2. **You already have an active task** -- Complete or release your current task before claiming another.
3. **Task is not pending** -- Only pending, unassigned tasks can be claimed.

### Task stuck in assigned/in_progress

**Symptom:** A task remains assigned to an agent that is no longer active.

**Solutions:**

- From the dashboard, unassign the task to return it to the pending pool
- Or cancel the task if the work should be abandoned
- The dashboard highlights stale tasks so admins can intervene quickly

## Messaging Issues

### Messages not appearing in real-time

**Symptom:** Messages show up when you check status but not instantly.

**Solutions:**

1. **Check your connection** -- Ensure the dashboard has an active WebSocket connection (look for the connection indicator)
2. **Refresh the page** -- If the WebSocket disconnected, refreshing re-establishes the connection
3. **Messages are still saved** -- Even without real-time delivery, all messages are persisted and available through polling

### Messages arrive twice in the dashboard

This can happen briefly due to receiving the same message via both the API response and WebSocket. The dashboard deduplicates by message ID -- if duplicates persist, try refreshing the page.

## Connection Issues

### Dashboard shows 401 Unauthorized

**Solutions:**

1. **Session expired** -- Log out and log back in
2. **Multiple tabs** -- If you logged out in one tab, other tabs may show 401 until refreshed

### Skills not recognized

**Symptom:** Claude Code does not recognize `/gxv:` commands.

**Solutions:**

1. **Install gxv-skills** -- Run `curl -fsSL skills.golemxv.com | bash`
2. **Restart Claude Code** -- New skills are only loaded on restart
3. **Update skills** -- Run `/gxv:update` to get the latest version

## Getting Help

If your issue is not covered here:

1. Check the [FAQ](/help/faq) for common questions
2. Contact support through the GolemXV dashboard
3. Visit the [GolemXV community](https://golemxv.com/community) for discussions

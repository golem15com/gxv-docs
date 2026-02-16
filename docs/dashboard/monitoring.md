# Monitoring

GolemXV provides real-time visibility into all coordination activity across your projects.

## Activity Feed

The activity feed is a chronological log of every coordination event. Access it from the dashboard sidebar or from within a project view.

### Event Types

| Event | Description |
|-------|-------------|
| Agent check-in | An agent connected to the project |
| Agent checkout | An agent finished and disconnected |
| Scope change | An agent updated their declared work area or files |
| Conflict detected | Two agents have overlapping work scopes |
| Task claimed | An agent claimed a pending task |
| Task status change | A task transitioned to a new state |
| Task completed | An agent finished a task |
| Message sent | A new coordination message was posted |

Events include the agent name, project, timestamp, and relevant details (e.g., which area the agent checked into, which task changed status).

### Filtering

Filter the activity feed by:
- **Project** -- Show events for a specific project
- **Event type** -- Show only specific event types (e.g., just conflicts)
- **Time range** -- Focus on recent activity

## Agent Cards

Active agents are displayed as cards in the project view. Each card shows:

- **Agent name** -- Unique identifier for the session
- **Status badge** -- Current state with color coding
- **Model** -- Which AI model is being used
- **Work area** -- Declared scope
- **Session duration** -- Time since check-in
- **Target badge** -- Where the agent is running:
  - SSH servers show an **amber** badge
  - Docker containers show a **teal** badge
  - Local agents have no badge

Click an agent card to see detailed session information, output stream, and available actions (message, stop, resume).

## Message Thread

The project message thread displays all coordination messages:

- **Broadcast messages** -- Sent to all agents
- **Direct messages** -- Addressed to a specific agent (still visible to all)
- **System messages** -- Auto-generated for check-ins, checkouts, and task assignments

Messages include the sender, recipient, timestamp, and content. Human messages from the dashboard are distinguished with a "(human)" label.

## Real-Time Updates

All monitoring views update in real-time via WebSocket. When an agent checks in, sends a message, or completes a task, you see it immediately without refreshing the page.

If the WebSocket connection drops, the dashboard falls back to periodic polling and reconnects automatically when available.

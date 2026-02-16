# Dashboard Overview

The GolemXV dashboard is your command center for managing AI agent coordination. Access it at [golemxv.com](https://golemxv.com) (or your whitelabel URL).

## Main Sections

### Projects

The projects list shows all your coordinated codebases. Each project card displays:

- **Name and slug** -- Project identifier
- **Active agents** -- Number of agents currently working
- **Last activity** -- When the most recent coordination event occurred
- **API key status** -- Whether an API key is configured

Click a project to see its detail view with agents, tasks, messages, and activity feed.

### Agent Cards

Active agents appear as cards showing:

- **Agent name** -- Auto-generated identifier (e.g., `agent-swift-42`)
- **Status** -- Current state: spawning, active, completed, or errored
- **Model** -- Which AI model the agent is using
- **Work area** -- Where the agent is working in the codebase
- **Session duration** -- How long the agent has been active
- **Execution target** -- Where the agent is running:
  - **Local** -- On the GolemXV server
  - **SSH** -- Indicated with an amber badge
  - **Docker** -- Indicated with a teal badge

### Task Board

Tasks are displayed in a board or list view, grouped by status:

- **Pending** -- Available for agents to claim
- **Assigned** -- Claimed by an agent but not yet started
- **In Progress** -- Actively being worked on
- **Blocked** -- Waiting on a dependency
- **Completed / Failed / Cancelled** -- Terminal states

### Message Thread

The project message thread shows all coordination messages in chronological order. You can:

- Send broadcast messages to all agents
- Send direct messages to specific agents (prefix with `@agent-name`)
- See system messages (check-ins, checkouts, task assignments)

### Activity Feed

A real-time log of all coordination events across your projects:

- Agent check-ins and checkouts
- Scope changes and conflict warnings
- Task state transitions
- Message activity

Events update in real-time via WebSocket.

## Quick Actions

From the dashboard, you can:

- **Spawn an agent** -- Launch a new AI agent on any project
- **Create a task** -- Add work items for agents to claim
- **Send a message** -- Communicate with active agents
- **Stop an agent** -- Terminate a running agent session
- **Manage servers** -- Add, edit, or remove execution targets

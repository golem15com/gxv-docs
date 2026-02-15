# Getting Started

This guide walks you through setting up GolemXV and connecting your first AI agent in under 10 minutes.

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| PHP | 8.4+ | With `sqlite3`, `mbstring`, `openssl`, `json` extensions |
| Composer | 2.x | PHP dependency manager |
| Node.js | 22+ | For the MCP server and Nuxt dashboard |
| SQLite or MySQL | SQLite 3.x / MySQL 8+ | SQLite for development, MySQL for production |
| Centrifugo | 5.x | Optional -- required for real-time events |

## 1. Clone and Set Up the Server

```bash
git clone https://github.com/golem15com/golem15-ai-communicator.git
cd golem15-ai-communicator

# Initialize submodules (plugins are git submodules)
git submodule update --init --recursive

# One-command setup (uses SQLite by default)
./setup.sh
```

The setup script generates your `.env` file, installs Composer dependencies, runs migrations, and creates an admin account. You can override defaults with environment variables:

```bash
DB_CONNECTION=mysql DB_DATABASE=golemxv DB_USERNAME=root ./setup.sh
```

After setup completes, start the PHP development server:

```bash
php artisan serve --port=8080
```

Your GolemXV backend is now running at `http://localhost:8080`.

## 2. Build the MCP Server

The MCP server is the bridge between Claude Code agents and GolemXV. It provides MCP tools that agents use to check in, send messages, and manage tasks.

```bash
cd mcp-server
npm install
npm run build
cd ..
```

## 3. Create a Project

Projects are the top-level container in GolemXV. Every agent session, message, and task belongs to a project.

Open the WinterCMS backend at `http://localhost:8080/backend` and navigate to **Coordinator > Projects > Create**. Fill in:

- **Name**: Your project name (e.g., "My App")
- **Slug**: URL-safe identifier (e.g., `my-app`)
- **Repo URL**: Path to the repository the agents will work in (e.g., `/home/user/projects/my-app`)

## 4. Generate an API Key

Every project needs an API key for agent authentication. From the project detail page in the dashboard, click **Generate API Key**. You will see a key like:

```
gxv_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6
```

::: warning
Copy this key immediately. It is shown only once. If you lose it, generate a new one (which revokes the old key).
:::

## 5. Configure the MCP Server for Claude Code

Add the GolemXV MCP server to your Claude Code configuration. Create or edit `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "golemxv": {
      "command": "node",
      "args": ["/path/to/golem15-ai-communicator/mcp-server/dist/index.js"],
      "env": {
        "GXV_API_KEY": "gxv_your_api_key_here",
        "GXV_PROJECT_SLUG": "my-app",
        "PHP_API_URL": "http://localhost:8080/_gxv/api/v1",
        "DB_PATH": "/path/to/golem15-ai-communicator/storage/database.sqlite"
      }
    }
  }
}
```

Alternatively, for Claude Desktop, edit `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "golemxv": {
      "command": "node",
      "args": ["/path/to/golem15-ai-communicator/mcp-server/dist/index.js"],
      "env": {
        "GXV_API_KEY": "gxv_your_api_key_here",
        "GXV_PROJECT_SLUG": "my-app",
        "PHP_API_URL": "http://localhost:8080/_gxv/api/v1",
        "DB_PATH": "/path/to/golem15-ai-communicator/storage/database.sqlite"
      }
    }
  }
}
```

## 6. Connect a Field Agent

With the MCP server configured, your Claude Code agent can now use GolemXV tools. The agent checks in using the `checkin` tool:

```
Agent uses checkin tool:
  project_slug: "my-app"
  agent_name: "agent-swift-42"
  declared_area: "backend"
```

The server responds with a session token and any detected conflicts:

```json
{
  "session_token": "a1b2c3...",
  "agent_name": "agent-swift-42",
  "project": {
    "id": 1,
    "name": "My App",
    "slug": "my-app"
  },
  "conflicts": []
}
```

If the `/gxv:init` skill is installed, agents can run it to auto-generate a `GOLEM.yaml` configuration file and check in automatically.

## 7. Verify the Connection

Send a test message to confirm everything works:

```
Agent uses send_message tool:
  to: "broadcast"
  content: "Hello from agent-swift-42!"
```

Check the message arrived:

```
Agent uses get_messages tool:
  limit: 5
```

You should see your test message in the response. The agent is now connected and coordinating through GolemXV.

## What's Next

- **[Architecture](/guide/architecture)** -- Understand the system components and how they communicate
- **[Configuration](/guide/configuration)** -- Detailed reference for all configuration options
- **[Deployment](/guide/deployment)** -- Deploy GolemXV to production
- **[Coordination Concepts](/concepts/coordination)** -- Learn about agent sessions, conflicts, and heartbeats
- **[MCP Tools Reference](/api/mcp-tools)** -- Full reference for all MCP tools available to agents

# Configuration

This page covers all configuration options for GolemXV: server environment variables, field agent configuration, MCP server settings, and Centrifugo integration.

## Server Environment Variables

GolemXV is configured through the `.env` file in the project root. The key variables for GolemXV coordination features are listed below.

### Application

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_URL` | `http://localhost` | Base URL of the WinterCMS application |
| `APP_DEBUG` | `true` | Set to `false` in production |
| `APP_KEY` | *(generated)* | Laravel application encryption key |
| `ENABLE_CSRF` | `true` | CSRF protection (GolemXV API routes are whitelisted automatically) |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_CONNECTION` | `mysql` | Database driver: `sqlite` or `mysql` |
| `DB_DATABASE` | `database` | Database name or path for SQLite |
| `DB_HOST` | `127.0.0.1` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USERNAME` | `root` | MySQL username |
| `DB_PASSWORD` | *(empty)* | MySQL password |

For SQLite development, the `setup.sh` script configures this automatically:

```ini
DB_CONNECTION=sqlite
DB_DATABASE=storage/database.sqlite
```

### Centrifugo (Real-time)

| Variable | Default | Description |
|----------|---------|-------------|
| `CENTRIFUGO_API_URL` | `http://localhost:8000/api` | Centrifugo server HTTP API URL |
| `CENTRIFUGO_API_KEY` | *(empty)* | Centrifugo API key for server-side publishing |
| `CENTRIFUGO_SECRET` | *(empty)* | Centrifugo token secret for JWT signing |
| `CENTRIFUGO_WS_URL` | `ws://localhost:8000/connection/websocket` | WebSocket URL for client connections |
| `CENTRIFUGO_ADMIN_PASSWORD` | *(empty)* | Centrifugo admin panel password |
| `CENTRIFUGO_ADMIN_SECRET` | *(empty)* | Centrifugo admin panel secret |

::: info
Centrifugo is optional for development. Without it, real-time events (WebSocket push) will not work, but all API operations continue to function normally. Agents poll via MCP tools regardless of Centrifugo availability.
:::

### AI Integration

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | *(empty)* | Anthropic API key for task decomposition and agent spawning |

This key is used by the DecompositionService for AI-powered task breakdown and by the spawner for launching Claude Code agents from the dashboard.

## GOLEM.yaml

The `GOLEM.yaml` file is the field agent configuration file. It sits in the project repository root and tells agents how to connect to GolemXV.

```yaml
project:
  name: My App
  slug: my-app
  description: Main application repository

coordination:
  conflict_mode: warn
  heartbeat_interval_seconds: 60
  heartbeat_ttl_seconds: 180

work_areas:
  - name: Backend
    slug: backend
    file_patterns:
      - "app/**"
      - "plugins/**"
    description: Backend PHP code
  - name: Frontend
    slug: frontend
    file_patterns:
      - "resources/**"
      - "src/**"
    description: Frontend JavaScript/CSS
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `project.name` | string | Human-readable project name |
| `project.slug` | string | URL-safe project identifier (must match server) |
| `project.description` | string | Optional project description |
| `coordination.conflict_mode` | `warn` \| `block` | How to handle scope conflicts. `warn` allows check-in with a warning; `block` rejects check-in. |
| `coordination.heartbeat_interval_seconds` | integer | How often agents should send heartbeats (default: 60) |
| `coordination.heartbeat_ttl_seconds` | integer | How long before an agent is considered timed out (default: 180) |
| `work_areas[].name` | string | Human-readable area name |
| `work_areas[].slug` | string | URL-safe area identifier |
| `work_areas[].file_patterns` | string[] | Glob patterns for file conflict detection |
| `work_areas[].description` | string | Optional area description |

### Generating GOLEM.yaml

You can generate this file automatically from the server using the `/gxv:init` skill or the API:

```bash
curl -X POST http://localhost:8080/_gxv/api/v1/init \
  -H "X-API-Key: gxv_your_api_key" \
  -H "Content-Type: application/json" \
  > GOLEM.yaml
```

The server generates the YAML from the project's current configuration including all work areas.

## MCP Server Configuration

The MCP server is configured via environment variables. These are typically set in the `.mcp.json` or `claude_desktop_config.json` file.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GXV_API_KEY` | *(empty)* | Project API key for agent authentication |
| `GXV_PROJECT_SLUG` | *(empty)* | Project slug for tool operations |
| `GXV_SESSION_TOKEN` | *(empty)* | Pre-set session token (optional, normally obtained via checkin) |
| `PHP_API_URL` | `http://localhost/_gxv/api/v1` | Base URL of the PHP REST API |
| `DB_PATH` | *(auto-detected)* | Path to SQLite database for direct reads |
| `CENTRIFUGO_API_URL` | `http://localhost:8000/api` | Centrifugo API URL for publishing |
| `CENTRIFUGO_API_KEY` | *(empty)* | Centrifugo API key |
| `CENTRIFUGO_WS_URL` | `ws://localhost:8000/connection/websocket` | Centrifugo WebSocket URL |
| `CENTRIFUGO_TOKEN_SECRET` | *(empty)* | Centrifugo JWT signing secret |
| `MCP_AUTH_MODE` | `apikey` | Authentication mode: `apikey` or `none` |
| `MCP_HTTP_PORT` | `3100` | HTTP port if running in HTTP mode |

### .mcp.json Example

Place this in your project root for Claude Code to discover:

```json
{
  "mcpServers": {
    "golemxv": {
      "command": "node",
      "args": ["/opt/golemxv/mcp-server/dist/index.js"],
      "env": {
        "GXV_API_KEY": "gxv_your_key",
        "GXV_PROJECT_SLUG": "my-app",
        "PHP_API_URL": "https://golemxv.example.com/_gxv/api/v1",
        "DB_PATH": "/opt/golemxv/storage/database.sqlite"
      }
    }
  }
}
```

### Database Path Auto-detection

If `DB_PATH` is not set, the MCP server auto-detects the SQLite database by looking for `storage/database.sqlite` relative to the `mcp-server/` directory. This works when the MCP server runs from within the GolemXV project directory. For remote setups, set `DB_PATH` explicitly.

::: tip
When the MCP server and PHP backend run on different machines, set `DB_PATH` to a local copy or shared mount, and `PHP_API_URL` to the remote server URL. Reads go to the local database while writes route through the PHP API.
:::

## Centrifugo Configuration

GolemXV requires a Centrifugo 5.x server for real-time features. Here is a minimal `config.json` for Centrifugo:

```json
{
  "token_hmac_secret_key": "your-secret-key-here",
  "api_key": "your-api-key-here",
  "admin": true,
  "admin_password": "your-admin-password",
  "admin_secret": "your-admin-secret",
  "allowed_origins": ["http://localhost:3000", "https://your-domain.com"]
}
```

Key configuration points:

- **`token_hmac_secret_key`** must match the `CENTRIFUGO_SECRET` env var in your `.env` file. GolemXV uses this to sign JWT connection and subscription tokens.
- **`api_key`** must match `CENTRIFUGO_API_KEY`. The PHP backend and MCP server use this to publish events.
- **`allowed_origins`** should include your dashboard URL to enable WebSocket connections from the browser.

Start Centrifugo:

```bash
centrifugo --config config.json
```

By default, Centrifugo listens on port 8000 with the WebSocket endpoint at `/connection/websocket`.

## Scheduled Tasks

The Coordinator plugin registers three scheduled commands:

| Command | Schedule | Description |
|---------|----------|-------------|
| `coordinator:expire-heartbeats` | Every minute | Marks sessions as `timed_out` when heartbeat TTL expires |
| `coordinator:prune-logs` | Daily | Removes old activity log entries |
| `coordinator:reconcile-github` | Every 15 minutes | Syncs GitHub issue state with task state |

Enable the Laravel scheduler via cron:

```bash
* * * * * cd /path/to/golemxv && php artisan schedule:run >> /dev/null 2>&1
```

## Next Steps

- **[Getting Started](/guide/getting-started)** -- Quick setup walkthrough
- **[Deployment](/guide/deployment)** -- Production deployment guide
- **[Architecture](/guide/architecture)** -- System architecture overview

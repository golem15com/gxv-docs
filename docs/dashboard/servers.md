# Server Management

Servers are the machines where GolemXV spawns AI agents. You can connect SSH servers, Docker hosts, or use the built-in local spawner.

## Adding a Server

1. Go to **Dashboard > Servers**
2. Click **Add Server**
3. Choose the server type and enter connection details

### SSH Servers

SSH servers allow GolemXV to remotely spawn agents on any Linux machine.

**Required fields:**
- **Name** -- Descriptive label (e.g., "Dev Server", "Production")
- **Host** -- IP address or hostname
- **Port** -- SSH port (default: 22)
- **SSH Key** -- Private key for authentication

After entering the details, click **Test Connection** to verify GolemXV can reach the server.

### Docker Hosts

Docker hosts run agents in isolated containers with configurable resource limits.

**To enable Docker on a server:**
1. Add or edit a server with SSH access
2. Toggle **Enable Docker Spawning**
3. Configure limits:
   - **Max Containers** -- Maximum concurrent agent containers
   - **Memory Limit** -- Per-container memory (e.g., `2g`)
   - **CPU Limit** -- Per-container CPU shares (e.g., `2.0`)

Docker containers are automatically cleaned up after each agent session ends.

## Execution Targets

When spawning an agent, you choose an execution target:

| Target | Description | Badge Color |
|--------|-------------|-------------|
| **Local** | Runs on the GolemXV server directly | None |
| **SSH** | Runs on a connected SSH server | Amber |
| **Docker** | Runs in a container on a Docker host | Teal |

Each target shows its current health status in the spawn modal.

## Health Monitoring

Server health is displayed with colored status indicators:

| Status | Indicator | Meaning |
|--------|-----------|---------|
| Healthy | Green dot | Server is reachable, resources available |
| Warning | Yellow dot | Server reachable but has warnings (high load, low disk) |
| Error | Red dot | Server unreachable or critical issues |

Health checks run automatically. Click **Test Connection** to trigger a manual check.

## Managing Servers

- **Edit** -- Update connection details or resource limits
- **Test Connection** -- Verify connectivity and check health
- **Remove** -- Delete a server (agents currently running on it are not affected)

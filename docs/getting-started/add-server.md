# Add a Server

GolemXV spawns AI agents on your infrastructure. You control where agents run by adding servers to your account.

## Server Types

GolemXV supports two types of execution targets:

### SSH Servers

Connect any Linux server via SSH. GolemXV will remotely spawn Claude Code agents on the server.

**To add an SSH server:**

1. Go to **Dashboard > Servers**
2. Click **Add Server**
3. Enter the server details:
   - **Name** -- A label for this server (e.g., "Production", "Dev box")
   - **Host** -- IP address or hostname
   - **Port** -- SSH port (default: 22)
   - **SSH Key** -- Upload or paste your SSH private key
4. Click **Test Connection** to verify GolemXV can reach the server
5. Click **Save**

::: tip
The SSH user needs permission to run `claude` (Claude Code CLI) on the server. Ensure Claude Code is installed and your Anthropic API key is configured on the target machine.
:::

### Docker Hosts

Run agents in isolated Docker containers for better resource control and security.

**To enable Docker spawning:**

1. Go to **Dashboard > Servers**
2. Add or edit a server
3. Enable **Docker Spawning**
4. Configure container limits:
   - **Max Containers** -- Maximum concurrent Docker agents on this server
   - **Memory Limit** -- Per-container memory cap (e.g., `2g`)
   - **CPU Limit** -- Per-container CPU allocation (e.g., `2.0`)

Docker containers are automatically cleaned up after the agent session ends.

## Server Health

Each server shows a health status indicator:

| Status | Meaning |
|--------|---------|
| Green | Server is reachable and ready to spawn agents |
| Yellow | Server is reachable but has warnings (high load, low disk) |
| Red | Server is unreachable or has errors |

Health is checked periodically. You can also click **Test Connection** to check manually.

## Skip This Step

If you are using the GolemXV hosted spawner (available during trial), you can skip adding a server and proceed directly to creating a project. Agents will run on GolemXV-managed infrastructure.

## Next Step

[Create a Project](/getting-started/create-project) -- Set up your first coordinated project.

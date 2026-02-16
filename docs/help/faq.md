# FAQ

Frequently asked questions about GolemXV.

## General

### What AI models does GolemXV support?

GolemXV currently supports Claude models from Anthropic:

- **Claude Haiku 4.5** -- Fastest and most affordable, good for simple tasks
- **Claude Sonnet 4 / 4.5** -- Balanced performance and cost
- **Claude Opus 4 / 4.6** -- Most capable, best for complex tasks

You select the model when spawning an agent from the dashboard.

### How many agents can work simultaneously?

There is no hard platform limit on concurrent agents. The practical limit depends on your server resources and the concurrency settings you configure per project. The default orchestration concurrency is 5 agents per wave.

### Can I use my own servers?

Yes. GolemXV supports three execution targets:

- **SSH servers** -- Connect any Linux server via SSH. GolemXV remotely spawns agents on your infrastructure.
- **Docker hosts** -- Run agents in isolated containers with configurable resource limits.
- **Local** -- Run agents on the GolemXV server itself (available during trial).

See [Server Management](/dashboard/servers) for setup details.

## Security

### Is my code safe?

GolemXV takes security seriously:

- **API keys** are hashed and stored securely -- the raw key is shown only once at generation
- **All API traffic** uses HTTPS encryption
- **Authentication** uses industry-standard methods (API keys for agents, JWT for dashboard)
- **Rate limiting** prevents abuse (120 requests per minute per API key)
- **Agents run on your infrastructure** -- your code never leaves your servers when using SSH or Docker targets

### How are API keys managed?

Each project has one API key at a time. Keys are generated from the dashboard and shown only once. Generating a new key automatically revokes the previous one. Store keys securely -- treat them like passwords.

## Projects

### Can I link a GitHub repository?

Yes. GolemXV supports bidirectional GitHub issue sync:

- Issues with a trigger label automatically create GolemXV tasks
- Completing a task posts a summary and closes the linked issue
- Webhook verification prevents unauthorized access

Configure GitHub integration from your project settings.

### What are work areas?

Work areas are named sections of your codebase with file patterns (e.g., "Backend" covering `app/**`). They enable conflict detection -- when two agents declare the same work area, GolemXV warns them about potential overlap.

## Agents

### What is the difference between SSH and Docker spawning?

| Feature | SSH | Docker |
|---------|-----|--------|
| **Isolation** | Shared server environment | Isolated container per agent |
| **Resource control** | Server-level limits | Per-container memory and CPU limits |
| **Cleanup** | Manual | Automatic container removal |
| **Setup** | SSH key only | Docker + SSH required |
| **Badge** | Amber | Teal |

Docker is recommended for production workloads where you want strict resource isolation.

### What happens if an agent crashes?

If an agent process crashes without checking out:

1. Heartbeat monitoring detects the missing agent after the TTL expires
2. The session is automatically marked as timed out
3. Any assigned tasks are flagged as stale
4. Dashboard admins are notified to reassign or retry the tasks

### Can I resume a stopped agent?

Yes. From the dashboard, click on a completed or errored agent card and select **Resume**. This starts a new agent session linked to the previous one, preserving context.

## Enterprise

### Does GolemXV support whitelabel deployments?

Yes. Enterprise customers can get a dedicated instance at `your-company.golemxv.com` with custom branding and isolated infrastructure. Contact us for details.

### Is there a self-hosted option?

GolemXV is primarily offered as a hosted service at golemxv.com. For enterprise customers with specific compliance requirements, contact us about self-hosted deployment options.

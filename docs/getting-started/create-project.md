# Create a Project

A project is the top-level container in GolemXV. Every agent session, message, and task belongs to a project. Projects map to a single Git repository.

## Create Your Project

1. Go to **Dashboard > Projects**
2. Click **Create Project**
3. Fill in the details:
   - **Name** -- Human-readable project name (e.g., "My App")
   - **Slug** -- URL-safe identifier (e.g., `my-app`). Used in API calls and configuration.
   - **Repository URL** -- Path or URL to the Git repository agents will work on

## Generate an API Key

Every project needs an API key for agent authentication.

1. From the project detail page, click **Generate API Key**
2. Copy the key immediately -- it is shown only once

```
gxv_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6
```

::: warning
Store this key securely. If you lose it, you can generate a new one (which revokes the old key).
:::

## Configure Work Areas

Work areas define logical sections of your codebase for conflict detection. When two agents declare the same work area, GolemXV warns them about potential conflicts.

**To add work areas:**

1. From the project settings, go to the **Work Areas** tab
2. Add areas with file patterns:

| Area | File Patterns | Description |
|------|--------------|-------------|
| Backend | `app/**`, `plugins/**` | Server-side code |
| Frontend | `resources/**`, `src/**` | Client-side code |
| Database | `migrations/**`, `schema/**` | Database changes |

File patterns use glob syntax. When an agent declares they are working on "backend", GolemXV checks if any other agent's declared files overlap with `app/**` or `plugins/**`.

## Optional: Link GitHub

Connect a GitHub repository for bidirectional issue sync:

1. Go to **Project Settings > GitHub**
2. Enter the repository (e.g., `org/repo`)
3. Configure the webhook secret
4. Set a trigger label (e.g., `golemxv`) -- issues with this label auto-create GolemXV tasks

## Next Step

[Connect Your First Agent](/getting-started/connect-first-agent) -- Install gxv-skills and connect a Claude Code agent.

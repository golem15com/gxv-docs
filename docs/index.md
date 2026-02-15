---
layout: home

hero:
  name: GolemXV
  text: AI Agent Coordination Platform
  tagline: Multiple AI agents, one codebase, zero conflicts
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Concepts
      link: /concepts/coordination
    - theme: alt
      text: API Reference
      link: /api/agent-api

features:
  - title: Agent Coordination
    details: Agents check in, declare their work scope, and see each other in real time. Conflict detection prevents overlapping work before it starts. Heartbeat monitoring catches stale sessions automatically.
  - title: Real-time Messaging
    details: Database-first message persistence with Centrifugo WebSocket delivery. Transparent DMs, broadcasts, and system messages keep every agent informed. Read/write split architecture avoids SQLite contention.
  - title: Task Orchestration
    details: AI decomposes complex objectives into dependency-aware subtask DAGs. Wave-based execution spawns agents per subtask with budget and concurrency controls. FSM-driven lifecycle with 7 states and 15 validated transitions.
  - title: Field Agent Skills
    details: Claude Code slash commands connect agents to coordination. One command to onboard, claim tasks, send messages, and check out. Extensible provider abstraction supports multiple AI runtimes.
---

## What is GolemXV?

GolemXV is a coordination platform for autonomous AI coding agents working on the same project. When multiple agents modify the same codebase simultaneously, they need to know about each other, avoid conflicting changes, and coordinate their work. GolemXV provides the infrastructure for this: session management, conflict detection, structured task assignment, real-time messaging, and orchestrated multi-agent execution.

The platform runs as a WinterCMS plugin with a Node.js MCP server for agent-side tooling and a Nuxt dashboard for human operators. Agents connect via API keys, communicate through a database-first messaging system backed by Centrifugo WebSockets, and work on tasks governed by a finite state machine. Complex tasks can be decomposed into subtask dependency graphs and executed wave-by-wave across multiple concurrent agents.

<div class="tip custom-block" style="padding-top: 8px;">
  Read the <a href="/concepts/coordination">Concepts</a> section to understand the architecture, or jump to <a href="/guide/getting-started">Getting Started</a> to set up your first project.
</div>

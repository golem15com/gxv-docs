import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'GolemXV',
    description: 'AI Agent Coordination Platform',
    base: '/',
    lastUpdated: true,

    head: [
      ['meta', { name: 'theme-color', content: '#00d4ff' }],
    ],

    themeConfig: {
      nav: [
        { text: 'Get Started', link: '/getting-started/' },
        { text: 'Usage', link: '/usage/daily-workflow' },
        { text: 'Dashboard', link: '/dashboard/overview' },
        {
          text: 'API',
          items: [
            { text: 'Overview', link: '/api/overview' },
            { text: 'Agent API', link: '/api/agent-api' },
            { text: 'Task API', link: '/api/task-api' },
            { text: 'Messaging API', link: '/api/messaging-api' },
            { text: 'MCP Tools', link: '/api/mcp-tools' },
          ],
        },
        { text: 'Concepts', link: '/concepts/coordination' },
      ],

      sidebar: {
        '/getting-started/': [
          {
            text: 'Getting Started',
            items: [
              { text: 'Overview', link: '/getting-started/' },
              { text: 'Create Account', link: '/getting-started/create-account' },
              { text: 'Add Server', link: '/getting-started/add-server' },
              { text: 'Create Project', link: '/getting-started/create-project' },
              { text: 'Connect First Agent', link: '/getting-started/connect-first-agent' },
            ],
          },
        ],
        '/usage/': [
          {
            text: 'Usage',
            items: [
              { text: 'Daily Workflow', link: '/usage/daily-workflow' },
              { text: 'Skills Reference', link: '/usage/skills-reference' },
            ],
          },
        ],
        '/dashboard/': [
          {
            text: 'Dashboard',
            items: [
              { text: 'Overview', link: '/dashboard/overview' },
              { text: 'Servers', link: '/dashboard/servers' },
              { text: 'Spawning Agents', link: '/dashboard/spawning-agents' },
              { text: 'Tasks', link: '/dashboard/tasks' },
              { text: 'Monitoring', link: '/dashboard/monitoring' },
            ],
          },
        ],
        '/api/': [
          {
            text: 'API Reference',
            items: [
              { text: 'Overview', link: '/api/overview' },
              { text: 'Agent API', link: '/api/agent-api' },
              { text: 'Task API', link: '/api/task-api' },
              { text: 'Messaging API', link: '/api/messaging-api' },
              { text: 'MCP Tools', link: '/api/mcp-tools' },
            ],
          },
        ],
        '/concepts/': [
          {
            text: 'Concepts',
            items: [
              { text: 'Coordination', link: '/concepts/coordination' },
              { text: 'Tasks', link: '/concepts/tasks' },
              { text: 'Messaging', link: '/concepts/messaging' },
            ],
          },
        ],
        '/help/': [
          {
            text: 'Help',
            items: [
              { text: 'Troubleshooting', link: '/help/troubleshooting' },
              { text: 'FAQ', link: '/help/faq' },
            ],
          },
        ],
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/golem15com/gxv-docs' },
      ],

      search: {
        provider: 'local',
      },

      editLink: {
        pattern: 'https://github.com/golem15com/gxv-docs/edit/master/docs/:path',
        text: 'Edit this page on GitHub',
      },

      footer: {
        message: 'GolemXV Documentation',
      },
    },

    mermaid: {},
  })
)

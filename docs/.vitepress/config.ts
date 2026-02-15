import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'GolemXV',
    description: 'AI Agent Coordination Platform',
    base: '/',
    lastUpdated: true,

    head: [
      ['meta', { name: 'theme-color', content: '#646cff' }],
    ],

    themeConfig: {
      nav: [
        { text: 'Guide', link: '/guide/getting-started' },
        {
          text: 'API',
          items: [
            { text: 'Agent API', link: '/api/agent-api' },
            { text: 'Messaging API', link: '/api/messaging-api' },
            { text: 'Task API', link: '/api/task-api' },
            { text: 'Dashboard API', link: '/api/dashboard-api' },
            { text: 'MCP Tools', link: '/api/mcp-tools' },
          ],
        },
        { text: 'Concepts', link: '/concepts/coordination' },
      ],

      sidebar: {
        '/guide/': [
          {
            text: 'Guide',
            items: [
              { text: 'Getting Started', link: '/guide/getting-started' },
              { text: 'Architecture', link: '/guide/architecture' },
              { text: 'Configuration', link: '/guide/configuration' },
              { text: 'Deployment', link: '/guide/deployment' },
            ],
          },
        ],
        '/api/': [
          {
            text: 'API Reference',
            items: [
              { text: 'Agent API', link: '/api/agent-api' },
              { text: 'Messaging API', link: '/api/messaging-api' },
              { text: 'Task API', link: '/api/task-api' },
              { text: 'Dashboard API', link: '/api/dashboard-api' },
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
              { text: 'Skills', link: '/concepts/skills' },
            ],
          },
        ],
        '/operations/': [
          {
            text: 'Operations',
            items: [
              { text: 'Security', link: '/operations/security' },
              { text: 'Troubleshooting', link: '/operations/troubleshooting' },
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

import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'env-doctor',
  tagline: 'Analyze and validate environment variables in your codebase',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://WOLFIEEEE.github.io',
  baseUrl: '/env-doctor/',

  organizationName: 'WOLFIEEEE',
  projectName: 'env-doctor',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/WOLFIEEEE/env-doctor/tree/main/docs/',
          routeBasePath: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/env-doctor-social.png',
    metadata: [
      {name: 'twitter:card', content: 'summary_large_image'},
      {name: 'twitter:site', content: '@envdoctor'},
    ],
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'env-doctor',
      logo: {
        alt: 'env-doctor Logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo.svg',
        width: 32,
        height: 32,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/playground',
          label: 'Playground',
          position: 'left',
        },
        {
          to: '/docs/cli-reference',
          label: 'CLI',
          position: 'left',
        },
        {
          to: '/docs/api-reference',
          label: 'API',
          position: 'left',
        },
        {
          href: 'https://github.com/WOLFIEEEE/env-doctor',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/@theaccessibleteam/env-doctor',
          label: 'npm',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started/installation',
            },
            {
              label: 'Configuration',
              to: '/docs/getting-started/configuration',
            },
            {
              label: 'CLI Reference',
              to: '/docs/cli-reference',
            },
          ],
        },
        {
          title: 'Features',
          items: [
            {
              label: 'Missing Variables',
              to: '/docs/features/missing-vars',
            },
            {
              label: 'Secret Detection',
              to: '/docs/features/secret-detection',
            },
            {
              label: 'Framework Support',
              to: '/docs/frameworks/nextjs',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/WOLFIEEEE/env-doctor',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/@theaccessibleteam/env-doctor',
            },
            {
              label: 'Contributing',
              href: 'https://github.com/WOLFIEEEE/env-doctor/blob/main/CONTRIBUTING.md',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} The Accessible Team. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'javascript'],
    },
    announcementBar: {
      id: 'star_us',
      content: '⭐ If you like env-doctor, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/WOLFIEEEE/env-doctor">GitHub</a>!',
      backgroundColor: '#1a1a2e',
      textColor: '#eaeaea',
      isCloseable: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

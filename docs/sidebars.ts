import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/configuration',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      collapsed: false,
      items: [
        'features/missing-vars',
        'features/unused-vars',
        'features/type-checking',
        'features/secret-detection',
        'features/sync-check',
      ],
    },
    {
      type: 'category',
      label: 'Frameworks',
      collapsed: true,
      items: [
        'frameworks/nextjs',
        'frameworks/vite',
        'frameworks/cra',
      ],
    },
    'cli-reference',
    'api-reference',
    'ci-integration',
    {
      type: 'category',
      label: 'Examples',
      collapsed: true,
      items: [
        'examples/basic-usage',
        'examples/monorepo',
        'examples/custom-rules',
      ],
    },
    {
      type: 'category',
      label: 'Help',
      collapsed: false,
      items: [
        'faq',
        'troubleshooting',
      ],
    },
  ],
};

export default sidebars;

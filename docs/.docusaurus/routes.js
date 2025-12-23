import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/env-doctor/markdown-page',
    component: ComponentCreator('/env-doctor/markdown-page', '09c'),
    exact: true
  },
  {
    path: '/env-doctor/docs',
    component: ComponentCreator('/env-doctor/docs', '814'),
    routes: [
      {
        path: '/env-doctor/docs',
        component: ComponentCreator('/env-doctor/docs', '04c'),
        routes: [
          {
            path: '/env-doctor/docs',
            component: ComponentCreator('/env-doctor/docs', '7b5'),
            routes: [
              {
                path: '/env-doctor/docs',
                component: ComponentCreator('/env-doctor/docs', '099'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/api-reference',
                component: ComponentCreator('/env-doctor/docs/api-reference', '9d6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/ci-integration',
                component: ComponentCreator('/env-doctor/docs/ci-integration', '750'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/cli-reference',
                component: ComponentCreator('/env-doctor/docs/cli-reference', '6b6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/examples/basic-usage',
                component: ComponentCreator('/env-doctor/docs/examples/basic-usage', '11c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/examples/custom-rules',
                component: ComponentCreator('/env-doctor/docs/examples/custom-rules', '9c6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/examples/monorepo',
                component: ComponentCreator('/env-doctor/docs/examples/monorepo', 'bd4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/features/missing-vars',
                component: ComponentCreator('/env-doctor/docs/features/missing-vars', '8e2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/features/secret-detection',
                component: ComponentCreator('/env-doctor/docs/features/secret-detection', 'e2a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/features/sync-check',
                component: ComponentCreator('/env-doctor/docs/features/sync-check', 'a44'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/features/type-checking',
                component: ComponentCreator('/env-doctor/docs/features/type-checking', '22d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/features/unused-vars',
                component: ComponentCreator('/env-doctor/docs/features/unused-vars', '784'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/frameworks/cra',
                component: ComponentCreator('/env-doctor/docs/frameworks/cra', 'bf2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/frameworks/nextjs',
                component: ComponentCreator('/env-doctor/docs/frameworks/nextjs', '509'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/frameworks/vite',
                component: ComponentCreator('/env-doctor/docs/frameworks/vite', '0f6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/getting-started/configuration',
                component: ComponentCreator('/env-doctor/docs/getting-started/configuration', '417'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/getting-started/installation',
                component: ComponentCreator('/env-doctor/docs/getting-started/installation', 'e24'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/env-doctor/docs/getting-started/quick-start',
                component: ComponentCreator('/env-doctor/docs/getting-started/quick-start', 'd3a'),
                exact: true,
                sidebar: "docsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/env-doctor/',
    component: ComponentCreator('/env-doctor/', '570'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];

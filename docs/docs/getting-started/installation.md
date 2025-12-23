---
sidebar_position: 1
---

# Installation

env-doctor can be installed globally or run directly with npx.

## Using npx (Recommended)

The easiest way to use env-doctor is with npx - no installation required:

```bash
npx env-doctor
```

This always uses the latest version.

## Global Installation

Install globally to use `env-doctor` command anywhere:

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="npm" label="npm" default>

```bash
npm install -g env-doctor
```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

```bash
pnpm add -g env-doctor
```

  </TabItem>
  <TabItem value="yarn" label="yarn">

```bash
yarn global add env-doctor
```

  </TabItem>
</Tabs>

Then run:

```bash
env-doctor
```

## Project Installation

Install as a dev dependency in your project:

<Tabs>
  <TabItem value="npm" label="npm" default>

```bash
npm install -D env-doctor
```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

```bash
pnpm add -D env-doctor
```

  </TabItem>
  <TabItem value="yarn" label="yarn">

```bash
yarn add -D env-doctor
```

  </TabItem>
</Tabs>

Add to your `package.json` scripts:

```json
{
  "scripts": {
    "env:check": "env-doctor",
    "env:fix": "env-doctor fix"
  }
}
```

## Requirements

- **Node.js 20** or later
- **Git** (optional, for history scanning)

## Verifying Installation

Check that env-doctor is installed correctly:

```bash
env-doctor --version
# env-doctor v1.0.0
```

## Next Steps

- [Quick Start](/docs/getting-started/quick-start) - Run your first scan
- [Configuration](/docs/getting-started/configuration) - Customize behavior


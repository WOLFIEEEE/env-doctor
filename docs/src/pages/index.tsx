import React, { useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import TerminalDemo from '@site/src/components/TerminalDemo';
import {
  SearchIcon,
  TrashIcon,
  LockIcon,
  BarChartIcon,
  RefreshIcon,
  ZapIcon,
  ScanIcon,
  CodeIcon,
  FileSearchIcon,
  SettingsIcon,
} from '@site/src/components/Icons';

import styles from './index.module.css';

const cursorPrompt = `Add env-doctor to this project to analyze and validate environment variables.

Please do the following:

1. Install the package:
   npm install -D @theaccessibleteam/env-doctor

2. Create a configuration file \`env-doctor.config.js\` in the project root with these settings:
   - Detect the framework being used (Next.js, Vite, CRA, or Node.js)
   - Set appropriate file patterns to scan
   - Configure .env file paths
   - Enable all analyzers: missing, unused, secrets, type-mismatch, sync-check

3. Add npm scripts to package.json:
   - "env:check": "env-doctor"
   - "env:check:ci": "env-doctor --ci"
   - "env:fix": "env-doctor --fix"

4. If there's a CI/CD pipeline (GitHub Actions), add an env-doctor check step

5. Create or update .env.example with placeholder values for all environment variables found in the codebase

6. Run env-doctor and fix any issues found

The package documentation is at: https://wolfieeee.github.io/env-doctor/`;

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const [installCopied, setInstallCopied] = useState(false);
  const installCommand = 'npx @theaccessibleteam/env-doctor';

  const handleInstallCopy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setInstallCopied(true);
      setTimeout(() => setInstallCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroContent}>
          <Heading as="h1" className={styles.heroTitle}>
            {siteConfig.title}
          </Heading>
          <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
          <div className={styles.badges}>
            <a href="https://www.npmjs.com/package/@theaccessibleteam/env-doctor" target="_blank" rel="noopener noreferrer">
              <img src="https://img.shields.io/npm/dm/@theaccessibleteam/env-doctor?style=flat-square&color=10b981" alt="npm downloads" />
            </a>
            <a href="https://github.com/WOLFIEEEE/env-doctor" target="_blank" rel="noopener noreferrer">
              <img src="https://img.shields.io/github/stars/WOLFIEEEE/env-doctor?style=flat-square&color=10b981" alt="GitHub stars" />
            </a>
            <a href="https://www.npmjs.com/package/@theaccessibleteam/env-doctor" target="_blank" rel="noopener noreferrer">
              <img src="https://img.shields.io/npm/v/@theaccessibleteam/env-doctor?style=flat-square&color=10b981" alt="npm version" />
            </a>
          </div>
          <p className={styles.heroDescription}>
            The complete environment variable management platform. Static analysis, runtime validation, 
            multi-environment support, and IDE integration for JavaScript/TypeScript projects.
          </p>
          <div className={styles.buttons}>
            <Link
              className="button button--secondary button--lg"
              to="/docs/getting-started/installation">
              Get Started
            </Link>
            <Link
              className="button button--outline button--lg"
              to="/docs/getting-started/installation">
              Documentation
            </Link>
          </div>
          <div className={styles.installCommand} onClick={handleInstallCopy} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleInstallCopy()}>
            <code>{installCommand}</code>
            <button 
              className={`${styles.installCopyBtn} ${installCopied ? styles.copied : ''}`}
              onClick={(e) => { e.stopPropagation(); handleInstallCopy(); }}
              aria-label={installCopied ? 'Copied!' : 'Copy command'}
            >
              {installCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

const coreFeatures = [
  {
    title: 'Missing Variable Detection',
    description: 'Find environment variables used in your code that aren\'t defined in your .env files.',
    icon: <SearchIcon size={24} />,
  },
  {
    title: 'Unused Variable Detection',
    description: 'Identify variables defined in .env but never referenced in your codebase.',
    icon: <TrashIcon size={24} />,
  },
  {
    title: 'Secret Detection',
    description: 'Detect exposed API keys, tokens, and credentials with built-in patterns for 20+ services.',
    icon: <LockIcon size={24} />,
  },
  {
    title: 'Type Validation',
    description: 'Catch type mismatches like using parseInt() on non-numeric values.',
    icon: <BarChartIcon size={24} />,
  },
  {
    title: 'Smart Sync',
    description: 'Auto-generate and maintain .env.example with types, descriptions, and grouping.',
    icon: <RefreshIcon size={24} />,
  },
  {
    title: 'Framework Support',
    description: 'Auto-detect Next.js, Vite, and CRA with framework-specific rules.',
    icon: <ZapIcon size={24} />,
  },
];

const advancedFeatures = [
  {
    title: 'Runtime Validation',
    description: 'Type-safe env vars with automatic coercion, validation at startup, and full TypeScript inference.',
    icon: <CodeIcon size={24} />,
    link: '/docs/features/runtime-validation',
  },
  {
    title: 'Multi-Environment Matrix',
    description: 'Compare dev/staging/production side-by-side. Catch inconsistencies before deployment.',
    icon: <BarChartIcon size={24} />,
    link: '/docs/features/multi-environment',
  },
  {
    title: 'Monorepo Support',
    description: 'npm, yarn, pnpm, Turborepo, Nx. Track shared vars, detect conflicts, visualize dependencies.',
    icon: <FileSearchIcon size={24} />,
    link: '/docs/examples/monorepo',
  },
  {
    title: 'VS Code Extension',
    description: 'Real-time diagnostics, autocomplete, hover info, go-to-definition, and quick fixes.',
    icon: <SettingsIcon size={24} />,
    link: '/docs/features/ide-extension',
  },
];

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link?: string;
}

function FeatureCard({title, description, icon, link}: FeatureProps) {
  const content = (
    <>
      <div className={styles.featureIcon}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </>
  );
  
  if (link) {
    return (
      <Link to={link} className={clsx(styles.featureCard, styles.featureCardLink)}>
        {content}
        <span className={styles.learnMore}>Learn more →</span>
      </Link>
    );
  }
  
  return <div className={styles.featureCard}>{content}</div>;
}

function FeaturesSection() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">Core Features</Heading>
          <p>Static analysis to catch issues before they reach production</p>
        </div>
        <div className={styles.featureGrid}>
          {coreFeatures.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AdvancedFeaturesSection() {
  return (
    <section className={clsx(styles.features, styles.advancedFeatures)}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.newBadge}>New in v1.1</span>
          <Heading as="h2">Advanced Features</Heading>
          <p>Enterprise-grade environment management for modern teams</p>
        </div>
        <div className={styles.featureGrid}>
          {advancedFeatures.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section className={styles.demoSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">See It In Action</Heading>
          <p>Try different scenarios to see how env-doctor catches issues</p>
        </div>
        <div className={styles.demoContainer}>
          <TerminalDemo />
        </div>
        <div className={styles.demoDescription}>
          <div className={styles.demoFeatureGrid}>
            <div className={styles.demoFeatureItem}>
              <span className={styles.demoFeatureIcon}><ScanIcon size={20} /></span>
              <span>AST-based scanning for accurate detection</span>
            </div>
            <div className={styles.demoFeatureItem}>
              <span className={styles.demoFeatureIcon}><ZapIcon size={20} /></span>
              <span>Framework-aware (Next.js, Vite, CRA)</span>
            </div>
            <div className={styles.demoFeatureItem}>
              <span className={styles.demoFeatureIcon}><CodeIcon size={20} /></span>
              <span>SARIF output for GitHub Code Scanning</span>
            </div>
            <div className={styles.demoFeatureItem}>
              <span className={styles.demoFeatureIcon}><SettingsIcon size={20} /></span>
              <span>Interactive fix mode</span>
            </div>
          </div>
          <div className={styles.demoCTA}>
            <Link
              className="button button--primary button--lg"
              to="/docs/getting-started/quick-start">
              Quick Start Guide
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function VSCodeExtensionSection() {
  return (
    <section className={styles.vscodeSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.newBadge}>IDE Integration</span>
          <Heading as="h2">VS Code Extension</Heading>
          <p>Get real-time environment variable support directly in your editor</p>
        </div>
        <div className={styles.vscodeGrid}>
          <div className={styles.vscodeFeatureList}>
            <div className={styles.vscodeFeature}>
              <div className={styles.vscodeFeatureIcon}>🔴</div>
              <div className={styles.vscodeFeatureContent}>
                <h4>Live Diagnostics</h4>
                <p>See errors and warnings as you type, without running the CLI</p>
              </div>
            </div>
            <div className={styles.vscodeFeature}>
              <div className={styles.vscodeFeatureIcon}>💡</div>
              <div className={styles.vscodeFeatureContent}>
                <h4>Smart Autocomplete</h4>
                <p>Get suggestions when typing <code>process.env.</code> with values and types</p>
              </div>
            </div>
            <div className={styles.vscodeFeature}>
              <div className={styles.vscodeFeatureIcon}>📖</div>
              <div className={styles.vscodeFeatureContent}>
                <h4>Hover Information</h4>
                <p>See variable value, type, source file, and usage count on hover</p>
              </div>
            </div>
            <div className={styles.vscodeFeature}>
              <div className={styles.vscodeFeatureIcon}>⚡</div>
              <div className={styles.vscodeFeatureContent}>
                <h4>Quick Fixes</h4>
                <p>Add missing variables to .env with one click, fix typos automatically</p>
              </div>
            </div>
            <div className={styles.vscodeFeature}>
              <div className={styles.vscodeFeatureIcon}>🔗</div>
              <div className={styles.vscodeFeatureContent}>
                <h4>Go to Definition</h4>
                <p>Jump from usage to the definition in your .env file</p>
              </div>
            </div>
          </div>
          <div className={styles.vscodeDemo}>
            <div className={styles.vscodeMockup}>
              <div className={styles.vscodeMockupHeader}>
                <div className={styles.vscodeMockupDots}>
                  <span></span><span></span><span></span>
                </div>
                <span className={styles.vscodeMockupTitle}>src/lib/db.ts - VS Code</span>
              </div>
              <div className={styles.vscodeMockupContent}>
                <pre className={styles.vscodeMockupCode}>{`import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.`}<span className={styles.vscodeAutocomplete}>DATABASE_URL</span>{`
    }
  }
});`}</pre>
                <div className={styles.vscodePopup}>
                  <div className={styles.vscodePopupItem}>
                    <span className={styles.vscodePopupIcon}>$</span>
                    <span className={styles.vscodePopupName}>DATABASE_URL</span>
                    <span className={styles.vscodePopupValue}>postgres://...</span>
                  </div>
                  <div className={styles.vscodePopupItem}>
                    <span className={styles.vscodePopupIcon}>$</span>
                    <span className={styles.vscodePopupName}>DATABASE_POOL_SIZE</span>
                    <span className={styles.vscodePopupValue}>10</span>
                  </div>
                  <div className={styles.vscodePopupItem}>
                    <span className={styles.vscodePopupIcon}>$</span>
                    <span className={styles.vscodePopupName}>DATABASE_SSL</span>
                    <span className={styles.vscodePopupValue}>true</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.vscodeCTA}>
          <a 
            href="https://marketplace.visualstudio.com/items?itemName=theaccessibleteam.env-doctor-vscode"
            className="button button--primary button--lg"
            target="_blank"
            rel="noopener noreferrer"
          >
            Install VS Code Extension
          </a>
          <Link
            className="button button--secondary button--lg"
            to="/docs/features/ide-extension">
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}

function RuntimeValidationSection() {
  return (
    <section className={styles.codeShowcaseSection}>
      <div className="container">
        <div className={styles.codeShowcaseGrid}>
          <div className={styles.codeShowcaseContent}>
            <span className={styles.newBadge}>Runtime Validation</span>
            <Heading as="h2">Type-Safe Environment Variables</Heading>
            <p>
              Stop using <code>process.env</code> directly. Get full TypeScript inference, 
              automatic type coercion, and validation at application startup.
            </p>
            <ul className={styles.benefitsList}>
              <li>✓ Fail fast with clear error messages</li>
              <li>✓ Automatic string → number/boolean conversion</li>
              <li>✓ Full TypeScript type inference</li>
              <li>✓ Framework-specific client/server separation</li>
            </ul>
            <Link
              className="button button--secondary button--lg"
              to="/docs/features/runtime-validation">
              Learn More
            </Link>
          </div>
          <div className={styles.codeShowcaseCode}>
            <pre className={styles.codeBlock}>{`// src/env.ts
import { createEnv } from '@theaccessibleteam/env-doctor/runtime';

export const env = createEnv({
  server: {
    DATABASE_URL: { type: 'url', required: true },
    PORT: { type: 'number', default: 3000 },
  },
  client: {
    NEXT_PUBLIC_API_URL: { type: 'url', required: true },
  },
  framework: 'nextjs',
});

// Fully typed!
console.log(env.PORT);         // number
console.log(env.DATABASE_URL); // string`}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function MatrixSection() {
  return (
    <section className={clsx(styles.codeShowcaseSection, styles.matrixSection)}>
      <div className="container">
        <div className={clsx(styles.codeShowcaseGrid, styles.reverse)}>
          <div className={styles.codeShowcaseContent}>
            <span className={styles.newBadge}>Multi-Environment</span>
            <Heading as="h2">Environment Matrix Comparison</Heading>
            <p>
              Compare environment variables across development, staging, and production. 
              Catch inconsistencies and missing variables before deployment.
            </p>
            <ul className={styles.benefitsList}>
              <li>✓ Side-by-side comparison table</li>
              <li>✓ Environment-specific validation rules</li>
              <li>✓ Interactive fix mode</li>
              <li>✓ Export to JSON, CSV, or HTML</li>
            </ul>
            <Link
              className="button button--secondary button--lg"
              to="/docs/features/multi-environment">
              Learn More
            </Link>
          </div>
          <div className={styles.codeShowcaseCode}>
            <pre className={styles.codeBlock}>{`$ npx env-doctor matrix

Environment Variable Matrix
═══════════════════════════════════════════════════════

Variable           │ dev     │ staging │ prod    │ Status
───────────────────┼─────────┼─────────┼─────────┼────────
DATABASE_URL       │ ✓       │ ✓       │ ✓       │ OK
STRIPE_SECRET_KEY  │ ✓ test  │ ✓ test  │ ✗       │ ERROR
DEBUG_MODE         │ ✓ true  │ ✓ true  │ ✓ true  │ WARN

Summary: 1 error, 1 warning`}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function MonorepoSection() {
  return (
    <section className={styles.codeShowcaseSection}>
      <div className="container">
        <div className={styles.codeShowcaseGrid}>
          <div className={styles.codeShowcaseContent}>
            <span className={styles.newBadge}>Monorepo Support</span>
            <Heading as="h2">Analyze Entire Workspaces</Heading>
            <p>
              Full support for npm, yarn, pnpm workspaces, plus deep integration with 
              Turborepo and Nx. Track shared variables, detect conflicts, and visualize dependencies.
            </p>
            <ul className={styles.benefitsList}>
              <li>✓ Auto-detect workspace configuration</li>
              <li>✓ Track shared variables across packages</li>
              <li>✓ Detect variable conflicts</li>
              <li>✓ Generate dependency graphs</li>
            </ul>
            <Link
              className="button button--secondary button--lg"
              to="/docs/examples/monorepo">
              Learn More
            </Link>
          </div>
          <div className={styles.codeShowcaseCode}>
            <pre className={styles.codeBlock}>{`$ npx env-doctor workspaces

Monorepo Environment Analysis
═══════════════════════════════════════════════════════

📦 @myapp/web (nextjs)
   .env files: .env, .env.local
   ✓ No issues

📦 @myapp/api (node)
   .env files: .env
   ✗ 2 errors: DATABASE_URL, REDIS_URL

📦 @myapp/shared (library)
   ⚠ 1 warning: unused LEGACY_API_KEY

Shared Variables (from root)
───────────────────────────────────────────────────────
DATABASE_URL    │ @myapp/web, @myapp/api
API_SECRET      │ @myapp/api

Summary: 3 packages, 2 errors, 1 warning`}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section className={styles.comparisonSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">Why env-doctor?</Heading>
          <p>The complete solution for environment variable management</p>
        </div>
        <div className={styles.comparisonTable}>
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>env-doctor</th>
                <th>dotenv-linter</th>
                <th>envalid</th>
                <th>t3-env</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Static Analysis</td>
                <td className={styles.check}>✓</td>
                <td className={styles.check}>✓</td>
                <td className={styles.cross}>✗</td>
                <td className={styles.cross}>✗</td>
              </tr>
              <tr>
                <td>Runtime Validation</td>
                <td className={styles.check}>✓</td>
                <td className={styles.cross}>✗</td>
                <td className={styles.check}>✓</td>
                <td className={styles.check}>✓</td>
              </tr>
              <tr>
                <td>TypeScript Types</td>
                <td className={styles.check}>✓</td>
                <td className={styles.cross}>✗</td>
                <td className={styles.check}>✓</td>
                <td className={styles.check}>✓</td>
              </tr>
              <tr>
                <td>VS Code Extension</td>
                <td className={styles.check}>✓</td>
                <td className={styles.cross}>✗</td>
                <td className={styles.cross}>✗</td>
                <td className={styles.cross}>✗</td>
              </tr>
              <tr>
                <td>Multi-Environment</td>
                <td className={styles.check}>✓</td>
                <td className={styles.cross}>✗</td>
                <td className={styles.cross}>✗</td>
                <td className={styles.cross}>✗</td>
              </tr>
              <tr>
                <td>Monorepo Support</td>
                <td className={styles.check}>✓</td>
                <td className={styles.cross}>✗</td>
                <td className={styles.cross}>✗</td>
                <td className={styles.cross}>✗</td>
              </tr>
              <tr>
                <td>Git History Scan</td>
                <td className={styles.check}>✓</td>
                <td className={styles.cross}>✗</td>
                <td className={styles.cross}>✗</td>
                <td className={styles.cross}>✗</td>
              </tr>
              <tr>
                <td>Sync .env.example</td>
                <td className={styles.check}>✓</td>
                <td className={styles.cross}>✗</td>
                <td className={styles.cross}>✗</td>
                <td className={styles.cross}>✗</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={styles.comparisonCTA}>
          <Link
            className="button button--primary button--lg"
            to="/docs/comparison">
            Full Comparison
          </Link>
        </div>
      </div>
    </section>
  );
}

function CISection() {
  return (
    <section className={styles.ciSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">CI/CD Integration</Heading>
          <p>Add env-doctor to your CI pipeline in minutes</p>
        </div>
        <div className={styles.ciExample}>
          <pre className={styles.codeBlock}>{`# .github/workflows/env-check.yml
name: Environment Check

on: [push, pull_request]

jobs:
  env-doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      # Run static analysis
      - run: npx @theaccessibleteam/env-doctor --ci --format sarif > results.sarif
      
      # Validate multi-environment matrix
      - run: npx @theaccessibleteam/env-doctor matrix --ci
      
      # Upload to GitHub Code Scanning
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif`}</pre>
        </div>
        <Link
          className="button button--secondary button--lg"
          to="/docs/ci-integration">
          View CI/CD Guide
        </Link>
      </div>
    </section>
  );
}

function CopyIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
  );
}

function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}

function PromptSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cursorPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <section className={styles.promptSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">Cursor AI Setup</Heading>
          <p>Copy this prompt to instantly set up env-doctor in your project</p>
        </div>
        <div className={styles.promptCard}>
          <div className={styles.promptHeader}>
            <div className={styles.promptHeaderLeft}>
              <span className={styles.promptLabel}>Cursor AI Prompt</span>
              <span className={styles.promptHint}>Paste into Cursor chat</span>
            </div>
            <button 
              className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
              onClick={handleCopy}
              aria-label={copied ? 'Copied!' : 'Copy prompt'}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <pre className={styles.promptCode}>
            <code>{cursorPrompt}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Environment Variable Management Platform`}
      description="The complete environment variable management platform. Static analysis, runtime validation, multi-environment support, and IDE integration for JavaScript/TypeScript.">
      <HomepageHeader />
      <main>
        <FeaturesSection />
        <AdvancedFeaturesSection />
        <DemoSection />
        <VSCodeExtensionSection />
        <RuntimeValidationSection />
        <MatrixSection />
        <MonorepoSection />
        <ComparisonSection />
        <PromptSection />
        <CISection />
      </main>
    </Layout>
  );
}

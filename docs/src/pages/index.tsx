import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import TerminalDemo from '@site/src/components/TerminalDemo';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroContent}>
          <Heading as="h1" className={styles.heroTitle}>
            🩺 {siteConfig.title}
          </Heading>
          <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
          <p className={styles.heroDescription}>
            Detect missing, unused, and misconfigured environment variables before they cause runtime errors.
            Framework-aware scanning for Next.js, Vite, and more.
          </p>
          <div className={styles.buttons}>
            <Link
              className="button button--secondary button--lg"
              to="/docs/getting-started/installation">
              Get Started →
            </Link>
            <Link
              className="button button--outline button--lg"
              to="/docs">
              Learn More
            </Link>
          </div>
          <div className={styles.installCommand}>
            <code>npx @theaccessibleteam/env-doctor</code>
          </div>
        </div>
      </div>
    </header>
  );
}

const features = [
  {
    title: '🔍 Missing Variable Detection',
    description: 'Find environment variables used in your code that aren\'t defined in your .env files.',
  },
  {
    title: '🧹 Unused Variable Detection',
    description: 'Identify variables defined in .env but never referenced in your codebase.',
  },
  {
    title: '🔐 Secret Detection',
    description: 'Detect exposed API keys, tokens, and credentials with built-in patterns for 20+ services.',
  },
  {
    title: '📊 Type Validation',
    description: 'Catch type mismatches like using parseInt() on non-numeric values.',
  },
  {
    title: '🔄 Sync Check',
    description: 'Keep .env and .env.example in sync automatically.',
  },
  {
    title: '⚡ Framework Support',
    description: 'Auto-detect Next.js, Vite, and CRA with framework-specific rules.',
  },
];

function FeatureCard({title, description}: {title: string; description: string}) {
  return (
    <div className={styles.featureCard}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">Features</Heading>
          <p>Everything you need to keep your environment variables healthy</p>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature, idx) => (
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
              <span className={styles.demoFeatureIcon}>🔍</span>
              <span>AST-based scanning for accurate detection</span>
            </div>
            <div className={styles.demoFeatureItem}>
              <span className={styles.demoFeatureIcon}>⚡</span>
              <span>Framework-aware (Next.js, Vite, CRA)</span>
            </div>
            <div className={styles.demoFeatureItem}>
              <span className={styles.demoFeatureIcon}>📊</span>
              <span>SARIF output for GitHub Code Scanning</span>
            </div>
            <div className={styles.demoFeatureItem}>
              <span className={styles.demoFeatureIcon}>🛠️</span>
              <span>Interactive fix mode</span>
            </div>
          </div>
          <div className={styles.demoCTA}>
            <Link
              className="button button--primary button--lg"
              to="/docs/getting-started/quick-start">
              Quick Start Guide →
            </Link>
          </div>
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
      - run: npx @theaccessibleteam/env-doctor --ci --format sarif > results.sarif
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

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Environment Variable Analyzer`}
      description="Analyze and validate environment variables in your codebase. Detect missing, unused, and misconfigured env vars with framework-aware scanning.">
      <HomepageHeader />
      <main>
        <FeaturesSection />
        <DemoSection />
        <CISection />
      </main>
    </Layout>
  );
}

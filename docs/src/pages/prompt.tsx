import React, { useState } from 'react';
import Layout from '@theme/Layout';
import styles from './prompt.module.css';

const quickPrompt = `Add env-doctor to this project to analyze and validate environment variables.

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

const detailedPrompt = `Set up env-doctor in this project with the following requirements:

1. Install @theaccessibleteam/env-doctor as a dev dependency

2. Analyze the project structure and create an appropriate env-doctor.config.js:
   - Detect the framework (Next.js uses NEXT_PUBLIC_*, Vite uses VITE_*, CRA uses REACT_APP_*)
   - Set srcDir to the main source directory
   - Configure envFiles array with all .env* files in the project
   - Set up custom rules if needed for project-specific patterns

3. Configuration should include:
   module.exports = {
     srcDir: './src',
     envFiles: ['.env', '.env.local', '.env.development', '.env.production'],
     framework: 'auto',
     analyzers: {
       missing: true,
       unused: true,
       secrets: true,
       typeMismatch: true,
       syncCheck: true,
     },
     ignore: {
       variables: [],
       files: ['node_modules/**', 'dist/**', 'build/**'],
     },
   };

4. Add these npm scripts:
   - "env:check" - Run env-doctor
   - "env:check:ci" - Run in CI mode with SARIF output
   - "env:fix" - Run with auto-fix enabled

5. If GitHub Actions exists, add env-doctor check to the workflow

6. Create .env.example from detected variables

7. Run the check and report findings`;

const ciPrompt = `Add env-doctor environment variable checking to the CI/CD pipeline.

Create or update GitHub Actions workflow to include:

env-check:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - run: npm ci
    - run: npx @theaccessibleteam/env-doctor --ci --format sarif > env-doctor.sarif
    - uses: github/codeql-action/upload-sarif@v3
      if: always()
      with:
        sarif_file: env-doctor.sarif

Ensure the workflow runs on pull requests and pushes to main.`;

interface PromptCardProps {
  title: string;
  description: string;
  prompt: string;
  variant?: 'primary' | 'secondary';
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

function PromptCard({ title, description, prompt, variant = 'secondary' }: PromptCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`${styles.promptCard} ${variant === 'primary' ? styles.primary : ''}`}>
      <div className={styles.promptHeader}>
        <div>
          <h3 className={styles.promptTitle}>{title}</h3>
          <p className={styles.promptDescription}>{description}</p>
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
        <code>{prompt}</code>
      </pre>
    </div>
  );
}

export default function PromptPage(): JSX.Element {
  return (
    <Layout
      title="Cursor AI Prompt"
      description="Copy this prompt to quickly set up env-doctor in your project using Cursor AI">
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>Cursor AI Prompt</h1>
            <p className={styles.subtitle}>
              Copy and paste these prompts into Cursor AI to automatically set up env-doctor in your project
            </p>
          </header>

          <section className={styles.section}>
            <PromptCard
              title="Quick Setup"
              description="Best for getting started quickly. Handles installation, configuration, and basic setup."
              prompt={quickPrompt}
              variant="primary"
            />
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Additional Prompts</h2>
            <div className={styles.grid}>
              <PromptCard
                title="Detailed Configuration"
                description="For projects needing custom configuration with specific settings."
                prompt={detailedPrompt}
              />
              <PromptCard
                title="CI/CD Integration"
                description="Add env-doctor to your GitHub Actions workflow."
                prompt={ciPrompt}
              />
            </div>
          </section>

          <section className={styles.tips}>
            <h2 className={styles.tipsTitle}>Tips for Best Results</h2>
            <ul className={styles.tipsList}>
              <li>Mention your framework (Next.js, Vite, etc.) for better configuration</li>
              <li>Include context about specific .env files or patterns you use</li>
              <li>Always review the generated configuration before committing</li>
              <li>Run env-doctor after setup to verify everything works</li>
            </ul>
          </section>
        </div>
      </main>
    </Layout>
  );
}


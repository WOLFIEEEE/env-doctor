import React, { useState } from 'react';
import styles from './styles.module.css';

interface DemoScenario {
  id: string;
  title: string;
  icon: string;
  command: string;
  output: string;
}

const scenarios: DemoScenario[] = [
  {
    id: 'missing',
    title: 'Missing Variables',
    icon: '🔍',
    command: 'npx @theaccessibleteam/env-doctor',
    output: `env-doctor v1.0.0

Framework: nextjs
Scanned 42 files, 8 env variables

✗ Missing Variables (2 issues)

  DATABASE_URL
    Variable "DATABASE_URL" is used in code but not defined
    at src/lib/db.ts:5:12

  API_SECRET
    Required variable "API_SECRET" is not defined in any .env file

Summary: 2 errors
Completed in 124ms`
  },
  {
    id: 'unused',
    title: 'Unused Variables',
    icon: '🧹',
    command: 'npx @theaccessibleteam/env-doctor',
    output: `env-doctor v1.0.0

Framework: node
Scanned 28 files, 12 env variables

⚠ Unused Variables (3 issues)

  OLD_API_KEY
    Variable "OLD_API_KEY" is defined in .env but never used in code
    at .env:15

  DEPRECATED_URL
    Variable "DEPRECATED_URL" is defined in .env but never used in code
    at .env:18

  LEGACY_TOKEN
    Variable "LEGACY_TOKEN" is defined in .env but never used in code
    at .env:22

Summary: 3 warnings
Completed in 89ms`
  },
  {
    id: 'secrets',
    title: 'Secret Detection',
    icon: '🔐',
    command: 'npx @theaccessibleteam/env-doctor',
    output: `env-doctor v1.0.0

Framework: node
Scanned 24 files, 6 env variables

✗ Exposed Secrets (2 issues)

  STRIPE_SECRET_KEY (Stripe)
    Variable appears to be a secret - detected as Stripe live secret key
    Consider using a secure vault or removing from version control.
    at .env:8
    Value: sk_li...x7Kp

  DATABASE_URL
    Variable appears to be a secret - detected as Database URL with credentials
    at .env:3
    Value: post...@aws

Summary: 2 errors
Completed in 67ms`
  },
  {
    id: 'clean',
    title: 'All Checks Pass',
    icon: '✅',
    command: 'npx @theaccessibleteam/env-doctor',
    output: `env-doctor v1.0.0

Framework: nextjs
Scanned 42 files, 12 env variables

✓ Missing Variables
  All used variables are defined

✓ Unused Variables
  No unused variables found

✓ Type Validation
  All types match expected values

✓ Sync Check
  .env and .env.example are in sync

Summary: All checks passed!
Completed in 156ms`
  }
];

export default function TerminalDemo(): JSX.Element {
  const [activeScenario, setActiveScenario] = useState(scenarios[0].id);
  const [isTyping, setIsTyping] = useState(false);
  
  const currentScenario = scenarios.find(s => s.id === activeScenario) || scenarios[0];

  const handleScenarioChange = (scenarioId: string) => {
    if (scenarioId !== activeScenario) {
      setIsTyping(true);
      setActiveScenario(scenarioId);
      setTimeout(() => setIsTyping(false), 300);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            className={`${styles.tab} ${activeScenario === scenario.id ? styles.active : ''}`}
            onClick={() => handleScenarioChange(scenario.id)}
            aria-pressed={activeScenario === scenario.id}
          >
            <span className={styles.tabIcon}>{scenario.icon}</span>
            <span className={styles.tabText}>{scenario.title}</span>
          </button>
        ))}
      </div>
      
      <div className={styles.terminal}>
        <div className={styles.header}>
          <div className={styles.dots}>
            <span className={`${styles.dot} ${styles.red}`}></span>
            <span className={`${styles.dot} ${styles.yellow}`}></span>
            <span className={`${styles.dot} ${styles.green}`}></span>
          </div>
          <span className={styles.title}>env-doctor demo</span>
          <div className={styles.headerSpacer}></div>
        </div>
        <div className={`${styles.content} ${isTyping ? styles.fadeIn : ''}`}>
          <div className={styles.command}>
            <span className={styles.prompt}>$</span> {currentScenario.command}
          </div>
          <pre className={styles.output}>{currentScenario.output}</pre>
        </div>
      </div>
    </div>
  );
}


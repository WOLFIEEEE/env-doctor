import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Playground from '@site/src/components/Playground';
import styles from './playground.module.css';

export default function PlaygroundPage(): JSX.Element {
  return (
    <Layout
      title="Playground"
      description="Try env-doctor in your browser - analyze environment variables interactively">
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>Interactive Playground</h1>
            <p className={styles.subtitle}>
              Try env-doctor directly in your browser. Select a scenario or edit the code to see real-time analysis.
            </p>
          </header>
          
          <div className={styles.playgroundWrapper}>
            <Playground />
          </div>
          
          <section className={styles.info}>
            <h2>How It Works</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <div className={styles.infoNumber}>1</div>
                <h3>Select a Scenario</h3>
                <p>Choose from pre-built examples showing different types of issues env-doctor can detect.</p>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.infoNumber}>2</div>
                <h3>Edit the Code</h3>
                <p>Modify the .env file or source code to see how changes affect the analysis results.</p>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.infoNumber}>3</div>
                <h3>View Results</h3>
                <p>See real-time feedback on missing variables, unused definitions, exposed secrets, and more.</p>
              </div>
            </div>
          </section>
          
          <section className={styles.cta}>
            <h2>Ready to try it in your project?</h2>
            <p>Install env-doctor and run it on your actual codebase for comprehensive analysis.</p>
            <div className={styles.ctaButtons}>
              <Link className="button button--primary button--lg" to="/docs/getting-started/installation">
                Get Started
              </Link>
              <Link className="button button--outline button--lg" to="/docs/getting-started/configuration">
                Configuration Guide
              </Link>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
}


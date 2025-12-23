import React, { useState, useCallback, useMemo } from 'react';
import styles from './styles.module.css';

interface Scenario {
  id: string;
  name: string;
  description: string;
  envContent: string;
  codeContent: string;
}

interface AnalysisResult {
  type: 'error' | 'warning' | 'success';
  category: string;
  message: string;
  details?: string;
}

const scenarios: Scenario[] = [
  {
    id: 'missing',
    name: 'Missing Variables',
    description: 'Variables used in code but not defined in .env',
    envContent: `DATABASE_URL=postgres://localhost:5432/mydb
API_KEY=sk_test_123456`,
    codeContent: `// Database connection
const db = connect(process.env.DATABASE_URL);

// API calls
const api = new Client({
  key: process.env.API_KEY,
  secret: process.env.API_SECRET,  // Missing!
});

// Feature flags
if (process.env.ENABLE_FEATURE) {  // Missing!
  enableExperimentalFeature();
}`,
  },
  {
    id: 'unused',
    name: 'Unused Variables',
    description: 'Variables defined in .env but never used in code',
    envContent: `DATABASE_URL=postgres://localhost:5432/mydb
API_KEY=sk_test_123456
OLD_API_KEY=sk_old_deprecated
LEGACY_ENDPOINT=https://old.api.com
DEBUG_MODE=true`,
    codeContent: `// Only using some variables
const db = connect(process.env.DATABASE_URL);

const api = new Client({
  key: process.env.API_KEY,
});

// OLD_API_KEY, LEGACY_ENDPOINT, DEBUG_MODE are never used!`,
  },
  {
    id: 'secrets',
    name: 'Exposed Secrets',
    description: 'Detecting hardcoded or exposed secrets',
    envContent: `# Production secrets (DANGER!)
STRIPE_SECRET_KEY=sk_live_abc123def456ghi789
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
DATABASE_URL=postgres://admin:password123@db.example.com:5432/prod`,
    codeContent: `// Using secrets in code
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const aws = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const db = connect(process.env.DATABASE_URL);`,
  },
  {
    id: 'type-mismatch',
    name: 'Type Mismatches',
    description: 'Type conversion issues with env variables',
    envContent: `PORT=3000
ENABLE_CACHE=true
MAX_CONNECTIONS=fifty
TIMEOUT_MS=abc`,
    codeContent: `// Potential type issues
const port = parseInt(process.env.PORT);  // OK
const cache = process.env.ENABLE_CACHE === 'true';  // OK

// These will fail at runtime!
const maxConn = parseInt(process.env.MAX_CONNECTIONS);  // NaN
const timeout = parseInt(process.env.TIMEOUT_MS);  // NaN`,
  },
  {
    id: 'passing',
    name: 'All Checks Pass',
    description: 'A healthy environment configuration',
    envContent: `# Database
DATABASE_URL=postgres://localhost:5432/mydb

# API Configuration
API_KEY=your_api_key_here
API_ENDPOINT=https://api.example.com

# Feature Flags
ENABLE_CACHE=true
DEBUG_MODE=false`,
    codeContent: `// All variables are properly defined and used
const db = connect(process.env.DATABASE_URL);

const api = new Client({
  key: process.env.API_KEY,
  endpoint: process.env.API_ENDPOINT,
});

const config = {
  cache: process.env.ENABLE_CACHE === 'true',
  debug: process.env.DEBUG_MODE === 'true',
};`,
  },
];

// Simple client-side analyzer
function analyzeEnv(envContent: string, codeContent: string): AnalysisResult[] {
  const results: AnalysisResult[] = [];
  
  // Parse .env content
  const envVars = new Map<string, string>();
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match) {
        envVars.set(match[1], match[2]);
      }
    }
  });
  
  // Find variables used in code
  const usedVars = new Set<string>();
  const envPattern = /process\.env\.([A-Z_][A-Z0-9_]*)|process\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g;
  let match;
  while ((match = envPattern.exec(codeContent)) !== null) {
    usedVars.add(match[1] || match[2]);
  }
  
  // Check for missing variables
  usedVars.forEach(varName => {
    if (!envVars.has(varName)) {
      results.push({
        type: 'error',
        category: 'Missing Variable',
        message: `${varName} is used in code but not defined`,
        details: `Add ${varName}=your_value to your .env file`,
      });
    }
  });
  
  // Check for unused variables
  envVars.forEach((value, varName) => {
    if (!usedVars.has(varName)) {
      results.push({
        type: 'warning',
        category: 'Unused Variable',
        message: `${varName} is defined but never used`,
        details: `Consider removing it or verify it's used elsewhere`,
      });
    }
  });
  
  // Check for exposed secrets
  const secretPatterns = [
    { name: 'Stripe Secret Key', pattern: /sk_live_[a-zA-Z0-9]+/ },
    { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/ },
    { name: 'AWS Secret Key', pattern: /[a-zA-Z0-9+/]{40}/ },
    { name: 'Database Password', pattern: /:\/\/[^:]+:([^@]+)@/ },
  ];
  
  envVars.forEach((value, varName) => {
    secretPatterns.forEach(({ name, pattern }) => {
      if (pattern.test(value)) {
        results.push({
          type: 'error',
          category: 'Exposed Secret',
          message: `${varName} appears to contain a ${name}`,
          details: `Never commit real secrets to version control`,
        });
      }
    });
  });
  
  // Check for type issues
  const typePatterns = [
    { pattern: /parseInt\(process\.env\.([A-Z_][A-Z0-9_]*)\)/, type: 'number' },
    { pattern: /Number\(process\.env\.([A-Z_][A-Z0-9_]*)\)/, type: 'number' },
  ];
  
  typePatterns.forEach(({ pattern, type }) => {
    const matches = codeContent.matchAll(new RegExp(pattern, 'g'));
    for (const m of matches) {
      const varName = m[1];
      const value = envVars.get(varName);
      if (value && type === 'number' && isNaN(Number(value))) {
        results.push({
          type: 'warning',
          category: 'Type Mismatch',
          message: `${varName} is used as a number but value "${value}" is not numeric`,
          details: `This will result in NaN at runtime`,
        });
      }
    }
  });
  
  // If no issues, add success message
  if (results.length === 0) {
    results.push({
      type: 'success',
      category: 'All Checks Passed',
      message: 'No issues found with your environment configuration',
    });
  }
  
  return results;
}

export default function Playground(): JSX.Element {
  const [selectedScenario, setSelectedScenario] = useState(scenarios[0].id);
  const [envContent, setEnvContent] = useState(scenarios[0].envContent);
  const [codeContent, setCodeContent] = useState(scenarios[0].codeContent);
  
  const handleScenarioChange = useCallback((scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setSelectedScenario(scenarioId);
      setEnvContent(scenario.envContent);
      setCodeContent(scenario.codeContent);
    }
  }, []);
  
  const results = useMemo(() => {
    return analyzeEnv(envContent, codeContent);
  }, [envContent, codeContent]);
  
  const errorCount = results.filter(r => r.type === 'error').length;
  const warningCount = results.filter(r => r.type === 'warning').length;
  
  return (
    <div className={styles.playground}>
      <div className={styles.header}>
        <div className={styles.scenarioSelector}>
          <label htmlFor="scenario-select">Scenario:</label>
          <select
            id="scenario-select"
            value={selectedScenario}
            onChange={(e) => handleScenarioChange(e.target.value)}
            className={styles.select}
          >
            {scenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </div>
        <p className={styles.description}>
          {scenarios.find(s => s.id === selectedScenario)?.description}
        </p>
      </div>
      
      <div className={styles.editors}>
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <span className={styles.editorTitle}>.env</span>
            <span className={styles.editorHint}>Environment variables</span>
          </div>
          <textarea
            className={styles.editor}
            value={envContent}
            onChange={(e) => setEnvContent(e.target.value)}
            spellCheck={false}
            placeholder="DATABASE_URL=..."
          />
        </div>
        
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <span className={styles.editorTitle}>app.js</span>
            <span className={styles.editorHint}>Source code</span>
          </div>
          <textarea
            className={styles.editor}
            value={codeContent}
            onChange={(e) => setCodeContent(e.target.value)}
            spellCheck={false}
            placeholder="process.env.DATABASE_URL..."
          />
        </div>
      </div>
      
      <div className={styles.results}>
        <div className={styles.resultsHeader}>
          <span className={styles.resultsTitle}>Analysis Results</span>
          <div className={styles.resultsSummary}>
            {errorCount > 0 && (
              <span className={styles.errorBadge}>{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
            )}
            {warningCount > 0 && (
              <span className={styles.warningBadge}>{warningCount} warning{warningCount !== 1 ? 's' : ''}</span>
            )}
            {errorCount === 0 && warningCount === 0 && (
              <span className={styles.successBadge}>All clear</span>
            )}
          </div>
        </div>
        
        <div className={styles.resultsList}>
          {results.map((result, idx) => (
            <div key={idx} className={`${styles.resultItem} ${styles[result.type]}`}>
              <div className={styles.resultIcon}>
                {result.type === 'error' && '✗'}
                {result.type === 'warning' && '⚠'}
                {result.type === 'success' && '✓'}
              </div>
              <div className={styles.resultContent}>
                <span className={styles.resultCategory}>{result.category}</span>
                <span className={styles.resultMessage}>{result.message}</span>
                {result.details && (
                  <span className={styles.resultDetails}>{result.details}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


import { z } from 'zod';

/**
 * Supported frameworks for environment variable patterns
 */
type Framework = 'auto' | 'nextjs' | 'vite' | 'cra' | 'node';
/**
 * Variable type for validation
 */
type VariableType = 'string' | 'number' | 'boolean' | 'json' | 'url' | 'email';
/**
 * Rule for a specific environment variable
 */
interface VariableRule {
    /** Whether this variable is required */
    required?: boolean;
    /** Whether this variable contains a secret */
    secret?: boolean;
    /** Expected type of the variable */
    type?: VariableType;
    /** Regex pattern the value must match */
    pattern?: RegExp;
    /** Default value if not provided */
    default?: string | number | boolean;
    /** Allowed values (enum) */
    enum?: string[];
    /** Description for documentation */
    description?: string;
}
/**
 * Main configuration for env-doctor
 */
interface EnvDoctorConfig {
    /** Environment files to check (default: ['.env']) */
    envFiles: string[];
    /** Template file to compare against (e.g., '.env.example') */
    templateFile?: string;
    /** Glob patterns for files to scan */
    include: string[];
    /** Glob patterns for files to exclude */
    exclude: string[];
    /** Framework for env var patterns (default: 'auto') */
    framework: Framework;
    /** Variable-specific rules */
    variables: Record<string, VariableRule>;
    /** Patterns or rules to ignore */
    ignore: string[];
    /** Strict mode - treat warnings as errors */
    strict?: boolean;
    /** Custom secret detection patterns */
    secretPatterns?: RegExp[];
    /** Root directory to scan (default: process.cwd()) */
    root?: string;
}
/**
 * Zod schema for VariableRule
 */
declare const VariableRuleSchema: z.ZodObject<{
    required: z.ZodOptional<z.ZodBoolean>;
    secret: z.ZodOptional<z.ZodBoolean>;
    type: z.ZodOptional<z.ZodEnum<["string", "number", "boolean", "json", "url", "email"]>>;
    pattern: z.ZodOptional<z.ZodType<RegExp, z.ZodTypeDef, RegExp>>;
    default: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>;
    enum: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    required?: boolean | undefined;
    secret?: boolean | undefined;
    type?: "string" | "number" | "boolean" | "json" | "url" | "email" | undefined;
    pattern?: RegExp | undefined;
    default?: string | number | boolean | undefined;
    enum?: string[] | undefined;
    description?: string | undefined;
}, {
    required?: boolean | undefined;
    secret?: boolean | undefined;
    type?: "string" | "number" | "boolean" | "json" | "url" | "email" | undefined;
    pattern?: RegExp | undefined;
    default?: string | number | boolean | undefined;
    enum?: string[] | undefined;
    description?: string | undefined;
}>;
/**
 * Zod schema for EnvDoctorConfig
 */
declare const EnvDoctorConfigSchema: z.ZodObject<{
    envFiles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    templateFile: z.ZodOptional<z.ZodString>;
    include: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    exclude: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    framework: z.ZodDefault<z.ZodEnum<["auto", "nextjs", "vite", "cra", "node"]>>;
    variables: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
        required: z.ZodOptional<z.ZodBoolean>;
        secret: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodEnum<["string", "number", "boolean", "json", "url", "email"]>>;
        pattern: z.ZodOptional<z.ZodType<RegExp, z.ZodTypeDef, RegExp>>;
        default: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>;
        enum: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        required?: boolean | undefined;
        secret?: boolean | undefined;
        type?: "string" | "number" | "boolean" | "json" | "url" | "email" | undefined;
        pattern?: RegExp | undefined;
        default?: string | number | boolean | undefined;
        enum?: string[] | undefined;
        description?: string | undefined;
    }, {
        required?: boolean | undefined;
        secret?: boolean | undefined;
        type?: "string" | "number" | "boolean" | "json" | "url" | "email" | undefined;
        pattern?: RegExp | undefined;
        default?: string | number | boolean | undefined;
        enum?: string[] | undefined;
        description?: string | undefined;
    }>>>;
    ignore: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    strict: z.ZodOptional<z.ZodBoolean>;
    secretPatterns: z.ZodOptional<z.ZodArray<z.ZodType<RegExp, z.ZodTypeDef, RegExp>, "many">>;
    root: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    envFiles: string[];
    include: string[];
    exclude: string[];
    framework: "auto" | "nextjs" | "vite" | "cra" | "node";
    variables: Record<string, {
        required?: boolean | undefined;
        secret?: boolean | undefined;
        type?: "string" | "number" | "boolean" | "json" | "url" | "email" | undefined;
        pattern?: RegExp | undefined;
        default?: string | number | boolean | undefined;
        enum?: string[] | undefined;
        description?: string | undefined;
    }>;
    ignore: string[];
    templateFile?: string | undefined;
    strict?: boolean | undefined;
    secretPatterns?: RegExp[] | undefined;
    root?: string | undefined;
}, {
    envFiles?: string[] | undefined;
    templateFile?: string | undefined;
    include?: string[] | undefined;
    exclude?: string[] | undefined;
    framework?: "auto" | "nextjs" | "vite" | "cra" | "node" | undefined;
    strict?: boolean | undefined;
    variables?: Record<string, {
        required?: boolean | undefined;
        secret?: boolean | undefined;
        type?: "string" | "number" | "boolean" | "json" | "url" | "email" | undefined;
        pattern?: RegExp | undefined;
        default?: string | number | boolean | undefined;
        enum?: string[] | undefined;
        description?: string | undefined;
    }> | undefined;
    ignore?: string[] | undefined;
    secretPatterns?: RegExp[] | undefined;
    root?: string | undefined;
}>;
/**
 * Default configuration values
 */
declare const defaultConfig: EnvDoctorConfig;
/**
 * CLI options passed from command line
 */
interface CLIOptions {
    config?: string;
    env?: string;
    format?: 'console' | 'json' | 'sarif';
    ci?: boolean;
    fix?: boolean;
    watch?: boolean;
    verbose?: boolean;
    depth?: number;
}

/**
 * Severity levels for issues
 */
type Severity = 'error' | 'warning' | 'info';
/**
 * Types of issues that can be detected
 */
type IssueType = 'missing' | 'unused' | 'type-mismatch' | 'sync-drift' | 'secret-exposed' | 'invalid-value' | 'dynamic-access';
/**
 * Location in source code
 */
interface SourceLocation {
    file: string;
    line: number;
    column?: number;
}
/**
 * A single detected issue
 */
interface Issue {
    /** Type of the issue */
    type: IssueType;
    /** Severity level */
    severity: Severity;
    /** Name of the environment variable */
    variable: string;
    /** Human-readable message */
    message: string;
    /** Location in source code (if applicable) */
    location?: SourceLocation;
    /** Suggested fix (if available) */
    fix?: string;
    /** Additional context */
    context?: Record<string, unknown>;
}
/**
 * Parsed environment variable from .env file
 */
interface EnvVariable {
    /** Variable name */
    name: string;
    /** Variable value (may be empty) */
    value: string;
    /** Line number in the file */
    line: number;
    /** Source file path */
    file: string;
    /** Whether the value appears to be a secret */
    isSecret?: boolean;
    /** Inferred type from usage */
    inferredType?: 'string' | 'number' | 'boolean' | 'json' | 'array';
    /** Raw line content */
    raw?: string;
}
/**
 * Environment variable usage found in code
 */
interface EnvUsage {
    /** Variable name */
    name: string;
    /** File where it's used */
    file: string;
    /** Line number */
    line: number;
    /** Column number */
    column: number;
    /** Access pattern (direct, bracket, destructure) */
    accessPattern: 'direct' | 'bracket' | 'destructure' | 'dynamic';
    /** Inferred type from usage context */
    inferredType?: 'string' | 'number' | 'boolean' | 'json' | 'array';
    /** Code snippet for context */
    snippet?: string;
    /** Whether this is a client-side access (framework specific) */
    isClientSide?: boolean;
}
/**
 * Result of scanning git history
 */
interface GitScanResult {
    /** Commit hash where secret was found */
    commit: string;
    /** Author of the commit */
    author: string;
    /** Commit date */
    date: string;
    /** File path */
    file: string;
    /** Line number */
    line: number;
    /** Variable name */
    variable: string;
    /** Partial value (redacted) */
    redactedValue: string;
}
/**
 * Overall analysis result
 */
interface AnalysisResult {
    /** All detected issues */
    issues: Issue[];
    /** Environment variables defined in .env files */
    definedVariables: EnvVariable[];
    /** Environment variables used in code */
    usedVariables: EnvUsage[];
    /** Template variables from .env.example */
    templateVariables?: EnvVariable[];
    /** Detected framework */
    framework: string;
    /** Scan statistics */
    stats: ScanStats;
}
/**
 * Scan statistics
 */
interface ScanStats {
    /** Number of files scanned */
    filesScanned: number;
    /** Number of env files parsed */
    envFilesParsed: number;
    /** Time taken in milliseconds */
    duration: number;
    /** Number of errors */
    errorCount: number;
    /** Number of warnings */
    warningCount: number;
    /** Number of info messages */
    infoCount: number;
}
/**
 * SARIF output format for GitHub code scanning
 */
interface SARIFOutput {
    $schema: string;
    version: string;
    runs: SARIFRun[];
}
interface SARIFRun {
    tool: {
        driver: {
            name: string;
            version: string;
            informationUri: string;
            rules: SARIFRule[];
        };
    };
    results: SARIFResult[];
}
interface SARIFRule {
    id: string;
    name: string;
    shortDescription: {
        text: string;
    };
    fullDescription: {
        text: string;
    };
    defaultConfiguration: {
        level: 'error' | 'warning' | 'note';
    };
    helpUri?: string;
}
interface SARIFResult {
    ruleId: string;
    level: 'error' | 'warning' | 'note';
    message: {
        text: string;
    };
    locations: Array<{
        physicalLocation: {
            artifactLocation: {
                uri: string;
            };
            region: {
                startLine: number;
                startColumn?: number;
            };
        };
    }>;
}

/**
 * Load configuration from file or use defaults
 */
declare function loadConfig(configPath?: string, rootDir?: string): Promise<{
    config: EnvDoctorConfig;
    configPath?: string;
}>;
/**
 * Create a config file template
 */
declare function generateConfigTemplate(): string;
/**
 * Get environment-specific config overrides
 */
declare function getEnvSpecificConfig(baseConfig: EnvDoctorConfig, env: string): EnvDoctorConfig;
/**
 * Validate that required config values are present
 */
declare function validateConfig(config: EnvDoctorConfig): {
    valid: boolean;
    errors: string[];
};

interface ParseResult {
    variables: EnvVariable[];
    errors: Array<{
        line: number;
        message: string;
    }>;
}
/**
 * Parse a .env file and extract all variables
 */
declare function parseEnvFile(filePath: string, rootDir?: string): Promise<ParseResult>;
/**
 * Parse multiple env files and merge results
 */
declare function parseEnvFiles(filePaths: string[], rootDir?: string): Promise<ParseResult>;
/**
 * Infer the type of a value
 */
declare function inferValueType(value: string): 'string' | 'number' | 'boolean' | 'json' | 'array' | undefined;
/**
 * Get all secret patterns (built-in + custom)
 */
declare function getSecretPatterns(customPatterns?: RegExp[]): RegExp[];

interface CodeScanOptions {
    /** Root directory */
    rootDir: string;
    /** Include patterns */
    include: string[];
    /** Exclude patterns */
    exclude: string[];
    /** Detected framework */
    framework: Framework | string;
}
interface CodeScanResult {
    usages: EnvUsage[];
    errors: Array<{
        file: string;
        message: string;
    }>;
    filesScanned: number;
}
/**
 * Scan source files for process.env usage
 */
declare function scanCode(options: CodeScanOptions): Promise<CodeScanResult>;
/**
 * Scan a single file's content for env usage
 */
declare function scanFileContent(content: string, filePath: string, rootDir: string, framework: Framework | string): EnvUsage[];
/**
 * Extract all unique variable names from usages
 */
declare function getUniqueVariableNames(usages: EnvUsage[]): string[];

interface GitScanOptions {
    /** Root directory of the git repository */
    rootDir: string;
    /** How many commits back to scan */
    depth?: number;
    /** Specific files to scan (glob patterns) */
    files?: string[];
    /** Include only specific branches */
    branches?: string[];
}
/**
 * Scan git history for leaked secrets
 */
declare function scanGitHistory(options: GitScanOptions): Promise<{
    results: GitScanResult[];
    error?: string;
}>;
/**
 * Check if the current directory is a git repository
 */
declare function isGitRepository(rootDir: string): Promise<boolean>;

interface FrameworkInfo {
    name: Framework;
    displayName: string;
    envPrefix: string[];
    clientPrefix: string[];
    serverOnly: boolean;
    configFiles: string[];
}
/**
 * Framework definitions
 */
declare const FRAMEWORKS: Record<Exclude<Framework, 'auto'>, FrameworkInfo>;
/**
 * Auto-detect the framework used in a project
 */
declare function detectFramework(rootDir: string): Promise<Framework>;
/**
 * Get framework info
 */
declare function getFrameworkInfo(framework: Framework): FrameworkInfo;
/**
 * Check if a variable should be client-accessible for a framework
 */
declare function isClientAccessible(variable: string, framework: Framework): boolean;
/**
 * Get the expected env file patterns for a framework
 */
declare function getEnvFilePatterns(framework: Framework): string[];
/**
 * Validate that a variable follows framework conventions
 */
declare function validateFrameworkConvention(variable: string, framework: Framework, isClientSide: boolean): {
    valid: boolean;
    message?: string;
};

interface MissingAnalyzerOptions {
    /** Variables defined in .env files */
    definedVariables: EnvVariable[];
    /** Variables used in code */
    usedVariables: EnvUsage[];
    /** Configuration */
    config: EnvDoctorConfig;
}
/**
 * Find variables that are used in code but not defined in .env files
 */
declare function analyzeMissing(options: MissingAnalyzerOptions): Issue[];
/**
 * Get a summary of missing variables
 */
declare function getMissingSummary(issues: Issue[]): {
    required: string[];
    optional: string[];
};

interface UnusedAnalyzerOptions {
    /** Variables defined in .env files */
    definedVariables: EnvVariable[];
    /** Variables used in code */
    usedVariables: EnvUsage[];
    /** Configuration */
    config: EnvDoctorConfig;
    /** Framework for checking special variables */
    framework: string;
}
/**
 * Find variables that are defined in .env files but never used in code
 */
declare function analyzeUnused(options: UnusedAnalyzerOptions): Issue[];
/**
 * Get a summary of unused variables
 */
declare function getUnusedSummary(issues: Issue[]): {
    count: number;
    byFile: Record<string, string[]>;
};

interface TypeMismatchAnalyzerOptions {
    /** Variables defined in .env files */
    definedVariables: EnvVariable[];
    /** Variables used in code */
    usedVariables: EnvUsage[];
    /** Configuration */
    config: EnvDoctorConfig;
}
/**
 * Find variables where the value doesn't match the expected or inferred type
 */
declare function analyzeTypeMismatch(options: TypeMismatchAnalyzerOptions): Issue[];

interface SyncCheckOptions {
    /** Variables defined in .env files */
    envVariables: EnvVariable[];
    /** Variables defined in template file (.env.example) */
    templateVariables: EnvVariable[];
    /** Template file name */
    templateFile: string;
}
interface SyncCheckResult {
    /** Issues found */
    issues: Issue[];
    /** Variables in env but not in template */
    missingFromTemplate: string[];
    /** Variables in template but not in env */
    missingFromEnv: string[];
    /** Whether files are in sync */
    inSync: boolean;
}
/**
 * Check if .env files are in sync with the template file
 */
declare function analyzeSyncDrift(options: SyncCheckOptions): SyncCheckResult;
/**
 * Generate a template file content from env variables
 */
declare function generateTemplate(variables: EnvVariable[], options?: {
    includeComments?: boolean;
    groupByPrefix?: boolean;
    maskSecrets?: boolean;
}): string;
/**
 * Merge template variables with env variables to find diff
 */
declare function compareTemplateWithEnv(template: EnvVariable[], env: EnvVariable[]): {
    added: string[];
    removed: string[];
    changed: Array<{
        name: string;
        templateValue: string;
        envValue: string;
    }>;
};

/**
 * Built-in patterns for detecting secrets
 */
declare const SECRET_NAME_PATTERNS: Array<{
    pattern: RegExp;
    provider?: string;
}>;
/**
 * Patterns for detecting secrets in values
 */
declare const SECRET_VALUE_PATTERNS: Array<{
    pattern: RegExp;
    type: string;
}>;
interface SecretAnalyzerOptions {
    /** Variables to analyze */
    variables: EnvVariable[];
    /** Additional patterns to check */
    customPatterns?: RegExp[];
    /** Patterns to ignore */
    ignorePatterns?: string[];
}
/**
 * Analyze variables for potential secrets
 */
declare function analyzeSecrets(options: SecretAnalyzerOptions): Issue[];
/**
 * Check if a variable should be treated as a secret
 */
declare function isSecretVariable(name: string, value?: string): boolean;
/**
 * Get security recommendations for a project
 */
declare function getSecurityRecommendations(issues: Issue[]): string[];

interface ConsoleReporterOptions {
    /** Show verbose output */
    verbose?: boolean;
    /** Show colors (default: true) */
    colors?: boolean;
    /** Maximum issues to show per category */
    maxIssuesPerCategory?: number;
}
/**
 * Report analysis results to the console
 */
declare function reportToConsole(result: AnalysisResult, options?: ConsoleReporterOptions): void;
/**
 * Format for CI output (minimal, good for logs)
 */
declare function reportForCI(result: AnalysisResult): void;
/**
 * Create a spinner for progress indication
 */
declare function createSpinner(text: string): {
    start: () => void;
    stop: (success?: boolean) => void;
    update: (newText: string) => void;
};

interface JSONReport {
    /** Tool version */
    version: string;
    /** Timestamp of the report */
    timestamp: string;
    /** Detected framework */
    framework: string;
    /** Summary statistics */
    summary: {
        totalIssues: number;
        errors: number;
        warnings: number;
        info: number;
        filesScanned: number;
        envFilesParsed: number;
        duration: number;
    };
    /** All issues */
    issues: JSONIssue[];
    /** Environment variables defined */
    variables: {
        defined: Array<{
            name: string;
            file: string;
            line: number;
            hasValue: boolean;
            isSecret: boolean;
        }>;
        used: Array<{
            name: string;
            file: string;
            line: number;
            accessPattern: string;
            isClientSide: boolean;
        }>;
    };
}
interface JSONIssue {
    type: string;
    severity: string;
    variable: string;
    message: string;
    location?: {
        file: string;
        line: number;
        column?: number;
    };
    fix?: string;
    context?: Record<string, unknown>;
}
/**
 * Convert analysis result to JSON report format
 */
declare function toJSONReport(result: AnalysisResult): JSONReport;
/**
 * Report analysis results as JSON
 */
declare function reportToJSON(result: AnalysisResult): string;
/**
 * Report analysis results as JSON (compact, for piping)
 */
declare function reportToJSONCompact(result: AnalysisResult): string;
/**
 * Parse JSON report from string
 */
declare function parseJSONReport(json: string): JSONReport | null;
/**
 * Merge multiple JSON reports
 */
declare function mergeJSONReports(reports: JSONReport[]): JSONReport;

/**
 * Convert analysis results to SARIF format
 */
declare function toSARIF(result: AnalysisResult): SARIFOutput;
/**
 * Report analysis results as SARIF JSON string
 */
declare function reportToSARIF(result: AnalysisResult): string;
/**
 * Create a minimal SARIF report for specific issues
 */
declare function createMinimalSARIF(issues: Issue[]): SARIFOutput;
/**
 * Merge multiple SARIF reports
 */
declare function mergeSARIF(reports: SARIFOutput[]): SARIFOutput;
/**
 * Validate SARIF structure (basic validation)
 */
declare function validateSARIF(sarif: unknown): sarif is SARIFOutput;

interface AnalyzeOptions {
    config: EnvDoctorConfig;
    verbose?: boolean;
}
/**
 * Main analysis function - orchestrates all scanners and analyzers
 */
declare function analyze(options: AnalyzeOptions): Promise<AnalysisResult>;

export { type AnalysisResult, type CLIOptions, type EnvDoctorConfig, EnvDoctorConfigSchema, type EnvUsage, type EnvVariable, FRAMEWORKS, type Framework, type GitScanResult, type Issue, type IssueType, type SARIFOutput, type SARIFResult, type SARIFRule, type SARIFRun, SECRET_NAME_PATTERNS, SECRET_VALUE_PATTERNS, type ScanStats, type Severity, type SourceLocation, type VariableRule, VariableRuleSchema, type VariableType, analyze, analyzeMissing, analyzeSecrets, analyzeSyncDrift, analyzeTypeMismatch, analyzeUnused, compareTemplateWithEnv, createMinimalSARIF, createSpinner, defaultConfig, detectFramework, generateConfigTemplate, generateTemplate, getEnvFilePatterns, getEnvSpecificConfig, getFrameworkInfo, getMissingSummary, getSecretPatterns, getSecurityRecommendations, getUniqueVariableNames, getUnusedSummary, inferValueType, isClientAccessible, isGitRepository, isSecretVariable, loadConfig, mergeJSONReports, mergeSARIF, parseEnvFile, parseEnvFiles, parseJSONReport, reportForCI, reportToConsole, reportToJSON, reportToJSONCompact, reportToSARIF, scanCode, scanFileContent, scanGitHistory, toJSONReport, toSARIF, validateConfig, validateFrameworkConvention, validateSARIF };

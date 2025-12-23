"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/.pnpm/tsup@8.5.1_postcss@8.5.6_typescript@5.9.3/node_modules/tsup/assets/cjs_shims.js
var init_cjs_shims = __esm({
  "node_modules/.pnpm/tsup@8.5.1_postcss@8.5.6_typescript@5.9.3/node_modules/tsup/assets/cjs_shims.js"() {
    "use strict";
  }
});

// src/types/config.ts
var import_zod, VariableRuleSchema, EnvDoctorConfigSchema, defaultConfig;
var init_config = __esm({
  "src/types/config.ts"() {
    "use strict";
    init_cjs_shims();
    import_zod = require("zod");
    VariableRuleSchema = import_zod.z.object({
      required: import_zod.z.boolean().optional(),
      secret: import_zod.z.boolean().optional(),
      type: import_zod.z.enum(["string", "number", "boolean", "json", "url", "email"]).optional(),
      pattern: import_zod.z.instanceof(RegExp).optional(),
      default: import_zod.z.union([import_zod.z.string(), import_zod.z.number(), import_zod.z.boolean()]).optional(),
      enum: import_zod.z.array(import_zod.z.string()).optional(),
      description: import_zod.z.string().optional()
    });
    EnvDoctorConfigSchema = import_zod.z.object({
      envFiles: import_zod.z.array(import_zod.z.string()).default([".env"]),
      templateFile: import_zod.z.string().optional(),
      include: import_zod.z.array(import_zod.z.string()).default(["src/**/*.{ts,js,tsx,jsx}"]),
      exclude: import_zod.z.array(import_zod.z.string()).default(["node_modules", "dist", "**/*.test.*", "**/*.spec.*"]),
      framework: import_zod.z.enum(["auto", "nextjs", "vite", "cra", "node"]).default("auto"),
      variables: import_zod.z.record(import_zod.z.string(), VariableRuleSchema).default({}),
      ignore: import_zod.z.array(import_zod.z.string()).default([]),
      strict: import_zod.z.boolean().optional(),
      secretPatterns: import_zod.z.array(import_zod.z.instanceof(RegExp)).optional(),
      root: import_zod.z.string().optional()
    });
    defaultConfig = {
      envFiles: [".env"],
      include: ["src/**/*.{ts,js,tsx,jsx}", "app/**/*.{ts,js,tsx,jsx}", "pages/**/*.{ts,js,tsx,jsx}"],
      exclude: ["node_modules", "dist", "build", ".next", "**/*.test.*", "**/*.spec.*", "**/__tests__/**"],
      framework: "auto",
      variables: {},
      ignore: [],
      strict: false
    };
  }
});

// src/types/results.ts
var init_results = __esm({
  "src/types/results.ts"() {
    "use strict";
    init_cjs_shims();
  }
});

// src/types/index.ts
var init_types = __esm({
  "src/types/index.ts"() {
    "use strict";
    init_cjs_shims();
    init_config();
    init_results();
  }
});

// src/utils/fs.ts
async function fileExists(path) {
  try {
    await (0, import_promises.access)(path, import_node_fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
async function readJsonFile(path) {
  try {
    const content = await (0, import_promises.readFile)(path, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}
async function findUp(filename, startDir) {
  let currentDir = (0, import_node_path.resolve)(startDir);
  const root = (0, import_node_path.resolve)("/");
  while (currentDir !== root) {
    const filePath = (0, import_node_path.resolve)(currentDir, filename);
    if (await fileExists(filePath)) {
      return filePath;
    }
    currentDir = (0, import_node_path.dirname)(currentDir);
  }
  return null;
}
var import_promises, import_node_fs, import_node_path;
var init_fs = __esm({
  "src/utils/fs.ts"() {
    "use strict";
    init_cjs_shims();
    import_promises = require("fs/promises");
    import_node_fs = require("fs");
    import_node_path = require("path");
  }
});

// src/utils/logger.ts
var import_picocolors, LOG_LEVELS, Logger, logger;
var init_logger = __esm({
  "src/utils/logger.ts"() {
    "use strict";
    init_cjs_shims();
    import_picocolors = __toESM(require("picocolors"), 1);
    LOG_LEVELS = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      silent: 4
    };
    Logger = class {
      level = "info";
      verbose = false;
      setLevel(level) {
        this.level = level;
      }
      setVerbose(verbose) {
        this.verbose = verbose;
        if (verbose) {
          this.level = "debug";
        }
      }
      shouldLog(level) {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
      }
      debug(...args) {
        if (this.shouldLog("debug")) {
          console.log(import_picocolors.default.gray("[debug]"), ...args);
        }
      }
      info(...args) {
        if (this.shouldLog("info")) {
          console.log(...args);
        }
      }
      success(...args) {
        if (this.shouldLog("info")) {
          console.log(import_picocolors.default.green("\u2713"), ...args);
        }
      }
      warn(...args) {
        if (this.shouldLog("warn")) {
          console.log(import_picocolors.default.yellow("\u26A0"), ...args);
        }
      }
      error(...args) {
        if (this.shouldLog("error")) {
          console.error(import_picocolors.default.red("\u2717"), ...args);
        }
      }
      /** Print without any prefix */
      log(...args) {
        if (this.shouldLog("info")) {
          console.log(...args);
        }
      }
      /** Print a blank line */
      blank() {
        if (this.shouldLog("info")) {
          console.log();
        }
      }
      /** Print a header */
      header(text) {
        if (this.shouldLog("info")) {
          console.log();
          console.log(import_picocolors.default.bold(import_picocolors.default.cyan(text)));
          console.log();
        }
      }
      /** Print a section divider */
      divider() {
        if (this.shouldLog("info")) {
          console.log(import_picocolors.default.gray("\u2500".repeat(50)));
        }
      }
    };
    logger = new Logger();
  }
});

// src/config.ts
async function loadConfig(configPath, rootDir = process.cwd()) {
  if (configPath) {
    const absolutePath = (0, import_node_path2.resolve)(rootDir, configPath);
    if (await fileExists(absolutePath)) {
      const config = await loadConfigFile(absolutePath);
      return { config: mergeWithDefaults(config), configPath: absolutePath };
    }
    logger.warn(`Config file not found: ${configPath}`);
    return { config: { ...defaultConfig, root: rootDir } };
  }
  for (const filename of CONFIG_FILENAMES) {
    const foundPath = await findUp(filename, rootDir);
    if (foundPath) {
      logger.debug(`Found config at ${foundPath}`);
      const config = await loadConfigFile(foundPath);
      return {
        config: mergeWithDefaults(config, (0, import_node_path2.dirname)(foundPath)),
        configPath: foundPath
      };
    }
  }
  const packageJsonPath = (0, import_node_path2.resolve)(rootDir, "package.json");
  if (await fileExists(packageJsonPath)) {
    const packageJson = await readJsonFile(
      packageJsonPath
    );
    if (packageJson?.["env-doctor"]) {
      logger.debug("Found config in package.json");
      return {
        config: mergeWithDefaults(packageJson["env-doctor"], rootDir),
        configPath: packageJsonPath
      };
    }
  }
  logger.debug("No config found, using defaults");
  return { config: { ...defaultConfig, root: rootDir } };
}
async function loadConfigFile(filePath) {
  const ext = filePath.split(".").pop()?.toLowerCase();
  try {
    if (ext === "json" || filePath.endsWith("rc")) {
      const content = await readJsonFile(filePath);
      return content || {};
    }
    const fileUrl = (0, import_node_url.pathToFileURL)(filePath).href;
    const module2 = await import(fileUrl);
    return module2.default || module2;
  } catch (err) {
    logger.warn(`Failed to load config from ${filePath}: ${err instanceof Error ? err.message : "Unknown error"}`);
    return {};
  }
}
function mergeWithDefaults(userConfig, rootDir) {
  const merged = {
    ...defaultConfig,
    ...userConfig,
    root: userConfig.root || rootDir || process.cwd(),
    variables: {
      ...defaultConfig.variables,
      ...userConfig.variables
    }
  };
  const result = EnvDoctorConfigSchema.safeParse(merged);
  if (!result.success) {
    logger.warn("Config validation warnings:");
    for (const issue of result.error.issues) {
      logger.warn(`  ${issue.path.join(".")}: ${issue.message}`);
    }
  }
  return merged;
}
function generateConfigTemplate() {
  return `// env-doctor.config.js
// See https://github.com/yourusername/env-doctor for documentation

/** @type {import('env-doctor').EnvDoctorConfig} */
module.exports = {
  // Which env files to check
  envFiles: ['.env', '.env.local'],

  // Compare against this template
  templateFile: '.env.example',

  // Where to scan for usage
  include: ['src/**/*.{ts,js,tsx,jsx}', 'app/**/*.{ts,js,tsx,jsx}'],
  exclude: ['node_modules', 'dist', '**/*.test.*'],

  // Framework detection (auto-detected by default)
  framework: 'auto', // 'nextjs' | 'vite' | 'cra' | 'node' | 'auto'

  // Variable-specific rules
  variables: {
    // DATABASE_URL: {
    //   required: true,
    //   secret: true,
    //   pattern: /^postgres:\\/\\//
    // },
    // PORT: {
    //   type: 'number',
    //   default: 3000
    // },
    // NODE_ENV: {
    //   enum: ['development', 'production', 'test']
    // }
  },

  // Ignore specific issues
  ignore: [
    // 'LEGACY_*',           // Ignore variables matching pattern
    // 'unused:DEBUG',       // Ignore specific rule for specific var
  ],

  // Strict mode - treat warnings as errors
  strict: false,
};
`;
}
function getEnvSpecificConfig(baseConfig, env) {
  const envFileMap = {
    development: [".env", ".env.local", ".env.development", ".env.development.local"],
    production: [".env", ".env.production", ".env.production.local"],
    test: [".env", ".env.test", ".env.test.local"],
    staging: [".env", ".env.staging", ".env.staging.local"]
  };
  const envFiles = envFileMap[env] || [`.env.${env}`];
  return {
    ...baseConfig,
    envFiles
  };
}
function validateConfig(config) {
  const errors = [];
  if (!config.envFiles || config.envFiles.length === 0) {
    errors.push("At least one env file must be specified");
  }
  if (!config.include || config.include.length === 0) {
    errors.push("At least one include pattern must be specified");
  }
  for (const [name, rule] of Object.entries(config.variables)) {
    if (rule.pattern && !(rule.pattern instanceof RegExp)) {
      errors.push(`Variable "${name}": pattern must be a RegExp`);
    }
    if (rule.enum && !Array.isArray(rule.enum)) {
      errors.push(`Variable "${name}": enum must be an array`);
    }
    if (rule.type && !["string", "number", "boolean", "json", "url", "email"].includes(rule.type)) {
      errors.push(`Variable "${name}": invalid type "${rule.type}"`);
    }
  }
  return { valid: errors.length === 0, errors };
}
var import_node_path2, import_node_url, CONFIG_FILENAMES;
var init_config2 = __esm({
  "src/config.ts"() {
    "use strict";
    init_cjs_shims();
    import_node_path2 = require("path");
    import_node_url = require("url");
    init_types();
    init_fs();
    init_logger();
    CONFIG_FILENAMES = [
      "env-doctor.config.js",
      "env-doctor.config.mjs",
      "env-doctor.config.cjs",
      ".env-doctor.config.js",
      ".env-doctor.config.mjs",
      ".env-doctor.config.cjs",
      "env-doctor.config.json",
      ".env-doctorrc",
      ".env-doctorrc.json"
    ];
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  EnvDoctorConfigSchema: () => EnvDoctorConfigSchema,
  FRAMEWORKS: () => FRAMEWORKS,
  SECRET_NAME_PATTERNS: () => SECRET_NAME_PATTERNS,
  SECRET_VALUE_PATTERNS: () => SECRET_VALUE_PATTERNS2,
  VariableRuleSchema: () => VariableRuleSchema,
  analyze: () => analyze,
  analyzeMissing: () => analyzeMissing,
  analyzeSecrets: () => analyzeSecrets,
  analyzeSyncDrift: () => analyzeSyncDrift,
  analyzeTypeMismatch: () => analyzeTypeMismatch,
  analyzeUnused: () => analyzeUnused,
  compareTemplateWithEnv: () => compareTemplateWithEnv,
  createMinimalSARIF: () => createMinimalSARIF,
  createSpinner: () => createSpinner,
  defaultConfig: () => defaultConfig,
  detectFramework: () => detectFramework,
  generateConfigTemplate: () => generateConfigTemplate,
  generateTemplate: () => generateTemplate,
  getEnvFilePatterns: () => getEnvFilePatterns,
  getEnvSpecificConfig: () => getEnvSpecificConfig,
  getFrameworkInfo: () => getFrameworkInfo,
  getMissingSummary: () => getMissingSummary,
  getSecretPatterns: () => getSecretPatterns,
  getSecurityRecommendations: () => getSecurityRecommendations,
  getUniqueVariableNames: () => getUniqueVariableNames,
  getUnusedSummary: () => getUnusedSummary,
  inferValueType: () => inferValueType,
  isClientAccessible: () => isClientAccessible,
  isGitRepository: () => isGitRepository,
  isSecretVariable: () => isSecretVariable2,
  loadConfig: () => loadConfig,
  mergeJSONReports: () => mergeJSONReports,
  mergeSARIF: () => mergeSARIF,
  parseEnvFile: () => parseEnvFile,
  parseEnvFiles: () => parseEnvFiles,
  parseJSONReport: () => parseJSONReport,
  reportForCI: () => reportForCI,
  reportToConsole: () => reportToConsole,
  reportToJSON: () => reportToJSON,
  reportToJSONCompact: () => reportToJSONCompact,
  reportToSARIF: () => reportToSARIF,
  scanCode: () => scanCode,
  scanFileContent: () => scanFileContent,
  scanGitHistory: () => scanGitHistory,
  toJSONReport: () => toJSONReport,
  toSARIF: () => toSARIF,
  validateConfig: () => validateConfig,
  validateFrameworkConvention: () => validateFrameworkConvention,
  validateSARIF: () => validateSARIF
});
module.exports = __toCommonJS(src_exports);
init_cjs_shims();
init_config2();
init_config();

// src/scanner/env-parser.ts
init_cjs_shims();
var import_promises2 = require("fs/promises");
var import_node_path3 = require("path");
init_fs();
init_logger();
var SECRET_PATTERNS = [
  /password/i,
  /secret/i,
  /api[_-]?key/i,
  /auth[_-]?token/i,
  /access[_-]?token/i,
  /private[_-]?key/i,
  /jwt/i,
  /bearer/i,
  /credential/i,
  /^AWS_/i,
  /^STRIPE_/i,
  /^GITHUB_TOKEN/i,
  /^DATABASE_URL$/i,
  /^REDIS_URL$/i,
  /^MONGODB_URI$/i
];
var CREDENTIAL_VALUE_PATTERNS = [
  /^sk[-_]/i,
  // Stripe secret key
  /^pk[-_]/i,
  // Stripe publishable key
  /^ghp_/,
  // GitHub personal access token
  /^gho_/,
  // GitHub OAuth token
  /^github_pat_/,
  // GitHub PAT
  /^AKIA[A-Z0-9]{16}/,
  // AWS access key
  /^eyJ[A-Za-z0-9-_]+\.eyJ/,
  // JWT token
  /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/
  // Private key
];
async function parseEnvFile(filePath, rootDir = process.cwd()) {
  const absolutePath = (0, import_node_path3.resolve)(rootDir, filePath);
  const variables = [];
  const errors = [];
  if (!await fileExists(absolutePath)) {
    logger.debug(`Env file not found: ${absolutePath}`);
    return { variables, errors: [{ line: 0, message: `File not found: ${filePath}` }] };
  }
  let content;
  try {
    content = await (0, import_promises2.readFile)(absolutePath, "utf-8");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { variables, errors: [{ line: 0, message: `Failed to read file: ${message}` }] };
  }
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const parsed = parseLine(line, lineNumber);
    if (parsed.error) {
      errors.push({ line: lineNumber, message: parsed.error });
      continue;
    }
    if (parsed.variable) {
      variables.push({
        ...parsed.variable,
        file: filePath,
        raw: rawLine,
        isSecret: isSecretVariable(parsed.variable.name, parsed.variable.value)
      });
    }
  }
  return { variables, errors };
}
function parseLine(line, lineNumber) {
  let processedLine = line;
  if (processedLine.startsWith("export ")) {
    processedLine = processedLine.slice(7);
  }
  const equalIndex = processedLine.indexOf("=");
  if (equalIndex === -1) {
    return { error: `Invalid format: missing '=' sign` };
  }
  const name = processedLine.slice(0, equalIndex).trim();
  let value = processedLine.slice(equalIndex + 1);
  if (!isValidVariableName(name)) {
    return { error: `Invalid variable name: "${name}"` };
  }
  value = parseValue(value);
  return {
    variable: {
      name,
      value,
      line: lineNumber
    }
  };
}
function parseValue(value) {
  value = value.trim();
  if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
    const quote = value[0];
    value = value.slice(1, -1);
    if (quote === '"') {
      value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "	").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
  } else {
    const commentIndex = value.indexOf(" #");
    if (commentIndex !== -1) {
      value = value.slice(0, commentIndex).trim();
    }
  }
  return value;
}
function isValidVariableName(name) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}
function isSecretVariable(name, value) {
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(name)) {
      return true;
    }
  }
  if (value) {
    for (const pattern of CREDENTIAL_VALUE_PATTERNS) {
      if (pattern.test(value)) {
        return true;
      }
    }
  }
  return false;
}
async function parseEnvFiles(filePaths, rootDir = process.cwd()) {
  const allVariables = [];
  const allErrors = [];
  const seenVariables = /* @__PURE__ */ new Map();
  for (const filePath of filePaths) {
    const result = await parseEnvFile(filePath, rootDir);
    for (const variable of result.variables) {
      seenVariables.set(variable.name, variable);
    }
    allErrors.push(...result.errors);
  }
  allVariables.push(...seenVariables.values());
  return { variables: allVariables, errors: allErrors };
}
function inferValueType(value) {
  if (!value) return void 0;
  if (value === "true" || value === "false") {
    return "boolean";
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return "number";
  }
  if (value.startsWith("{") && value.endsWith("}") || value.startsWith("[") && value.endsWith("]")) {
    try {
      JSON.parse(value);
      return "json";
    } catch {
    }
  }
  if (value.includes(",") && !value.includes(" ")) {
    return "array";
  }
  return "string";
}
function getSecretPatterns(customPatterns) {
  if (customPatterns) {
    return [...SECRET_PATTERNS, ...customPatterns];
  }
  return SECRET_PATTERNS;
}

// src/scanner/code-scanner.ts
init_cjs_shims();
var import_typescript_estree = require("@typescript-eslint/typescript-estree");
var import_promises3 = require("fs/promises");
var import_node_path5 = require("path");

// src/utils/glob.ts
init_cjs_shims();
var import_glob = require("glob");
var import_node_path4 = require("path");
async function findFiles(options) {
  const { cwd, include, exclude, followSymlinks = false } = options;
  const files = await (0, import_glob.glob)(include, {
    cwd,
    ignore: exclude,
    absolute: true,
    nodir: true,
    follow: followSymlinks
  });
  return files.map((f) => (0, import_node_path4.resolve)(f));
}
function shouldIgnoreVariable(variable, ignorePatterns, ruleType) {
  for (const pattern of ignorePatterns) {
    if (pattern.includes(":")) {
      const [rule, varPattern] = pattern.split(":");
      if (ruleType && rule === ruleType) {
        if (matchesVariablePattern(variable, varPattern)) {
          return true;
        }
      }
    } else {
      if (matchesVariablePattern(variable, pattern)) {
        return true;
      }
    }
  }
  return false;
}
function matchesVariablePattern(variable, pattern) {
  if (pattern.endsWith("*")) {
    return variable.startsWith(pattern.slice(0, -1));
  }
  if (pattern.startsWith("*")) {
    return variable.endsWith(pattern.slice(1));
  }
  return variable === pattern;
}

// src/scanner/code-scanner.ts
init_logger();
var CLIENT_PREFIXES = {
  nextjs: ["NEXT_PUBLIC_"],
  vite: ["VITE_"],
  cra: ["REACT_APP_"],
  node: []
};
async function scanCode(options) {
  const { rootDir, include, exclude, framework } = options;
  const usages = [];
  const errors = [];
  const files = await findFiles({
    cwd: rootDir,
    include,
    exclude
  });
  logger.debug(`Found ${files.length} files to scan`);
  for (const file of files) {
    try {
      const content = await (0, import_promises3.readFile)(file, "utf-8");
      const fileUsages = scanFileContent(content, file, rootDir, framework);
      usages.push(...fileUsages);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push({ file: (0, import_node_path5.relative)(rootDir, file), message });
      logger.debug(`Error scanning ${file}: ${message}`);
    }
  }
  return {
    usages,
    errors,
    filesScanned: files.length
  };
}
function scanFileContent(content, filePath, rootDir, framework) {
  const usages = [];
  const relativePath = (0, import_node_path5.relative)(rootDir, filePath);
  const isClientFile = isClientSideFile(filePath);
  const clientPrefixes = CLIENT_PREFIXES[framework] || [];
  try {
    const ast = (0, import_typescript_estree.parse)(content, {
      jsx: true,
      loc: true,
      range: true,
      comment: false,
      errorOnUnknownASTType: false
    });
    walkAST(ast, (node) => {
      const usage = extractEnvUsage(node, relativePath, isClientFile, clientPrefixes, content);
      if (usage) {
        usages.push(usage);
      }
    });
  } catch {
    logger.debug(`AST parsing failed for ${filePath}, using regex fallback`);
    usages.push(...scanWithRegex(content, relativePath, isClientFile, clientPrefixes));
  }
  return usages;
}
function extractEnvUsage(node, file, isClientFile, clientPrefixes, _content) {
  if (node.type === "MemberExpression" && isProcessEnv(node.object) && node.property.type === "Identifier") {
    const name = node.property.name;
    return {
      name,
      file,
      line: node.loc?.start.line ?? 0,
      column: node.loc?.start.column ?? 0,
      accessPattern: "direct",
      isClientSide: isClientFile || isClientVariable(name, clientPrefixes),
      inferredType: inferTypeFromContext(node)
    };
  }
  if (node.type === "MemberExpression" && isProcessEnv(node.object) && node.computed && node.property.type === "Literal" && typeof node.property.value === "string") {
    const name = node.property.value;
    return {
      name,
      file,
      line: node.loc?.start.line ?? 0,
      column: node.loc?.start.column ?? 0,
      accessPattern: "bracket",
      isClientSide: isClientFile || isClientVariable(name, clientPrefixes),
      inferredType: inferTypeFromContext(node)
    };
  }
  if (node.type === "VariableDeclarator" && node.id.type === "ObjectPattern" && node.init && isProcessEnvNode(node.init)) {
    const usages = [];
    for (const prop of node.id.properties) {
      if (prop.type === "Property" && prop.key.type === "Identifier") {
        const name = prop.key.name;
        usages.push({
          name,
          file,
          line: prop.loc?.start.line ?? 0,
          column: prop.loc?.start.column ?? 0,
          accessPattern: "destructure",
          isClientSide: isClientFile || isClientVariable(name, clientPrefixes)
        });
      }
    }
    return usages[0] || null;
  }
  if (node.type === "MemberExpression" && isProcessEnv(node.object) && node.computed && node.property.type !== "Literal") {
    return {
      name: "<dynamic>",
      file,
      line: node.loc?.start.line ?? 0,
      column: node.loc?.start.column ?? 0,
      accessPattern: "dynamic",
      isClientSide: isClientFile
    };
  }
  if (node.type === "MemberExpression" && isImportMetaEnv(node.object) && node.property.type === "Identifier") {
    const name = node.property.name;
    return {
      name,
      file,
      line: node.loc?.start.line ?? 0,
      column: node.loc?.start.column ?? 0,
      accessPattern: "direct",
      isClientSide: true
      // import.meta.env is always client-side in Vite
    };
  }
  return null;
}
function isProcessEnv(node) {
  return node.type === "MemberExpression" && node.object.type === "Identifier" && node.object.name === "process" && node.property.type === "Identifier" && node.property.name === "env";
}
function isProcessEnvNode(node) {
  return isProcessEnv(node);
}
function isImportMetaEnv(node) {
  return node.type === "MemberExpression" && node.object.type === "MetaProperty" && node.object.meta.name === "import" && node.object.property.name === "meta" && node.property.type === "Identifier" && node.property.name === "env";
}
function inferTypeFromContext(node) {
  const parent = node.parent;
  if (!parent) return void 0;
  if (parent.type === "CallExpression" && parent.callee.type === "Identifier" && ["parseInt", "parseFloat", "Number"].includes(parent.callee.name)) {
    return "number";
  }
  if (parent.type === "BinaryExpression" && parent.right.type === "Literal" && (parent.right.value === "true" || parent.right.value === "false")) {
    return "boolean";
  }
  if (parent.type === "CallExpression" && parent.callee.type === "MemberExpression" && parent.callee.object.type === "Identifier" && parent.callee.object.name === "JSON" && parent.callee.property.type === "Identifier" && parent.callee.property.name === "parse") {
    return "json";
  }
  if (parent.type === "MemberExpression" && parent.property.type === "Identifier" && parent.property.name === "split") {
    return "array";
  }
  return void 0;
}
function isClientVariable(name, prefixes) {
  return prefixes.some((prefix) => name.startsWith(prefix));
}
function isClientSideFile(filePath) {
  const clientPatterns = [
    /\/components\//,
    /\/pages\//,
    /\/app\/.*page\.(tsx?|jsx?)$/,
    /\/hooks\//,
    /\.client\.(tsx?|jsx?)$/
  ];
  return clientPatterns.some((pattern) => pattern.test(filePath));
}
function walkAST(node, visitor) {
  visitor(node);
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object" && "type" in item) {
          walkAST(item, visitor);
        }
      }
    } else if (value && typeof value === "object" && "type" in value) {
      walkAST(value, visitor);
    }
  }
}
function scanWithRegex(content, file, isClientFile, clientPrefixes) {
  const usages = [];
  const lines = content.split("\n");
  const directPattern = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
  const bracketPattern = /process\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g;
  const vitePattern = /import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    let match;
    while ((match = directPattern.exec(line)) !== null) {
      usages.push({
        name: match[1],
        file,
        line: lineNumber,
        column: match.index,
        accessPattern: "direct",
        isClientSide: isClientFile || isClientVariable(match[1], clientPrefixes)
      });
    }
    while ((match = bracketPattern.exec(line)) !== null) {
      usages.push({
        name: match[1],
        file,
        line: lineNumber,
        column: match.index,
        accessPattern: "bracket",
        isClientSide: isClientFile || isClientVariable(match[1], clientPrefixes)
      });
    }
    while ((match = vitePattern.exec(line)) !== null) {
      usages.push({
        name: match[1],
        file,
        line: lineNumber,
        column: match.index,
        accessPattern: "direct",
        isClientSide: true
      });
    }
  }
  return usages;
}
function getUniqueVariableNames(usages) {
  const names = /* @__PURE__ */ new Set();
  for (const usage of usages) {
    if (usage.name !== "<dynamic>") {
      names.add(usage.name);
    }
  }
  return Array.from(names);
}

// src/scanner/git-scanner.ts
init_cjs_shims();
var import_simple_git = __toESM(require("simple-git"), 1);
init_logger();
var SECRET_VALUE_PATTERNS = [
  // API Keys
  /^sk[-_]live[-_][a-zA-Z0-9]{24,}/,
  /^sk[-_]test[-_][a-zA-Z0-9]{24,}/,
  /^pk[-_]live[-_][a-zA-Z0-9]{24,}/,
  /^pk[-_]test[-_][a-zA-Z0-9]{24,}/,
  // AWS
  /^AKIA[A-Z0-9]{16}/,
  /^[a-zA-Z0-9/+=]{40}/,
  // AWS secret key pattern
  // GitHub
  /^ghp_[a-zA-Z0-9]{36}/,
  /^gho_[a-zA-Z0-9]{36}/,
  /^github_pat_[a-zA-Z0-9_]{22,}/,
  // JWT
  /^eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/,
  // Generic secrets (long alphanumeric strings)
  /^[a-zA-Z0-9]{32,}/,
  // Database URLs with credentials
  /^(postgres|mysql|mongodb):\/\/[^:]+:[^@]+@/,
  // Private keys
  /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/
];
var SECRET_VAR_NAMES = [
  /password/i,
  /secret/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /access[_-]?token/i,
  /auth[_-]?token/i,
  /credentials?/i,
  /^AWS_SECRET/i,
  /^DATABASE_URL$/,
  /^REDIS_URL$/
];
async function scanGitHistory(options) {
  const { rootDir, depth = 100, files } = options;
  const results = [];
  let git;
  try {
    git = (0, import_simple_git.default)(rootDir);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return { results: [], error: "Not a git repository" };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { results: [], error: `Failed to initialize git: ${message}` };
  }
  try {
    const logOptions = [
      `-${depth}`,
      "--all",
      "--format=%H|%an|%ai",
      "-p"
      // Show patches
    ];
    if (files && files.length > 0) {
      logOptions.push("--", ...files);
    }
    const log = await git.raw(logOptions);
    const commits = parseGitLog(log);
    for (const commit of commits) {
      const secrets = findSecretsInDiff(commit.diff);
      for (const secret of secrets) {
        results.push({
          commit: commit.hash,
          author: commit.author,
          date: commit.date,
          file: secret.file,
          line: secret.line,
          variable: secret.variable,
          redactedValue: redactValue(secret.value)
        });
      }
    }
    logger.debug(`Scanned ${commits.length} commits, found ${results.length} potential secrets`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { results, error: `Git scan error: ${message}` };
  }
  return { results };
}
function parseGitLog(log) {
  const commits = [];
  const commitRegex = /^([a-f0-9]{40})\|([^|]*)\|([^|]*)\n([\s\S]*?)(?=\n[a-f0-9]{40}\||\n*$)/gm;
  let match;
  while ((match = commitRegex.exec(log)) !== null) {
    commits.push({
      hash: match[1],
      author: match[2],
      date: match[3],
      diff: match[4]
    });
  }
  if (commits.length === 0) {
    const lines = log.split("\n");
    let currentCommit = null;
    let diffLines = [];
    for (const line of lines) {
      const headerMatch = line.match(/^([a-f0-9]{40})\|([^|]*)\|(.*)$/);
      if (headerMatch) {
        if (currentCommit) {
          currentCommit.diff = diffLines.join("\n");
          commits.push(currentCommit);
        }
        currentCommit = {
          hash: headerMatch[1],
          author: headerMatch[2],
          date: headerMatch[3],
          diff: ""
        };
        diffLines = [];
      } else if (currentCommit) {
        diffLines.push(line);
      }
    }
    if (currentCommit) {
      currentCommit.diff = diffLines.join("\n");
      commits.push(currentCommit);
    }
  }
  return commits;
}
function findSecretsInDiff(diff) {
  const secrets = [];
  const lines = diff.split("\n");
  let currentFile = "";
  let lineNumber = 0;
  for (const line of lines) {
    const fileMatch = line.match(/^\+\+\+ b\/(.+)$/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      lineNumber = 0;
      continue;
    }
    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (hunkMatch) {
      lineNumber = parseInt(hunkMatch[1], 10) - 1;
      continue;
    }
    if (line.startsWith("+") && !line.startsWith("+++")) {
      lineNumber++;
      if (isEnvFile(currentFile) || containsEnvPattern(line)) {
        const envMatch = line.match(/^\+\s*([A-Z_][A-Z0-9_]*)=(.+)$/);
        if (envMatch) {
          const [, variable, value] = envMatch;
          if (isLikelySecret(variable, value)) {
            secrets.push({
              file: currentFile,
              line: lineNumber,
              variable,
              value
            });
          }
        }
      }
    } else if (!line.startsWith("-")) {
      lineNumber++;
    }
  }
  return secrets;
}
function isEnvFile(filename) {
  const envPatterns = [/^\.env/, /\.env$/, /\.env\./];
  return envPatterns.some((pattern) => pattern.test(filename));
}
function containsEnvPattern(line) {
  return /[A-Z_][A-Z0-9_]*=.+/.test(line);
}
function isLikelySecret(variable, value) {
  for (const pattern of SECRET_VAR_NAMES) {
    if (pattern.test(variable)) {
      return true;
    }
  }
  for (const pattern of SECRET_VALUE_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }
  if (value.length > 20 && hasHighEntropy(value)) {
    return true;
  }
  return false;
}
function hasHighEntropy(str) {
  const charCounts = {};
  for (const char of str) {
    charCounts[char] = (charCounts[char] || 0) + 1;
  }
  const uniqueChars = Object.keys(charCounts).length;
  const ratio = uniqueChars / str.length;
  return ratio > 0.4 && uniqueChars > 10;
}
function redactValue(value) {
  if (value.length <= 8) {
    return "****";
  }
  const visibleStart = value.slice(0, 4);
  const visibleEnd = value.slice(-4);
  return `${visibleStart}...${visibleEnd}`;
}
async function isGitRepository(rootDir) {
  try {
    const git = (0, import_simple_git.default)(rootDir);
    return await git.checkIsRepo();
  } catch {
    return false;
  }
}

// src/frameworks/index.ts
init_cjs_shims();
var import_node_path6 = require("path");
init_fs();
init_logger();
var FRAMEWORKS = {
  nextjs: {
    name: "nextjs",
    displayName: "Next.js",
    envPrefix: ["NEXT_PUBLIC_"],
    clientPrefix: ["NEXT_PUBLIC_"],
    serverOnly: false,
    configFiles: ["next.config.js", "next.config.mjs", "next.config.ts"]
  },
  vite: {
    name: "vite",
    displayName: "Vite",
    envPrefix: ["VITE_"],
    clientPrefix: ["VITE_"],
    serverOnly: false,
    configFiles: ["vite.config.js", "vite.config.ts", "vite.config.mjs"]
  },
  cra: {
    name: "cra",
    displayName: "Create React App",
    envPrefix: ["REACT_APP_"],
    clientPrefix: ["REACT_APP_"],
    serverOnly: false,
    configFiles: []
  },
  node: {
    name: "node",
    displayName: "Node.js",
    envPrefix: [],
    clientPrefix: [],
    serverOnly: true,
    configFiles: []
  }
};
async function detectFramework(rootDir) {
  logger.debug("Auto-detecting framework...");
  for (const [framework, info] of Object.entries(FRAMEWORKS)) {
    for (const configFile of info.configFiles) {
      const configPath = (0, import_node_path6.resolve)(rootDir, configFile);
      if (await fileExists(configPath)) {
        logger.debug(`Detected ${info.displayName} via ${configFile}`);
        return framework;
      }
    }
  }
  const packageJsonPath = (0, import_node_path6.resolve)(rootDir, "package.json");
  const packageJson = await readJsonFile(packageJsonPath);
  if (packageJson) {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    if ("next" in allDeps) {
      logger.debug("Detected Next.js via package.json");
      return "nextjs";
    }
    if ("vite" in allDeps) {
      logger.debug("Detected Vite via package.json");
      return "vite";
    }
    if ("react-scripts" in allDeps) {
      logger.debug("Detected Create React App via package.json");
      return "cra";
    }
  }
  logger.debug("No specific framework detected, defaulting to Node.js");
  return "node";
}
function getFrameworkInfo(framework) {
  if (framework === "auto") {
    return FRAMEWORKS.node;
  }
  return FRAMEWORKS[framework];
}
function isClientAccessible(variable, framework) {
  const info = getFrameworkInfo(framework);
  if (info.serverOnly) {
    return false;
  }
  return info.clientPrefix.some((prefix) => variable.startsWith(prefix));
}
function getEnvFilePatterns(framework) {
  const baseFiles = [".env", ".env.local"];
  switch (framework) {
    case "nextjs":
      return [
        ...baseFiles,
        ".env.development",
        ".env.development.local",
        ".env.production",
        ".env.production.local",
        ".env.test",
        ".env.test.local"
      ];
    case "vite":
      return [
        ...baseFiles,
        ".env.development",
        ".env.development.local",
        ".env.production",
        ".env.production.local"
      ];
    case "cra":
      return [
        ...baseFiles,
        ".env.development",
        ".env.development.local",
        ".env.production",
        ".env.production.local",
        ".env.test",
        ".env.test.local"
      ];
    default:
      return baseFiles;
  }
}
function validateFrameworkConvention(variable, framework, isClientSide) {
  const info = getFrameworkInfo(framework);
  if (info.serverOnly) {
    return { valid: true };
  }
  const hasClientPrefix = info.clientPrefix.some((prefix) => variable.startsWith(prefix));
  if (isClientSide && !hasClientPrefix) {
    return {
      valid: false,
      message: `Variable "${variable}" is used on client-side but doesn't have required prefix (${info.clientPrefix.join(" or ")})`
    };
  }
  return { valid: true };
}

// src/analyzers/missing.ts
init_cjs_shims();
function analyzeMissing(options) {
  const { definedVariables, usedVariables, config } = options;
  const issues = [];
  const definedNames = new Set(definedVariables.map((v) => v.name));
  const reported = /* @__PURE__ */ new Set();
  for (const usage of usedVariables) {
    const { name } = usage;
    if (name === "<dynamic>") {
      continue;
    }
    if (reported.has(name)) {
      continue;
    }
    if (definedNames.has(name)) {
      continue;
    }
    if (shouldIgnoreVariable(name, config.ignore, "missing")) {
      continue;
    }
    const varConfig = config.variables[name];
    if (varConfig?.default !== void 0) {
      continue;
    }
    const isRequired = varConfig?.required ?? false;
    const severity = isRequired ? "error" : "warning";
    reported.add(name);
    issues.push({
      type: "missing",
      severity,
      variable: name,
      message: `Variable "${name}" is used in code but not defined in any .env file`,
      location: {
        file: usage.file,
        line: usage.line,
        column: usage.column
      },
      fix: `Add ${name}= to your .env file`
    });
  }
  for (const [name, rule] of Object.entries(config.variables)) {
    if (!rule.required) continue;
    if (definedNames.has(name)) continue;
    if (reported.has(name)) continue;
    if (shouldIgnoreVariable(name, config.ignore, "missing")) continue;
    reported.add(name);
    issues.push({
      type: "missing",
      severity: "error",
      variable: name,
      message: `Required variable "${name}" is not defined in any .env file`,
      fix: `Add ${name}= to your .env file`
    });
  }
  return issues;
}
function getMissingSummary(issues) {
  const required = [];
  const optional = [];
  for (const issue of issues) {
    if (issue.type !== "missing") continue;
    if (issue.severity === "error") {
      required.push(issue.variable);
    } else {
      optional.push(issue.variable);
    }
  }
  return { required, optional };
}

// src/analyzers/unused.ts
init_cjs_shims();
var COMMON_RUNTIME_VARS = /* @__PURE__ */ new Set([
  "NODE_ENV",
  "PORT",
  "HOST",
  "DEBUG",
  "LOG_LEVEL",
  "TZ",
  "CI",
  "HOME",
  "PATH",
  "SHELL",
  "USER",
  "TERM"
]);
var FRAMEWORK_VARS = {
  nextjs: /* @__PURE__ */ new Set([
    "NEXT_TELEMETRY_DISABLED",
    "NEXT_RUNTIME",
    "VERCEL",
    "VERCEL_ENV",
    "VERCEL_URL",
    "VERCEL_REGION"
  ]),
  vite: /* @__PURE__ */ new Set(["VITE_CJS_TRACE", "VITE_CJS_IGNORE_WARNING"]),
  cra: /* @__PURE__ */ new Set(["BROWSER", "GENERATE_SOURCEMAP", "CI"]),
  node: /* @__PURE__ */ new Set([])
};
function analyzeUnused(options) {
  const { definedVariables, usedVariables, config, framework } = options;
  const issues = [];
  const usedNames = new Set(
    usedVariables.filter((u) => u.name !== "<dynamic>").map((u) => u.name)
  );
  const frameworkVars = FRAMEWORK_VARS[framework] || /* @__PURE__ */ new Set();
  for (const variable of definedVariables) {
    const { name, file, line } = variable;
    if (usedNames.has(name)) {
      continue;
    }
    if (COMMON_RUNTIME_VARS.has(name)) {
      continue;
    }
    if (frameworkVars.has(name)) {
      continue;
    }
    if (shouldIgnoreVariable(name, config.ignore, "unused")) {
      continue;
    }
    if (isPlaceholderValue(variable.value)) {
      continue;
    }
    issues.push({
      type: "unused",
      severity: "warning",
      variable: name,
      message: `Variable "${name}" is defined in ${file} but never used in code`,
      location: {
        file,
        line
      },
      context: {
        value: variable.value ? "[set]" : "[empty]"
      }
    });
  }
  return issues;
}
function isPlaceholderValue(value) {
  if (!value) return true;
  const placeholderPatterns = [
    /^your[-_]?/i,
    /^xxx+$/i,
    /^placeholder$/i,
    /^changeme$/i,
    /^todo$/i,
    /^<.*>$/,
    /^\[.*\]$/,
    /^example[-_]?/i
  ];
  return placeholderPatterns.some((pattern) => pattern.test(value));
}
function getUnusedSummary(issues) {
  const byFile = {};
  let count = 0;
  for (const issue of issues) {
    if (issue.type !== "unused") continue;
    count++;
    const file = issue.location?.file || "unknown";
    if (!byFile[file]) {
      byFile[file] = [];
    }
    byFile[file].push(issue.variable);
  }
  return { count, byFile };
}

// src/analyzers/type-mismatch.ts
init_cjs_shims();
function analyzeTypeMismatch(options) {
  const { definedVariables, usedVariables, config } = options;
  const issues = [];
  const definedMap = /* @__PURE__ */ new Map();
  for (const variable of definedVariables) {
    definedMap.set(variable.name, variable);
  }
  const usagesByName = /* @__PURE__ */ new Map();
  for (const usage of usedVariables) {
    if (usage.name === "<dynamic>") continue;
    const existing = usagesByName.get(usage.name) || [];
    existing.push(usage);
    usagesByName.set(usage.name, existing);
  }
  const checked = /* @__PURE__ */ new Set();
  for (const [name, usages] of usagesByName) {
    if (checked.has(name)) continue;
    checked.add(name);
    if (shouldIgnoreVariable(name, config.ignore, "type-mismatch")) {
      continue;
    }
    const defined = definedMap.get(name);
    if (!defined) continue;
    const value = defined.value;
    const varConfig = config.variables[name];
    if (varConfig?.type) {
      const typeIssue = validateType(name, value, varConfig.type, defined);
      if (typeIssue) {
        issues.push(typeIssue);
        continue;
      }
    }
    if (varConfig?.pattern) {
      if (!varConfig.pattern.test(value)) {
        issues.push({
          type: "invalid-value",
          severity: "error",
          variable: name,
          message: `Value of "${name}" doesn't match required pattern`,
          location: {
            file: defined.file,
            line: defined.line
          },
          context: {
            pattern: varConfig.pattern.toString(),
            value: maskSensitiveValue(value, defined.isSecret)
          }
        });
        continue;
      }
    }
    if (varConfig?.enum && varConfig.enum.length > 0) {
      if (!varConfig.enum.includes(value)) {
        issues.push({
          type: "invalid-value",
          severity: "error",
          variable: name,
          message: `Value of "${name}" must be one of: ${varConfig.enum.join(", ")}`,
          location: {
            file: defined.file,
            line: defined.line
          },
          context: {
            expected: varConfig.enum,
            actual: maskSensitiveValue(value, defined.isSecret)
          }
        });
        continue;
      }
    }
    const inferredTypes = usages.map((u) => u.inferredType).filter((t) => t !== void 0);
    if (inferredTypes.length > 0) {
      const primaryType = getMostCommonType(inferredTypes);
      if (primaryType) {
        const typeIssue = validateInferredType(name, value, primaryType, defined, usages[0]);
        if (typeIssue) {
          issues.push(typeIssue);
        }
      }
    }
  }
  return issues;
}
function validateType(name, value, type, defined) {
  switch (type) {
    case "number":
      if (!/^-?\d+(\.\d+)?$/.test(value)) {
        return {
          type: "type-mismatch",
          severity: "error",
          variable: name,
          message: `Variable "${name}" should be a number but value "${maskSensitiveValue(value, defined.isSecret)}" is not numeric`,
          location: { file: defined.file, line: defined.line },
          fix: "Update the value to be a valid number"
        };
      }
      break;
    case "boolean":
      if (!["true", "false", "1", "0", "yes", "no"].includes(value.toLowerCase())) {
        return {
          type: "type-mismatch",
          severity: "error",
          variable: name,
          message: `Variable "${name}" should be a boolean but value "${maskSensitiveValue(value, defined.isSecret)}" is not valid`,
          location: { file: defined.file, line: defined.line },
          fix: "Use true, false, 1, 0, yes, or no"
        };
      }
      break;
    case "json":
      try {
        JSON.parse(value);
      } catch {
        return {
          type: "type-mismatch",
          severity: "error",
          variable: name,
          message: `Variable "${name}" should be valid JSON but value is not parseable`,
          location: { file: defined.file, line: defined.line },
          fix: "Ensure the value is valid JSON"
        };
      }
      break;
    case "url":
      try {
        new URL(value);
      } catch {
        return {
          type: "type-mismatch",
          severity: "error",
          variable: name,
          message: `Variable "${name}" should be a valid URL`,
          location: { file: defined.file, line: defined.line },
          fix: "Provide a valid URL (e.g., https://example.com)"
        };
      }
      break;
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return {
          type: "type-mismatch",
          severity: "error",
          variable: name,
          message: `Variable "${name}" should be a valid email address`,
          location: { file: defined.file, line: defined.line },
          fix: "Provide a valid email address"
        };
      }
      break;
  }
  return null;
}
function validateInferredType(name, value, inferredType, defined, usage) {
  const actualType = inferValueType(value);
  if (!value) return null;
  switch (inferredType) {
    case "number":
      if (actualType !== "number") {
        return {
          type: "type-mismatch",
          severity: "warning",
          variable: name,
          message: `Variable "${name}" is used as a number at ${usage.file}:${usage.line} but value "${maskSensitiveValue(value, defined.isSecret)}" is not numeric`,
          location: { file: defined.file, line: defined.line },
          context: {
            usedAt: `${usage.file}:${usage.line}`
          }
        };
      }
      break;
    case "boolean":
      if (!["true", "false", "1", "0"].includes(value.toLowerCase())) {
        return {
          type: "type-mismatch",
          severity: "warning",
          variable: name,
          message: `Variable "${name}" is used as a boolean at ${usage.file}:${usage.line} but value may not be valid`,
          location: { file: defined.file, line: defined.line },
          context: {
            usedAt: `${usage.file}:${usage.line}`
          }
        };
      }
      break;
    case "json":
      if (actualType !== "json") {
        try {
          JSON.parse(value);
        } catch {
          return {
            type: "type-mismatch",
            severity: "warning",
            variable: name,
            message: `Variable "${name}" is parsed as JSON at ${usage.file}:${usage.line} but value is not valid JSON`,
            location: { file: defined.file, line: defined.line },
            context: {
              usedAt: `${usage.file}:${usage.line}`
            }
          };
        }
      }
      break;
    case "array":
      if (!value.includes(",")) {
        return {
          type: "type-mismatch",
          severity: "info",
          variable: name,
          message: `Variable "${name}" is used as an array at ${usage.file}:${usage.line} but value doesn't contain comma separators`,
          location: { file: defined.file, line: defined.line },
          context: {
            usedAt: `${usage.file}:${usage.line}`
          }
        };
      }
      break;
  }
  return null;
}
function getMostCommonType(types) {
  const counts = {};
  for (const type of types) {
    counts[type] = (counts[type] || 0) + 1;
  }
  let maxCount = 0;
  let maxType;
  for (const [type, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxType = type;
    }
  }
  return maxType;
}
function maskSensitiveValue(value, isSecret) {
  if (!isSecret) return value;
  if (value.length <= 4) return "****";
  return value.slice(0, 2) + "****" + value.slice(-2);
}

// src/analyzers/sync-check.ts
init_cjs_shims();
function analyzeSyncDrift(options) {
  const { envVariables, templateVariables, templateFile } = options;
  const issues = [];
  const envNames = new Set(envVariables.map((v) => v.name));
  const templateNames = new Set(templateVariables.map((v) => v.name));
  const missingFromTemplate = [];
  const missingFromEnv = [];
  for (const variable of envVariables) {
    if (!templateNames.has(variable.name)) {
      missingFromTemplate.push(variable.name);
      issues.push({
        type: "sync-drift",
        severity: "warning",
        variable: variable.name,
        message: `Variable "${variable.name}" is defined in ${variable.file} but not in ${templateFile}`,
        location: {
          file: variable.file,
          line: variable.line
        },
        fix: `Add ${variable.name}= to ${templateFile}`
      });
    }
  }
  for (const variable of templateVariables) {
    if (!envNames.has(variable.name)) {
      missingFromEnv.push(variable.name);
      issues.push({
        type: "sync-drift",
        severity: "info",
        variable: variable.name,
        message: `Variable "${variable.name}" is in ${templateFile} but not defined in any .env file`,
        location: {
          file: templateFile,
          line: variable.line
        },
        fix: `Add ${variable.name}= to your .env file`
      });
    }
  }
  const inSync = missingFromTemplate.length === 0 && missingFromEnv.length === 0;
  return {
    issues,
    missingFromTemplate,
    missingFromEnv,
    inSync
  };
}
function generateTemplate(variables, options = {}) {
  const { includeComments = true, groupByPrefix = true, maskSecrets = true } = options;
  const lines = [];
  if (includeComments) {
    lines.push("# Environment Variables Template");
    lines.push("# Copy this file to .env and fill in the values");
    lines.push("");
  }
  if (groupByPrefix) {
    const groups = {};
    for (const variable of variables) {
      const prefix = getPrefix(variable.name);
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix].push(variable);
    }
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    for (const [prefix, vars] of sortedGroups) {
      if (includeComments && prefix) {
        lines.push(`# ${formatPrefixName(prefix)}`);
      }
      for (const variable of vars.sort((a, b) => a.name.localeCompare(b.name))) {
        lines.push(formatTemplateVariable(variable, maskSecrets));
      }
      lines.push("");
    }
  } else {
    const sorted = [...variables].sort((a, b) => a.name.localeCompare(b.name));
    for (const variable of sorted) {
      lines.push(formatTemplateVariable(variable, maskSecrets));
    }
  }
  return lines.join("\n");
}
function getPrefix(name) {
  const prefixes = [
    "NEXT_PUBLIC_",
    "REACT_APP_",
    "VITE_",
    "DATABASE_",
    "DB_",
    "REDIS_",
    "AWS_",
    "STRIPE_",
    "AUTH_",
    "API_",
    "APP_"
  ];
  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) {
      return prefix;
    }
  }
  const parts = name.split("_");
  if (parts.length > 1) {
    return parts[0] + "_";
  }
  return "";
}
function formatPrefixName(prefix) {
  return prefix.replace(/_$/, "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
function formatTemplateVariable(variable, maskSecrets) {
  let value = "";
  if (variable.value && !maskSecrets) {
    value = variable.value;
  } else if (variable.isSecret) {
    value = "";
  } else if (variable.value) {
    value = getExampleValue(variable);
  }
  return `${variable.name}=${value}`;
}
function getExampleValue(variable) {
  const { name, value } = variable;
  if (name.includes("URL") || name.includes("URI")) {
    if (value.startsWith("postgres://")) return "postgres://user:pass@localhost:5432/db";
    if (value.startsWith("mysql://")) return "mysql://user:pass@localhost:3306/db";
    if (value.startsWith("mongodb://")) return "mongodb://localhost:27017/db";
    if (value.startsWith("redis://")) return "redis://localhost:6379";
    if (value.startsWith("http")) return "https://example.com";
    return "";
  }
  if (/^\d+$/.test(value)) {
    return value;
  }
  if (["true", "false"].includes(value.toLowerCase())) {
    return value;
  }
  if (name === "NODE_ENV") {
    return "development";
  }
  return "";
}
function compareTemplateWithEnv(template, env) {
  const templateMap = new Map(template.map((v) => [v.name, v]));
  const envMap = new Map(env.map((v) => [v.name, v]));
  const added = [];
  const removed = [];
  const changed = [];
  for (const [name] of envMap) {
    if (!templateMap.has(name)) {
      added.push(name);
    }
  }
  for (const [name] of templateMap) {
    if (!envMap.has(name)) {
      removed.push(name);
    }
  }
  for (const [name, envVar] of envMap) {
    const templateVar = templateMap.get(name);
    if (templateVar && templateVar.value && envVar.value) {
      if (templateVar.value !== envVar.value && !envVar.isSecret) {
        changed.push({
          name,
          templateValue: templateVar.value,
          envValue: envVar.value
        });
      }
    }
  }
  return { added, removed, changed };
}

// src/analyzers/secret-patterns.ts
init_cjs_shims();
var SECRET_NAME_PATTERNS = [
  // Generic patterns
  { pattern: /password/i },
  { pattern: /secret/i },
  { pattern: /private[_-]?key/i },
  { pattern: /api[_-]?key/i },
  { pattern: /auth[_-]?token/i },
  { pattern: /access[_-]?token/i },
  { pattern: /refresh[_-]?token/i },
  { pattern: /bearer/i },
  { pattern: /credential/i },
  { pattern: /connection[_-]?string/i },
  // Provider-specific
  { pattern: /^AWS_SECRET/i, provider: "AWS" },
  { pattern: /^AWS_ACCESS_KEY/i, provider: "AWS" },
  { pattern: /^STRIPE_SECRET/i, provider: "Stripe" },
  { pattern: /^STRIPE_WEBHOOK_SECRET/i, provider: "Stripe" },
  { pattern: /^GITHUB_TOKEN/i, provider: "GitHub" },
  { pattern: /^GH_TOKEN/i, provider: "GitHub" },
  { pattern: /^GOOGLE_APPLICATION_CREDENTIALS/i, provider: "Google" },
  { pattern: /^FIREBASE_/i, provider: "Firebase" },
  { pattern: /^TWILIO_AUTH_TOKEN/i, provider: "Twilio" },
  { pattern: /^SENDGRID_API_KEY/i, provider: "SendGrid" },
  { pattern: /^MAILGUN_API_KEY/i, provider: "Mailgun" },
  { pattern: /^SLACK_TOKEN/i, provider: "Slack" },
  { pattern: /^DISCORD_TOKEN/i, provider: "Discord" },
  { pattern: /^OPENAI_API_KEY/i, provider: "OpenAI" },
  { pattern: /^ANTHROPIC_API_KEY/i, provider: "Anthropic" },
  { pattern: /^SENTRY_DSN/i, provider: "Sentry" },
  { pattern: /^DATADOG_API_KEY/i, provider: "Datadog" }
];
var SECRET_VALUE_PATTERNS2 = [
  // Stripe
  { pattern: /^sk_live_[a-zA-Z0-9]{24,}/, type: "Stripe live secret key" },
  { pattern: /^sk_test_[a-zA-Z0-9]{24,}/, type: "Stripe test secret key" },
  { pattern: /^rk_live_[a-zA-Z0-9]{24,}/, type: "Stripe restricted key" },
  // AWS
  { pattern: /^AKIA[A-Z0-9]{16}/, type: "AWS access key" },
  { pattern: /^[a-zA-Z0-9/+=]{40}$/, type: "Possible AWS secret key" },
  // GitHub
  { pattern: /^ghp_[a-zA-Z0-9]{36}/, type: "GitHub personal access token" },
  { pattern: /^gho_[a-zA-Z0-9]{36}/, type: "GitHub OAuth token" },
  { pattern: /^ghu_[a-zA-Z0-9]{36}/, type: "GitHub user-to-server token" },
  { pattern: /^ghs_[a-zA-Z0-9]{36}/, type: "GitHub server-to-server token" },
  { pattern: /^github_pat_[a-zA-Z0-9_]{22,}/, type: "GitHub PAT" },
  // JWT
  { pattern: /^eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/, type: "JWT token" },
  // Private keys
  { pattern: /-----BEGIN RSA PRIVATE KEY-----/, type: "RSA private key" },
  { pattern: /-----BEGIN EC PRIVATE KEY-----/, type: "EC private key" },
  { pattern: /-----BEGIN OPENSSH PRIVATE KEY-----/, type: "OpenSSH private key" },
  { pattern: /-----BEGIN PRIVATE KEY-----/, type: "Private key" },
  // Generic API keys (high entropy strings)
  { pattern: /^[a-zA-Z0-9]{32,64}$/, type: "Possible API key" },
  // Database URLs with credentials
  {
    pattern: /^(postgres|postgresql|mysql|mongodb|redis):\/\/[^:]+:[^@]+@/,
    type: "Database URL with credentials"
  },
  // Google
  { pattern: /^AIza[a-zA-Z0-9_-]{35}/, type: "Google API key" },
  // Slack
  { pattern: /^xox[baprs]-[a-zA-Z0-9-]+/, type: "Slack token" },
  // Twilio
  { pattern: /^AC[a-zA-Z0-9]{32}/, type: "Twilio Account SID" },
  { pattern: /^SK[a-zA-Z0-9]{32}/, type: "Twilio API Key" }
];
function analyzeSecrets(options) {
  const { variables, customPatterns = [], ignorePatterns = [] } = options;
  const issues = [];
  for (const variable of variables) {
    const { name, value, file, line, isSecret } = variable;
    if (shouldIgnoreVariable(name, ignorePatterns, "secret")) {
      continue;
    }
    if (isSecret && !value) {
      continue;
    }
    const nameMatch = findSecretNamePattern(name);
    const valueMatch = value ? findSecretValuePattern(value) : null;
    const customMatch = customPatterns.find((p) => p.test(name) || value && p.test(value));
    if ((nameMatch || valueMatch || customMatch) && value) {
      const provider = nameMatch?.provider;
      const secretType = valueMatch?.type;
      let message = `Variable "${name}" appears to be a secret`;
      if (provider) {
        message += ` (${provider})`;
      }
      if (secretType) {
        message += ` - detected as ${secretType}`;
      }
      if (!isPlaceholderValue2(value)) {
        issues.push({
          type: "secret-exposed",
          severity: "error",
          variable: name,
          message: message + ". Consider using a secure vault or removing from version control.",
          location: { file, line },
          context: {
            provider,
            secretType,
            valuePreview: redactValue2(value)
          },
          fix: "Use environment-specific configuration or a secrets manager"
        });
      }
    }
  }
  return issues;
}
function findSecretNamePattern(name) {
  for (const { pattern, provider } of SECRET_NAME_PATTERNS) {
    if (pattern.test(name)) {
      return { pattern, provider };
    }
  }
  return null;
}
function findSecretValuePattern(value) {
  for (const { pattern, type } of SECRET_VALUE_PATTERNS2) {
    if (pattern.test(value)) {
      return { pattern, type };
    }
  }
  return null;
}
function isPlaceholderValue2(value) {
  const placeholderPatterns = [
    /^your[-_]?/i,
    /^xxx+$/i,
    /^placeholder$/i,
    /^changeme$/i,
    /^todo$/i,
    /^<.*>$/,
    /^\[.*\]$/,
    /^example[-_]?/i,
    /^test[-_]?/i,
    /^dummy[-_]?/i,
    /^fake[-_]?/i,
    /^sample[-_]?/i
  ];
  return placeholderPatterns.some((pattern) => pattern.test(value));
}
function redactValue2(value) {
  if (value.length <= 8) {
    return "****";
  }
  return value.slice(0, 4) + "..." + value.slice(-4);
}
function isSecretVariable2(name, value) {
  const nameMatch = findSecretNamePattern(name);
  if (nameMatch) return true;
  if (value) {
    const valueMatch = findSecretValuePattern(value);
    if (valueMatch) return true;
  }
  return false;
}
function getSecurityRecommendations(issues) {
  const recommendations = [];
  const secretIssues = issues.filter((i) => i.type === "secret-exposed");
  if (secretIssues.length > 0) {
    recommendations.push("Add .env files to .gitignore to prevent committing secrets");
    recommendations.push("Consider using a secrets manager like AWS Secrets Manager, HashiCorp Vault, or Doppler");
    recommendations.push("Use .env.example with placeholder values for documentation");
    recommendations.push("Enable git pre-commit hooks to scan for secrets before committing");
  }
  const providers = new Set(
    secretIssues.map((i) => i.context?.provider).filter(Boolean)
  );
  if (providers.has("AWS")) {
    recommendations.push("Consider using AWS IAM roles instead of access keys where possible");
  }
  if (providers.has("Stripe")) {
    recommendations.push("Use Stripe restricted API keys with minimal permissions in production");
  }
  return recommendations;
}

// src/reporters/console.ts
init_cjs_shims();
var import_picocolors2 = __toESM(require("picocolors"), 1);
var SEVERITY_ICONS = {
  error: import_picocolors2.default.red("\u2717"),
  warning: import_picocolors2.default.yellow("\u26A0"),
  info: import_picocolors2.default.blue("\u2139")
};
var SEVERITY_COLORS = {
  error: import_picocolors2.default.red,
  warning: import_picocolors2.default.yellow,
  info: import_picocolors2.default.blue
};
var ISSUE_TYPE_LABELS = {
  missing: "Missing Variables",
  unused: "Unused Variables",
  "type-mismatch": "Type Mismatches",
  "sync-drift": "Sync Drift",
  "secret-exposed": "Exposed Secrets",
  "invalid-value": "Invalid Values",
  "dynamic-access": "Dynamic Access"
};
function reportToConsole(result, options = {}) {
  const { verbose = false, maxIssuesPerCategory = 10 } = options;
  console.log();
  console.log(import_picocolors2.default.bold(import_picocolors2.default.cyan("env-doctor")) + import_picocolors2.default.gray(" v1.0.0"));
  console.log();
  const issuesByType = groupIssuesByType(result.issues);
  console.log(import_picocolors2.default.gray(`Framework: ${result.framework}`));
  console.log(
    import_picocolors2.default.gray(
      `Scanned ${result.stats.filesScanned} files, ${result.definedVariables.length} env variables`
    )
  );
  console.log();
  let hasIssues = false;
  for (const [type, issues] of Object.entries(issuesByType)) {
    if (issues.length === 0) continue;
    hasIssues = true;
    const label = ISSUE_TYPE_LABELS[type] || type;
    const severity = issues[0].severity;
    const icon = SEVERITY_ICONS[severity];
    const color = SEVERITY_COLORS[severity];
    console.log(color(import_picocolors2.default.bold(`${icon} ${label} (${issues.length} ${issues.length === 1 ? "issue" : "issues"})`)));
    console.log();
    const displayIssues = issues.slice(0, maxIssuesPerCategory);
    for (const issue of displayIssues) {
      printIssue(issue, verbose);
    }
    if (issues.length > maxIssuesPerCategory) {
      console.log(
        import_picocolors2.default.gray(`  ... and ${issues.length - maxIssuesPerCategory} more`)
      );
    }
    console.log();
  }
  if (!issuesByType["sync-drift"]?.length && result.templateVariables) {
    console.log(import_picocolors2.default.green("\u2713 ") + import_picocolors2.default.bold("Sync Check"));
    console.log(import_picocolors2.default.gray("  .env and template are in sync"));
    console.log();
  }
  printSummary(result);
  if (result.stats.errorCount > 0) {
    console.log();
    console.log(import_picocolors2.default.bold("Recommendations:"));
    console.log(import_picocolors2.default.gray("  Run `env-doctor fix` to interactively resolve issues"));
    console.log(import_picocolors2.default.gray("  Run `env-doctor init` to generate a .env.example file"));
  }
  if (!hasIssues) {
    console.log(import_picocolors2.default.green(import_picocolors2.default.bold("\u2713 No issues found!")));
    console.log();
  }
}
function printIssue(issue, verbose) {
  const { variable, message, location, fix } = issue;
  console.log(`  ${import_picocolors2.default.bold(variable)}`);
  console.log(`    ${import_picocolors2.default.gray(message)}`);
  if (location) {
    const loc = location.column ? `${location.file}:${location.line}:${location.column}` : `${location.file}:${location.line}`;
    console.log(`    ${import_picocolors2.default.dim("at")} ${import_picocolors2.default.cyan(loc)}`);
  }
  if (fix && verbose) {
    console.log(`    ${import_picocolors2.default.green("fix:")} ${fix}`);
  }
  console.log();
}
function printSummary(result) {
  const { errorCount, warningCount, infoCount, duration } = result.stats;
  console.log(import_picocolors2.default.gray("\u2500".repeat(50)));
  console.log();
  const parts = [];
  if (errorCount > 0) {
    parts.push(import_picocolors2.default.red(`${errorCount} ${errorCount === 1 ? "error" : "errors"}`));
  }
  if (warningCount > 0) {
    parts.push(import_picocolors2.default.yellow(`${warningCount} ${warningCount === 1 ? "warning" : "warnings"}`));
  }
  if (infoCount > 0) {
    parts.push(import_picocolors2.default.blue(`${infoCount} info`));
  }
  if (parts.length > 0) {
    console.log(`Summary: ${parts.join(", ")}`);
  } else {
    console.log(import_picocolors2.default.green("Summary: All checks passed!"));
  }
  console.log(import_picocolors2.default.gray(`Completed in ${duration}ms`));
  console.log();
}
function groupIssuesByType(issues) {
  const groups = {};
  for (const type of Object.keys(ISSUE_TYPE_LABELS)) {
    groups[type] = [];
  }
  for (const issue of issues) {
    if (!groups[issue.type]) {
      groups[issue.type] = [];
    }
    groups[issue.type].push(issue);
  }
  return groups;
}
function reportForCI(result) {
  for (const issue of result.issues) {
    const level = issue.severity === "error" ? "error" : issue.severity === "warning" ? "warning" : "notice";
    const location = issue.location ? `${issue.location.file}:${issue.location.line}` : "";
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::${level} file=${location}::${issue.message}`);
    } else {
      console.log(`[${level.toUpperCase()}] ${location ? location + ": " : ""}${issue.message}`);
    }
  }
  const { errorCount, warningCount } = result.stats;
  if (errorCount > 0) {
    console.log(`
Found ${errorCount} error(s) and ${warningCount} warning(s)`);
  }
}
function createSpinner(text) {
  const frames = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
  let frameIndex = 0;
  let intervalId = null;
  let currentText = text;
  const isTTY = process.stdout.isTTY;
  return {
    start() {
      if (isTTY) {
        process.stdout.write(`${import_picocolors2.default.cyan(frames[frameIndex])} ${currentText}`);
        intervalId = setInterval(() => {
          frameIndex = (frameIndex + 1) % frames.length;
          process.stdout.clearLine?.(0);
          process.stdout.cursorTo?.(0);
          process.stdout.write(`${import_picocolors2.default.cyan(frames[frameIndex])} ${currentText}`);
        }, 80);
      } else {
        console.log(`${import_picocolors2.default.cyan("...")} ${currentText}`);
      }
    },
    stop(success = true) {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      const icon = success ? import_picocolors2.default.green("\u2713") : import_picocolors2.default.red("\u2717");
      if (isTTY) {
        process.stdout.clearLine?.(0);
        process.stdout.cursorTo?.(0);
      }
      console.log(`${icon} ${currentText}`);
    },
    update(newText) {
      currentText = newText;
    }
  };
}

// src/reporters/json.ts
init_cjs_shims();
function toJSONReport(result) {
  return {
    version: "1.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    framework: result.framework,
    summary: {
      totalIssues: result.issues.length,
      errors: result.stats.errorCount,
      warnings: result.stats.warningCount,
      info: result.stats.infoCount,
      filesScanned: result.stats.filesScanned,
      envFilesParsed: result.stats.envFilesParsed,
      duration: result.stats.duration
    },
    issues: result.issues.map(issueToJSON),
    variables: {
      defined: result.definedVariables.map((v) => ({
        name: v.name,
        file: v.file,
        line: v.line,
        hasValue: Boolean(v.value),
        isSecret: v.isSecret ?? false
      })),
      used: result.usedVariables.map((u) => ({
        name: u.name,
        file: u.file,
        line: u.line,
        accessPattern: u.accessPattern,
        isClientSide: u.isClientSide ?? false
      }))
    }
  };
}
function issueToJSON(issue) {
  return {
    type: issue.type,
    severity: issue.severity,
    variable: issue.variable,
    message: issue.message,
    location: issue.location,
    fix: issue.fix,
    context: issue.context
  };
}
function reportToJSON(result) {
  const report = toJSONReport(result);
  return JSON.stringify(report, null, 2);
}
function reportToJSONCompact(result) {
  const report = toJSONReport(result);
  return JSON.stringify(report);
}
function parseJSONReport(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
function mergeJSONReports(reports) {
  if (reports.length === 0) {
    throw new Error("No reports to merge");
  }
  const merged = {
    version: reports[0].version,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    framework: reports[0].framework,
    summary: {
      totalIssues: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      filesScanned: 0,
      envFilesParsed: 0,
      duration: 0
    },
    issues: [],
    variables: {
      defined: [],
      used: []
    }
  };
  const seenIssues = /* @__PURE__ */ new Set();
  const seenDefinedVars = /* @__PURE__ */ new Set();
  const seenUsedVars = /* @__PURE__ */ new Set();
  for (const report of reports) {
    merged.summary.totalIssues += report.summary.totalIssues;
    merged.summary.errors += report.summary.errors;
    merged.summary.warnings += report.summary.warnings;
    merged.summary.info += report.summary.info;
    merged.summary.filesScanned += report.summary.filesScanned;
    merged.summary.envFilesParsed += report.summary.envFilesParsed;
    merged.summary.duration = Math.max(merged.summary.duration, report.summary.duration);
    for (const issue of report.issues) {
      const key = `${issue.type}:${issue.variable}:${issue.location?.file}:${issue.location?.line}`;
      if (!seenIssues.has(key)) {
        seenIssues.add(key);
        merged.issues.push(issue);
      }
    }
    for (const v of report.variables.defined) {
      const key = `${v.name}:${v.file}`;
      if (!seenDefinedVars.has(key)) {
        seenDefinedVars.add(key);
        merged.variables.defined.push(v);
      }
    }
    for (const v of report.variables.used) {
      const key = `${v.name}:${v.file}:${v.line}`;
      if (!seenUsedVars.has(key)) {
        seenUsedVars.add(key);
        merged.variables.used.push(v);
      }
    }
  }
  return merged;
}

// src/reporters/sarif.ts
init_cjs_shims();
var TOOL_NAME = "env-doctor";
var TOOL_VERSION = "1.0.0";
var TOOL_INFO_URI = "https://github.com/yourusername/env-doctor";
var RULE_DEFINITIONS = {
  missing: {
    name: "MissingEnvVariable",
    shortDescription: "Environment variable is used but not defined",
    fullDescription: "A environment variable is referenced in the code but not defined in any .env file. This could cause runtime errors or unexpected behavior."
  },
  unused: {
    name: "UnusedEnvVariable",
    shortDescription: "Environment variable is defined but never used",
    fullDescription: "An environment variable is defined in a .env file but never referenced in the codebase. This could indicate dead configuration or a typo."
  },
  "type-mismatch": {
    name: "TypeMismatch",
    shortDescription: "Environment variable value type does not match usage",
    fullDescription: "The value of an environment variable does not match how it is used in the code. For example, using parseInt() on a non-numeric value."
  },
  "sync-drift": {
    name: "SyncDrift",
    shortDescription: "Environment files are out of sync",
    fullDescription: "The .env file and .env.example (or other template) have different variables defined. This can cause issues when setting up new environments."
  },
  "secret-exposed": {
    name: "SecretExposed",
    shortDescription: "Potential secret value detected",
    fullDescription: "A variable that appears to contain a secret (API key, password, token) has a value that looks like a real credential. Secrets should not be committed to version control."
  },
  "invalid-value": {
    name: "InvalidValue",
    shortDescription: "Environment variable has an invalid value",
    fullDescription: "The value of an environment variable does not match the expected format or constraints defined in the configuration."
  },
  "dynamic-access": {
    name: "DynamicAccess",
    shortDescription: "Dynamic environment variable access detected",
    fullDescription: "Environment variables are being accessed dynamically, which makes it difficult to statically analyze which variables are used."
  }
};
function severityToLevel(severity) {
  switch (severity) {
    case "error":
      return "error";
    case "warning":
      return "warning";
    default:
      return "note";
  }
}
function getDefaultLevel(type) {
  switch (type) {
    case "missing":
    case "secret-exposed":
    case "invalid-value":
      return "error";
    case "unused":
    case "type-mismatch":
    case "sync-drift":
      return "warning";
    case "dynamic-access":
      return "note";
    default:
      return "warning";
  }
}
function createRules(issues) {
  const usedTypes = new Set(issues.map((i) => i.type));
  const rules = [];
  for (const type of usedTypes) {
    const def = RULE_DEFINITIONS[type];
    if (def) {
      rules.push({
        id: `env-doctor/${type}`,
        name: def.name,
        shortDescription: { text: def.shortDescription },
        fullDescription: { text: def.fullDescription },
        defaultConfiguration: { level: getDefaultLevel(type) },
        helpUri: `${TOOL_INFO_URI}#${type}`
      });
    }
  }
  return rules;
}
function issueToResult(issue) {
  const location = issue.location || { file: ".env", line: 1 };
  return {
    ruleId: `env-doctor/${issue.type}`,
    level: severityToLevel(issue.severity),
    message: { text: issue.message },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: location.file },
          region: {
            startLine: location.line,
            startColumn: location.column
          }
        }
      }
    ]
  };
}
function toSARIF(result) {
  const run = {
    tool: {
      driver: {
        name: TOOL_NAME,
        version: TOOL_VERSION,
        informationUri: TOOL_INFO_URI,
        rules: createRules(result.issues)
      }
    },
    results: result.issues.map(issueToResult)
  };
  return {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [run]
  };
}
function reportToSARIF(result) {
  const sarif = toSARIF(result);
  return JSON.stringify(sarif, null, 2);
}
function createMinimalSARIF(issues) {
  const run = {
    tool: {
      driver: {
        name: TOOL_NAME,
        version: TOOL_VERSION,
        informationUri: TOOL_INFO_URI,
        rules: createRules(issues)
      }
    },
    results: issues.map(issueToResult)
  };
  return {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [run]
  };
}
function mergeSARIF(reports) {
  if (reports.length === 0) {
    throw new Error("No reports to merge");
  }
  const allRuns = [];
  for (const report of reports) {
    allRuns.push(...report.runs);
  }
  return {
    $schema: reports[0].$schema,
    version: reports[0].version,
    runs: allRuns
  };
}
function validateSARIF(sarif) {
  if (!sarif || typeof sarif !== "object") return false;
  const s = sarif;
  if (typeof s.$schema !== "string") return false;
  if (typeof s.version !== "string") return false;
  if (!Array.isArray(s.runs)) return false;
  return true;
}

// src/core.ts
init_cjs_shims();
init_logger();
async function analyze(options) {
  const { config, verbose = false } = options;
  const startTime = Date.now();
  const rootDir = config.root || process.cwd();
  if (verbose) {
    logger.setVerbose(true);
  }
  logger.debug("Starting analysis...");
  logger.debug(`Root directory: ${rootDir}`);
  let framework = config.framework;
  if (framework === "auto") {
    framework = await detectFramework(rootDir);
    logger.debug(`Auto-detected framework: ${framework}`);
  }
  logger.debug(`Parsing env files: ${config.envFiles.join(", ")}`);
  const envResult = await parseEnvFiles(config.envFiles, rootDir);
  const definedVariables = envResult.variables;
  if (envResult.errors.length > 0) {
    logger.debug(`Env parsing errors: ${envResult.errors.length}`);
  }
  let templateVariables;
  if (config.templateFile) {
    logger.debug(`Parsing template file: ${config.templateFile}`);
    const templateResult = await parseEnvFile(config.templateFile, rootDir);
    if (templateResult.variables.length > 0) {
      templateVariables = templateResult.variables;
    }
  }
  logger.debug("Scanning code for env usage...");
  const codeResult = await scanCode({
    rootDir,
    include: config.include,
    exclude: config.exclude,
    framework
  });
  const usedVariables = codeResult.usages;
  logger.debug(`Found ${usedVariables.length} env usages in ${codeResult.filesScanned} files`);
  const issues = [];
  logger.debug("Analyzing missing variables...");
  const missingIssues = analyzeMissing({
    definedVariables,
    usedVariables,
    config
  });
  issues.push(...missingIssues);
  logger.debug("Analyzing unused variables...");
  const unusedIssues = analyzeUnused({
    definedVariables,
    usedVariables,
    config,
    framework
  });
  issues.push(...unusedIssues);
  logger.debug("Analyzing type mismatches...");
  const typeMismatchIssues = analyzeTypeMismatch({
    definedVariables,
    usedVariables,
    config
  });
  issues.push(...typeMismatchIssues);
  if (templateVariables) {
    logger.debug("Analyzing sync drift...");
    const syncResult = analyzeSyncDrift({
      envVariables: definedVariables,
      templateVariables,
      templateFile: config.templateFile
    });
    issues.push(...syncResult.issues);
  }
  logger.debug("Analyzing secrets...");
  const secretIssues = analyzeSecrets({
    variables: definedVariables,
    customPatterns: config.secretPatterns,
    ignorePatterns: config.ignore
  });
  issues.push(...secretIssues);
  const duration = Date.now() - startTime;
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;
  logger.debug(`Analysis complete in ${duration}ms`);
  logger.debug(`Found ${issues.length} issues (${errorCount} errors, ${warningCount} warnings, ${infoCount} info)`);
  return {
    issues,
    definedVariables,
    usedVariables,
    templateVariables,
    framework,
    stats: {
      filesScanned: codeResult.filesScanned,
      envFilesParsed: config.envFiles.length,
      duration,
      errorCount,
      warningCount,
      infoCount
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EnvDoctorConfigSchema,
  FRAMEWORKS,
  SECRET_NAME_PATTERNS,
  SECRET_VALUE_PATTERNS,
  VariableRuleSchema,
  analyze,
  analyzeMissing,
  analyzeSecrets,
  analyzeSyncDrift,
  analyzeTypeMismatch,
  analyzeUnused,
  compareTemplateWithEnv,
  createMinimalSARIF,
  createSpinner,
  defaultConfig,
  detectFramework,
  generateConfigTemplate,
  generateTemplate,
  getEnvFilePatterns,
  getEnvSpecificConfig,
  getFrameworkInfo,
  getMissingSummary,
  getSecretPatterns,
  getSecurityRecommendations,
  getUniqueVariableNames,
  getUnusedSummary,
  inferValueType,
  isClientAccessible,
  isGitRepository,
  isSecretVariable,
  loadConfig,
  mergeJSONReports,
  mergeSARIF,
  parseEnvFile,
  parseEnvFiles,
  parseJSONReport,
  reportForCI,
  reportToConsole,
  reportToJSON,
  reportToJSONCompact,
  reportToSARIF,
  scanCode,
  scanFileContent,
  scanGitHistory,
  toJSONReport,
  toSARIF,
  validateConfig,
  validateFrameworkConvention,
  validateSARIF
});
//# sourceMappingURL=index.cjs.map
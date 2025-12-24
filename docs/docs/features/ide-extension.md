---
sidebar_position: 8
---

# VS Code Extension

The env-doctor VS Code extension provides real-time environment variable validation, intelligent autocomplete, and seamless navigation directly in your editor. Stop switching between files—get instant feedback as you code.

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (`Cmd+Shift+X` / `Ctrl+Shift+X`)
3. Search for **"env-doctor"**
4. Click **Install**

Or install directly:

```bash
code --install-extension theaccessibleteam.env-doctor-vscode
```

### From Source

```bash
# Clone and build
git clone https://github.com/WOLFIEEEE/env-doctor.git
cd env-doctor/packages/vscode-extension
npm install
npm run build

# Package and install
npm run package
code --install-extension env-doctor-vscode-1.0.0.vsix
```

## Features

### 🔴 Real-time Diagnostics

See issues instantly as you type—no need to run the CLI:

```typescript
// ❌ This will show a warning squiggle
const apiKey = process.env.STRIPE_SECRT_KEY;
//                         ~~~~~~~~~~~~~~~~
//                         ⚠️ "STRIPE_SECRT_KEY" is not defined
//                         💡 Did you mean "STRIPE_SECRET_KEY"?

// ✅ This is correctly defined
const dbUrl = process.env.DATABASE_URL;
```

**Diagnostic Types:**

| Icon | Type | Severity | Description |
|------|------|----------|-------------|
| 🔴 | Missing Required | Error | Required variable not defined |
| 🟡 | Missing Optional | Warning | Used variable not defined |
| 🔵 | Unused | Hint | Defined but never used |
| 🔴 | Secret Exposed | Error | Secret used in client code |

### 💡 Smart Autocomplete

When you type `process.env.` or `import.meta.env.`, get intelligent suggestions:

```typescript
const config = {
  database: process.env.|
  //                    ↓ Autocomplete dropdown appears
  //  ┌─────────────────────────────────────────┐
  //  │ $ DATABASE_URL      postgres://...      │
  //  │ $ DATABASE_POOL     10                  │
  //  │ $ DATABASE_SSL      true                │
  //  │ $ DEBUG_MODE        false               │
  //  └─────────────────────────────────────────┘
};
```

**Each suggestion shows:**
- Variable name
- Current value (secrets are redacted as `••••••••`)
- Source file and line number
- Inferred type
- Description from config

### 📖 Hover Information

Hover over any environment variable to see rich documentation:

```typescript
const url = process.env.DATABASE_URL;
//                      ^^^^^^^^^^^^
// ┌─────────────────────────────────────────────┐
// │ 🌿 DATABASE_URL                             │
// │                                             │
// │ Value: postgres://user:***@host:5432/db     │
// │ Type: url | Required: Yes                   │
// │                                             │
// │ PostgreSQL connection string for the main   │
// │ application database.                       │
// │                                             │
// │ ────────────────────────────────────────    │
// │ 📁 Defined in: .env:3                       │
// │                                             │
// │ 📊 Used in 5 files:                         │
// │ • src/lib/db.ts:5                           │
// │ • src/api/users.ts:12                       │
// │ • src/api/posts.ts:8                        │
// │ • ...and 2 more                             │
// └─────────────────────────────────────────────┘
```

### 🔗 Go to Definition

`Ctrl+Click` (or `Cmd+Click` on Mac) on any environment variable to jump directly to its definition in the `.env` file.

**Works both ways:**
- From code → Jump to `.env` file
- From `.env` file → Jump to first usage in code

### ⚡ Quick Fixes

One-click fixes for common issues:

| Issue | Quick Fix Options |
|-------|-------------------|
| **Undefined variable** | "Add to .env", "Did you mean X?" |
| **Unused variable** | "Remove from .env" |
| **Typo detected** | "Change to CORRECT_NAME" |
| **Exposed secret** | "Move to server-side" |

**Example:**

```typescript
// STRIPE_SECRT_KEY is not defined
const key = process.env.STRIPE_SECRT_KEY;
//                      ~~~~~~~~~~~~~~~~
// 💡 Quick Fix:
//   ▸ Add "STRIPE_SECRT_KEY" to .env
//   ▸ Change to "STRIPE_SECRET_KEY"
//   ▸ Add to .env.example
```

### 📊 Status Bar

See the health of your environment at a glance:

```
┌─────────────────────────────────────────────────────────┐
│ ... │ ✓ env-doctor │                                    │
└─────────────────────────────────────────────────────────┘
         ↑
   Click to run analysis

┌─────────────────────────────────────────────────────────┐
│ ... │ ⚠️ env-doctor: 2 │                                │
└─────────────────────────────────────────────────────────┘
         ↑
   2 issues detected
```

## Configuration

### VS Code Settings

Open Settings (`Cmd+,` / `Ctrl+,`) and search for "env-doctor":

| Setting | Default | Description |
|---------|---------|-------------|
| `envDoctor.enable` | `true` | Enable/disable the extension |
| `envDoctor.configPath` | `""` | Custom path to env-doctor config |
| `envDoctor.envFiles` | `[".env", ".env.local", ".env.development"]` | Environment files to analyze |
| `envDoctor.diagnostics.enable` | `true` | Enable real-time diagnostics |
| `envDoctor.diagnostics.showUnused` | `true` | Show unused variable hints |
| `envDoctor.diagnostics.showMissing` | `true` | Show missing variable warnings |
| `envDoctor.diagnostics.showSecrets` | `true` | Show exposed secret errors |
| `envDoctor.diagnostics.severity.missing` | `"warning"` | Severity for missing variables |
| `envDoctor.diagnostics.severity.unused` | `"hint"` | Severity for unused variables |
| `envDoctor.diagnostics.severity.secret` | `"error"` | Severity for exposed secrets |
| `envDoctor.autocomplete.enable` | `true` | Enable autocomplete |
| `envDoctor.autocomplete.showValues` | `true` | Show values in suggestions |
| `envDoctor.autocomplete.redactSecrets` | `true` | Hide secret values |
| `envDoctor.hover.enable` | `true` | Enable hover information |
| `envDoctor.hover.showUsages` | `true` | Show usage locations in hover |
| `envDoctor.hover.maxUsages` | `5` | Maximum usages to display |
| `envDoctor.statusBar.enable` | `true` | Show status bar item |

### Workspace Settings

Create `.vscode/settings.json` in your project:

```json
{
  "envDoctor.enable": true,
  "envDoctor.envFiles": [
    ".env",
    ".env.local",
    ".env.development",
    ".env.production"
  ],
  "envDoctor.diagnostics.severity.missing": "error",
  "envDoctor.hover.maxUsages": 10
}
```

## Commands

Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and type "env-doctor":

| Command | Description |
|---------|-------------|
| `env-doctor: Analyze` | Run full environment analysis |
| `env-doctor: Refresh` | Refresh analysis after manual changes |
| `env-doctor: Add Variable to .env` | Add a new variable interactively |
| `env-doctor: Sync .env.example` | Run the sync command |
| `env-doctor: Show Matrix` | Open environment comparison matrix |
| `env-doctor: Generate Schema` | Generate TypeScript runtime schema |

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Go to Definition | `Cmd+Click` / `Ctrl+Click` |
| Find All References | `Shift+F12` |
| Quick Fix | `Cmd+.` / `Ctrl+.` |
| Show Hover | `Cmd+K Cmd+I` / `Ctrl+K Ctrl+I` |

## Supported Languages

**Full support (diagnostics + autocomplete + hover):**
- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`)

**Special support:**
- `.env` files (syntax highlighting, hover for usages)

## Performance

The extension is optimized for large projects:

- **Incremental analysis** - Only re-analyzes changed files
- **Cached parsing** - `.env` files are parsed once and cached
- **Debounced updates** - Rapid typing triggers analysis after 300ms pause
- **Background processing** - Analysis runs without blocking the UI

For very large projects (500+ files), the initial analysis may take 2-3 seconds.

## Troubleshooting

### Diagnostics not appearing

1. **Check extension is enabled**: Open Settings → search "envDoctor.enable"
2. **Verify `.env` files exist**: Extension needs at least one `.env` file
3. **Check output panel**: View → Output → select "env-doctor" from dropdown
4. **Reload window**: `Cmd+Shift+P` → "Developer: Reload Window"

### Autocomplete not working

1. **Trigger manually**: Type `process.env.` and wait 100ms
2. **Check language**: Ensure file is TypeScript or JavaScript
3. **Verify `.env` format**: Variables must be `KEY=value` format

### Extension not activating

The extension activates when:
- A `.env*` file exists in the workspace
- An `env-doctor.config.*` file exists
- You open a TypeScript/JavaScript file

### High CPU usage

Try these settings to reduce analysis frequency:

```json
{
  "envDoctor.diagnostics.enable": false
}
```

Then use the `env-doctor: Analyze` command manually.

## Integration with env-doctor CLI

The extension uses the same analysis engine as the CLI:

```bash
# CLI analysis
npx @theaccessibleteam/env-doctor

# Same results in VS Code - just open the project!
```

Configuration in `env-doctor.config.js` is automatically used by both.

## Feedback & Issues

- **GitHub Issues**: [Report bugs or request features](https://github.com/WOLFIEEEE/env-doctor/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/WOLFIEEEE/env-doctor/discussions)

---

**Next Steps:**
- [Runtime Validation](./runtime-validation.md) - Add type-safe env vars to your app
- [Multi-Environment](./multi-environment.md) - Compare variables across environments
- [CLI Reference](/docs/cli-reference) - Full command documentation

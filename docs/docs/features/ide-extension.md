---
sidebar_position: 8
---

# VS Code Extension

The env-doctor VS Code extension provides real-time environment variable validation, autocomplete, and navigation directly in your editor.

## Features

### Real-time Diagnostics

See issues as you type:

```typescript
const apiKey = process.env.STRIPE_SECRT_KEY;
//                         ~~~~~~~~~~~~~~~~
//                         ⚠️ "STRIPE_SECRT_KEY" is not defined in any .env file
//                         💡 Did you mean "STRIPE_SECRET_KEY"?
```

### Autocomplete

When typing `process.env.`, get autocomplete suggestions:

- Variable name
- Current value (secrets redacted)
- Source file and line
- Inferred type

### Hover Information

Hover over any env variable to see:

- Definition location
- Current value
- Type information
- Usage locations (where else it's referenced)
- Description from config

### Go to Definition

`Ctrl+Click` on any env variable to jump to its definition in the `.env` file.

### CodeLens

In `.env` files, see reference counts for each variable:

```env
DATABASE_URL=postgres://localhost/mydb
# ▲ 3 references | Secret: Yes | Required: Yes

PORT=3000
# ▲ 1 reference | Type: number
```

### Quick Fixes

Automatic fixes for common issues:

| Issue | Quick Fix Options |
|-------|-------------------|
| Undefined variable | "Add to .env", "Fix typo: did you mean X?" |
| Unused variable | "Remove from .env" |
| Exposed secret | "Move to secrets manager" |

## Installation

### VS Code Marketplace

1. Open VS Code
2. Go to Extensions (`Cmd+Shift+X`)
3. Search for "env-doctor"
4. Click Install

### From VSIX

```bash
# Build the extension
cd packages/vscode-extension
npm install
npm run package

# Install the .vsix file
code --install-extension env-doctor-vscode-1.0.0.vsix
```

## Configuration

Open VS Code settings and search for "env-doctor":

| Setting | Default | Description |
|---------|---------|-------------|
| `envDoctor.enable` | `true` | Enable env-doctor diagnostics |
| `envDoctor.configPath` | `""` | Path to env-doctor config |
| `envDoctor.envFiles` | `[".env", ".env.local"]` | Env files to watch |
| `envDoctor.diagnostics.showUnused` | `true` | Show unused warnings |
| `envDoctor.diagnostics.showMissing` | `true` | Show missing warnings |
| `envDoctor.diagnostics.showSecrets` | `true` | Show secret warnings |
| `envDoctor.autocomplete.showValues` | `true` | Show values in autocomplete |
| `envDoctor.autocomplete.redactSecrets` | `true` | Redact secrets |
| `envDoctor.codeLens.enable` | `true` | Enable CodeLens |
| `envDoctor.hover.showUsages` | `true` | Show usages in hover |
| `envDoctor.hover.maxUsages` | `5` | Max usages to show |

## Commands

Open the command palette (`Cmd+Shift+P`) and type "env-doctor":

| Command | Description |
|---------|-------------|
| `env-doctor: Analyze` | Run full analysis |
| `env-doctor: Add Variable to .env` | Add a new variable |
| `env-doctor: Sync .env.example` | Sync template file |
| `env-doctor: Show Environment Matrix` | Show multi-env comparison |

## Workspace Settings

Create `.vscode/settings.json` in your project:

```json
{
  "envDoctor.enable": true,
  "envDoctor.envFiles": [
    ".env",
    ".env.local",
    ".env.development"
  ],
  "envDoctor.diagnostics.showUnused": true,
  "envDoctor.hover.maxUsages": 10
}
```

## Supported Languages

The extension provides diagnostics for:

- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`)

And special support for:

- `.env` files (syntax highlighting, CodeLens)

## Performance

The extension uses incremental analysis:

- Only re-analyzes changed files
- Caches parsed `.env` files
- Debounces rapid changes (300ms)

For large projects, the initial analysis may take a few seconds.

## Troubleshooting

### Diagnostics not showing

1. Check if the extension is enabled
2. Verify `.env` files exist
3. Check the Output panel (View → Output → env-doctor)

### Autocomplete not working

1. Make sure you're typing after `process.env.` or `import.meta.env.`
2. Check that `.env` files are properly formatted

### Extension not activating

The extension activates when:
- A `.env*` file exists in the workspace
- An `env-doctor.config.*` file exists

## Feedback

Report issues or request features:

- [GitHub Issues](https://github.com/WOLFIEEEE/env-doctor/issues)
- Use the command: `env-doctor: Report Issue`


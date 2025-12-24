# env-doctor for VS Code

Real-time environment variable validation and intellisense for VS Code.

## Features

### Real-time Diagnostics
- Warnings for undefined environment variables
- Errors for missing required variables
- Hints for potential typos with suggested fixes

### Autocomplete
- Autocomplete for `process.env.*` and `import.meta.env.*`
- Shows variable values (secrets are redacted)
- Displays source file and type information

### Hover Information
- Detailed information about environment variables
- Source location and type
- List of files where the variable is used

### Go to Definition
- Click on an env variable to jump to its definition in the `.env` file

### CodeLens
- Reference count for each variable in `.env` files
- Quick access to find all references

### Quick Fixes
- Add missing variables to `.env`
- Add to `.env.example`
- Fix typos with suggested corrections

## Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `envDoctor.enable` | `true` | Enable env-doctor diagnostics |
| `envDoctor.configPath` | `""` | Path to env-doctor config file |
| `envDoctor.envFiles` | `[".env", ".env.local"]` | Environment files to watch |
| `envDoctor.diagnostics.showUnused` | `true` | Show unused variable warnings |
| `envDoctor.diagnostics.showMissing` | `true` | Show missing variable warnings |
| `envDoctor.diagnostics.showSecrets` | `true` | Show exposed secret warnings |
| `envDoctor.autocomplete.showValues` | `true` | Show values in autocomplete |
| `envDoctor.autocomplete.redactSecrets` | `true` | Redact secret values |
| `envDoctor.codeLens.enable` | `true` | Enable CodeLens for .env files |
| `envDoctor.hover.showUsages` | `true` | Show usage locations in hover |
| `envDoctor.hover.maxUsages` | `5` | Max usages to show in hover |

## Commands

| Command | Description |
|---------|-------------|
| `env-doctor: Analyze` | Run full analysis |
| `env-doctor: Add Variable to .env` | Add a new variable |
| `env-doctor: Sync .env.example` | Sync template file |
| `env-doctor: Show Environment Matrix` | Show multi-env comparison |

## Requirements

- VS Code 1.85.0 or higher
- Node.js 18+ for the env-doctor CLI features

## Installation

### From VS Code Marketplace
Search for "env-doctor" in the Extensions view.

### From VSIX
1. Download the `.vsix` file from releases
2. Open VS Code
3. Go to Extensions view
4. Click "..." menu > "Install from VSIX..."
5. Select the downloaded file

## Usage

1. Open a project with `.env` files
2. The extension activates automatically
3. Start typing `process.env.` to see autocomplete
4. Hover over env variables to see details
5. Ctrl+Click to go to definition

## License

MIT


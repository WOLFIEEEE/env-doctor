# Quick Start: Publishing env-doctor Extension

## 🚀 Fast Track (5 Steps)

### 1. Create Publisher Account
- Visit: https://marketplace.visualstudio.com/manage
- Create publisher: `theaccessibleteam`
- Sign in with Microsoft/Azure account

### 2. Get Personal Access Token
- Visit: https://dev.azure.com
- Profile → Personal access tokens → New Token
- Scope: **Marketplace (Manage)** - Full access
- Copy token (save it!)

### 3. Build Extension
```bash
cd packages/vscode-extension
npm install
npm run build
```

### 4. Package Extension
```bash
npm run package
# Creates: env-doctor-vscode-1.0.0.vsix
```

### 5. Publish
```bash
# Login (first time only)
vsce login theaccessibleteam
# Enter your PAT when prompted

# Publish
npm run publish
```

## 📋 Pre-Publish Checklist

- [ ] Icon created at `assets/icon.png` (128x128 PNG)
- [ ] `package.json` version is correct
- [ ] Extension builds successfully
- [ ] Extension works when installed locally
- [ ] README.md is complete

## 🔗 Important Links

- **Marketplace**: https://marketplace.visualstudio.com/manage
- **Publisher ID**: `theaccessibleteam`
- **Extension Name**: `env-doctor-vscode`
- **Full Guide**: See `PUBLISHING.md`

## 📝 Common Commands

```bash
# Build
npm run build

# Package
npm run package

# Publish
npm run publish

# Test locally
code --install-extension env-doctor-vscode-1.0.0.vsix
```

## ⚠️ Important Notes

1. **Publisher ID** in `package.json` must match your Marketplace publisher
2. **Version** must be incremented for each update
3. **PAT** must have "Marketplace (Manage)" scope
4. **Icon** is optional but recommended

For detailed instructions, see `PUBLISHING.md`.


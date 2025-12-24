# Publishing env-doctor VS Code Extension

This guide will walk you through publishing the env-doctor extension to the Visual Studio Code Marketplace.

## Prerequisites

1. **Azure DevOps Account**: You need a Microsoft/Azure DevOps account
2. **Personal Access Token (PAT)**: Required for authentication
3. **Publisher ID**: Create a publisher on the Marketplace
4. **Node.js**: Version 18+ installed
5. **vsce**: Visual Studio Code Extension manager (already in devDependencies)

## Step 1: Create a Publisher Account

1. Go to [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
2. Sign in with your Microsoft/Azure DevOps account
3. Click **"Create Publisher"**
4. Fill in the details:
   - **Publisher ID**: `theaccessibleteam` (must match `package.json`)
   - **Publisher Name**: The Accessible Team (or your organization name)
   - **Owner**: Your email address
   - **Support URL**: `https://github.com/WOLFIEEEE/env-doctor/issues`
5. Click **"Create"**

## Step 2: Create a Personal Access Token (PAT)

1. Go to [Azure DevOps](https://dev.azure.com)
2. Click on your profile icon (top right) → **"Personal access tokens"**
3. Click **"New Token"**
4. Configure the token:
   - **Name**: `VS Code Extension Publishing`
   - **Organization**: Select your organization
   - **Expiration**: Set to 1 year (or as needed)
   - **Scopes**: 
     - ✅ **Custom defined**
     - ✅ **Marketplace (Manage)** - Full access
5. Click **"Create"**
6. **IMPORTANT**: Copy the token immediately (you won't see it again!)
7. Save it securely (you'll need it in Step 4)

## Step 3: Prepare the Extension

### 3.1 Create Extension Icon

Create a 128x128 PNG icon for your extension:

```bash
# Create the icon file (you'll need to design this)
# Save it as: packages/vscode-extension/assets/icon.png
```

The icon should be:
- 128x128 pixels
- PNG format
- Represents env-doctor visually
- Clear and recognizable at small sizes

### 3.2 Verify package.json

Ensure your `package.json` has:
- ✅ `publisher`: `"theaccessibleteam"` (matches your publisher ID)
- ✅ `name`: `"env-doctor-vscode"`
- ✅ `version`: `"1.0.0"` (increment for updates)
- ✅ `displayName`: `"env-doctor"`
- ✅ `description`: Clear description
- ✅ `icon`: `"assets/icon.png"` (if you have an icon)
- ✅ `repository`: Points to your GitHub repo
- ✅ `license`: `"MIT"`

### 3.3 Build the Extension

```bash
cd packages/vscode-extension

# Install dependencies
npm install

# Build the extension
npm run build

# Verify the build output exists
ls -la dist/extension.js
```

## Step 4: Install vsce Globally (if needed)

```bash
# Install vsce globally (optional, but recommended)
npm install -g @vscode/vsce

# Verify installation
vsce --version
```

## Step 5: Package the Extension

```bash
cd packages/vscode-extension

# Package the extension (creates .vsix file)
npm run package

# Or use vsce directly:
vsce package --no-dependencies

# This creates: env-doctor-vscode-1.0.0.vsix
```

**Note**: The `--no-dependencies` flag is used because the extension bundles dependencies via esbuild.

## Step 6: Test the Package Locally (Optional but Recommended)

Before publishing, test the extension locally:

```bash
# Install the .vsix file in VS Code
code --install-extension env-doctor-vscode-1.0.0.vsix

# Or manually:
# 1. Open VS Code
# 2. Go to Extensions view
# 3. Click "..." menu → "Install from VSIX..."
# 4. Select the .vsix file
```

Test all features:
- ✅ Extension activates
- ✅ Diagnostics work
- ✅ Autocomplete works
- ✅ Hover information works
- ✅ Commands work

## Step 7: Publish to Marketplace

### Option A: Using npm script

```bash
cd packages/vscode-extension

# First time: Login with your PAT
vsce login theaccessibleteam
# Enter your Personal Access Token when prompted

# Publish
npm run publish

# Or directly:
vsce publish --no-dependencies
```

### Option B: Using PAT directly

```bash
cd packages/vscode-extension

# Publish with PAT (replace YOUR_PAT with your actual token)
vsce publish --no-dependencies -p YOUR_PAT
```

### Option C: Using environment variable

```bash
# Set environment variable
export VSCE_PAT=your_personal_access_token

# Publish
cd packages/vscode-extension
vsce publish --no-dependencies
```

## Step 8: Verify Publication

1. Go to [Visual Studio Marketplace](https://marketplace.visualstudio.com/vscode)
2. Search for "env-doctor"
3. Your extension should appear within a few minutes
4. Click on it to view the listing

## Step 9: Update the Extension

When you need to publish an update:

1. **Update version** in `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. **Update CHANGELOG.md** (create if it doesn't exist):
   ```markdown
   # Change Log
   
   ## [1.0.1] - 2024-12-24
   - Fixed bug X
   - Added feature Y
   
   ## [1.0.0] - 2024-12-24
   - Initial release
   ```

3. **Build and publish**:
   ```bash
   cd packages/vscode-extension
   npm run build
   vsce publish --no-dependencies -p YOUR_PAT
   ```

## Troubleshooting

### Error: "Publisher not found"
- Verify your publisher ID matches exactly in `package.json`
- Ensure you've created the publisher on the Marketplace

### Error: "Invalid Personal Access Token"
- Check token expiration date
- Verify token has "Marketplace (Manage)" scope
- Regenerate token if needed

### Error: "Extension name already exists"
- Change the `name` field in `package.json`
- Must be globally unique

### Error: "Missing required field"
- Check `package.json` has all required fields:
  - `name`, `publisher`, `version`, `displayName`, `description`, `engines.vscode`

### Build errors
- Ensure all dependencies are installed: `npm install`
- Check that `dist/extension.js` exists after build
- Verify esbuild configuration in `esbuild.js`

## Publishing Checklist

Before publishing, ensure:

- [ ] Extension builds successfully (`npm run build`)
- [ ] Extension packages successfully (`npm run package`)
- [ ] Extension works when installed locally
- [ ] `package.json` has correct publisher ID
- [ ] `package.json` has correct version number
- [ ] Icon exists at `assets/icon.png` (128x128 PNG)
- [ ] README.md is complete and accurate
- [ ] CHANGELOG.md exists (optional but recommended)
- [ ] All required fields in `package.json` are filled
- [ ] Personal Access Token is ready
- [ ] Publisher account is created on Marketplace

## Post-Publication

After publishing:

1. **Share the extension link**:
   ```
   https://marketplace.visualstudio.com/items?itemName=theaccessibleteam.env-doctor-vscode
   ```

2. **Update documentation**:
   - Add installation instructions to main README
   - Update website with extension link
   - Add to GitHub repository description

3. **Monitor feedback**:
   - Check Marketplace reviews
   - Monitor GitHub issues
   - Respond to user feedback

4. **Plan updates**:
   - Fix reported bugs
   - Add requested features
   - Keep extension updated with main package

## Quick Reference Commands

```bash
# Navigate to extension directory
cd packages/vscode-extension

# Install dependencies
npm install

# Build extension
npm run build

# Package extension
npm run package

# Publish extension (first time - login required)
vsce login theaccessibleteam
npm run publish

# Publish with PAT
vsce publish --no-dependencies -p YOUR_PAT

# Check extension info
vsce ls theaccessibleteam

# Show extension details
vsce show theaccessibleteam.env-doctor-vscode
```

## Additional Resources

- [VS Code Extension Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce Documentation](https://github.com/microsoft/vscode-vsce)
- [Marketplace Publisher Guide](https://docs.microsoft.com/en-us/azure/devops/extend/publish/overview)
- [Extension Manifest Reference](https://code.visualstudio.com/api/references/extension-manifest)

---

**Good luck with your publication! 🚀**


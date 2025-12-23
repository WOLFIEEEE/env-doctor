# GitHub Repository Setup Instructions

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `env-doctor`
3. Description: "Analyze and validate environment variables in your codebase"
4. Visibility: **Public** (for open source)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Push Your Code

After creating the repository, run:

```bash
git push -u origin main
```

If you need to authenticate, GitHub will prompt you for credentials or use a personal access token.

## Step 3: Enable GitHub Pages (for Documentation)

1. Go to repository Settings → Pages
2. Source: GitHub Actions
3. The `.github/workflows/docs.yml` workflow will automatically deploy docs

## Step 4: Enable GitHub Actions

The repository includes three workflows:
- **CI** (`.github/workflows/ci.yml`) - Runs tests on PRs
- **Release** (`.github/workflows/release.yml`) - Publishes to npm
- **Docs** (`.github/workflows/docs.yml`) - Deploys documentation

These will activate automatically once the repository is created.

## Step 5: Generate Icons (Optional but Recommended)

Before deploying docs, generate PNG/ICO files:

```bash
# Option 1: Install sharp and run script
npm install -g sharp-cli
pnpm icons:generate

# Option 2: Use online tools (see docs/static/img/convert-instructions.md)
```

## Next Steps After Push

1. ✅ Verify all files are pushed
2. ✅ Check GitHub Actions are running
3. ✅ Review the repository on GitHub
4. ✅ Test the documentation site (will be at https://khushwantparihar.github.io/env-doctor)
5. ✅ Prepare for npm publishing (when ready)

## Publishing to npm

When ready to publish:

```bash
# Create a changeset
pnpm changeset

# Build the package
pnpm build

# Test locally
pnpm test:run

# Publish (after merging changeset PR)
pnpm release
```

## Repository URL

Make sure your `package.json` has the correct repository URL:
```json
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/khushwantparihar/env-doctor.git"
  }
}
```

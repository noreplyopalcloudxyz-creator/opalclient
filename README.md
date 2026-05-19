# Opal Launcher

## Auto Update

This guide explains how the launcher's auto-update system works and how to publish updates using your GitHub repository.

### Configured Files
1. **Production Auto-Updater**: In `xmcl-electron-app/build/electron-builder.config.ts`, the publish destination points to `noreplyopalcloudxyz-creator/opalclient`.
2. **Development Auto-Updater**: In `xmcl-electron-app/main/index.dev.ts`, the development feed URL points to `noreplyopalcloudxyz-creator/opalclient`.
3. **Download & Mirror Paths**: In `xmcl-electron-app/main/utils/updater.ts`, the fallback GitHub release links and mirrors point to `noreplyopalcloudxyz-creator/opalclient`.
4. **GitHub Workflows**: Updated `.github/workflows/build.yml` and `.github/workflows/deploy-release.yml` to push tags and fetch assets from your repository.

---

### How to Trigger Updates Automatically when Pushing to GitHub

To make updates show up automatically in the launcher when you push changes, follow these steps:

#### Step 1: Configure your GitHub Repository Settings
1. Go to your repository on GitHub: https://github.com/noreplyopalcloudxyz-creator/opalclient.
2. Click on **Settings** -> **Actions** -> **General**.
3. Under **Actions permissions**, select **Allow all actions and workflows**.
4. Scroll down to **Workflow permissions**, select **Read and write permissions** (so the builder can create tags and releases), and click **Save**.

#### Step 2: Push the code changes
Commit and push these update configurations to your repository:
```bash
git add .
git commit -m "Configure auto-updater to point to noreplyopalcloudxyz-creator/opalclient"
git push origin master
```

#### Step 3: Trigger a Release Build
The workflow is configured to create a release when it detects a release-commit:
1. Increment the `"version"` field in `xmcl-electron-app/package.json` (e.g., set it to `0.56.4`).
2. Commit and push the version change with a commit message starting with `chore(release)`:
   ```bash
   git commit -am "chore(release): version 0.56.4"
   git push origin master
   ```
3. GitHub Actions will run the Build, compile the launcher installers (e.g., `.exe` and `.asar`), tag your commit, and automatically create a **Draft Release** under your repository's Releases page.
4. Go to your GitHub repository -> **Releases**, edit the new Draft Release, and click **Publish release**.

As soon as that release is published on GitHub, any running client pointing to your launcher will automatically detect `latest.yml` from your repo and prompt the user to update!

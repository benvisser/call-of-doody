# 📦 Git Setup & GitHub Repository Guide

Complete guide to initialize Git, create a GitHub repository, and push your code.

---

## Prerequisites

- Git installed on your computer
- GitHub account created
- Project files ready in your `CallOfDoody` folder

---

## Step 1: Initialize Git Repository

Open terminal in your `CallOfDoody` project directory and run:

```bash
# Navigate to your project (if not already there)
cd CallOfDoody

# Initialize Git repository
git init

# Verify .gitignore exists
ls -la | grep .gitignore
```

You should see `.gitignore` in the list. This file tells Git which files to ignore (like `node_modules/`).

---

## Step 2: Stage and Commit Files

```bash
# Add all files to staging
git add .

# Verify what will be committed
git status

# Create your first commit
git commit -m "Initial commit: Call of Doody MVP with map and detail screens"
```

**What's being committed:**
- ✅ All source code (`src/` folder)
- ✅ Documentation (`README.md`, `SETUP.md`, etc.)
- ✅ Configuration files (`package.json`, `app.json`)
- ❌ `node_modules/` (ignored by .gitignore)
- ❌ `.expo/` (ignored by .gitignore)

---

## Step 3: Create GitHub Repository

### Option A: Using GitHub Website

1. **Go to GitHub.com and log in**

2. **Click the "+" icon** (top right) → "New repository"

3. **Fill in repository details:**
   - Repository name: `call-of-doody`
   - Description: "React Native app to find public restrooms with ratings and reviews"
   - Public or Private: Your choice
   - ❌ **DO NOT** initialize with README, .gitignore, or license (we already have these)

4. **Click "Create repository"**

5. **Copy the repository URL** shown on the next page
   - Should look like: `https://github.com/YOUR-USERNAME/call-of-doody.git`

### Option B: Using GitHub CLI (if installed)

```bash
# Create repository
gh repo create call-of-doody --public --description "React Native app to find public restrooms"

# Follow prompts to push existing local repository
```

---

## Step 4: Connect Local Repository to GitHub

```bash
# Add GitHub repository as remote
git remote add origin https://github.com/YOUR-USERNAME/call-of-doody.git

# Verify remote was added
git remote -v
```

You should see:
```
origin  https://github.com/YOUR-USERNAME/call-of-doody.git (fetch)
origin  https://github.com/YOUR-USERNAME/call-of-doody.git (push)
```

---

## Step 5: Push to GitHub

```bash
# Push your code to GitHub
git push -u origin main
```

If you get an error about "master" vs "main":
```bash
# Rename branch to main
git branch -M main

# Then push
git push -u origin main
```

---

## Step 6: Verify on GitHub

1. Go to `https://github.com/YOUR-USERNAME/call-of-doody`
2. You should see:
   - All your files
   - README.md displayed on the main page
   - Commit history
   - File structure

---

## Repository Structure on GitHub

```
call-of-doody/
├── 📄 README.md                    ← Main documentation (auto-displayed)
├── 📄 SETUP.md                     ← Installation guide
├── 📄 ARCHITECTURE.md              ← Technical documentation
├── 📄 CONTRIBUTING.md              ← Contribution guidelines
├── 📄 package.json                 ← Dependencies list
├── 📄 .gitignore                   ← Files to ignore
├── 📁 src/
│   ├── 📁 screens/
│   │   ├── MapScreen.js
│   │   └── RestroomDetailScreen.js
│   ├── 📁 components/
│   └── 📁 data/
│       └── mockData.js
└── 📄 App.js                       ← Main entry point
```

---

## Common Git Commands for Daily Development

### Check Status
```bash
# See what files have changed
git status
```

### View Changes
```bash
# See specific changes in files
git diff
```

### Stage Changes
```bash
# Stage specific file
git add src/screens/MapScreen.js

# Stage all changes
git add .
```

### Commit Changes
```bash
# Commit with message
git commit -m "feat(map): add filter by cleanliness"
```

### Push to GitHub
```bash
# Push to main branch
git push origin main
```

### Pull Latest Changes
```bash
# Get latest code from GitHub
git pull origin main
```

### Create New Branch
```bash
# Create and switch to new branch
git checkout -b feature/add-review-screen

# Push new branch to GitHub
git push -u origin feature/add-review-screen
```

### Switch Branches
```bash
# Switch to existing branch
git checkout main

# List all branches
git branch -a
```

### View History
```bash
# See commit history
git log --oneline

# See detailed history
git log
```

---

## Setting Up Branch Protection (Recommended)

1. Go to your repository on GitHub
2. Click "Settings" → "Branches"
3. Under "Branch protection rules", click "Add rule"
4. Branch name pattern: `main`
5. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging (when CI is set up)
6. Save changes

This prevents direct pushes to `main` and requires code review.

---

## Collaborative Workflow

### For Team Members

1. **Clone the repository**
   ```bash
   git clone https://github.com/OWNER/call-of-doody.git
   cd call-of-doody
   npm install
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

3. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

4. **Push branch**
   ```bash
   git push origin feature/your-feature
   ```

5. **Create Pull Request on GitHub**
   - Go to repository on GitHub
   - Click "Pull requests" → "New pull request"
   - Select your branch
   - Fill in description
   - Request reviews
   - Wait for approval and merge

---

## GitHub Features to Enable

### Issues
Track bugs, features, and tasks
- Enable in Settings → Features → Issues

### Projects
Kanban board for project management
- Create project board
- Add columns: To Do, In Progress, Done
- Link issues to board

### Actions (CI/CD - Future)
Automated testing and deployment
- Will add in Phase 2

### Wiki (Optional)
Additional documentation space
- Can move some docs here later

---

## Best Practices

### Commit Messages
✅ **Good:**
```
feat(map): add distance filter for restrooms
fix(location): handle permission denial gracefully
docs(readme): update installation steps
```

❌ **Avoid:**
```
Update
Fixed stuff
Changes
asdf
```

### Commit Frequency
- Commit logical units of work
- Don't commit broken code to main
- Commit before switching branches
- Push at end of work session

### Branch Naming
✅ **Good:**
```
feature/add-review-form
fix/map-marker-crash
docs/update-architecture
refactor/data-model
```

❌ **Avoid:**
```
test
my-branch
updates
fixes
```

---

## Troubleshooting

### Authentication Issues

**If using HTTPS and getting password prompts:**
```bash
# Use Personal Access Token instead of password
# Create token at: GitHub → Settings → Developer settings → Personal access tokens
```

**Switch to SSH:**
```bash
# Generate SSH key (if needed)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Add to GitHub: Settings → SSH and GPG keys

# Change remote URL
git remote set-url origin git@github.com:YOUR-USERNAME/call-of-doody.git
```

### Merge Conflicts

If you get merge conflicts:
```bash
# Pull latest changes
git pull origin main

# Fix conflicts in your editor
# Look for <<<<<, =====, >>>>> markers

# Stage resolved files
git add .

# Complete merge
git commit -m "Merge main into feature branch"
```

### Undo Last Commit (Not Pushed)
```bash
# Undo commit but keep changes
git reset --soft HEAD~1

# Undo commit and discard changes
git reset --hard HEAD~1
```

### Revert Pushed Commit
```bash
# Create new commit that undoes changes
git revert COMMIT_HASH
git push origin main
```

---

## Setting Up Collaborators

1. Go to repository on GitHub
2. Settings → Collaborators
3. Click "Add people"
4. Enter GitHub username or email
5. Send invitation

Collaborators can:
- Push to branches
- Create pull requests
- Review code
- Manage issues

---

## Repository Badges (Optional but Cool)

Add to top of README.md:

```markdown
![GitHub Stars](https://img.shields.io/github/stars/USERNAME/call-of-doody?style=social)
![GitHub Forks](https://img.shields.io/github/forks/USERNAME/call-of-doody?style=social)
![License](https://img.shields.io/github/license/USERNAME/call-of-doody)
![Last Commit](https://img.shields.io/github/last-commit/USERNAME/call-of-doody)
```

---

## Next Steps After Setup

1. ✅ Repository created and code pushed
2. ✅ README displays properly
3. ⏳ Add topics/tags to repository (react-native, expo, mobile-app)
4. ⏳ Add repository description
5. ⏳ Enable issues and projects
6. ⏳ Invite collaborators
7. ⏳ Set up branch protection
8. ⏳ Create first issue for next feature

---

## Quick Reference

```bash
# Daily workflow
git pull origin main          # Get latest
git checkout -b feature/name  # New branch
# ... make changes ...
git add .                     # Stage
git commit -m "message"       # Commit
git push origin feature/name  # Push
# Create PR on GitHub
```

---

**Your repository is now live! 🎉**

Share the link with your team and start collaborating!

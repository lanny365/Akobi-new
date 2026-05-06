# GitHub Setup Instructions

Follow these steps to push your AISHMS project to GitHub.

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and log in
2. Click the **"+"** icon in the top-right corner
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `aishms` (or your preferred name)
   - **Description**: "AKOBI Integrated Smart Hospital Management System - Comprehensive hospital operations software"
   - **Visibility**: Choose **Public** or **Private**
   - ❌ **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 2: Prepare Your Local Project

Open your terminal in the project root directory and run:

```bash
# Initialize git repository (if not already initialized)
git init

# Add all files to staging
git add .

# Create your first commit
git commit -m "Initial commit: AISHMS Hospital Management System

- Complete patient management with QR codes
- Ward & nursing management with bed tracking
- Emergency alert system (Reception to Doctors)
- Payment verification (Cashier to Reception)
- 11 department modules with professional UI
- Built with React, TypeScript, Tailwind CSS"

# Rename branch to main (if needed)
git branch -M main
```

## Step 3: Connect to GitHub

Replace `yourusername` with your actual GitHub username:

```bash
# Add your GitHub repository as remote origin
git remote add origin https://github.com/yourusername/aishms.git

# Verify the remote was added
git remote -v
```

## Step 4: Push to GitHub

```bash
# Push your code to GitHub
git push -u origin main
```

If this is your first time pushing, you may need to authenticate:
- **Username**: Your GitHub username
- **Password**: Use a [Personal Access Token](https://github.com/settings/tokens) instead of your password

### Creating a Personal Access Token (if needed)

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "AISHMS Project"
4. Select scopes: ✅ **repo** (all checkboxes under repo)
5. Click "Generate token"
6. Copy the token and use it as your password when pushing

## Step 5: Verify Upload

1. Go to your GitHub repository: `https://github.com/yourusername/aishms`
2. You should see all your files uploaded
3. The README.md will display automatically

## Step 6: Share Your Project

Now you can share your project! Here are the links to share:

### Repository Link
```
https://github.com/yourusername/aishms
```

### Clone Command (for others to download)
```bash
git clone https://github.com/yourusername/aishms.git
```

### Quick Setup Instructions (for collaborators)
```bash
# Clone the repository
git clone https://github.com/yourusername/aishms.git

# Navigate to directory
cd aishms

# Install dependencies
npm install

# Start development server
npm run dev
```

## Optional: Additional Git Commands

### Update your repository after making changes
```bash
# Check status
git status

# Add specific files
git add src/app/components/NewComponent.tsx

# Or add all changes
git add .

# Commit changes
git commit -m "Add new feature: XYZ"

# Push to GitHub
git push
```

### Create a new feature branch
```bash
# Create and switch to new branch
git checkout -b feature/new-module

# Push new branch to GitHub
git push -u origin feature/new-module
```

### View commit history
```bash
git log --oneline --graph
```

## Troubleshooting

### Problem: "Permission denied (publickey)"
**Solution**: You need to set up SSH keys or use HTTPS with a personal access token.

### Problem: "Repository not found"
**Solution**: Make sure you created the repository on GitHub and used the correct URL.

### Problem: "Failed to push some refs"
**Solution**: Pull the latest changes first:
```bash
git pull origin main --rebase
git push
```

### Problem: Files too large
**Solution**: Check if you accidentally included `node_modules/` or `dist/`. They should be in `.gitignore`.

## Next Steps

After pushing to GitHub, you can:

1. **Enable GitHub Pages** (if you want to deploy):
   - Go to repository Settings → Pages
   - Select source: GitHub Actions
   - Deploy using Vite

2. **Add Collaborators**:
   - Go to Settings → Collaborators
   - Add team members by username

3. **Set up Branch Protection**:
   - Settings → Branches → Add rule
   - Protect your `main` branch

4. **Create Issues/Projects**:
   - Use GitHub Issues for task tracking
   - Use GitHub Projects for kanban boards

---

**Your project is now on GitHub! 🎉**

Share the link with Codex: `https://github.com/yourusername/aishms`

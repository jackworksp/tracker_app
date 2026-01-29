---
description: Check-in code changes to the main branch
---

# Check-in Code to Main

This workflow guides you through staging, committing, and pushing changes to the `main` branch.

## 1. Check Git Status
See which files have changed.
// turbo
```powershell
git status
```

## 2. Stage All Changes
Add all modified and new files to the staging area.
// turbo
```powershell
git add .
```

## 3. Commit Changes
Commit the staged changes. **Replace "Update application" with a descriptive message.**
```powershell
git commit -m "Update application"
```

## 4. Pull Latest Changes
Pull any changes from the remote `main` branch to avoid conflicts.
// turbo
```powershell
git pull origin main --rebase
```

## 5. Push to Remote
Push your commits to the remote repository.
// turbo
```powershell
git push origin main
```

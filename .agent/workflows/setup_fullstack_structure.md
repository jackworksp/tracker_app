---
description: Create a clean, well-organized project folder structure for a full-stack application
---

# Setup Full-Stack Project Structure

This workflow creates a comprehensive folder structure for:
- Backend: python
- Frontend-Web: React/Next.js
- Frontend-Android: 
- Infrastructure & Documentation

## 1. Create Root Directory Structure
// turbo
```powershell
New-Item -ItemType Directory -Force -Path "backend", "frontend-web", "frontend-android", "docs", "infra", "scripts"
New-Item -ItemType File -Force -Path "README.md", ".gitignore"
```

## 2. Create Backend Structure (Spring Boot)
Scaffolding standard Spring Boot structure with packages.
// turbo
```powershell
$basePath = "backend/src/main/java/com/example/project"
$dirs = @(
    "$basePath/config",
    "$basePath/controllers",
    "$basePath/services",
    "$basePath/repositories",
    "$basePath/entities",
    "$basePath/dto",
    "$basePath/utils",
    "$basePath/exception",
    "$basePath/security",
    "backend/src/main/resources",
    "backend/scripts",
    "backend/tests"
)
foreach ($dir in $dirs) { New-Item -ItemType Directory -Force -Path $dir }
```

## 3. Create Frontend-Web Structure (React)
Scaffolding typical React 'src' structure.
// turbo
```powershell
$webSrc = "frontend-web/src"
$dirs = @(
    "$webSrc/components",
    "$webSrc/pages",
    "$webSrc/hooks",
    "$webSrc/services",
    "$webSrc/utils",
    "$webSrc/assets",
    "$webSrc/styles",
    "$webSrc/state",
    "frontend-web/public",
    "frontend-web/tests"
)
foreach ($dir in $dirs) { New-Item -ItemType Directory -Force -Path $dir }
```

## 4. Create Frontend-Android Structure (Kotlin)
Scaffolding standard Android Clean Architecture layers.
// turbo
```powershell
$androidBase = "frontend-android/app/src/main/java/com/example/project"
$dirs = @(
    "$androidBase/ui",
    "$androidBase/viewmodel",
    "$androidBase/repository",
    "$androidBase/network",
    "$androidBase/models",
    "$androidBase/utils",
    "frontend-android/app/src/main/res/values",
    "frontend-android/app/src/main/res/layout"
)
foreach ($dir in $dirs) { New-Item -ItemType Directory -Force -Path $dir }
```

## 5. Add Placeholder Files
// turbo
```powershell
New-Item -ItemType File -Force -Path "backend/src/main/resources/application.properties"
New-Item -ItemType File -Force -Path "frontend-web/public/index.html"
New-Item -ItemType File -Force -Path "frontend-android/build.gradle.kts"
Set-Content -Path "README.md" -Value "# Full-Stack Project`n`nStructure generated via workflow."
```
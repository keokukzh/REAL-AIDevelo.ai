# Ralph PRD Import Script (PowerShell)
# Converts PRD/spec files to Ralph project structure

param(
    [Parameter(Mandatory=$true)]
    [string]$PrdFile,
    
    [string]$ProjectName = "ralph-project",
    [string]$ProjectDir = ".\$ProjectName"
)

if (-not (Test-Path $PrdFile)) {
    Write-Host "Error: PRD file not found: $PrdFile" -ForegroundColor Red
    exit 1
}

if (Test-Path $ProjectDir) {
    Write-Host "Error: Directory $ProjectDir already exists" -ForegroundColor Red
    exit 1
}

Write-Host "Importing PRD: $PrdFile" -ForegroundColor Cyan
Write-Host "Creating project: $ProjectName" -ForegroundColor Cyan
Write-Host "Directory: $ProjectDir" -ForegroundColor Gray

# Create directory structure
New-Item -ItemType Directory -Path $ProjectDir -Force | Out-Null
New-Item -ItemType Directory -Path "$ProjectDir\specs" -Force | Out-Null
New-Item -ItemType Directory -Path "$ProjectDir\src" -Force | Out-Null
New-Item -ItemType Directory -Path "$ProjectDir\logs" -Force | Out-Null

# Copy PRD to specs directory
Copy-Item -Path $PrdFile -Destination "$ProjectDir\specs\" -Force

# Extract project name from PRD (first # heading)
$prdContent = Get-Content $PrdFile -TotalCount 20
$projectTitle = ($prdContent | Select-String -Pattern "^# " | Select-Object -First 1).Line -replace "^# ", ""
if (-not $projectTitle) {
    $projectTitle = $ProjectName
}

# Create PROMPT.md from PRD
@"
# Project Prompt

## Project Name
$projectTitle

## Overview
This project was imported from: $PrdFile

## Original PRD
See: specs/$(Split-Path $PrdFile -Leaf)

## Goals
[Extracted from PRD - edit as needed]

## Requirements
[Extracted from PRD - edit as needed]

## Constraints
[Extracted from PRD - edit as needed]

## Success Criteria
[Extracted from PRD - edit as needed]

---
*Note: This PROMPT.md was auto-generated from $PrdFile. Please review and edit as needed.*
"@ | Out-File -FilePath "$ProjectDir\PROMPT.md" -Encoding UTF8

# Create @fix_plan.md template
@"
# Implementation Plan

## Task 1: [Extract first major task from PRD]

**Files:**
- Create: `path/to/file.ext`
- Modify: `path/to/existing.ext`

**Steps:**
1. Write failing test
2. Verify test fails
3. Write minimal implementation
4. Verify test passes
5. Refactor if needed
6. Commit

**Verification:**
- Run: `command to verify`
- Expected: `expected output`

---

## Task 2: [Extract second major task from PRD]

[Follow same format as Task 1]

---

*Note: Tasks were auto-generated from PRD. Please review and break down into bite-sized tasks (2-5 minutes each) following Superpowers writing-plans format.*
"@ | Out-File -FilePath "$ProjectDir\@fix_plan.md" -Encoding UTF8

# Create .gitignore
@"
# Ralph session files
.ralph_session
.ralph_session.bak

# Logs
logs/*.log

# Dependencies
node_modules/
venv/
__pycache__/

# Build outputs
dist/
build/
*.o
*.so

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
"@ | Out-File -FilePath "$ProjectDir\.gitignore" -Encoding UTF8

# Create README.md
@"
# $projectTitle

## Overview
This project was imported from: $PrdFile

## Setup
[Setup instructions]

## Running Autonomous Loop
Use the `autonomous-loop` skill in Cursor to execute this project:

1. Review and edit PROMPT.md
2. Review and edit @fix_plan.md (break into bite-sized tasks)
3. Agent will use autonomous-loop skill
4. Monitor progress via `logs/ralph.log`
5. Check status with `scripts/ralph-status.ps1`

## Project Structure
- `PROMPT.md` - Project description and goals (auto-generated from PRD)
- `@fix_plan.md` - Prioritized task list (needs manual refinement)
- `specs/` - Original PRD and specifications
- `src/` - Source code
- `logs/` - Execution logs
- `.ralph_session` - Session state (auto-generated)

## Original PRD
See: `specs/$(Split-Path $PrdFile -Leaf)`
"@ | Out-File -FilePath "$ProjectDir\README.md" -Encoding UTF8

Write-Host ""
Write-Host "✅ PRD imported successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review $ProjectDir\PROMPT.md and edit as needed"
Write-Host "2. Review $ProjectDir\@fix_plan.md and break tasks into bite-sized items"
Write-Host "3. Use Superpowers writing-plans skill to refine @fix_plan.md"
Write-Host "4. Use the autonomous-loop skill in Cursor to execute"
Write-Host ""
Write-Host "Project location: $ProjectDir" -ForegroundColor Cyan

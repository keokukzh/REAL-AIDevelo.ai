# Ralph Project Setup Script (PowerShell)
# Creates a new Ralph project structure

param(
    [string]$ProjectName = "ralph-project",
    [string]$ProjectDir = ".\$ProjectName"
)

if (Test-Path $ProjectDir) {
    Write-Host "Error: Directory $ProjectDir already exists" -ForegroundColor Red
    exit 1
}

Write-Host "Creating Ralph project: $ProjectName" -ForegroundColor Cyan
Write-Host "Directory: $ProjectDir" -ForegroundColor Gray

# Create directory structure
New-Item -ItemType Directory -Path $ProjectDir -Force | Out-Null
New-Item -ItemType Directory -Path "$ProjectDir\specs" -Force | Out-Null
New-Item -ItemType Directory -Path "$ProjectDir\src" -Force | Out-Null
New-Item -ItemType Directory -Path "$ProjectDir\logs" -Force | Out-Null

# Create PROMPT.md template
@"
# Project Prompt

## Project Name
[Your project name]

## Goals
- [ ] Goal 1
- [ ] Goal 2
- [ ] Goal 3

## Requirements
- Requirement 1
- Requirement 2
- Requirement 3

## Constraints
- Constraint 1
- Constraint 2

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
"@ | Out-File -FilePath "$ProjectDir\PROMPT.md" -Encoding UTF8

# Create @fix_plan.md template
@"
# Implementation Plan

## Task 1: [Task Name]

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

## Task 2: [Task Name]

[Follow same format as Task 1]
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
# [Project Name]

## Overview
[Brief project description]

## Setup
[Setup instructions]

## Running Autonomous Loop
Use the `autonomous-loop` skill in Cursor to execute this project:

1. Ensure PROMPT.md and @fix_plan.md are defined
2. Agent will use autonomous-loop skill
3. Monitor progress via `logs/ralph.log`
4. Check status with `scripts/ralph-status.ps1`

## Project Structure
- `PROMPT.md` - Project description and goals
- `@fix_plan.md` - Prioritized task list
- `specs/` - Specifications and documentation
- `src/` - Source code
- `logs/` - Execution logs
- `.ralph_session` - Session state (auto-generated)
"@ | Out-File -FilePath "$ProjectDir\README.md" -Encoding UTF8

Write-Host ""
Write-Host "✅ Ralph project created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit $ProjectDir\PROMPT.md with your project details"
Write-Host "2. Edit $ProjectDir\@fix_plan.md with your task list"
Write-Host "3. Use the autonomous-loop skill in Cursor to execute"
Write-Host ""
Write-Host "Project location: $ProjectDir" -ForegroundColor Cyan

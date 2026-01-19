#!/bin/bash
# Ralph Project Setup Script
# Creates a new Ralph project structure

set -e

PROJECT_NAME="${1:-ralph-project}"
PROJECT_DIR="${2:-./$PROJECT_NAME}"

if [ -d "$PROJECT_DIR" ]; then
    echo "Error: Directory $PROJECT_DIR already exists"
    exit 1
fi

echo "Creating Ralph project: $PROJECT_NAME"
echo "Directory: $PROJECT_DIR"

# Create directory structure
mkdir -p "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR/specs"
mkdir -p "$PROJECT_DIR/src"
mkdir -p "$PROJECT_DIR/logs"

# Create PROMPT.md template
cat > "$PROJECT_DIR/PROMPT.md" << 'EOF'
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
EOF

# Create @fix_plan.md template
cat > "$PROJECT_DIR/@fix_plan.md" << 'EOF'
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
EOF

# Create .gitignore
cat > "$PROJECT_DIR/.gitignore" << 'EOF'
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
EOF

# Create README.md
cat > "$PROJECT_DIR/README.md" << 'EOF'
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
4. Check status with `scripts/ralph-status.sh`

## Project Structure
- `PROMPT.md` - Project description and goals
- `@fix_plan.md` - Prioritized task list
- `specs/` - Specifications and documentation
- `src/` - Source code
- `logs/` - Execution logs
- `.ralph_session` - Session state (auto-generated)
EOF

echo ""
echo "✅ Ralph project created successfully!"
echo ""
echo "Next steps:"
echo "1. Edit $PROJECT_DIR/PROMPT.md with your project details"
echo "2. Edit $PROJECT_DIR/@fix_plan.md with your task list"
echo "3. Use the autonomous-loop skill in Cursor to execute"
echo ""
echo "Project location: $PROJECT_DIR"

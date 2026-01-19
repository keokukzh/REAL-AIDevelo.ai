#!/bin/bash
# Ralph PRD Import Script
# Converts PRD/spec files to Ralph project structure

set -e

PRD_FILE="${1}"
PROJECT_NAME="${2:-ralph-project}"
PROJECT_DIR="${3:-./$PROJECT_NAME}"

if [ -z "$PRD_FILE" ]; then
    echo "Usage: $0 <prd-file> [project-name] [project-dir]"
    echo "Example: $0 requirements.md my-project"
    exit 1
fi

if [ ! -f "$PRD_FILE" ]; then
    echo "Error: PRD file not found: $PRD_FILE"
    exit 1
fi

if [ -d "$PROJECT_DIR" ]; then
    echo "Error: Directory $PROJECT_DIR already exists"
    exit 1
fi

echo "Importing PRD: $PRD_FILE"
echo "Creating project: $PROJECT_NAME"
echo "Directory: $PROJECT_DIR"

# Create directory structure
mkdir -p "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR/specs"
mkdir -p "$PROJECT_DIR/src"
mkdir -p "$PROJECT_DIR/logs"

# Copy PRD to specs directory
cp "$PRD_FILE" "$PROJECT_DIR/specs/"

# Extract project name from PRD (first # heading)
PROJECT_TITLE=$(head -n 20 "$PRD_FILE" | grep -m 1 "^# " | sed 's/^# //' || echo "$PROJECT_NAME")

# Create PROMPT.md from PRD
cat > "$PROJECT_DIR/PROMPT.md" << EOF
# Project Prompt

## Project Name
$PROJECT_TITLE

## Overview
This project was imported from: $PRD_FILE

## Original PRD
See: specs/$(basename "$PRD_FILE")

## Goals
[Extracted from PRD - edit as needed]

## Requirements
[Extracted from PRD - edit as needed]

## Constraints
[Extracted from PRD - edit as needed]

## Success Criteria
[Extracted from PRD - edit as needed]

---
*Note: This PROMPT.md was auto-generated from $PRD_FILE. Please review and edit as needed.*
EOF

# Create @fix_plan.md template with tasks extracted from PRD
cat > "$PROJECT_DIR/@fix_plan.md" << 'EOF'
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
cat > "$PROJECT_DIR/README.md" << EOF
# $PROJECT_TITLE

## Overview
This project was imported from: $PRD_FILE

## Setup
[Setup instructions]

## Running Autonomous Loop
Use the \`autonomous-loop\` skill in Cursor to execute this project:

1. Review and edit PROMPT.md
2. Review and edit @fix_plan.md (break into bite-sized tasks)
3. Agent will use autonomous-loop skill
4. Monitor progress via \`logs/ralph.log\`
5. Check status with \`scripts/ralph-status.sh\`

## Project Structure
- \`PROMPT.md\` - Project description and goals (auto-generated from PRD)
- \`@fix_plan.md\` - Prioritized task list (needs manual refinement)
- \`specs/\` - Original PRD and specifications
- \`src/\` - Source code
- \`logs/\` - Execution logs
- \`.ralph_session\` - Session state (auto-generated)

## Original PRD
See: \`specs/$(basename "$PRD_FILE")\`
EOF

echo ""
echo "✅ PRD imported successfully!"
echo ""
echo "Next steps:"
echo "1. Review $PROJECT_DIR/PROMPT.md and edit as needed"
echo "2. Review $PROJECT_DIR/@fix_plan.md and break tasks into bite-sized items"
echo "3. Use Superpowers writing-plans skill to refine @fix_plan.md"
echo "4. Use the autonomous-loop skill in Cursor to execute"
echo ""
echo "Project location: $PROJECT_DIR"

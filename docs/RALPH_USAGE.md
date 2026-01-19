# Ralph Autonomous Loop Usage Guide

Complete guide to using Ralph-inspired autonomous loop development in Cursor.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Project Setup](#project-setup)
4. [Running Autonomous Loops](#running-autonomous-loops)
5. [Monitoring & Status](#monitoring--status)
6. [Integration with Superpowers](#integration-with-superpowers)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

Ralph autonomous loop is a skill that enables iterative, autonomous development execution. It:

- Executes development plans automatically until completion
- Uses dual-condition exit detection (completion + explicit signal)
- Implements safety mechanisms (rate limiting, circuit breaker)
- Tracks state across iterations
- Integrates with Superpowers workflow

**Key Concept:** Instead of manually executing each task, the agent runs loops automatically, checking exit conditions after each iteration.

## Quick Start

### 1. Create a Ralph Project

```bash
# Bash
./scripts/ralph-setup.sh my-project

# PowerShell
.\scripts\ralph-setup.ps1 -ProjectName my-project
```

Or import from existing PRD:

```bash
# Bash
./scripts/ralph-import.sh requirements.md my-project

# PowerShell
.\scripts\ralph-import.ps1 -PrdFile requirements.md -ProjectName my-project
```

### 2. Define Your Project

Edit the created files:
- `PROMPT.md` - Project description and goals
- `@fix_plan.md` - Prioritized task list

**Important:** Tasks in `@fix_plan.md` should follow Superpowers `writing-plans` format:
- Bite-sized (2-5 minutes each)
- Exact file paths
- Complete code specifications
- Verification steps

### 3. Run Autonomous Loop

Tell the Cursor agent:
```
"Use the autonomous-loop skill to execute this project"
```

The agent will:
1. Load `PROMPT.md` and `@fix_plan.md`
2. Initialize session state (`.ralph_session`)
3. Execute tasks iteratively
4. Track progress and state
5. Exit when completion criteria are met

### 4. Monitor Progress

```bash
# Check status
./scripts/ralph-status.sh

# View logs
tail -f logs/ralph.log
```

## Project Setup

### Project Structure

A Ralph project has this structure:

```
my-project/
├── PROMPT.md          # Project description and goals
├── @fix_plan.md       # Prioritized task list
├── specs/             # Specifications and documentation
├── src/               # Source code
├── logs/              # Execution logs (auto-created)
├── .ralph_session     # Session state (auto-created)
└── README.md          # Project documentation
```

### PROMPT.md Format

```markdown
# Project Name

## Goals
- [ ] Goal 1
- [ ] Goal 2

## Requirements
- Requirement 1
- Requirement 2

## Constraints
- Constraint 1

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

### @fix_plan.md Format

```markdown
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

## Task 2: [Next Task]

[Same format...]
```

**Key Requirements:**
- Tasks must be bite-sized (2-5 minutes each)
- Include exact file paths
- Specify complete code (not just descriptions)
- Include verification steps
- Follow TDD format (test first)

## Running Autonomous Loops

### Basic Usage

1. **Ensure project is set up:**
   - `PROMPT.md` exists and is complete
   - `@fix_plan.md` exists with tasks

2. **Tell agent to use skill:**
   ```
   "Use the autonomous-loop skill to execute this project"
   ```

3. **Agent will:**
   - Read project files
   - Initialize session
   - Execute tasks iteratively
   - Track state
   - Exit when done

### Exit Conditions

The loop exits when **ALL** of these are true:
1. Completion indicators in agent response
2. `EXIT_SIGNAL: true` explicitly set
3. All tasks in `@fix_plan.md` are complete
4. Verification passed (Superpowers `verification-before-completion`)

OR when **ANY** of these occur:
- Circuit breaker opened (too many failures)
- Rate limit exceeded
- Timeout reached (default 24 hours)
- User explicitly stops

### Configuration

Default values (can be adjusted in session):
- `MAX_API_CALLS_PER_HOUR`: 100
- `CIRCUIT_BREAKER_THRESHOLD`: 5 failures
- `SESSION_TIMEOUT_HOURS`: 24
- `LOOP_TIMEOUT_MINUTES`: 15 per iteration

## Monitoring & Status

### Check Status

```bash
# Text output
./scripts/ralph-status.sh

# JSON output
./scripts/ralph-status.sh .ralph_session json
```

Status shows:
- Loop count
- API calls used
- Current task
- Circuit breaker state
- Rate limit status
- Completed tasks

### View Logs

```bash
# Bash
tail -f logs/ralph.log

# PowerShell
Get-Content logs\ralph.log -Wait
```

Logs include:
- Session start/end
- Each loop iteration
- Task execution
- Exit conditions
- Errors and warnings

### Session State

`.ralph_session` (JSON) tracks:
- Loop count
- API calls
- Start time and last activity
- Circuit breaker state
- Completed tasks
- Current task
- Rate limit info

## Integration with Superpowers

### writing-plans

Use Superpowers `writing-plans` skill to create `@fix_plan.md`:

1. Use `writing-plans` skill to create plan
2. Save plan as `@fix_plan.md`
3. Ensure tasks are bite-sized
4. Include exact file paths and verification

### test-driven-development

**MANDATORY:** Every task must follow TDD:

1. Write failing test
2. Verify it fails
3. Write minimal code
4. Verify it passes
5. Refactor if needed

The autonomous loop enforces this for each task.

### verification-before-completion

**MANDATORY:** Before exit, verification runs:

1. Run all tests
2. Verify expected outputs
3. Document evidence
4. Only then exit

### systematic-debugging

If a task fails:
1. Use `systematic-debugging` skill
2. Identify root cause
3. Fix and retry
4. Update circuit breaker on failures

## Best Practices

### 1. Start Small

Begin with simple projects to verify the loop works:
- 3-5 tasks
- Clear, well-defined tasks
- Simple verification steps

### 2. Well-Defined Tasks

Tasks in `@fix_plan.md` should be:
- Bite-sized (2-5 minutes)
- Self-contained
- Include exact file paths
- Have clear verification steps

### 3. Use TDD Always

Never skip test-driven development:
- Write test first
- Watch it fail
- Write minimal code
- Watch it pass

### 4. Monitor Progress

Check status regularly:
- Use `ralph-status` script
- Review logs
- Verify tasks are completing

### 5. Review Before Exit

Before loop exits:
- Verify all tests pass
- Check all tasks complete
- Review code quality
- Ensure documentation updated

### 6. Handle Errors Gracefully

If tasks fail:
- Use `systematic-debugging`
- Fix root cause
- Retry with fix
- Don't ignore failures

## Troubleshooting

### Loop Not Exiting

**Problem:** Loop continues even when tasks are done

**Solutions:**
- Check if `EXIT_SIGNAL` is set to `true`
- Verify all tasks marked complete in `@fix_plan.md`
- Ensure `verification-before-completion` passed
- Check session state: `./scripts/ralph-status.sh`

### Tasks Failing Repeatedly

**Problem:** Same task fails multiple times

**Solutions:**
- Check circuit breaker state
- Review task definition in `@fix_plan.md`
- Use `systematic-debugging` for root cause
- Verify task is well-defined and executable

### Rate Limit Issues

**Problem:** Rate limit exceeded

**Solutions:**
- Check status: `./scripts/ralph-status.sh`
- Wait for rate limit window to reset
- Reduce task complexity
- Increase `MAX_API_CALLS_PER_HOUR` if needed

### Session Lost

**Problem:** `.ralph_session` file missing or corrupted

**Solutions:**
- Check if file exists
- Verify file permissions
- Restore from backup if available
- Start new session if needed

### Circuit Breaker Open

**Problem:** Circuit breaker opened, loop stopped

**Solutions:**
- Review failure count
- Fix underlying issues
- Reset circuit breaker (manual intervention)
- Restart session

## Examples

See `examples/ralph-project/` for a complete example:
- `PROMPT.md` - Example project prompt
- `@fix_plan.md` - Example task breakdown
- `README.md` - Example documentation

## Next Steps

1. Create your first Ralph project
2. Define clear tasks in `@fix_plan.md`
3. Run autonomous loop
4. Monitor progress
5. Review and iterate

## Related Documentation

- **Skill:** `.agent/skills/autonomous-loop/SKILL.md`
- **Superpowers Workflow:** `.agent/WORKFLOW.md`
- **Writing Plans:** `.agent/skills/writing-plans/SKILL.md`
- **TDD:** `.agent/skills/test-driven-development/SKILL.md`

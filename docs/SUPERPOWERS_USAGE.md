# Superpowers Usage Guide

Complete guide to using Superpowers skills effectively in your development workflow.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Skills](#core-skills)
3. [Workflow Examples](#workflow-examples)
4. [Best Practices](#best-practices)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)

## Getting Started

### Understanding Skills

Skills are structured workflows that guide development. Each skill:
- Has a specific purpose
- Defines when to use it
- Provides step-by-step instructions
- Includes examples and anti-patterns

### Loading Skills

In Cursor, skills are loaded by reading SKILL.md files:

1. Identify which skill applies
2. Read `.agent/skills/<skill-name>/SKILL.md`
3. Follow the instructions
4. Announce usage: "Using [skill-name] to [purpose]"

### Skill Discovery

- **Quick Reference:** `.agent/skills/INDEX.md`
- **Complete Workflow:** `.agent/WORKFLOW.md`
- **Skill Loader Guide:** `.agent/load-skill.md`

## Core Skills

### 1. Brainstorming

**When:** Before any creative work - new features, components, functionality

**Purpose:** Turn rough ideas into fully formed designs

**Process:**
1. Understand project context
2. Ask questions one at a time
3. Explore 2-3 approaches
4. Present design in sections
5. Get approval
6. Save design document

**Output:** `docs/plans/YYYY-MM-DD-<topic>-design.md`

### 2. Writing Plans

**When:** Before multi-step implementation work

**Purpose:** Break work into bite-sized, executable tasks

**Key Principles:**
- Tasks are 2-5 minutes each
- Exact file paths specified
- Complete code (not just descriptions)
- Verification steps included
- TDD-focused

**Output:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

### 3. Test-Driven Development

**When:** ALWAYS when writing code

**Purpose:** Red-Green-Refactor cycle

**Process:**
1. **RED:** Write failing test
2. **Verify:** Run test, confirm failure
3. **GREEN:** Write minimal code to pass
4. **Verify:** Run test, confirm pass
5. **REFACTOR:** Improve code, keep tests green

**Iron Law:** NO production code without failing test first

### 4. Systematic Debugging

**When:** Any bug, test failure, or unexpected behavior

**Purpose:** Root-cause analysis before fixing

**Process:**
1. **Observe:** Document symptoms
2. **Hypothesize:** Form testable hypothesis
3. **Test:** Run experiments
4. **Fix:** Only after root cause identified

**Never:** Guess or fix without understanding

### 5. Verification Before Completion

**When:** Before claiming work is complete

**Purpose:** Evidence before assertions

**Process:**
1. Run verification commands
2. Confirm actual output
3. Document evidence
4. Only then claim success

**Never:** Claim success without running tests

### 6. Using Git Worktrees

**When:** Starting feature work needing isolation

**Purpose:** Create isolated workspace

**Process:**
1. Create new branch
2. Create worktree in isolated directory
3. Run project setup
4. Verify clean test baseline

**Benefits:** Parallel work, clean isolation

### 7. Requesting Code Review

**When:** Before claiming work is complete

**Purpose:** Quality gate before completion

**Process:**
1. Pre-review checklist
2. Request review
3. Address feedback
4. Iterate until approved

### 8. Finishing Development Branch

**When:** Tasks complete, ready to merge

**Purpose:** Clean completion workflow

**Process:**
1. Verify tests pass
2. Review changes
3. Choose: merge/PR/keep/discard
4. Clean up worktree

## Workflow Examples

### Example 1: New Feature

```
1. User: "Add user authentication"

2. Agent uses brainstorming:
   - Reads .agent/skills/brainstorming/SKILL.md
   - Asks questions about requirements
   - Explores approaches (JWT, sessions, OAuth)
   - Presents design in sections
   - Saves: docs/plans/2026-01-20-auth-design.md

3. Agent uses using-git-worktrees:
   - Creates branch: feature/user-auth
   - Creates worktree
   - Sets up environment

4. Agent uses writing-plans:
   - Breaks into tasks:
     * Task 1: Write failing test for login endpoint
     * Task 2: Implement login endpoint
     * Task 3: Write failing test for auth middleware
     * Task 4: Implement auth middleware
   - Saves: docs/plans/2026-01-20-user-auth.md

5. Agent uses test-driven-development:
   - For each task:
     * Write failing test
     * Verify it fails
     * Write minimal code
     * Verify it passes
     * Refactor
     * Commit

6. Agent uses verification-before-completion:
   - Runs all tests
   - Verifies endpoints work
   - Documents evidence

7. Agent uses requesting-code-review:
   - Pre-review checklist
   - Requests review
   - Addresses feedback

8. Agent uses finishing-a-development-branch:
   - Verifies everything
   - Creates PR
   - Cleans up worktree
```

### Example 2: Bug Fix

```
1. User: "Login is failing"

2. Agent uses systematic-debugging:
   - Reads .agent/skills/systematic-debugging/SKILL.md
   - Observes: Error message, logs, stack trace
   - Hypothesizes: Token validation issue
   - Tests: Check token format, validation logic
   - Identifies: Root cause - expired token handling

3. Agent uses test-driven-development:
   - Write failing test for expired token
   - Verify it fails
   - Fix the code
   - Verify it passes

4. Agent uses verification-before-completion:
   - Runs all auth tests
   - Tests with expired tokens
   - Documents fix

5. Agent uses requesting-code-review:
   - Reviews fix
   - Gets approval

6. Agent commits and merges
```

### Example 3: Quick Fix (Still TDD!)

```
1. User: "Fix typo in error message"

2. Agent uses test-driven-development:
   - Write failing test checking error message
   - Verify it fails with wrong message
   - Fix typo
   - Verify test passes

3. Agent uses verification-before-completion:
   - Runs test
   - Confirms fix

4. Agent commits
```

## Best Practices

### Always Use TDD

**Never:**
- Write code before tests
- Skip tests for "simple" changes
- Keep code written before tests

**Always:**
- Write failing test first
- Watch it fail
- Write minimal code
- Watch it pass
- Refactor

### Plan Before Coding

**For multi-step work:**
1. Use brainstorming (if new feature)
2. Use writing-plans
3. Break into small tasks
4. Execute systematically

### Verify Everything

**Before claiming success:**
1. Run tests
2. Verify output
3. Document evidence
4. Only then claim completion

### Use Worktrees

**For feature work:**
1. Create isolated workspace
2. Keep main clean
3. Enable parallel work
4. Easy cleanup

### Review Before Completion

**Always:**
1. Self-review first
2. Request code review
3. Address feedback
4. Iterate until approved

## Common Patterns

### Pattern: Feature Development

```
brainstorming → using-git-worktrees → writing-plans → 
test-driven-development → verification-before-completion → 
requesting-code-review → finishing-a-development-branch
```

### Pattern: Bug Fix

```
systematic-debugging → test-driven-development → 
verification-before-completion → requesting-code-review
```

### Pattern: Refactoring

```
test-driven-development → (ensure tests exist) → 
refactor → verification-before-completion
```

### Pattern: Quick Change

```
test-driven-development → verification-before-completion
```

## Troubleshooting

### Skill Not Applied

**Problem:** Agent skipped a skill

**Solution:**
- Explicitly request: "Use the [skill-name] skill"
- Check `.cursorrules` has skill triggers
- Remind agent to check INDEX.md

### Tests Failing

**Problem:** Tests fail after implementation

**Solution:**
- Use systematic-debugging
- Check test setup
- Verify test expectations
- Review TDD cycle

### Plan Too Large

**Problem:** Tasks are too big

**Solution:**
- Break into smaller tasks (2-5 minutes)
- Use writing-plans skill guidelines
- Review task granularity

### Worktree Issues

**Problem:** Worktree conflicts or issues

**Solution:**
- Use using-git-worktrees skill
- Check git status
- Verify branch isolation
- Clean up properly

## Advanced Usage

### Custom Skills

Create project-specific skills:
1. Use writing-skills skill
2. Follow skill structure
3. Document thoroughly
4. Test with subagents

### Parallel Work

Use dispatching-parallel-agents for:
- Independent tasks
- Parallel feature work
- Concurrent bug fixes

### Subagent Development

Use subagent-driven-development for:
- Fast iteration
- Fresh context per task
- Two-stage reviews

## Resources

- **Skills Index:** `.agent/skills/INDEX.md`
- **Workflow Guide:** `.agent/WORKFLOW.md`
- **Setup Guide:** `docs/SUPERPOWERS_SETUP.md`
- **Official Repo:** https://github.com/obra/superpowers

## Next Steps

1. Try a small feature using complete workflow
2. Practice TDD on bug fixes
3. Create custom skills for project needs
4. Refine workflow based on experience

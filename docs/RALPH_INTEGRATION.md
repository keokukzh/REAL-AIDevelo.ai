# Ralph Integration with Superpowers

This document explains how Ralph autonomous loop integrates with the Superpowers workflow framework.

## Overview

Ralph autonomous loop is a Superpowers skill that enables iterative, autonomous development execution. It integrates seamlessly with existing Superpowers skills and workflows.

## Integration Points

### 1. writing-plans

**Relationship:** Ralph uses `writing-plans` output format

**How it works:**
1. Use Superpowers `writing-plans` skill to create `@fix_plan.md`
2. Ensure tasks follow `writing-plans` format:
   - Bite-sized (2-5 minutes each)
   - Exact file paths
   - Complete code specifications
   - Verification steps
3. Save plan as `@fix_plan.md` in Ralph project
4. Autonomous loop reads and executes tasks

**Example:**
```
1. Use writing-plans skill → creates detailed plan
2. Save plan as @fix_plan.md
3. Use autonomous-loop skill → executes plan iteratively
```

### 2. test-driven-development

**Relationship:** Ralph enforces TDD for every task

**How it works:**
1. Each task in `@fix_plan.md` must follow TDD format
2. Autonomous loop executes:
   - RED: Write failing test
   - Verify test fails
   - GREEN: Write minimal code
   - Verify test passes
   - REFACTOR: Improve while keeping tests green
3. No task can skip TDD - it's mandatory

**Enforcement:**
- Loop checks for test files before implementation
- Verification step requires tests to pass
- Failure to follow TDD increments failure counter

### 3. verification-before-completion

**Relationship:** Ralph requires verification before exit

**How it works:**
1. Before loop exits, `verification-before-completion` runs:
   - Run all tests
   - Verify expected outputs
   - Document evidence
2. Exit only happens if verification passes
3. If verification fails, loop continues

**Exit Conditions:**
- All tasks complete ✓
- Verification passed ✓
- EXIT_SIGNAL: true ✓

### 4. systematic-debugging

**Relationship:** Ralph uses debugging when tasks fail

**How it works:**
1. If task fails, autonomous loop:
   - Uses `systematic-debugging` skill
   - Identifies root cause
   - Fixes issue
   - Retries task
2. Failure counter increments
3. If failures exceed threshold, circuit breaker opens

**Error Handling:**
- Task failure → systematic-debugging → retry
- Multiple failures → circuit breaker opens → exit

### 5. using-git-worktrees

**Relationship:** Ralph projects can use worktrees for isolation

**How it works:**
1. Before starting autonomous loop:
   - Use `using-git-worktrees` to create isolated workspace
   - Run autonomous loop in worktree
   - Keep main branch clean
2. After completion:
   - Use `finishing-a-development-branch` to merge/PR

**Best Practice:**
- Always use worktrees for Ralph projects
- Isolate autonomous execution
- Easy cleanup if needed

## Workflow Integration

### Complete Workflow with Ralph

```
┌─────────────────┐
│  User Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Brainstorming  │ ← Use: brainstorming skill
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Git Worktree   │ ← Use: using-git-worktrees skill
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Write Plan     │ ← Use: writing-plans skill
│  (Save as       │
│   @fix_plan.md) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Autonomous     │ ← Use: autonomous-loop skill
│  Loop Execution │
└────────┬────────┘
         │
         ├─► TDD Cycle ← Enforced for each task
         │   (Red → Green → Refactor)
         │
         ├─► Error Handling ← Uses systematic-debugging
         │
         └─► Verification ← Uses verification-before-completion
         
         ▼
┌─────────────────┐
│ Finish Branch   │ ← Use: finishing-a-development-branch skill
└─────────────────┘
```

### When to Use Ralph vs Manual Execution

**Use Ralph (autonomous-loop) when:**
- You have well-defined tasks in `@fix_plan.md`
- Tasks are independent and can be executed sequentially
- You want minimal intervention
- You need safety mechanisms (rate limiting, circuit breaker)

**Use Manual Execution (executing-plans) when:**
- Tasks need human review between batches
- Tasks are tightly coupled
- You want more control over execution
- You need to adjust plan during execution

**Use Subagent-Driven (subagent-driven-development) when:**
- Tasks are independent
- You want fast iteration in same session
- You need two-stage review (spec + quality)
- You want to stay in current session

## Skill Dependencies

Ralph autonomous loop depends on:

1. **writing-plans** - Creates the task list format
2. **test-driven-development** - Enforced for every task
3. **verification-before-completion** - Required before exit
4. **systematic-debugging** - Used for error recovery

Ralph autonomous loop works with:

1. **using-git-worktrees** - For project isolation
2. **finishing-a-development-branch** - For cleanup
3. **requesting-code-review** - For quality gates

## Best Practices

### 1. Plan Before Loop

Always use `writing-plans` to create `@fix_plan.md`:
- Ensures tasks are well-defined
- Follows Superpowers format
- Includes verification steps

### 2. Use Worktrees

Always use `using-git-worktrees` before starting loop:
- Isolates execution
- Keeps main branch clean
- Easy cleanup if needed

### 3. Monitor Progress

Check status regularly:
- Use `ralph-status` script
- Review logs
- Verify tasks completing

### 4. Handle Errors

If tasks fail:
- Loop uses `systematic-debugging`
- Fixes root cause
- Retries automatically
- Opens circuit breaker if too many failures

### 5. Verify Before Exit

Loop requires `verification-before-completion`:
- Runs all tests
- Verifies outputs
- Documents evidence
- Only exits if verification passes

## Examples

### Example 1: New Feature with Ralph

```
1. User: "Add user authentication"

2. Agent uses brainstorming:
   - Creates design document
   - Saves to docs/plans/

3. Agent uses using-git-worktrees:
   - Creates isolated workspace

4. Agent uses writing-plans:
   - Creates detailed plan
   - Saves as @fix_plan.md

5. Agent uses autonomous-loop:
   - Executes tasks iteratively
   - Each task uses TDD
   - Tracks state in .ralph_session
   - Exits when complete + verified

6. Agent uses finishing-a-development-branch:
   - Merges or creates PR
```

### Example 2: Bug Fix with Ralph

```
1. User: "Fix login bug"

2. Agent uses systematic-debugging:
   - Identifies root cause

3. Agent uses writing-plans:
   - Creates fix plan
   - Saves as @fix_plan.md

4. Agent uses autonomous-loop:
   - Executes fix with TDD
   - Verifies fix works
   - Exits when verified
```

## Configuration

Ralph respects Superpowers configuration:
- TDD enforcement (mandatory)
- Verification requirements (mandatory)
- Code review gates (optional, but recommended)

Ralph adds its own configuration:
- Rate limiting (100 calls/hour)
- Circuit breaker (5 failures)
- Timeout (24 hours)

## Troubleshooting

### Integration Issues

**Problem:** Tasks not following TDD format

**Solution:**
- Ensure `@fix_plan.md` follows `writing-plans` format
- Each task must include test step
- Loop enforces TDD - cannot skip

**Problem:** Verification failing

**Solution:**
- Check all tests pass
- Verify expected outputs match
- Review `verification-before-completion` requirements

**Problem:** Loop not respecting Superpowers rules

**Solution:**
- Ensure skill is loaded correctly
- Check `.agent/skills/autonomous-loop/SKILL.md`
- Verify integration points are followed

## Related Documentation

- **Ralph Usage:** `docs/RALPH_USAGE.md`
- **Autonomous Loop Skill:** `.agent/skills/autonomous-loop/SKILL.md`
- **Superpowers Workflow:** `.agent/WORKFLOW.md`
- **Writing Plans:** `.agent/skills/writing-plans/SKILL.md`
- **TDD:** `.agent/skills/test-driven-development/SKILL.md`

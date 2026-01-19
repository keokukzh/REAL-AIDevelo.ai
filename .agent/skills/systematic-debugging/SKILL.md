---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## The Four Phases

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully** - Read stack traces completely. Note line numbers, file paths.
2. **Reproduce Consistently** - Find exact steps to trigger reliably.
3. **Check Recent Changes** - What changed (git diff, commits)?
4. **Gather Evidence** - Add diagnostic logging. Log data entering/exiting components.
5. **Trace Data Flow** - Where does bad value originate? Trace up until source.

### Phase 2: Pattern Analysis

1. **Find Working Examples** - Locate similar code that works.
2. **Compare Against References** - Read reference implementation COMPLETELY.
3. **Identify Differences** - What's different between working and broken?

### Phase 3: Hypothesis and Testing

1. **Form Single Hypothesis** - "I think X is root cause because Y."
2. **Test Minimally** - Smallest change to test hypothesis. One variable at a time.
3. **Verify Before Continuing** - Did it work? If not, form NEW hypothesis. Don't layer fixes.

### Phase 4: Implementation

1. **Create Failing Test Case** - Reproduction test is MUST. Use `superpowers:test-driven-development`.
2. **Implement Single Fix** - Address root cause, one change at a time. No "while I'm here" changes.
3. **Verify Fix** - All tests pass. Issue resolved.
4. **If 3+ Fixes Failed** - STOP. Question architecture. Is the pattern fundamentally sound?

## Red Flags - STOP and Return to Phase 1

- "Just trying X and see if it works"
- Proposing fixes without tracing data flow
- Layers of unproven changes
- "One more fix attempt" (after 2+ failures)
- No reproduction test

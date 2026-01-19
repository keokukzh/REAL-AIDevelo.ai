# Add Jitter to Retry Mechanism Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add optional jitter to the exponential backoff in `retryWithBackoff` to prevent thundering herd issues.

**Architecture:** Extend the `RetryOptions` interface and modify the delay calculation in `retryWithBackoff`.

**Tech Stack:** TypeScript, Vitest.

---

### Task 1: Add useJitter to RetryOptions

**Files:**

- Modify: `server/src/utils/retry.ts`

**Step 1: Write the failing test**
In `server/src/utils/__tests__/retry.test.ts`, add a test that checks if `useJitter` works.
Since the current code doesn't have `useJitter`, just adding it to the options in a test will cause a type error (fail to compile).

**Step 2: Run test to verify it fails**
`npm test server/src/utils/__tests__/retry.test.ts`
Expected: Compilation error.

**Step 3: Update RetryOptions interface**
Add `useJitter?: boolean;` to `RetryOptions`.

**Step 4: Run test to verify it passes**
`npm test server/src/utils/__tests__/retry.test.ts`
Expected: PASS (compiles now).

**Step 5: Commit**
`git add ...`

### Task 2: Implement Jitter Logic

**Files:**

- Modify: `server/src/utils/retry.ts`

**Step 1: Write the failing test**
Add a test that mocks `setTimeout` and verifies that with `useJitter: true`, the delay is not exactly the exponential value.

**Step 2: Run test to verify it fails**
`npm test server/src/utils/__tests__/retry.test.ts`
Expected: FAIL (delays are exactly exponential).

**Step 3: Implement Jitter in retryWithBackoff**
Update the loop to apply jitter if `useJitter` is true.

**Step 4: Run test to verify it passes**
`npm test server/src/utils/__tests__/retry.test.ts`
Expected: PASS.

**Step 5: Commit**
`git add ...`

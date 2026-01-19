# Superpowers Skills Comparison

This document compares local skills with the official repository to ensure they are up-to-date.

## Comparison Date

2026-01-20

## Skills Inventory

### Repository Skills (from https://github.com/obra/superpowers.git)

1. brainstorming
2. dispatching-parallel-agents
3. executing-plans
4. finishing-a-development-branch
5. receiving-code-review
6. requesting-code-review
7. subagent-driven-development
8. systematic-debugging
9. test-driven-development
10. using-git-worktrees
11. using-superpowers
12. verification-before-completion
13. writing-plans
14. writing-skills

**Total:** 14 skills

### Local Skills (in `.agent/skills/`)

1. brainstorming
2. dispatching-parallel-agents
3. executing-plans
4. finishing-a-development-branch
5. receiving-code-review
6. requesting-code-review
7. subagent-driven-development
8. systematic-debugging
9. test-driven-development
10. using-git-worktrees
11. using-superpowers
12. verification-before-completion
13. writing-plans
14. writing-skills

**Total:** 14 skills

**Additional Files:**
- INDEX.md (created locally for Cursor integration)

## Status

✅ **All 14 core skills are present and match the repository**

## Local Customizations

The following files are local additions (not in repository):
- `.agent/skills/INDEX.md` - Skills index for Cursor integration
- `.agent/load-skill.md` - Skill loading guide for Cursor
- `.agent/WORKFLOW.md` - Complete workflow guide
- `.agent/rules/superpowers.md` - Extended rules with Cursor notes

These are intentional additions for Cursor integration and should be preserved during updates.

## Update Process

To update skills from the repository:

**Windows (PowerShell):**
```powershell
.\scripts\update-superpowers-skills.ps1
```

**Linux/Mac (Bash):**
```bash
./scripts/update-superpowers-skills.sh
```

The update script will:
1. Create a backup of current skills
2. Clone the latest repository
3. Copy updated skills
4. Preserve local customizations (INDEX.md, etc.)

## Verification

After updating, verify:
1. All 14 skills are present
2. INDEX.md is preserved
3. Local customizations are intact
4. Skills work correctly

## Notes

- Skills are stored in `.agent/skills/`
- Each skill is a directory with `SKILL.md` and supporting files
- The repository structure matches the official superpowers repository
- Local additions are documented and preserved during updates

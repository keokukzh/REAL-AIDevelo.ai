# Superpowers Setup Guide for Cursor

This guide explains how to install, configure, and use Superpowers skills in Cursor IDE.

## What is Superpowers?

Superpowers is a software development workflow framework for AI coding agents. It provides structured methodologies and composable "skills" that help agents plan, implement, review, and test code systematically.

## Installation

### Current Status

Superpowers skills are already installed in this workspace at `.agent/skills/`.

### Verifying Installation

Check that skills are present:

```bash
ls .agent/skills/
```

You should see 14 skill directories:
- brainstorming
- dispatching-parallel-agents
- executing-plans
- finishing-a-development-branch
- receiving-code-review
- requesting-code-review
- subagent-driven-development
- systematic-debugging
- test-driven-development
- using-git-worktrees
- using-superpowers
- verification-before-completion
- writing-plans
- writing-skills

### Updating Skills

To update skills from the official repository:

**On Windows (PowerShell):**
```powershell
.\scripts\update-superpowers-skills.ps1
```

**On Linux/Mac (Bash):**
```bash
chmod +x scripts/update-superpowers-skills.sh
./scripts/update-superpowers-skills.sh
```

The script will:
1. Create a backup of current skills
2. Clone the latest superpowers repository
3. Copy updated skills
4. Preserve local customizations

## How Skills Work in Cursor

### Key Difference from Claude Code

Unlike Claude Code which has a plugin system with commands like `/superpowers:brainstorm`, Cursor requires manual skill loading by reading SKILL.md files.

### Skill Loading Process

1. **Identify applicable skill** - Check `.agent/skills/INDEX.md` or the skill list
2. **Read the skill file** - Load `.agent/skills/<skill-name>/SKILL.md`
3. **Announce usage** - "I'm using [skill-name] to [purpose]"
4. **Follow instructions** - Execute the skill's steps exactly
5. **Verify completion** - Ensure all steps are done

### Example

```
User: "Add user authentication"

Agent:
1. Recognizes need for planning → checks brainstorming skill
2. Reads: .agent/skills/brainstorming/SKILL.md
3. Announces: "I'm using the brainstorming skill to refine this feature design"
4. Follows brainstorming process
5. Saves design to docs/plans/
```

## Configuration

### .cursorrules

The `.cursorrules` file contains instructions for the agent to use superpowers. It includes:
- TDD rules
- Skill triggers
- Workflow guidance

### .agent/rules/superpowers.md

Extended rules and Cursor-specific integration notes.

### Skill Files

Each skill is a directory containing:
- `SKILL.md` - Main skill instructions
- Additional files (examples, templates, etc.)

## File Structure

```
.agent/
├── skills/
│   ├── INDEX.md              # Skills index and quick reference
│   ├── brainstorming/
│   │   └── SKILL.md
│   ├── writing-plans/
│   │   └── SKILL.md
│   └── ... (other skills)
├── rules/
│   └── superpowers.md        # Extended rules
├── WORKFLOW.md               # Complete workflow guide
└── load-skill.md             # How to load skills

docs/
├── plans/                    # Implementation plans storage
└── SUPERPOWERS_SETUP.md      # This file

scripts/
├── update-superpowers-skills.sh    # Update script (Bash)
└── update-superpowers-skills.ps1   # Update script (PowerShell)
```

## Usage

### Quick Start

1. **New feature?** → Use `brainstorming` skill
2. **Planning?** → Use `writing-plans` skill
3. **Coding?** → Use `test-driven-development` skill (always)
4. **Debugging?** → Use `systematic-debugging` skill
5. **Completing?** → Use `verification-before-completion` skill

### Common Workflows

**Feature Development:**
```
brainstorming → using-git-worktrees → writing-plans → 
test-driven-development → verification-before-completion → 
requesting-code-review → finishing-a-development-branch
```

**Bug Fix:**
```
systematic-debugging → test-driven-development → 
verification-before-completion → requesting-code-review
```

### Skill Reference

See `.agent/skills/INDEX.md` for complete skill reference.

## Troubleshooting

### Skills Not Found

**Problem:** Agent can't find skills

**Solution:**
1. Verify skills exist: `ls .agent/skills/`
2. Check `.cursorrules` references `.agent/skills`
3. Ensure agent can read files in `.agent/` directory

### Skills Not Being Used

**Problem:** Agent skips skills or doesn't use them

**Solution:**
1. Check `.cursorrules` has skill triggers
2. Remind agent to check `.agent/skills/INDEX.md`
3. Explicitly request skill usage: "Use the brainstorming skill"

### Outdated Skills

**Problem:** Skills seem outdated

**Solution:**
1. Run update script: `.\scripts\update-superpowers-skills.ps1`
2. Review changes: `git diff .agent/skills/`
3. Test updated skills

### Local Customizations Lost

**Problem:** Update script overwrote customizations

**Solution:**
1. Check backup: `.agent/skills-backup-YYYYMMDD-HHMMSS/`
2. Restore custom files from backup
3. Consider documenting customizations separately

## Best Practices

1. **Always use TDD** - No production code without failing test first
2. **Plan before coding** - Use `writing-plans` for multi-step work
3. **Verify everything** - Use `verification-before-completion` before claiming success
4. **Use worktrees** - Isolate feature work with `using-git-worktrees`
5. **Review before completion** - Use `requesting-code-review`

## Resources

- **Skills Index:** `.agent/skills/INDEX.md`
- **Workflow Guide:** `.agent/WORKFLOW.md`
- **Skill Loader:** `.agent/load-skill.md`
- **Extended Rules:** `.agent/rules/superpowers.md`
- **Official Repo:** https://github.com/obra/superpowers

## Next Steps

1. Read `.agent/WORKFLOW.md` for complete workflow
2. Review `.agent/skills/INDEX.md` for skill reference
3. Try a small feature using the complete workflow
4. Create custom skills if needed (see `writing-skills` skill)

## Support

- **Issues:** Check `.agent/rules/superpowers.md` troubleshooting section
- **Official Issues:** https://github.com/obra/superpowers/issues
- **Documentation:** See `.agent/` directory for guides

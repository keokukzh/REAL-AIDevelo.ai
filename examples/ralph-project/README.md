# Example Ralph Project: Simple Todo API

This is an example Ralph project demonstrating how to structure a project for autonomous loop execution.

## Project Structure

- `PROMPT.md` - Project description and goals
- `@fix_plan.md` - Prioritized task list (13 tasks)
- `src/` - Source code (to be created)
- `tests/` - Test files (to be created)
- `logs/` - Execution logs (created during execution)
- `.ralph_session` - Session state (created during execution)

## How to Use

1. **Review the plan:**
   - Read `PROMPT.md` to understand project goals
   - Review `@fix_plan.md` to see the task breakdown

2. **Run autonomous loop:**
   - Use the `autonomous-loop` skill in Cursor
   - Agent will execute tasks iteratively
   - Monitor progress via `logs/ralph.log`

3. **Check status:**
   ```bash
   # Bash
   ./scripts/ralph-status.sh
   
   # PowerShell
   .\scripts\ralph-status.ps1
   ```

4. **Monitor logs:**
   ```bash
   # Bash
   tail -f logs/ralph.log
   
   # PowerShell
   Get-Content logs\ralph.log -Wait
   ```

## Expected Outcome

After autonomous loop execution:
- Complete REST API with CRUD operations
- All tests passing
- Input validation implemented
- Documentation complete

## Notes

- Each task follows TDD (test-driven development)
- Tasks are bite-sized (2-5 minutes each)
- Tasks include exact file paths and verification steps
- This structure follows Superpowers `writing-plans` format

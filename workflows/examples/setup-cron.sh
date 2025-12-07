#!/bin/bash
# Setup cron jobs for workflow scheduling
# Run this script to set up automated workflow execution

# Get the absolute path to the project
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Add cron jobs
# Note: Edit these cron expressions as needed

# Daily CI/CD workflow at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * cd $PROJECT_DIR && npm run workflow:run workflows/definitions/ci-cd-workflow.json") | crontab -

# Health checks every 6 hours
(crontab -l 2>/dev/null; echo "0 */6 * * * cd $PROJECT_DIR && npm run workflow:run workflows/definitions/scheduled-tasks.json") | crontab -

# Weekly cleanup on Sunday at 3 AM
(crontab -l 2>/dev/null; echo "0 3 * * 0 cd $PROJECT_DIR && npm run workflow:run workflows/definitions/scheduled-tasks.json --env CLEANUP_LOGS=true,CLEANUP_BUILDS=true") | crontab -

echo "Cron jobs installed successfully!"
echo "View your cron jobs with: crontab -l"
echo "Edit cron jobs with: crontab -e"


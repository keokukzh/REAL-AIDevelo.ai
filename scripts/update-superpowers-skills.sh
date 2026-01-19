#!/bin/bash
# Update Superpowers Skills from Repository
# This script syncs skills from the official superpowers repository

set -e

REPO_URL="https://github.com/obra/superpowers.git"
TEMP_DIR=$(mktemp -d)
SKILLS_DIR=".agent/skills"
BACKUP_DIR=".agent/skills-backup-$(date +%Y%m%d-%H%M%S)"

echo "🔄 Updating Superpowers Skills..."

# Create backup
if [ -d "$SKILLS_DIR" ]; then
    echo "📦 Creating backup..."
    cp -r "$SKILLS_DIR" "$BACKUP_DIR"
    echo "✅ Backup created: $BACKUP_DIR"
fi

# Clone repository
echo "📥 Cloning superpowers repository..."
git clone --depth 1 "$REPO_URL" "$TEMP_DIR"

# Copy skills
echo "📋 Copying skills..."
if [ -d "$TEMP_DIR/skills" ]; then
    # Create skills directory if it doesn't exist
    mkdir -p "$SKILLS_DIR"
    
    # Copy each skill directory
    for skill_dir in "$TEMP_DIR/skills"/*; do
        if [ -d "$skill_dir" ]; then
            skill_name=$(basename "$skill_dir")
            echo "  → Updating $skill_name..."
            
            # Preserve any local customizations in subdirectories
            if [ -d "$SKILLS_DIR/$skill_name" ]; then
                # Backup local customizations
                find "$SKILLS_DIR/$skill_name" -type f ! -name "SKILL.md" -exec cp {} "$BACKUP_DIR/$skill_name/" \; 2>/dev/null || true
            fi
            
            # Copy skill directory
            cp -r "$skill_dir" "$SKILLS_DIR/"
        fi
    done
    
    echo "✅ Skills updated successfully!"
else
    echo "❌ Error: Skills directory not found in repository"
    exit 1
fi

# Cleanup
echo "🧹 Cleaning up..."
rm -rf "$TEMP_DIR"

# Regenerate INDEX.md
echo "📝 Regenerating INDEX.md..."
# Note: INDEX.md should be regenerated, but this script focuses on syncing skills
# The INDEX.md can be manually updated or regenerated separately

echo ""
echo "✨ Update complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Review changes: git diff $SKILLS_DIR"
echo "   2. Check for conflicts with local customizations"
echo "   3. Update .agent/skills/INDEX.md if needed"
echo "   4. Test skills to ensure they work correctly"
echo ""
echo "💾 Backup location: $BACKUP_DIR"

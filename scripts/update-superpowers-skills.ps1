# Update Superpowers Skills from Repository (PowerShell)
# This script syncs skills from the official superpowers repository

$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/obra/superpowers.git"
$TempDir = Join-Path $env:TEMP "superpowers-update-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$SkillsDir = ".agent/skills"
$BackupDir = ".agent/skills-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "🔄 Updating Superpowers Skills..." -ForegroundColor Cyan

# Create backup
if (Test-Path $SkillsDir) {
    Write-Host "📦 Creating backup..." -ForegroundColor Yellow
    Copy-Item -Path $SkillsDir -Destination $BackupDir -Recurse -Force
    Write-Host "✅ Backup created: $BackupDir" -ForegroundColor Green
}

# Clone repository
Write-Host "📥 Cloning superpowers repository..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
git clone --depth 1 $RepoUrl $TempDir

# Copy skills
Write-Host "📋 Copying skills..." -ForegroundColor Cyan
$RepoSkillsDir = Join-Path $TempDir "skills"

if (Test-Path $RepoSkillsDir) {
    # Create skills directory if it doesn't exist
    New-Item -ItemType Directory -Path $SkillsDir -Force | Out-Null
    
    # Copy each skill directory
    $skillDirs = Get-ChildItem -Path $RepoSkillsDir -Directory
    foreach ($skillDir in $skillDirs) {
        $skillName = $skillDir.Name
        Write-Host "  → Updating $skillName..." -ForegroundColor Gray
        
        # Preserve any local customizations in subdirectories
        $localSkillPath = Join-Path $SkillsDir $skillName
        if (Test-Path $localSkillPath) {
            # Backup local customizations (files other than SKILL.md)
            $backupSkillPath = Join-Path $BackupDir $skillName
            if (Test-Path $backupSkillPath) {
                Get-ChildItem -Path $localSkillPath -File | Where-Object { $_.Name -ne "SKILL.md" } | ForEach-Object {
                    Copy-Item -Path $_.FullName -Destination (Join-Path $backupSkillPath $_.Name) -Force -ErrorAction SilentlyContinue
                }
            }
        }
        
        # Copy skill directory
        Copy-Item -Path $skillDir.FullName -Destination $SkillsDir -Recurse -Force
    }
    
    Write-Host "✅ Skills updated successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Error: Skills directory not found in repository" -ForegroundColor Red
    exit 1
}

# Cleanup
Write-Host "🧹 Cleaning up..." -ForegroundColor Cyan
Remove-Item -Path $TempDir -Recurse -Force

Write-Host ""
Write-Host "✨ Update complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Review changes: git diff $SkillsDir"
Write-Host "   2. Check for conflicts with local customizations"
Write-Host "   3. Update .agent/skills/INDEX.md if needed"
Write-Host "   4. Test skills to ensure they work correctly"
Write-Host ""
Write-Host "💾 Backup location: $BackupDir" -ForegroundColor Cyan

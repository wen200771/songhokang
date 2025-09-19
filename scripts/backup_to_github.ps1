param(
  [string]$Remote="origin",
  [string]$Branch="main"
)

Write-Host "[Backup] Staging changes..."
git add -A

$commitMsg = "chore: sync backup $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "[Backup] Commit: $commitMsg"
git commit -m $commitMsg 2>$null

Write-Host "[Backup] Pushing to $Remote/$Branch ..."
git push $Remote $Branch

Write-Host "[Backup] Done."

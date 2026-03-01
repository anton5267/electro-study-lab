param(
  [string]$Repo = "anton5267/electro-study-lab"
)

gh api -X PUT "repos/$Repo/vulnerability-alerts" -H "Accept: application/vnd.github+json" | Out-Null
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

gh api -X PATCH "repos/$Repo" `
  -f security_and_analysis.secret_scanning.status=enabled `
  -f security_and_analysis.secret_scanning_push_protection.status=enabled `
  -f security_and_analysis.secret_scanning_non_provider_patterns.status=enabled `
  -f security_and_analysis.dependabot_security_updates.status=enabled | Out-Null
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

gh api -X PUT "repos/$Repo/automated-security-fixes" -H "Accept: application/vnd.github+json" | Out-Null
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

$status = gh api "repos/$Repo" --jq ".security_and_analysis"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "Security analysis status for ${Repo}:"
Write-Host $status

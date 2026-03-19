#!/usr/bin/env pwsh
# deploy.ps1 — 一鍵 commit + push
# 用法：.\deploy.ps1 "commit message"
# 或直接：.\deploy.ps1（會自動產生時間戳記 commit message）

param(
    [string]$Message
)

Set-Location $PSScriptRoot

if (-not $Message) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm"
    $Message = "chore: update $ts"
}

Write-Host "📦 Staging all changes..." -ForegroundColor Cyan
git add -A

$status = git status --porcelain
if (-not $status) {
    Write-Host "✅ 沒有任何變更，無需推送" -ForegroundColor Green
    exit 0
}

Write-Host "📝 Committing: $Message" -ForegroundColor Cyan
git commit -m $Message

Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 推送成功！" -ForegroundColor Green
} else {
    Write-Host "❌ 推送失敗" -ForegroundColor Red
    exit 1
}

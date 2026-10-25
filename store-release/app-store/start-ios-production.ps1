$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'Lecomax - Apple signing and iOS production build'
Set-Location -LiteralPath (Join-Path $PSScriptRoot '../../release/all-updates-publish-20260925/mobile')
Write-Host 'Lecomax 1.0.9 - production API: https://lecomax.com'
Write-Host 'Sign in to your Apple Developer account here. Do not send your password or verification code in chat.'
& eas.cmd credentials:configure-build --platform ios --profile production
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Apple signing setup did not complete. Tell Codex the error message, without passwords or codes.'
  return
}
Write-Host 'Apple signing configured. Starting the iOS production build.'
& eas.cmd build --platform ios --profile production --non-interactive --no-wait
if ($LASTEXITCODE -ne 0) {
  Write-Host 'The build did not start. Tell Codex the error message.'
} else {
  Write-Host 'Build submitted. Return to Codex to check its progress.'
}

# User-approved scope: this phone, this PC address, Node, TCP 6081, all profiles.
$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
$resultFile = Join-Path $projectPath '.pc-remote/firewall-result.txt'
try {
  $nodeBinary = (Get-Command node.exe).Source
  $ruleName = 'LECOMAX My PC - Zakaria phone'
  if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalAddress 192.168.1.11 -LocalPort 6081 -RemoteAddress 192.168.1.12 -Program $nodeBinary -Profile Any -Description 'User-approved LECOMAX My PC: only this phone and local PC port. VNC stays loopback-only.' | Out-Null
  }
  'Firewall rule added for phone 192.168.1.12 to PC 192.168.1.11 TCP 6081 through Node.' | Set-Content -LiteralPath $resultFile
} catch {
  $_.Exception.Message | Set-Content -LiteralPath $resultFile
  exit 1
}

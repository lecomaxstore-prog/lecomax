param([Parameter(Mandatory=$true)][string]$Address)
$ErrorActionPreference = 'Stop'
$parsed = $null
if (-not [Net.IPAddress]::TryParse($Address, [ref]$parsed) -or $Address -notmatch '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)') { throw 'Use the private IPv4 address of this PC.' }
if (-not (Get-NetIPAddress -AddressFamily IPv4 -IPAddress $Address -ErrorAction SilentlyContinue)) { throw 'The address is not assigned to this PC.' }
$projectPath = Split-Path -Parent $PSScriptRoot
$nodePath = (Get-Command node.exe).Source
$logPath = Join-Path $projectPath 'out/learning-wifi'
New-Item -ItemType Directory -Force -Path $logPath | Out-Null
foreach ($port in @(3002,8081)) {
  if (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) { throw "Port $port is in use. Stop the existing learning development server before starting Wi-Fi mode." }
}
$env:LECOMAX_LAB_HOST = $Address
$env:EXPO_PUBLIC_LEARNING_API_URL = "http://${Address}:3002"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $Address
Start-Process -FilePath $nodePath -ArgumentList 'scripts/start-teacher-lab.mjs' -WorkingDirectory $projectPath -WindowStyle Hidden -RedirectStandardOutput "$logPath/api.log" -RedirectStandardError "$logPath/api-error.log"
Start-Process -FilePath $nodePath -ArgumentList 'scripts/dev.cjs --web --lan --port 8081' -WorkingDirectory "$projectPath/lecomax-learning-app" -WindowStyle Hidden -RedirectStandardOutput "$logPath/web.log" -RedirectStandardError "$logPath/web-error.log"
Write-Output "Learning app: http://${Address}:8081"
Write-Output "Kali desktop: http://${Address}:8081/kali"
Write-Output 'Use the same trusted Wi-Fi; this development connection uses HTTP. Owner sign-in is required. Keep this PC running.'

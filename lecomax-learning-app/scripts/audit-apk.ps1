param([string]$Apk)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$appRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$repoRoot = [IO.Path]::GetFullPath((Join-Path $appRoot '..'))
$secretValues = @()
$environmentFile = Join-Path $repoRoot '.env.local'
if (Test-Path -LiteralPath $environmentFile) {
  foreach ($line in [IO.File]::ReadAllLines($environmentFile)) {
    if ($line -match '^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$') {
      $name = $Matches[1]; $value = $Matches[2].Trim().Trim('"').Trim("'")
      if (!$name.StartsWith('NEXT_PUBLIC_') -and $name -match 'KEY|TOKEN|SECRET|PASSWORD|DATABASE_URL|PIN$' -and $value.Length -ge 8) { $secretValues += $value }
    }
  }
}
$targets = if ($Apk) { @(Get-Item -LiteralPath $Apk) } else { @(Get-ChildItem -LiteralPath (Join-Path $appRoot 'artifacts') -Filter '*.apk') }
$results = @()
foreach ($target in $targets) {
  $archive = [IO.Compression.ZipFile]::OpenRead($target.FullName)
  $count = 0
  try {
    foreach ($entry in $archive.Entries) {
      if ($entry.FullName -match '(?:^|/)(?:\.env(?:\..*)?|credentials\.json|[^/]+\.(?:jks|keystore|pem))$') { throw "Private-file path in APK: $($entry.FullName)" }
      $inputStream = $entry.Open(); $memory = New-Object IO.MemoryStream
      try { $inputStream.CopyTo($memory); $bytes = $memory.ToArray() } finally { $inputStream.Dispose(); $memory.Dispose() }
      foreach ($encoding in @([Text.Encoding]::UTF8, [Text.Encoding]::Unicode)) {
        $content = $encoding.GetString($bytes)
        foreach ($secret in $secretValues) { if ($content.Contains($secret)) { throw "Known private value in APK entry: $($entry.FullName)" } }
        if ($content -match '\b(?:sk-proj-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{32,}|sb_secret_[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{30,}|AKIA[A-Z0-9]{16})\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----') { throw "Credential pattern in APK entry: $($entry.FullName)" }
      }
      $count++
    }
  } finally { $archive.Dispose() }
  $results += [pscustomobject]@{ apk=$target.Name; sha256=(Get-FileHash -LiteralPath $target.FullName -Algorithm SHA256).Hash; entries=$count; result='PASS'; scope='All ZIP entries decoded as UTF-8 and UTF-16; known private environment values, common credential patterns, private-file paths. Not proof against unknown or encoded secrets.' }
}
$results | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $appRoot 'docs/apk-secret-audit.json') -Encoding UTF8
$results | Select-Object apk,entries,result | Format-Table

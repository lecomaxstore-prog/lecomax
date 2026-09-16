param([switch]$Apply)
$ErrorActionPreference = 'Stop'

# Use the existing Supabase CLI login without printing or persisting its token.
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class SupabaseCredential {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct Credential {
    public uint Flags; public uint Type; public string TargetName; public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public uint CredentialBlobSize; public IntPtr CredentialBlob; public uint Persist;
    public uint AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
  }
  [DllImport("advapi32.dll", EntryPoint="CredReadW", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern bool Read(string target, uint type, uint flags, out IntPtr credential);
  [DllImport("advapi32.dll", SetLastError=true)]
  public static extern void CredFree(IntPtr buffer);
}
'@

$credentialPointer = [IntPtr]::Zero
if (-not [SupabaseCredential]::Read('Supabase CLI:supabase', 1, 0, [ref]$credentialPointer)) {
  throw 'Supabase CLI login not available. Run npx.cmd supabase login first.'
}
try {
  $credential = [Runtime.InteropServices.Marshal]::PtrToStructure($credentialPointer, [type][SupabaseCredential+Credential])
  $bytes = New-Object byte[] $credential.CredentialBlobSize
  [Runtime.InteropServices.Marshal]::Copy($credential.CredentialBlob, $bytes, 0, $bytes.Length)
  $token = [Text.Encoding]::UTF8.GetString($bytes).TrimEnd([char]0)
  if ($token.Contains([char]0)) { $token = [Text.Encoding]::Unicode.GetString($bytes).TrimEnd([char]0) }
} finally {
  [SupabaseCredential]::CredFree($credentialPointer)
}

$projectRoot = Split-Path $PSScriptRoot -Parent
$projectRef = (Get-Content -LiteralPath (Join-Path $projectRoot 'supabase/.temp/project-ref') -Raw).Trim()
$envText = Get-Content -LiteralPath (Join-Path $projectRoot '.env.local') -Raw
$configuredUrl = [regex]::Match($envText, '(?m)^NEXT_PUBLIC_SUPABASE_URL=["'']?(https://[^\s"'']+)').Groups[1].Value
if (([Uri]$configuredUrl).Host -ne "$projectRef.supabase.co") { throw 'Linked project does not match the app configuration.' }

$endpoint = "https://api.supabase.com/v1/projects/$projectRef/config/auth"
$headers = @{ Authorization = "Bearer $token" }
$current = Invoke-RestMethod -Uri $endpoint -Headers $headers -Method Get
# Preserve existing redirects and allow the fixed website callback, alongside Expo.
$siteOrigin = ([Uri]$current.site_url).GetLeftPart([UriPartial]::Authority)
$required = @("$siteOrigin/auth/callback", 'http://localhost:3000/auth/callback', 'http://localhost:3001/auth/callback', 'http://localhost:8081/auth**', 'lecomax://auth**')
$existing = @($current.uri_allow_list -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$missing = @($required | Where-Object { $_ -notin $existing })
if ($Apply -and $missing.Count -gt 0) {
  $backupPath = Join-Path ([IO.Path]::GetTempPath()) ('lecomax-auth-redirects-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')
  @{ project_ref = $projectRef; uri_allow_list = $current.uri_allow_list } | ConvertTo-Json | Set-Content -LiteralPath $backupPath
  $payload = @{ uri_allow_list = (($existing + $missing) -join ',') } | ConvertTo-Json
  $null = Invoke-RestMethod -Uri $endpoint -Headers $headers -Method Patch -ContentType 'application/json' -Body $payload
  $saved = Invoke-RestMethod -Uri $endpoint -Headers $headers -Method Get
  $savedUrls = @($saved.uri_allow_list -split ',' | ForEach-Object { $_.Trim() })
  foreach ($url in ($existing + $required)) {
    if ($url -notin $savedUrls) { throw "Redirect was not saved: $url" }
  }
  if ($saved.site_url -cne $current.site_url) { throw 'Site URL changed unexpectedly.' }
  $current = $saved
  Write-Output "Redirect settings saved and verified. Backup: $backupPath"
}
[pscustomobject]@{
  Project = $projectRef
  SiteUrl = $current.site_url
  RedirectUrls = $current.uri_allow_list
  GoogleEnabled = $current.external_google_enabled
} | ConvertTo-Json

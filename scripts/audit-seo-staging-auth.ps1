# GET-only management audit using the existing, specifically named CLI login.
# Never emit credentials, full Auth config, response bodies or error details.
$ErrorActionPreference = 'Stop'
try {
  Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class StagingCredential {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct Credential {
    public uint Flags; public uint Type; public string TargetName; public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public uint CredentialBlobSize; public IntPtr CredentialBlob; public uint Persist;
    public uint AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
  }
  [DllImport("advapi32.dll", EntryPoint="CredReadW", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern bool Read(string target, uint type, uint flags, out IntPtr credential);
  [DllImport("advapi32.dll")] public static extern void CredFree(IntPtr pointer);
}
'@
  $pointer = [IntPtr]::Zero
  if (-not [StagingCredential]::Read('Supabase CLI:supabase', 1, 0, [ref]$pointer)) { throw 'CLI_LOGIN_UNAVAILABLE' }
  try {
    $entry = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][StagingCredential+Credential])
    $bytes = New-Object byte[] $entry.CredentialBlobSize
    [Runtime.InteropServices.Marshal]::Copy($entry.CredentialBlob, $bytes, 0, $bytes.Length)
    $token = [Text.Encoding]::UTF8.GetString($bytes)
    if ($token -notmatch '^sbp_') { $token = [Text.Encoding]::Unicode.GetString($bytes) }
    if ($token -notmatch '^sbp_[a-zA-Z0-9_]+$') { throw 'CLI_LOGIN_FORMAT' }
  } finally { [StagingCredential]::CredFree($pointer) }
  $headers = @{ Authorization = "Bearer $token" }
  $ref = 'tyltharlnbxrxibuxyye'
  $project = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/$ref" -Headers $headers
  if ($project.id -ne $ref -or $project.name -ne 'lecomax-seo-staging' -or $project.organization_id -ne 'mbhkspintqoxntjbykrm') { throw 'IDENTITY_MISMATCH' }
  $config = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/$ref/config/auth" -Headers $headers
  $booleans = [ordered]@{}
  $presence = [ordered]@{}
  foreach ($property in $config.PSObject.Properties) {
    if ($property.Value -is [bool]) { $booleans[$property.Name] = $property.Value }
    elseif ($property.Name -match '^(smtp_|sms_|hook_|external_).*(secret|password|pass$|token|key|uri|url|host|user|client_id|account_sid|service_sid)') {
      $presence[$property.Name] = -not [string]::IsNullOrWhiteSpace([string]$property.Value)
    }
  }
  $webhooks = [ordered]@{}
  foreach ($scope in @('projects/tyltharlnbxrxibuxyye', 'organizations/mbhkspintqoxntjbykrm')) {
    try {
      $endpoints = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v2/$scope/webhooks/endpoints" -Headers $headers
      $webhooks[$scope] = @{ count = @($endpoints.data).Count; enabled = @($endpoints.data | Where-Object { $_.attributes.enabled }).Count; nextPagePresent = [bool]$endpoints.links.next; checked = $true }
    } catch {
      $detail = [string]$_.ErrorDetails.Message
      if (-not $detail -and $_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        try { $detail = $reader.ReadToEnd() } finally { $reader.Dispose() }
      }
      $detail = $detail -replace 'sb[a-z]*_[A-Za-z0-9_-]+', '[REDACTED]' -replace 'Bearer\s+\S+', '[REDACTED]' -replace 'https?://\S+', '[URL OMITTED]'
      if ($detail.Length -gt 600) { $detail = $detail.Substring(0,600) }
      $webhooks[$scope] = @{ checked = $false; reason = 'ENDPOINT_UNAVAILABLE_OR_ACCESS_DENIED'; httpStatus = [int]$_.Exception.Response.StatusCode; sanitizedError = $detail }
    }
  }
  $report = [ordered]@{
    at = [DateTime]::UtcNow.ToString('o')
    projectId = $project.id; projectName = $project.name; organizationId = $project.organization_id
    status = $project.status; readOnly = $true
    siteUrl = $config.site_url; redirectAllowList = $config.uri_allow_list
    toggles = $booleans; credentialOrEndpointPresence = $presence; webhooks = $webhooks
    configFieldCount = @($config.PSObject.Properties).Count
    secretsPrinted = $false; messagesSent = $false; modified = $false
  }
  $output = Join-Path $PSScriptRoot "../artifacts/seo-staging-auth-full-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()).json"
  $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $output -Encoding UTF8
  [ordered]@{projectId=$report.projectId; siteUrl=$report.siteUrl; enabled=@($booleans.Keys | Where-Object { $booleans[$_] }); configuredEndpointsOrCredentials=@($presence.Keys | Where-Object { $presence[$_] }); configFieldCount=$report.configFieldCount; readOnly=$true} | ConvertTo-Json -Depth 5
  Write-Output "Evidence: $output"
} catch {
  Write-Output 'STAGING_AUTH_AUDIT_FAILED_NO_SECRETS_LOGGED'
  exit 1
} finally {
  $token = $null; $headers = $null; $config = $null; $bytes = $null
}

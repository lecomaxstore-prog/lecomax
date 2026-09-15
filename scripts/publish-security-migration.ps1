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

$queryEndpoint = "https://api.supabase.com/v1/projects/$projectRef/database/query"
$headers = @{ Authorization = "Bearer $token" }
$query = "select to_regclass('public.paypal_webhook_events') is not null as paypal_events, to_regprocedure('public.reconcile_paypal_webhook(text,text,text,text,timestamp with time zone)') is not null as reconcile_paypal, to_regprocedure('public.find_review_orders_by_contact(text,text,text)') is not null as review_contact;"
$payload = @{ query = $query; read_only = $true } | ConvertTo-Json
Invoke-RestMethod -Uri $queryEndpoint -Headers $headers -Method Post -ContentType 'application/json' -Body $payload | ConvertTo-Json
if ($Apply) {
  $sql = (@('20260914220000_guest_order_reviews.sql', '20260914223000_review_api_permissions.sql', '20260915000000_review_contact_lookup.sql', '20260915120000_atomic_paypal_webhooks.sql') | ForEach-Object { [IO.File]::ReadAllText((Join-Path $projectRoot ('supabase/migrations/' + $_))) }) -join [Environment]::NewLine
  $payload = @{ query = "begin;`n$sql`ncommit;" } | ConvertTo-Json
  $null = Invoke-RestMethod -Uri $queryEndpoint -Headers $headers -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($payload))
  Write-Output 'Review and PayPal security migrations applied.'
}
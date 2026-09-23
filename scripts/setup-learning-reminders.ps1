param([switch]$Apply)
$ErrorActionPreference = 'Stop'

# Use the existing Supabase CLI login without printing or persisting its token.
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class LearningSupabaseCredential {
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
if (-not [LearningSupabaseCredential]::Read('Supabase CLI:supabase', 1, 0, [ref]$credentialPointer)) {
  throw 'Supabase CLI login not available. Run npx.cmd supabase login first.'
}
try {
  $credential = [Runtime.InteropServices.Marshal]::PtrToStructure($credentialPointer, [type][LearningSupabaseCredential+Credential])
  $bytes = New-Object byte[] $credential.CredentialBlobSize
  [Runtime.InteropServices.Marshal]::Copy($credential.CredentialBlob, $bytes, 0, $bytes.Length)
  $token = [Text.Encoding]::UTF8.GetString($bytes).TrimEnd([char]0)
  if ($token.Contains([char]0)) { $token = [Text.Encoding]::Unicode.GetString($bytes).TrimEnd([char]0) }
} finally {
  [LearningSupabaseCredential]::CredFree($credentialPointer)
}

$projectRoot = Split-Path $PSScriptRoot -Parent
$projectRef = (Get-Content -LiteralPath (Join-Path $projectRoot 'supabase/.temp/project-ref') -Raw).Trim()
$envText = Get-Content -LiteralPath (Join-Path $projectRoot '.env.local') -Raw
$configuredUrl = [regex]::Match($envText, '(?m)^NEXT_PUBLIC_SUPABASE_URL=["'']?(https://[^\s"'']+)').Groups[1].Value
if (([Uri]$configuredUrl).Host -ne "$projectRef.supabase.co") { throw 'Linked project does not match the app configuration.' }


$queryEndpoint = "https://api.supabase.com/v1/projects/$projectRef/database/query"
$headers = @{ Authorization = "Bearer $token" }
if ($Apply) {
  $sql = [IO.File]::ReadAllText((Join-Path $projectRoot 'supabase/migrations/20260922210000_learning_reminders.sql'))
  $payload = @{ query = "begin;
$sql
commit;" } | ConvertTo-Json
  $null = Invoke-RestMethod -Uri $queryEndpoint -Headers $headers -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($payload))
}
$query = "select to_regclass('public.owner_learning_days') is not null as daily_records_ready, exists(select 1 from information_schema.columns where table_schema='public' and table_name='push_subscriptions' and column_name='admin_email') as owner_devices_ready, to_regprocedure('public.claim_learning_reminder(text,date)') is not null as reminder_claim_ready;"
$payload = @{ query = $query; read_only = $true } | ConvertTo-Json
Invoke-RestMethod -Uri $queryEndpoint -Headers $headers -Method Post -ContentType 'application/json' -Body $payload | ConvertTo-Json -Depth 4

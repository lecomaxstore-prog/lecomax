param([switch]$Apply, [switch]$ConfigureSmtp)
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
$templatePath = Join-Path $projectRoot 'supabase/templates/confirmation.html'
$template = [IO.File]::ReadAllText($templatePath)
if (-not $template.Contains('{{ .ConfirmationURL }}')) { throw 'Missing secure confirmation URL placeholder.' }
# The shared module is the single source for both the website and hosted email.
$source = [IO.File]::ReadAllText((Join-Path $projectRoot 'lib/auth-confirmation-email.ts'))
$subject = [regex]::Match($source, 'confirmationEmailSubject = "([^"]+)"').Groups[1].Value
if (-not $subject) { throw 'Confirmation subject not found.' }

if ($Apply -or $ConfigureSmtp) {
  $backup = @{
    project_ref = $projectRef
    mailer_subjects_confirmation = $current.mailer_subjects_confirmation
    mailer_templates_confirmation_content = $current.mailer_templates_confirmation_content
  }
  $backupPath = Join-Path ([IO.Path]::GetTempPath()) ("lecomax-auth-email-backup-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')
  [IO.File]::WriteAllText($backupPath, ($backup | ConvertTo-Json -Depth 4), [Text.UTF8Encoding]::new($false))
  $payload = @{
    mailer_subjects_confirmation = $subject
    mailer_templates_confirmation_content = $template
  }
  if ($ConfigureSmtp) {
    if ($current.smtp_host -and $current.smtp_host -ne 'smtp.resend.com') {
      throw 'Another SMTP provider is already configured; refusing to replace it.'
    }
    $resendKey = [regex]::Match($envText, '(?m)^RESEND_API_KEY=["'']?([^\s"'']+)').Groups[1].Value
    if ($resendKey -notmatch '^re_[A-Za-z0-9_-]+$') { throw 'A valid local Resend key is required.' }
    $payload.smtp_host = 'smtp.resend.com'
    $payload.smtp_port = '465'
    $payload.smtp_user = 'resend'
    $payload.smtp_pass = $resendKey
    $payload.smtp_admin_email = 'noreply@lecomax.com'
    $payload.smtp_sender_name = "L'ecomax"
  }
  $payload = $payload | ConvertTo-Json -Depth 4
  $null = Invoke-RestMethod -Uri $endpoint -Headers $headers -Method Patch -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($payload))
  $current = Invoke-RestMethod -Uri $endpoint -Headers $headers -Method Get
  if ($current.mailer_templates_confirmation_content -cne $template -or $current.mailer_subjects_confirmation -cne $subject) { throw 'Saved template did not match the local design.' }
  if ($ConfigureSmtp -and ($current.smtp_host -ne 'smtp.resend.com' -or $current.smtp_admin_email -ne 'noreply@lecomax.com' -or $current.smtp_sender_name -ne "L'ecomax" -or $current.smtp_port -ne '465' -or $current.smtp_user -ne 'resend')) {
    throw 'Saved SMTP settings did not match the requested sender.'
  }
  Write-Output "Published and verified confirmation email. Backup: $backupPath"
}

[pscustomobject]@{
  Project = $projectRef
  Subject = $current.mailer_subjects_confirmation
  TemplateMatches = ($current.mailer_templates_confirmation_content -ceq $template)
  SmtpHost = $current.smtp_host
  SenderName = $current.smtp_sender_name
  SenderEmail = $current.smtp_admin_email
  EmailAutoConfirm = $current.mailer_autoconfirm
} | ConvertTo-Json
$token = $null
$headers = $null

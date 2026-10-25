param(
    [Parameter(Mandatory=$true)][string]$CredentialFile,
    [ValidateSet('check','backup')][string]$Mode = 'check'
)
# Secret crosses only the child-process environment; never argv, console, or project files.
$ErrorActionPreference = 'Stop'
$pointer = [IntPtr]::Zero
$secret = $null
try {
    $secret = ConvertTo-SecureString ([IO.File]::ReadAllText((Resolve-Path -LiteralPath $CredentialFile).Path))
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    $env:LECOMAX_BACKUP_DATABASE_URI = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    & node (Join-Path $PSScriptRoot 'seo-encrypted-production-backup.cjs') $Mode
    if ($LASTEXITCODE -ne 0) { throw 'BACKUP_TOOL_FAILED' }
} catch {
    Write-Host 'Secure backup invocation stopped. See the sanitized tool report if one was created. No secret details are printed.'
    exit 1
} finally {
    Remove-Item Env:LECOMAX_BACKUP_DATABASE_URI -ErrorAction SilentlyContinue
    if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    if ($secret) { $secret.Dispose() }
}

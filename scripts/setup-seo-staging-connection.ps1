# Run interactively in your own PowerShell. No database/network calls are made.
# Never paste the password or generated .env contents into chat.
$ErrorActionPreference = 'Stop'
$stagingRef = 'tyltharlnbxrxibuxyye'
$secretPointer = [IntPtr]::Zero
$secretPassword = $null
$plainPassword = $null
$connectionValue = $null
try {
    $dbHost = (Read-Host 'Staging host from Supabase Connect (host only)').Trim()
    $dbUser = (Read-Host 'Staging database user from Supabase Connect').Trim()
    $direct = $dbHost -eq "db.$stagingRef.supabase.co" -and $dbUser -eq 'postgres'
    $session = $dbHost -match '^[a-z0-9.-]+\.pooler\.supabase\.com$' -and $dbUser -eq "postgres.$stagingRef"
    if (-not ($direct -or $session)) { throw 'TARGET_REJECTED' }
    # Direct or session pooler only. Transaction pooler port 6543 is not used.
    $certInput = (Read-Host 'Path to staging CA certificate downloaded from the Supabase dashboard').Trim().Trim('"')
    $certificatePath = (Resolve-Path -LiteralPath $certInput).Path
    $certificateText = [IO.File]::ReadAllText($certificatePath)
    if ($certificateText -notmatch '-----BEGIN CERTIFICATE-----' -or $certificateText -match 'PRIVATE KEY') { throw 'CERTIFICATE_REQUIRED' }
    $stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
    $configDirectory = Join-Path $env:USERPROFILE "Backups\LECOMAX\staging-connection-$stamp"
    if (Test-Path -LiteralPath $configDirectory) { throw 'DIRECTORY_EXISTS' }
    New-Item -ItemType Directory -Path $configDirectory | Out-Null
    $ownerSid = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $allowedSids = @($ownerSid.Value, 'S-1-5-18', 'S-1-5-32-544')
    $acl = New-Object Security.AccessControl.DirectorySecurity
    $acl.SetOwner($ownerSid)
    $acl.SetAccessRuleProtection($true, $false)
    foreach ($sidText in $allowedSids) {
        $sid = New-Object Security.Principal.SecurityIdentifier($sidText)
        $rule = New-Object Security.AccessControl.FileSystemAccessRule($sid, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
        $acl.AddAccessRule($rule)
    }
    Set-Acl -LiteralPath $configDirectory -AclObject $acl
    $verifiedAcl = Get-Acl -LiteralPath $configDirectory
    if (-not $verifiedAcl.AreAccessRulesProtected) { throw 'ACL_NOT_PROTECTED' }
    foreach ($rule in $verifiedAcl.Access) {
        $ruleSid = $rule.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value
        if ($rule.AccessControlType -eq 'Allow' -and $ruleSid -notin $allowedSids) { throw 'ACL_TOO_BROAD' }
    }
    $storedCert = Join-Path $configDirectory 'staging-ca.crt'
    [IO.File]::WriteAllText($storedCert, $certificateText, (New-Object Text.UTF8Encoding($false)))
    $secretPassword = Read-Host 'STAGING database password (hidden; not the production password)' -AsSecureString
    if ($secretPassword.Length -eq 0) { throw 'PASSWORD_REQUIRED' }
    $secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretPassword)
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
    $connectionValue = 'postgresql://' + [Uri]::EscapeDataString($dbUser) + ':' + [Uri]::EscapeDataString($plainPassword) + '@' + $dbHost + ':5432/postgres?sslmode=verify-full'
    $configFile = Join-Path $configDirectory 'seo-staging.env'
    $lines = @("STAGING_PROJECT_REF=$stagingRef", "STAGING_DATABASE_URL=$connectionValue", ('STAGING_SSL_ROOT_CERT="' + $storedCert.Replace('\','/') + '"'))
    $bytes = (New-Object Text.UTF8Encoding($false)).GetBytes(($lines -join "`n") + "`n")
    $stream = [IO.File]::Open($configFile, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
    try { $stream.Write($bytes, 0, $bytes.Length) } finally { $stream.Dispose(); [Array]::Clear($bytes,0,$bytes.Length) }
    Write-Host 'Saved staging-only configuration. No connection, backup, restore, or activation was attempted.'
    Write-Host 'Share only this file path with Codex; never its contents:'
    Write-Host $configFile
} catch {
    Write-Error 'Staging setup stopped. Verify the staging host/user, downloaded CA, and directory permissions. No database operation was attempted.'
} finally {
    if ($secretPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer) }
    if ($secretPassword) { $secretPassword.Dispose() }
    $plainPassword = $null
    $connectionValue = $null
    $lines = $null
}

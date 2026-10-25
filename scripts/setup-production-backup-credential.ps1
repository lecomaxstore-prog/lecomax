param([string]$ReplacePasswordFrom)
# Run interactively as the Windows user who will perform the backup.
# Stores only Windows CurrentUser DPAPI ciphertext outside the repository.
$ErrorActionPreference = 'Stop'
$secret = $null
$replacementPassword = $null
$replacementPointer = [IntPtr]::Zero
$pointer = [IntPtr]::Zero
$safeFailure = 'Could not read the hidden input.'
try {
    if ($ReplacePasswordFrom) {
        $safeFailure = 'Could not read the existing Windows-encrypted connection file.'
        $secret = ConvertTo-SecureString ([IO.File]::ReadAllText((Resolve-Path -LiteralPath $ReplacePasswordFrom).Path))
    } else {
        $secret = Read-Host 'Paste the existing production PostgreSQL connection URI (hidden)' -AsSecureString
    }
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    $safeFailure = 'Input is not a PostgreSQL URI. Copy the URI only, without quotes or a psql command.'
    $uri = [Uri]([Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer))
    if (-not $uri.IsAbsoluteUri -or $uri.Scheme -notin @('postgres', 'postgresql')) { throw 'INVALID_URI' }
    $user = [Uri]::UnescapeDataString(($uri.UserInfo -split ':', 2)[0])
    $ref = 'yddqwgdgeljkzfsmtein'
    $direct = $uri.Host -eq "db.$ref.supabase.co" -and $user -eq 'postgres'
    $pooler = $uri.Host -match '^[a-z0-9.-]+\.pooler\.supabase\.com$' -and $user -eq "postgres.$ref"
    $safeFailure = 'Project or username does not match production yddqwgdgeljkzfsmtein. Use its Direct or Session pooler URI.'
    if (-not ($direct -or $pooler)) { throw 'TARGET_REJECTED' }
    $safeFailure = 'Port must be 5432. Select Session pooler, not Transaction pooler.'
    if ($uri.Port -notin @(-1, 5432)) { throw 'PORT_REJECTED' }
    $safeFailure = 'Database must be postgres. Copy the full connection URI.'
    if ($uri.AbsolutePath -ne '/postgres') { throw 'DATABASE_REJECTED' }
    $safeFailure = 'A real database password is required. Replace the password placeholder; URI-encode special characters.'
    if ($uri.UserInfo -notmatch ':.' -or [Uri]::UnescapeDataString($uri.UserInfo) -match '\[YOUR[-_]PASSWORD\]') { throw 'PASSWORD_REQUIRED' }
    $safeFailure = 'The URI contains a fragment. Special characters in the password must be URI-encoded.'
    if ($uri.Fragment) { throw 'FRAGMENT_REJECTED' }
    $safeFailure = 'Unsupported connection options. Use a URI without query options, or only ?sslmode=verify-full.'
    if ($uri.Query -and $uri.Query -ne '?sslmode=verify-full') { throw 'QUERY_OPTIONS_REJECTED' }
    if ($ReplacePasswordFrom) {
        $safeFailure = 'Could not read the replacement database password.'
        $replacementPassword = Read-Host 'Paste the actual DATABASE password only (hidden; not your Supabase login password)' -AsSecureString
        if ($replacementPassword.Length -eq 0) { throw 'PASSWORD_REQUIRED' }
        $replacementPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($replacementPassword)
        $replacementUri = 'postgresql://' + [Uri]::EscapeDataString($user) + ':' + [Uri]::EscapeDataString([Runtime.InteropServices.Marshal]::PtrToStringBSTR($replacementPointer)) + '@' + $uri.Host + ':5432/postgres?sslmode=verify-full'
        $secret.Dispose()
        $secret = ConvertTo-SecureString $replacementUri -AsPlainText -Force
        $replacementUri = $null
    }
    $safeFailure = 'Could not create the private backup directory. Check access to your user Backups folder.'
    $directory = Join-Path $env:USERPROFILE ('Backups\LECOMAX\secure-connection-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ'))
    New-Item -ItemType Directory -Path $directory | Out-Null
    $safeFailure = 'Could not restrict directory permissions. No credential was saved.'
    $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $acl = New-Object Security.AccessControl.DirectorySecurity
    $acl.SetOwner($sid)
    $acl.SetAccessRuleProtection($true, $false)
    $acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($sid, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')))
    Set-Acl -LiteralPath $directory -AclObject $acl
    if (-not (Get-Acl -LiteralPath $directory).AreAccessRulesProtected) { throw 'ACL_REQUIRED' }
    $file = Join-Path $directory 'owner-database-url.dpapi'
    $safeFailure = 'Windows user encryption failed. No plaintext credential was saved.'
    $encrypted = ConvertFrom-SecureString -SecureString $secret
    $safeFailure = 'Could not save the encrypted credential file.'
    [IO.File]::WriteAllText($file, $encrypted)
    Write-Host 'Saved Windows-user-encrypted credential. No network or database operation ran.'
    Write-Host 'Share only this file path, never its contents:'
    Write-Host $file
} catch {
    # Never print the underlying exception: URI parser errors can contain credentials.
    Write-Host ('Setup stopped: ' + $safeFailure)
    Write-Host 'No network or database operation ran. Share only this diagnostic message.'
    exit 1
} finally {
    if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    if ($replacementPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($replacementPointer) }
    if ($replacementPassword) { $replacementPassword.Dispose() }
    if ($secret) { $secret.Dispose() }
    $uri = $null
    $encrypted = $null
}

$ErrorActionPreference = 'Stop'
$pointer = [IntPtr]::Zero
$secret = $null
try {
    $file = 'C:/Users/Ziko/Backups/LECOMAX/secure-connection-20261021T170544574Z/owner-database-url.dpapi'
    $secret = ConvertTo-SecureString ([IO.File]::ReadAllText($file))
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    $env:LECOMAX_VERIFY_DATABASE_URI = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    & node (Join-Path $PSScriptRoot 'seo-minimal-production-provider.cjs')
    exit $LASTEXITCODE
} catch {
    Write-Host 'Secure binding verification unavailable. No secret details emitted.'
    exit 1
} finally {
    Remove-Item Env:LECOMAX_VERIFY_DATABASE_URI -ErrorAction SilentlyContinue
    if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    if ($secret) { $secret.Dispose() }
}

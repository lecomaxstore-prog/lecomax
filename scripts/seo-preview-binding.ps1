# Run interactively yourself. Never pass the key as an argument or paste it into chat.
# Matches project-ref + ':' + SHA256(exact UTF-8 key), without a trailing newline.
$ErrorActionPreference = 'Stop'
$seoSecureKey = Read-Host 'Paste the staging service key (input hidden)' -AsSecureString
$seoPointer = [IntPtr]::Zero
$seoBytes = $null
$seoHasher = $null
try {
    $seoPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seoSecureKey)
    $seoKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($seoPointer)
    if ([string]::IsNullOrWhiteSpace($seoKey) -or $seoKey -match '\s') {
        throw 'Key is empty or contains whitespace. Nothing was copied.'
    }
    $seoBytes = [Text.Encoding]::UTF8.GetBytes($seoKey)
    $seoHasher = [Security.Cryptography.SHA256]::Create()
    $seoDigest = [BitConverter]::ToString($seoHasher.ComputeHash($seoBytes)).Replace('-', '').ToLowerInvariant()
    $seoBinding = 'tyltharlnbxrxibuxyye:' + $seoDigest
    Set-Clipboard -Value $seoBinding
    Write-Host 'Binding copied to clipboard. Paste into SEO_PREVIEW_SUPABASE_SERVICE_KEY_BINDING, Preview only. No key or binding was printed.'
    Write-Host 'After saving in Vercel, run: Set-Clipboard -Value ([string]::Empty)'
} finally {
    if ($seoPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($seoPointer) }
    if ($null -ne $seoBytes) { [Array]::Clear($seoBytes, 0, $seoBytes.Length) }
    if ($null -ne $seoHasher) { $seoHasher.Dispose() }
    $seoKey = $null
    $seoBinding = $null
    $seoDigest = $null
    $seoSecureKey.Dispose()
}

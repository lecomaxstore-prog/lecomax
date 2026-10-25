param([switch]$SelfTest, [switch]$ValidateOnly, [switch]$ApiKeysOnly)
# Run in the owner's own PowerShell. Never paste credentials into chat or argv.
$ErrorActionPreference = 'Stop'
$values = @{}
$secure = $null
$pointer = [IntPtr]::Zero
$child = $null
$inputWriter = $null
$runLock = $null
$stage = 'preflight'
$reportDirectory = Join-Path (Split-Path $PSScriptRoot -Parent) 'artifacts'
try {
    # Fail before prompting if prerequisites or another invocation block execution.
    $nodePath = (Get-Command node -CommandType Application).Source
    $script = Join-Path $PSScriptRoot 'complete-production-bindings.cjs'
    if (-not (Test-Path -LiteralPath $script)) { throw 'SCRIPT_MISSING' }
    $runLock = [IO.File]::Open((Join-Path $reportDirectory 'production-bindings-run.lock'), [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
    $start = New-Object Diagnostics.ProcessStartInfo
    $start.FileName = $nodePath
    $start.Arguments = '"' + $script + '" --owner-attested'
    if ($ValidateOnly) { $start.Arguments = '"' + $script + '" --validate-only' }
    if ($ApiKeysOnly) { $start.Arguments += ' --api-keys-only' }
    $start.WorkingDirectory = Split-Path $PSScriptRoot -Parent
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardInput = $true
    $start.RedirectStandardError = $true
    if ($SelfTest) {
        $start.Arguments = '"' + $script + '" --transport-self-test'
        $values['test'] = ('fixture-' + [char]233)
    } else {
    $keys = @('NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','OWNER_DATABASE_URL')
    if ($ApiKeysOnly) {
        $keys = @('NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY')
        Write-Host 'Deux cles Supabase Production existantes uniquement. Aucun mot de passe PostgreSQL demande.'
        Write-Host 'Le script ajoute seulement les liaisons manquantes ; aucune cle remplacee, aucun deploiement.'
    }
    Write-Host 'Utilisez les valeurs EXACTES deja enregistrees dans Vercel Production, depuis votre gestionnaire de secrets approuve.'
    Write-Host 'Ne creez pas de nouvelles cles. Ne collez aucun secret dans le chat.'
    $answer = Read-Host 'Confirmez que vous possedez ces valeurs exactes de Production : tapez YES (sinon Entree pour arreter)'
    if ($answer -cne 'YES') { throw 'ATTESTATION_REQUIRED' }
    $stage = 'hidden-input'
    foreach ($key in $keys) {
        if ($key -eq 'NEXT_PUBLIC_SUPABASE_ANON_KEY') { Write-Host 'Cle publique anon : celle utilisee par le site Production.' }
        if ($key -eq 'SUPABASE_SERVICE_ROLE_KEY') { Write-Host 'Cle privee service_role : celle utilisee par le serveur Production.' }
        $secure = Read-Host "$key (saisie masquee)" -AsSecureString
        $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        $values[$key] = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
        $pointer = [IntPtr]::Zero
        $secure.Dispose()
        $secure = $null
    }
    $values['exactCurrentProductionValues'] = $true
    }
    $stage = 'child-start'
    $child = New-Object Diagnostics.Process
    $child.StartInfo = $start
    [void]$child.Start()
    $discardErrors = $child.StandardError.ReadToEndAsync()
    # .NET Framework / Windows PowerShell 5.1 lacks StandardInputEncoding.
    # Write UTF-8 directly through a compatible StreamWriter, without a BOM.
    $inputWriter = New-Object IO.StreamWriter($child.StandardInput.BaseStream, (New-Object Text.UTF8Encoding($false)))
    $stage = 'stdin-transfer'
    $inputWriter.Write(($values | ConvertTo-Json -Compress))
    $inputWriter.Dispose()
    $inputWriter = $null
    $values.Clear()
    $child.WaitForExit()
    $stage = 'child-result'
    if ($child.ExitCode -ne 0) { throw 'BINDING_TOOL_FAILED' }
    if ($SelfTest) { Write-Host 'Transport self-test passed. No credentials requested and no network operation ran.' }
    elseif ($ValidateOnly) { Write-Host 'Local validation passed. No network operation ran.' }
    else { Write-Host 'Bindings checked. Share only the sanitized report path. No deployment occurred.' }
} catch {
    $failureFile = Join-Path $reportDirectory ('seo-binding-launcher-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '.json')
    $safeReport = @{ at=[DateTime]::UtcNow.ToString('o'); stage=$stage; childStarted=($null -ne $child -and $stage -ne 'child-start'); selfTest=[bool]$SelfTest; message='Launcher stopped. No exception details or credentials recorded. Check child report before resuming.' }
    [IO.File]::WriteAllText($failureFile, ($safeReport | ConvertTo-Json), (New-Object Text.UTF8Encoding($false)))
    Write-Host ('Stopped at stage: ' + $stage + '. Sanitized launcher report: ' + $failureFile)
    exit 1
} finally {
    if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    if ($secure) { $secure.Dispose() }
    $values.Clear()
    if ($inputWriter) { $inputWriter.Dispose() }
    if ($child) { $child.Dispose() }
    if ($runLock) { $runLock.Dispose() }
}


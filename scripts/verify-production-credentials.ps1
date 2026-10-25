param([switch]$SelfTest, [switch]$RepairDatabase)
$ErrorActionPreference = 'Stop'
$child = $null
$writer = $null
$secure = $null
$pointer = [IntPtr]::Zero
try {
    $start = New-Object Diagnostics.ProcessStartInfo
    $start.FileName = (Get-Command node -CommandType Application).Source
    $start.Arguments = '"' + (Join-Path $PSScriptRoot 'verify-production-credentials.cjs') + '"'
    if ($RepairDatabase -and $SelfTest) { throw 'INCOMPATIBLE_MODES' }
    if ($RepairDatabase) { $start.Arguments = '"' + (Join-Path $PSScriptRoot 'repair-production-database.cjs') + '" --owner-authorized' }
    if ($SelfTest) { $start.Arguments += ' --self-test' }
    $start.WorkingDirectory = Split-Path $PSScriptRoot -Parent
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardInput = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    if ($RepairDatabase) {
        Write-Host 'Reparation autorisee : apres validation TLS et SQL lecture seule, mise a jour de OWNER_DATABASE_URL et creation de OWNER_DATABASE_BINDING dans Vercel Production. Aucun deploiement.'
        Write-Host 'Avant la saisie : remplacez EN PRIVE le mot de passe expose dans Supabase Production et sauvegardez le nouveau dans votre gestionnaire de secrets.'
    } else { Write-Host 'Verification en lecture seule. Aucun secret ne sera enregistre ou modifie.' }
    Write-Host 'La session Vercel existante est utilisee en premier. Aucun mot de passe de connexion Vercel demande.'
    $child = New-Object Diagnostics.Process
    $child.StartInfo = $start
    [void]$child.Start()
    $discardErrors = $child.StandardError.ReadToEndAsync()
    $writer = New-Object IO.StreamWriter($child.StandardInput.BaseStream, (New-Object Text.UTF8Encoding($false)))
    $writer.AutoFlush = $true
    while ($null -ne ($line = $child.StandardOutput.ReadLine())) {
        $event = $line | ConvertFrom-Json
        if ($event.prompt) {
            if ($event.prompt -notin @('NEW_DATABASE_PASSWORD','OWNER_DATABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY')) { throw 'UNKNOWN_PROMPT' }
            if ($event.prompt -eq 'NEW_DATABASE_PASSWORD') {
                if (-not $RepairDatabase) { throw 'WRONG_MODE' }
                Write-Host 'Collez UNIQUEMENT le nouveau mot de passe de la base, deja defini dans Supabase. Pas une URI, pas le mot de passe expose dans la capture.'
                Write-Host 'Le script construit la connexion, encode les caracteres speciaux et ajoute sslmode=verify-full automatiquement.'
            } elseif ($event.prompt -eq 'OWNER_DATABASE_URL') {
                Write-Host 'Vercel ne permet pas de lire cette valeur. Utilisez sa valeur exacte dans votre gestionnaire de secrets approuve.'
                Write-Host 'OWNER_DATABASE_URL : adresse PostgreSQL Production complete, avec le mot de passe de la base, port 5432 et sslmode=verify-full.'
                Write-Host 'Dans Vercel : projet lecomax > Settings > Environment Variables > Production > OWNER_DATABASE_URL.'
                Write-Host 'Si la valeur est sensible et masquee, retrouvez la copie exacte sauvegardee lors de sa creation. Ne la remplacez pas.'
            } elseif ($event.prompt -eq 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
                Write-Host 'Cle publique Supabase Production existante : necessaire pour comparer son empreinte de liaison.'
            } else {
                Write-Host 'Cle service_role Supabase Production existante : necessaire pour comparer son empreinte de liaison.'
            }
            Write-Host 'Si vous ne disposez pas de cette valeur exacte, laissez vide pour arreter. Ne collez rien dans le chat.'
            $secure = Read-Host ($event.prompt + ' (saisie masquee)') -AsSecureString
            $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
            $payload = @{value=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)} | ConvertTo-Json -Compress
            $writer.WriteLine($payload)
            $payload = $null
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
            $pointer = [IntPtr]::Zero
            $secure.Dispose()
            $secure = $null
        } elseif ($event.message) {
            Write-Host $event.message
        } elseif ($event.report) {
            Write-Host ('Etat : ' + $event.status)
            Write-Host ('Rapport sans secrets : ' + $event.report)
        }
    }
    $child.WaitForExit()
    if ($child.ExitCode -ne 0) { Write-Host 'Arret sans nouvelle tentative. Ne ressaisissez pas les memes secrets ; examinons le rapport.' }
} catch {
    Write-Host 'Verification interrompue. Aucun detail sensible affiche. Ne repetez pas la saisie.'
} finally {
    if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    if ($secure) { $secure.Dispose() }
    $payload = $null
    if ($writer) { $writer.Dispose() }
    if ($child) { if (-not $child.HasExited) { $child.Kill() }; $child.Dispose() }
}

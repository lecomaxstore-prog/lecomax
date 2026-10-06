param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$applyTutorSchema = $Apply
# Reuse linked-project verification and the existing CLI credential handling.
. (Join-Path $PSScriptRoot 'setup-micro-learning.ps1')
if ($applyTutorSchema) {
  $tutorSchema = [IO.File]::ReadAllText((Join-Path $projectRoot 'supabase/migrations/20261006150000_ai_tutor.sql'))
  $tutorPayload = @{ query = "begin;`n$tutorSchema`ncommit;" } | ConvertTo-Json
  try {
    $null = Invoke-RestMethod -Uri $queryEndpoint -Headers $headers -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($tutorPayload))
  } catch { throw 'AI Tutor schema installation failed. No credentials are included in this error.' }
}
$tutorPayload = @{ query = "select to_regclass('public.ai_learning_conversations') is not null as conversations_ready, to_regclass('public.ai_learning_progress') is not null as progress_ready, to_regprocedure('public.begin_ai_learning_turn(text,uuid,uuid,text,text,text,boolean)') is not null as turn_budget_ready;"; read_only = $true } | ConvertTo-Json
Invoke-RestMethod -Uri $queryEndpoint -Headers $headers -Method Post -ContentType 'application/json' -Body $tutorPayload | ConvertTo-Json -Depth 4

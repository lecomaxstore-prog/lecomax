# GET-only management audit using the existing, specifically named CLI login.
# Never emit credentials, full Auth config, response bodies or error details.
$ErrorActionPreference = 'Stop'
try {
  Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class StagingCredential {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct Credential {
    public uint Flags; public uint Type; public string TargetName; public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public uint CredentialBlobSize; public IntPtr CredentialBlob; public uint Persist;
    public uint AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
  }
  [DllImport("advapi32.dll", EntryPoint="CredReadW", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern bool Read(string target, uint type, uint flags, out IntPtr credential);
  [DllImport("advapi32.dll")] public static extern void CredFree(IntPtr pointer);
}
'@
  $pointer = [IntPtr]::Zero
  if (-not [StagingCredential]::Read('Supabase CLI:supabase', 1, 0, [ref]$pointer)) { throw 'CLI_LOGIN_UNAVAILABLE' }
  try {
    $entry = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][StagingCredential+Credential])
    $bytes = New-Object byte[] $entry.CredentialBlobSize
    [Runtime.InteropServices.Marshal]::Copy($entry.CredentialBlob, $bytes, 0, $bytes.Length)
    $token = [Text.Encoding]::UTF8.GetString($bytes)
    if ($token -notmatch '^sbp_') { $token = [Text.Encoding]::Unicode.GetString($bytes) }
    if ($token -notmatch '^sbp_[a-zA-Z0-9_]+$') { throw 'CLI_LOGIN_FORMAT' }
  } finally { [StagingCredential]::CredFree($pointer) }
  $headers = @{ Authorization = "Bearer $token" }
  $ref = 'tyltharlnbxrxibuxyye'
  $project = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/$ref" -Headers $headers
  if ($project.id -ne $ref -or $project.name -ne 'lecomax-seo-staging' -or $project.organization_id -ne 'mbhkspintqoxntjbykrm') { throw 'IDENTITY_MISMATCH' }
  $config = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/$ref/config/auth" -Headers $headers


  if ($config.external_email_enabled -or -not $config.disable_signup -or $config.site_url -ne 'https://lecomax-seo-staging.vercel.app') { throw 'AUTH_GUARD' }
  $keys = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/$ref/api-keys" -Headers $headers
  $key = ($keys | Where-Object { $_.name -eq 'service_role' }).api_key
  if (-not $key) { throw 'NO_KEY' }
  $h=@{apikey=$key;Authorization="Bearer $key"}
  $base="https://$ref.supabase.co/auth/v1/admin/users"

  $anon=($keys | Where-Object { $_.name -eq 'anon' }).api_key
  $fields = 'id,slug,name,brand,category,price,original_price,description,description_images,images,video,colors,sizes,featured,stock,color_stock,preorder_enabled,preorder_estimated_at,preorder_message,active,tags,created_at'
  $queries = @(
    "products?select=$fields&active=eq.true&order=created_at.desc",
    'categories?select=*&order=sort_order',
    'products?select=slug,updated_at&active=eq.true&order=id&limit=1000',
    'categories?select=slug,updated_at&active=eq.true&order=id&limit=1000',
    'pages?select=slug,updated_at&active=eq.true&order=id&limit=1000',
    'ecomedia_posts?select=slug,updated_at&is_published=eq.true&order=id&limit=1000',
    'settings?select=key,value&key=like.category_media:*',
    'reviews?select=product_slug,rating&verified_purchase=eq.true',
    'banners?select=*&order=sort_order,created_at',
    'promotions?select=*&order=created_at.desc'
  )
  $checks=@()
  foreach ($query in $queries) {
    $url="https://$ref.supabase.co/rest/v1/$query"
    $rows=Invoke-RestMethod -Method Get -Uri $url -Headers $h
    $checks+=@{query=$query;passed=$true;count=@($rows).Count}
  }
  foreach ($table in @('products','categories','pages','ecomedia_posts','settings','reviews','banners','promotions')) {
    $denied=$false
    try { $null=Invoke-RestMethod -Method Get -Uri "https://$ref.supabase.co/rest/v1/${table}?select=*&limit=1" -Headers @{apikey=$anon;Authorization="Bearer $anon"} } catch { $denied=([int]$_.Exception.Response.StatusCode -in @(401,403)) }
    if (-not $denied) { throw 'ANON_NOT_DENIED' }
    $checks+=@{name="anon_denied_$table";passed=$true}
  }
  $file='artifacts/seo-staging-runtime-rest-'+[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()+'.json'
  @{at=[DateTime]::UtcNow.ToString('o');project=$ref;checks=$checks;realSessionTested=$false;messagesSent=$false}|ConvertTo-Json -Depth 6|Set-Content $file
  Write-Output "HOSTED_RUNTIME_REST_CHECKS_PASSED $file"
  $env:STAGING_RUNTIME_SERVICE_KEY=$key
  try {
    & node scripts/verify-seo-staging-runtime-handlers.cjs
    if ($LASTEXITCODE -ne 0) { throw 'HANDLER_CHECK_FAILED' }
  } finally { Remove-Item Env:STAGING_RUNTIME_SERVICE_KEY }
} catch { Write-Output ('CHECK_FAILED_LINE_'+$_.InvocationInfo.ScriptLineNumber); exit 1 } finally { $key=$null; $token=$null; $headers=$null; $h=$null }

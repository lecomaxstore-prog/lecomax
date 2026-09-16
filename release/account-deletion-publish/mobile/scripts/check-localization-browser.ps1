param([string]$Language = 'fr', [string]$Routes = 'auth,cart,checkout,order-tracking,support,delete-account', [int]$Width = 390)
$browserPath = 'C:/Users/Ziko/AppData/Local/npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-win32-x64.exe'
$outputDirectory = Join-Path $PSScriptRoot '../out/localization'
& $browserPath --session localization-audit set viewport $Width 844
$languageScript = "localStorage.setItem('lecomax-preferences',JSON.stringify({state:{languageOverride:'$Language',theme:'system',hapticsEnabled:true},version:4}));"
$encodedScript = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($languageScript))
& $browserPath --session localization-audit eval "eval(atob('$encodedScript'))"
foreach ($route in $Routes.Split(',')) {
  $label = $route.Replace('/','-').Replace('?','-').Replace('=','-').Replace('&','-')
  & $browserPath --session localization-audit open "http://localhost:8082/$route"
  & $browserPath --session localization-audit wait 2500
  & $browserPath --session localization-audit snapshot -i | Out-File -Encoding utf8 (Join-Path $outputDirectory "$Language-$Width-$label.txt")
  & $browserPath --session localization-audit screenshot (Join-Path $outputDirectory "$Language-$Width-$label.png")
  & $browserPath --session localization-audit errors
}

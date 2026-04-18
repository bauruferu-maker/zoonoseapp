$configPath = "$env:APPDATA\netlify\config.json"
$cfg = Get-Content $configPath | ConvertFrom-Json
$token = $cfg.users.PSObject.Properties.Value[0].auth.token
$env:NETLIFY_AUTH_TOKEN = $token

Set-Location "C:\Users\leoal\Baurufer\projects\active\zoonoseapp"
netlify deploy --dir=deploy --prod --site=74e72cb4-d869-426a-9790-34dd942fa46c

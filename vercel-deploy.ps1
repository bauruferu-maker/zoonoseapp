$deployDir = "C:\Users\leoal\Baurufer\projects\active\zoonoseapp\deploy"

# Read files as base64
$appHtml = [System.IO.File]::ReadAllText("$deployDir\app.html")
$dashHtml = [System.IO.File]::ReadAllText("$deployDir\dashboard.html")
$indexHtml = [System.IO.File]::ReadAllText("$deployDir\index.html")

# Build deploy payload
$payload = @{
    name = "zoonoseapp-prototipo"
    files = @(
        @{ file = "index.html"; data = $indexHtml }
        @{ file = "app.html"; data = $appHtml }
        @{ file = "dashboard.html"; data = $dashHtml }
    )
    projectSettings = @{
        framework = $null
    }
} | ConvertTo-Json -Depth 5

$headers = @{ "Content-Type" = "application/json" }

Write-Output "Enviando deploy para Vercel..."
try {
    $resp = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments" -Method POST -Headers $headers -Body $payload
    Write-Output "URL: https://$($resp.url)"
    Write-Output "Status: $($resp.readyState)"
} catch {
    $msg = $_.Exception.Response
    $reader = New-Object System.IO.StreamReader($msg.GetResponseStream())
    Write-Output "Erro: $($reader.ReadToEnd())"
}

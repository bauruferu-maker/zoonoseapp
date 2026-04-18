$deployDir = "C:\Users\leoal\Baurufer\projects\active\zoonoseapp\deploy"
$appContent = [System.IO.File]::ReadAllText("$deployDir\app.html")
$dashContent = [System.IO.File]::ReadAllText("$deployDir\dashboard.html")
$indexContent = [System.IO.File]::ReadAllText("$deployDir\index.html")

$body = @{
    description = "ZoonoseApp - Prototipos App Mobile e Dashboard"
    public = $true
    files = @{
        "app.html" = @{ content = $appContent }
        "dashboard.html" = @{ content = $dashContent }
        "index.html" = @{ content = $indexContent }
    }
} | ConvertTo-Json -Depth 5 -Compress

$headers = @{
    "Content-Type" = "application/json"
    "User-Agent" = "ZoonoseApp"
}

try {
    $r = Invoke-RestMethod -Uri "https://api.github.com/gists" -Method POST -Headers $headers -Body $body
    $id = $r.id
    Write-Output "Gist criado com sucesso!"
    Write-Output ""
    Write-Output "App Mobile:"
    Write-Output "https://htmlpreview.github.io/?https://gist.githubusercontent.com/anonymous/$id/raw/app.html"
    Write-Output ""
    Write-Output "Dashboard:"
    Write-Output "https://htmlpreview.github.io/?https://gist.githubusercontent.com/anonymous/$id/raw/dashboard.html"
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Output "Erro: $($reader.ReadToEnd())"
}

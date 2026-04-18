Add-Type -AssemblyName System.IO.Compression.FileSystem

$deployDir = "C:\Users\leoal\Baurufer\projects\active\zoonoseapp\deploy"
$zipPath = "C:\Users\leoal\Baurufer\projects\active\zoonoseapp\deploy.zip"

# Remove old zip if exists
if (Test-Path $zipPath) { Remove-Item $zipPath }

# Create zip
[System.IO.Compression.ZipFile]::CreateFromDirectory($deployDir, $zipPath)
Write-Output "ZIP criado: $zipPath ($([math]::Round((Get-Item $zipPath).Length / 1KB)) KB)"

# Upload to tiiny.host
$boundary = [System.Guid]::NewGuid().ToString()
$fileBytes = [System.IO.File]::ReadAllBytes($zipPath)
$fileName = "deploy.zip"

$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
    "Content-Type: application/zip",
    "",
    [System.Text.Encoding]::Default.GetString($fileBytes),
    "--$boundary",
    "Content-Disposition: form-data; name=`"email`"",
    "",
    "bauruferu@gmail.com",
    "--$boundary",
    "Content-Disposition: form-data; name=`"domain`"",
    "",
    "zoonoseapp",
    "--$boundary--"
)

$body = $bodyLines -join "`r`n"

$headers = @{ "Content-Type" = "multipart/form-data; boundary=$boundary" }

Write-Output "Enviando para tiiny.host..."
try {
    $resp = Invoke-RestMethod -Uri "https://tiiny.host/api/update-site" -Method POST -Headers $headers -Body ([System.Text.Encoding]::Default.GetBytes($body))
    Write-Output "Resposta: $resp"
} catch {
    Write-Output "Erro tiiny: $($_.Exception.Message)"
}

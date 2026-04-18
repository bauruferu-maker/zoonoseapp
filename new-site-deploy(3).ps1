$token = "nfc_1aTdCk6xmC1fU8FzK2SiK6Jgb8tAcdvv437a"
$deployDir = "C:\Users\leoal\Baurufer\projects\active\zoonoseapp\deploy"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 1: Create a new site
Write-Output "Creating new site..."
$siteBody = @{ name = "zoonoseapp-v2" } | ConvertTo-Json

try {
    $site = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites" -Headers $headers -Method POST -Body $siteBody
    $siteId = $site.id
    $siteUrl = $site.url
    Write-Output "Site criado: $siteUrl (ID: $siteId)"
} catch {
    Write-Output "Erro ao criar site: $($_.Exception.Message)"
    exit 1
}

# Step 2: Calculate SHA1 hashes
$files = Get-ChildItem -Path $deployDir -File -Recurse
$fileHashes = @{}

foreach ($file in $files) {
    $relativePath = "/" + ($file.FullName.Substring($deployDir.Length + 1) -replace "\\", "/")
    $sha1 = (Get-FileHash -Path $file.FullName -Algorithm SHA1).Hash.ToLower()
    $fileHashes[$relativePath] = $sha1
    Write-Output "  $relativePath"
}

# Step 3: Create deploy
$deployBody = @{ files = $fileHashes } | ConvertTo-Json
$deployResponse = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites/$siteId/deploys" -Headers $headers -Method POST -Body $deployBody
$deployId = $deployResponse.id
$required = $deployResponse.required

Write-Output "Deploy ID: $deployId — $($required.Count) arquivos para upload"

# Step 4: Upload files
$uploadHeaders = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/octet-stream"
}

foreach ($sha in $required) {
    $filePath = $fileHashes.GetEnumerator() | Where-Object { $_.Value -eq $sha } | Select-Object -First 1
    if ($filePath) {
        $localPath = Join-Path $deployDir ($filePath.Key.TrimStart("/") -replace "/", "\")
        Write-Output "  Upload: $($filePath.Key)"
        $fileBytes = [System.IO.File]::ReadAllBytes($localPath)
        Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/deploys/$deployId/files$($filePath.Key)" -Headers $uploadHeaders -Method PUT -Body $fileBytes | Out-Null
    }
}

Write-Output ""
Write-Output "Deploy OK!"
Write-Output "URL: https://zoonoseapp-v2.netlify.app"

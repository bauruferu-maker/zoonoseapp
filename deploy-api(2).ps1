$token = "nfc_1aTdCk6xmC1fU8FzK2SiK6Jgb8tAcdvv437a"
$siteId = "74e72cb4-d869-426a-9790-34dd942fa46c"
$deployDir = "C:\Users\leoal\Baurufer\projects\active\zoonoseapp\deploy"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 1: Calculate SHA1 hashes of all files
$files = Get-ChildItem -Path $deployDir -File -Recurse
$fileHashes = @{}

foreach ($file in $files) {
    $relativePath = "/" + ($file.FullName.Substring($deployDir.Length + 1) -replace "\\", "/")
    $sha1 = (Get-FileHash -Path $file.FullName -Algorithm SHA1).Hash.ToLower()
    $fileHashes[$relativePath] = $sha1
    Write-Output "File: $relativePath -> $sha1"
}

# Step 2: Create deploy with file hashes
$deployBody = @{
    files = $fileHashes
} | ConvertTo-Json

Write-Output "`nCreating deploy..."
$deployResponse = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites/$siteId/deploys" -Headers $headers -Method POST -Body $deployBody
$deployId = $deployResponse.id
$required = $deployResponse.required

Write-Output "Deploy ID: $deployId"
Write-Output "Files required: $($required.Count)"

# Step 3: Upload required files
$uploadHeaders = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/octet-stream"
}

foreach ($sha in $required) {
    # Find which file has this sha
    $filePath = $fileHashes.GetEnumerator() | Where-Object { $_.Value -eq $sha } | Select-Object -First 1
    if ($filePath) {
        $localPath = Join-Path $deployDir ($filePath.Key.TrimStart("/") -replace "/", "\")
        Write-Output "Uploading: $($filePath.Key)"
        $fileBytes = [System.IO.File]::ReadAllBytes($localPath)
        Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/deploys/$deployId/files$($filePath.Key)" -Headers $uploadHeaders -Method PUT -Body $fileBytes | Out-Null
    }
}

Write-Output "`nDeploy complete!"
Write-Output "URL: https://zoonoseapp-prototipo.netlify.app"

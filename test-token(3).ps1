$token = "nfc_1aTdCk6xmC1fU8FzK2SiK6Jgb8tAcdvv437a"
$siteId = "74e72cb4-d869-426a-9790-34dd942fa46c"

$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites/$siteId" -Headers $headers -Method GET
    Write-Output "Site name: $($response.name)"
    Write-Output "URL: $($response.url)"
} catch {
    Write-Output "Error: $($_.Exception.Message)"
    Write-Output "Status: $($_.Exception.Response.StatusCode)"
}

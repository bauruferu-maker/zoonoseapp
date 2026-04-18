$token = "nfc_1aTdCk6xmC1fU8FzK2SiK6Jgb8tAcdvv437a"

$headers = @{
    "Authorization" = "Bearer $token"
}

# Check account info
$account = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/accounts" -Headers $headers -Method GET
Write-Output "Account info:"
$account | ConvertTo-Json -Depth 3

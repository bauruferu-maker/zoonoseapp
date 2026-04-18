$home = $env:USERPROFILE
$results = Get-ChildItem -Path $home -Recurse -Filter "*.json" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -like "*netlify*" }
foreach ($f in $results) {
    Write-Output $f.FullName
}

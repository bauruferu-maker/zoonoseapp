$paths = @(
  "C:\Users\leoal\AppData\Local\netlify",
  "C:\Users\leoal\AppData\Roaming\netlify",
  "C:\Users\leoal\.netlify"
)
foreach ($p in $paths) {
  if (Test-Path $p) {
    Write-Output "Found: $p"
    Get-ChildItem -Path $p -Recurse | Select-Object FullName
  } else {
    Write-Output "Not found: $p"
  }
}

# Also check where netlify CLI stores user data
$netlifyCli = where.exe netlify 2>$null
Write-Output "Netlify CLI location: $netlifyCli"

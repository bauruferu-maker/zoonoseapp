$input = "file:///C:/Users/leoal/Baurufer/projects/active/zoonoseapp/dossie-completo.html"
$output = "C:\Users\leoal\Baurufer\projects\active\zoonoseapp\ZoonoseApp-Dossie-Completo.pdf"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

& $chrome --headless --disable-gpu --print-to-pdf="$output" --no-margins --no-sandbox --print-to-pdf-no-header --virtual-time-budget=5000 "$input"

Start-Sleep -Seconds 4

if (Test-Path $output) {
    $size = [math]::Round((Get-Item $output).Length / 1KB)
    Write-Output "PDF gerado com sucesso!"
    Write-Output "Arquivo: $output"
    Write-Output "Tamanho: $size KB"
} else {
    Write-Output "ERRO: PDF nao foi gerado"
}

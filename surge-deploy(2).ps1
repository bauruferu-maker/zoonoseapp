$env:SURGE_LOGIN = "bauruferu@gmail.com"
$env:SURGE_TOKEN = ""

Set-Location "C:\Users\leoal\Baurufer\projects\active\zoonoseapp\deploy"
surge --domain zoonoseapp.surge.sh

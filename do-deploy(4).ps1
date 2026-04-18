$env:NETLIFY_AUTH_TOKEN = "nfc_1aTdCk6xmC1fU8FzK2SiK6Jgb8tAcdvv437a"
Set-Location "C:\Users\leoal\Baurufer\projects\active\zoonoseapp"
netlify deploy --dir=deploy --prod --auth $env:NETLIFY_AUTH_TOKEN

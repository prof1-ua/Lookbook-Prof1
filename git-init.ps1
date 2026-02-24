$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
Set-Location 'c:\Users\GODMAN\Documents\AI agents\lookbook-generator'
git init
git add .
git commit -m "initial commit"
Write-Host "ГОТОВО — теперь создай репозиторий на github.com и вставь команды git remote add + git push"
Read-Host "Нажми Enter для выхода"

param(
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

Write-Host "DARK Games v5 — setup" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js не найден. Установи Node.js 24 и запусти скрипт снова."
}

$nodeVersion = node -p "process.versions.node"
$parts = $nodeVersion.Split('.')
$nodeMajor = [int]$parts[0]
$nodeMinor = [int]$parts[1]
Write-Host "Node.js: v$nodeVersion"

if (($nodeMajor -lt 22) -or (($nodeMajor -eq 22) -and ($nodeMinor -lt 5))) {
    throw "Нужен Node.js 22.5+; рекомендуется Node.js 24."
}

if ($Clean) {
    if (Test-Path "node_modules") {
        Write-Host "Удаляю node_modules..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force "node_modules"
    }
    if (Test-Path "package-lock.json") {
        Remove-Item -Force "package-lock.json"
    }
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Создан .env из .env.example" -ForegroundColor Green
}

Write-Host "Устанавливаю зависимости..." -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "Готово." -ForegroundColor Green
Write-Host "1) Открой .env и замени JWT_SECRET и ADMIN_PASSWORD." -ForegroundColor Yellow
Write-Host "2) Для разработки: npm run dev"
Write-Host "3) Для обычного запуска: npm start"
Write-Host "4) Открой http://localhost:3000"

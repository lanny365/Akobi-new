$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = $root
$backendDir = Join-Path $root 'backend'
$phpExe = 'C:\xampp\php\php.exe'

if (-not (Test-Path (Join-Path $frontendDir 'package.json'))) {
  Write-Host "Could not find package.json in $frontendDir" -ForegroundColor Red
  Read-Host 'Press Enter to exit'
  exit 1
}

if (-not (Test-Path (Join-Path $backendDir 'artisan'))) {
  Write-Host "Could not find artisan in $backendDir" -ForegroundColor Red
  Read-Host 'Press Enter to exit'
  exit 1
}

if (-not (Test-Path $phpExe)) {
  $phpExe = 'php'
}

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "cmd /k `"cd /d `"$backendDir`" && `"$phpExe`" artisan serve --host=127.0.0.1 --port=8001`""
)

Write-Host 'Building frontend...' -ForegroundColor Yellow
npm.cmd --prefix "$frontendDir" run build
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Frontend build failed. Fix the frontend errors shown above, then run this launcher again.' -ForegroundColor Red
  Read-Host 'Press Enter to exit'
  exit 1
}

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "cmd /k `"cd /d `"$frontendDir`" && npm.cmd run preview -- --host 0.0.0.0 --port 5173`""
)

Start-Sleep -Seconds 8
Start-Process 'http://localhost:5173'

Write-Host ''
Write-Host 'AKOBI is starting.' -ForegroundColor Green
Write-Host 'Leave both terminal windows open while you use the app.'
Write-Host 'Open the app at http://localhost:5173'
Write-Host ''
Read-Host 'Press Enter to close this launcher window'

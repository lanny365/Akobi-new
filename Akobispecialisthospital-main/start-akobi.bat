@echo off
setlocal

set "ROOT=%~dp0"
set "FRONTEND_DIR=%ROOT%"
set "BACKEND_DIR=%ROOT%backend"
set "PHP_EXE=C:\xampp\php\php.exe"

if not exist "%FRONTEND_DIR%package.json" (
  echo Could not find package.json in:
  echo "%FRONTEND_DIR%"
  pause
  exit /b 1
)

if not exist "%BACKEND_DIR%\artisan" (
  echo Could not find artisan in:
  echo "%BACKEND_DIR%"
  pause
  exit /b 1
)

if not exist "%PHP_EXE%" (
  set "PHP_EXE=php"
)

echo Starting AKOBI backend on http://localhost:8001
start "AKOBI Backend" cmd /k "cd /d \"%BACKEND_DIR%\" && \"%PHP_EXE%\" artisan serve --host=127.0.0.1 --port=8001"

echo Building AKOBI frontend...
call npm.cmd --prefix "%FRONTEND_DIR%" run build
if errorlevel 1 (
  echo Frontend build failed. Fix the frontend errors shown above, then run this launcher again.
  pause
  exit /b 1
)

echo Starting AKOBI frontend on http://localhost:5173
start "AKOBI Frontend" cmd /k "cd /d \"%FRONTEND_DIR%\" && npm.cmd run preview -- --host 0.0.0.0 --port 5173"

timeout /t 8 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo AKOBI is starting.
echo Leave both command windows open.
echo Open the app at http://localhost:5173
echo.
pause

@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto falta_node
if not exist "node_modules\pg\package.json" (
  call npm ci
  if errorlevel 1 goto fallo
)
if not exist "local\node_modules\embedded-postgres\package.json" (
  call npm ci --prefix local
  if errorlevel 1 goto fallo
)
powershell -NoProfile -Command "try { $r=Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3180/api/index' -Body '{\"action\":\"catalog\"}' -ContentType application/json -TimeoutSec 2; if ($null -ne $r.products) {exit 0} } catch {}; exit 1"
if not errorlevel 1 (
  start "" http://127.0.0.1:3180
  exit /b
)
echo Abri http://127.0.0.1:3180 cuando aparezca el mensaje Food Store.
node local/demo.mjs
if errorlevel 1 goto fallo
exit /b
:falta_node
echo Instala Node.js 24 con npm y volve a abrir este archivo.
:fallo
pause


@echo off
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js 24 ou superior para configurar o acesso.
  pause
  exit /b 1
)
node.exe "%~dp0scripts\create-admin.cjs" %*
pause

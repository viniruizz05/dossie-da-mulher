@echo off
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js 24 ou superior para abrir o site.
  pause
  exit /b 1
)
node.exe "%~dp0scripts\launch.cjs"
if errorlevel 1 pause

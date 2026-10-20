@echo off
where node.exe >nul 2>nul
if %errorlevel%==0 (
  node.exe "%~dp0launch.cjs"
) else (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "%~dp0launch.cjs"
  ) else (
    echo Instale o Node.js para abrir o site.
    pause
    exit /b 1
  )
)
if errorlevel 1 pause

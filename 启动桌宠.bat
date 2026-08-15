@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist "node_modules\electron\dist\electron.exe" (
  echo [Moodie] 未找到 Electron 依赖，正在安装...
  call npm install
  if errorlevel 1 (
    echo [Moodie] 安装失败，请手动运行: npm install
    pause
    exit /b 1
  )
)
echo [Moodie] 启动桌宠...
"%~dp0node_modules\.bin\electron.cmd" .

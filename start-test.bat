@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "ELECTRON=%~dp0node_modules\electron\dist\electron.exe"
if not exist "%ELECTRON%" (
  echo [Moodie] 未找到 Electron，正在安装...
  call npm install
  if errorlevel 1 (
    echo [Moodie] 安装失败，请手动运行: npm install
    pause
    exit /b 1
  )
)
rem 用 start 脱离启动：electron.exe 是 GUI 程序无控制台，bat 随即退出，宠物独立常驻
start "" "%ELECTRON%" .
exit /b

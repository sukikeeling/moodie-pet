' Moodie 桌宠启动器 — 静默、脱离、常驻
' 用 WScript.Shell.Run(0, False) 启动 electron.exe：0=无窗口，False=不等待
' 这样启动的进程独立于调用者，关掉 cmd/脚本也不影响桌宠
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
exe = dir & "\node_modules\electron\dist\electron.exe"
If Not fso.FileExists(exe) Then
  MsgBox "未找到 Electron，请先在项目目录运行 npm install", vbExclamation, "Moodie"
  WScript.Quit 1
End If
CreateObject("WScript.Shell").Run """" & exe & """ .", 0, False

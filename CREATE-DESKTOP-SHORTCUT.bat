@echo off
title Create NovaMetrics Desktop Shortcut
color 0A
cls

echo ========================================================
echo        CREATE NOVAMETRICS DESKTOP SHORTCUT
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $d = [System.Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut(\"$d\NovaMetrics Financial Dashboard.lnk\"); $s.TargetPath = '%~dp0START-DASHBOARD.bat'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'NovaMetrics - SaaS Financial & Cashflow Analytics Dashboard'; $s.Save(); Write-Host 'SUCCESS: Shortcut [NovaMetrics Financial Dashboard.lnk] created on your Desktop!' -ForegroundColor Green"

echo.
echo You can now double-click the "NovaMetrics Financial Dashboard" icon directly on your Desktop!
echo.
pause

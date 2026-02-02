@echo off
title Start Project
cd /d "%~dp0"

echo ===============================
echo Installing dependencies...
echo ===============================
call npm install

echo.
echo ===============================
echo Starting project...
echo ===============================
call npm run dev

pause

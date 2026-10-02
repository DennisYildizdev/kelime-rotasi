@echo off
cd /d "C:\Users\PC\Oxford-Focus"

start "Oxford Focus Server" cmd /k "python -m http.server 8000 --bind 127.0.0.1"

timeout /t 2 /nobreak >nul

start "" "http://127.0.0.1:8000/"

exit
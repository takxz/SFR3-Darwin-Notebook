@echo off
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '172.17.*' -and $_.IPAddress -notlike '169.254.*' } | Sort-Object PrefixLength -Descending | Select-Object -ExpandProperty IPAddress -First 1"`) do set HOST_IP=%%i
echo HOST_IP=%HOST_IP%> .env
echo ^^ HOST_IP : %HOST_IP%
docker compose up --build %*
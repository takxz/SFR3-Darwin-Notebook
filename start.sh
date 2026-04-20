#!/bin/bash

if command -v powershell.exe &> /dev/null; then
    HOST_IP=$(powershell.exe -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { \$_.IPAddress -notlike '127.*' -and \$_.IPAddress -notlike '172.17.*' -and \$_.IPAddress -notlike '169.254.*' } | Sort-Object PrefixLength -Descending | Select-Object -ExpandProperty IPAddress -First 1" | tr -d '\r\n')
else
    HOST_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi

echo "HOST_IP=$HOST_IP" > .env
echo "→ HOST_IP : $HOST_IP"

docker compose up --build "$@"
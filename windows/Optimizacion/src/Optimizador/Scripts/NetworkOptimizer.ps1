# Optimización de Red y Reducción de Ping (Network Tuning)
# Este script requiere privilegios de Administrador

Write-Host "Iniciando Optimizacion de Red..." -ForegroundColor Cyan

# 1. Liberar y Renovar IP
Write-Host "Renovando IP..."
ipconfig /release | Out-Null
ipconfig /renew | Out-Null

# 2. Limpiar Caché DNS
Write-Host "Limpiando cache DNS..."
ipconfig /flushdns | Out-Null

# 3. Resetear Catálogo Winsock y TCP/IP
Write-Host "Reseteando Winsock y TCP/IP..."
netsh winsock reset | Out-Null
netsh int ip reset | Out-Null

# 4. Optimizaciones Globales TCP para bajar Ping y acelerar descargas
Write-Host "Aplicando optimizaciones TCP globales..."

# Deshabilitar heurística de Windows que puede limitar el rendimiento
netsh int tcp set heuristics disabled | Out-Null

# Habilitar el Auto-Tuning de la ventana de recepción (Mejora PING/Carga en redes modernas)
netsh int tcp set global autotuninglevel=normal | Out-Null

# Habilitar Explicit Congestion Notification (ECN) - Evita pérdida de paquetes antes de saturar routers
netsh int tcp set global ecncapability=enabled | Out-Null

# Escalar tiempo de espera (Timestamp) para redes asimétricas (ADSL/Cable)
netsh int tcp set global timestamps=disabled | Out-Null

# Desactivar RSC (Receive Segment Coalescing) - Puede causar latencia en juegos
netsh int tcp set global rsc=disabled | Out-Null
netsh int tcp set global initialRto=2000 | Out-Null

# Desactivar algoritmo de Nagle y optimizar Registry TCP (Gaming)
$TcpParametersPath = "HKLM:\System\CurrentControlSet\Services\Tcpip\Parameters"
if (Test-Path $TcpParametersPath) {
    Set-ItemProperty -Path $TcpParametersPath -Name "DefaultTTL" -Value 64 -Type DWord -Force
    Set-ItemProperty -Path $TcpParametersPath -Name "Tcp1323Opts" -Value 1 -Type DWord -Force
    Set-ItemProperty -Path $TcpParametersPath -Name "TcpMaxDupAcks" -Value 2 -Type DWord -Force
}

Write-Host "Optimizacion de Red Completada." -ForegroundColor Green
Write-Host "Se recomienda reiniciar el ordenador para aplicar todos los cambios de red." -ForegroundColor Yellow
Start-Sleep -Seconds 3

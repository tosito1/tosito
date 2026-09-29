<#
.SYNOPSIS
    Ejecuta comandos de optimización de red de Windows.
.DESCRIPTION
    Limpia la caché de DNS, renueva la IP y restablece el catálogo de Winsock y TCP/IP.
    Requiere permisos de Administrador para algunas operaciones.
#>

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Este script requiere permisos de Administrador para aplicar todas las configuraciones de red."
    Write-Warning "Por favor, reinicie la aplicación como Administrador."
    exit
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Iniciando Optimización de Red" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

try {
    Write-Host "`n1. Liberando dirección IP actual..." -ForegroundColor Green
    ipconfig /release | Out-Null
    
    Write-Host "2. Vaciando Caché DNS (Flush DNS)..." -ForegroundColor Green
    ipconfig /flushdns | Out-Null
    
    Write-Host "3. Renovando dirección IP..." -ForegroundColor Green
    ipconfig /renew | Out-Null
    
    Write-Host "4. Restableciendo IP..." -ForegroundColor Green
    netsh int ip reset | Out-Null
    
    Write-Host "5. Restableciendo Catálogo Winsock..." -ForegroundColor Green
    netsh winsock reset | Out-Null
    
    Write-Host "`n============================" -ForegroundColor Cyan
    Write-Host "¡Red optimizada correctamente!" -ForegroundColor Green
    Write-Host "Es posible que necesite reiniciar su computadora para que todos los cambios surtan efecto." -ForegroundColor Yellow
    Write-Host "============================" -ForegroundColor Cyan
} catch {
    Write-Host "Ocurrió un error al optimizar la red." -ForegroundColor Red
    Write-Host "Detalle: $($_.Exception.Message)" -ForegroundColor Yellow
}

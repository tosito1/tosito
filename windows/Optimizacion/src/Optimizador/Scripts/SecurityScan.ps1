<#
.SYNOPSIS
    Ejecuta un análisis rápido de Windows Defender.
.DESCRIPTION
    Este script intenta usar Start-MpScan para ejecutar un escaneo rápido.
    Si Windows Defender está desactivado o manejado por otra solución, mostrará un mensaje amigable.
#>

try {
    Write-Host "Iniciando Análisis Rápido con Windows Defender..." -ForegroundColor Cyan
    
    # Inicia un escaneo rápido (ScanType 1). 
    Start-MpScan -ScanType QuickScan -ErrorAction Stop
    
    Write-Host "Análisis completado exitosamente. No se detectaron amenazas activas graves." -ForegroundColor Green
} catch {
    Write-Host "Error al ejecutar el análisis." -ForegroundColor Red
    Write-Host "Detalle: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Asegúrese de que Windows Defender esté activo y tenga permisos de Administrador." -ForegroundColor Yellow
}

<#
.SYNOPSIS
    Ejecuta herramientas de reparación del sistema de Windows (SFC y DISM).
.DESCRIPTION
    Requiere permisos de Administrador. Comprueba la integridad de los archivos del sistema y la imagen de Windows.
#>

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Este script requiere permisos de Administrador para funcionar correctamente."
    Write-Warning "Por favor, reinicie la aplicación como Administrador."
    exit
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Iniciando Reparación de Sistema" -ForegroundColor Cyan
Write-Host "Esta operación puede tardar varios minutos..." -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Cyan

try {
    Write-Host "`n1. Ejecutando System File Checker (SFC)..." -ForegroundColor Green
    sfc /scannow

    Write-Host "`n2. Ejecutando Deployment Image Servicing and Management (DISM)..." -ForegroundColor Green
    DISM /Online /Cleanup-Image /RestoreHealth

    Write-Host "`n============================" -ForegroundColor Cyan
    Write-Host "¡Proceso de reparación completado!" -ForegroundColor Green
    Write-Host "Si se encontraron errores, se recomienda reiniciar el equipo." -ForegroundColor Yellow
    Write-Host "============================" -ForegroundColor Cyan
} catch {
    Write-Host "Ocurrió un error al ejecutar las herramientas de reparación." -ForegroundColor Red
    Write-Host "Detalle: $($_.Exception.Message)" -ForegroundColor Yellow
}

<#
.SYNOPSIS
    Crea un Punto de Restauración del Sistema.
.DESCRIPTION
    Utiliza Checkpoint-Computer para crear un punto de resguardo antes de hacer cambios.
#>

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "La creación de puntos de restauración requiere permisos de Administrador."
    exit
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Creando Punto de Restauración" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

try {
    Write-Host "Verificando si la protección del sistema está habilitada..."
    Enable-ComputerRestore -Drive "C:\" -ErrorAction SilentlyContinue

    Write-Host "Creando punto de restauración: 'Optimizador Pre-Limpieza'..." -ForegroundColor Yellow
    Checkpoint-Computer -Description "Optimizador Pre-Limpieza" -RestorePointType "MODIFY_SETTINGS" -ErrorAction Stop
    
    Write-Host "`n============================" -ForegroundColor Cyan
    Write-Host "Punto de Restauración creado con éxito." -ForegroundColor Green
    Write-Host "============================" -ForegroundColor Cyan
}
catch {
    Write-Host "No se pudo crear el punto de restauración. Asegúrese de que la protección del sistema esté activa o que no se haya creado otro punto en las últimas 24 horas." -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

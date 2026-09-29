<#
.SYNOPSIS
    Ejecuta una limpieza profunda del sistema.
.DESCRIPTION
    Limpia la caché de descargas de Windows Update y borra archivos de registros de eventos antiguos.
#>

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "La limpieza profunda requiere permisos de Administrador."
    exit
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Iniciando Limpieza Profunda" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

try {
    # 1. Limpieza de Caché de Windows Update
    Write-Host "Deteniendo servicio de Windows Update..." -ForegroundColor Yellow
    Stop-Service -Name wuauserv -Force -ErrorAction SilentlyContinue
    Stop-Service -Name bits -Force -ErrorAction SilentlyContinue
    
    $wsusPath = "$env:windir\SoftwareDistribution\Download"
    if (Test-Path $wsusPath) {
        Write-Host "Borrando caché de descargas de Windows Update..."
        Remove-Item -Path "$wsusPath\*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Caché de Windows Update limpiada." -ForegroundColor Green
    }
    
    Write-Host "Iniciando servicio de Windows Update..." -ForegroundColor Yellow
    Start-Service -Name wuauserv -ErrorAction SilentlyContinue
    Start-Service -Name bits -ErrorAction SilentlyContinue

    # 2. Limpieza de Caché de DNS
    Write-Host "Vaciando caché DNS..."
    ipconfig /flushdns | Out-Null
    
    # 3. Borrado de Registros de Eventos de Windows
    Write-Host "Borrando registros de eventos de Windows (esto puede tardar unos segundos)..." -ForegroundColor Yellow
    wevtutil el | ForEach-Object { wevtutil cl "$_" 2>$null }
    Write-Host "Registros de eventos limpiados." -ForegroundColor Green

    Write-Host "`n============================" -ForegroundColor Cyan
    Write-Host "Limpieza Profunda Completada." -ForegroundColor Green
    Write-Host "============================" -ForegroundColor Cyan
}
catch {
    Write-Host "Error durante la limpieza profunda: $($_.Exception.Message)" -ForegroundColor Red
}

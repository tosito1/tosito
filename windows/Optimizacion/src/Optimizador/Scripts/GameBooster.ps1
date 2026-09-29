<#
.SYNOPSIS
    Activa el Modo Game Booster.
.DESCRIPTION
    Detiene temporalmente servicios no esenciales de Windows para liberar RAM y CPU.
#>

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "El Modo Game Booster requiere permisos de Administrador."
    exit
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "🚀 Activando Modo Game Booster 🎮" -ForegroundColor Cyan
Write-Host "Deteniendo servicios en segundo plano..." -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Cyan

# Lista de servicios a detener temporalmente
$servicesToStop = @(
    "SysMain",          # Superfetch
    "wuauserv",         # Windows Update
    "WSearch",          # Windows Search
    "DiagTrack",        # Connected User Experiences and Telemetry
    "BITS",             # Background Intelligent Transfer Service
    "Spooler"           # Cola de Impresión
)

foreach ($svcName in $servicesToStop) {
    try {
        $svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
        if ($svc.Status -eq 'Running') {
            Write-Host "Deteniendo $svcName..." -ForegroundColor Green
            Stop-Service -Name $svcName -Force -ErrorAction SilentlyContinue
        }
        else {
            Write-Host "$svcName ya está detenido." -ForegroundColor DarkGray
        }
    }
    catch {
        Write-Host "Error al detener $svcName." -ForegroundColor Red
    }
}

# Liberar memoria de caché general usando PowerShell intrínseca
Write-Host "`nForzando recolección de basura de memoria (GC)..." -ForegroundColor Yellow
[System.GC]::Collect()

Write-Host "`n============================" -ForegroundColor Cyan
Write-Host "¡Game Booster Activado! Disfruta tu juego." -ForegroundColor Green
Write-Host "No olvides restaurar el sistema cuando termines." -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Cyan

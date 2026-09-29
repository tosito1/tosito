<#
.SYNOPSIS
    Desactiva el Modo Game Booster y restaura el estado normal.
.DESCRIPTION
    Vuelve a iniciar los servicios de Windows pausados durante el Game Booster.
#>

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Desactivar el Modo Game Booster requiere permisos de Administrador."
    exit
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "🔄 Restaurando Modo Normal" -ForegroundColor Cyan
Write-Host "Reiniciando servicios del sistema..." -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Cyan

# Lista de servicios a reiniciar
$servicesToStart = @(
    "SysMain",          # Superfetch
    "wuauserv",         # Windows Update
    "WSearch",          # Windows Search
    "DiagTrack",        # Connected User Experiences and Telemetry
    "BITS",             # Background Intelligent Transfer Service
    "Spooler"           # Cola de Impresión
)

foreach ($svcName in $servicesToStart) {
    try {
        $svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
        # Solo lo intentamos iniciar si está actualmente detenido y no está deshabilitado permanentemente
        if ($svc.Status -eq 'Stopped' -and $svc.StartType -ne 'Disabled') {
            Write-Host "Iniciando $svcName..." -ForegroundColor Green
            Start-Service -Name $svcName -ErrorAction SilentlyContinue
        }
        else {
            Write-Host "$svcName ya estaba iniciado o está deshabilitado." -ForegroundColor DarkGray
        }
    }
    catch {
        Write-Host "Error al iniciar $svcName." -ForegroundColor Red
    }
}

Write-Host "`n============================" -ForegroundColor Cyan
Write-Host "¡Sistema restaurado con éxito al modo normal!" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Cyan

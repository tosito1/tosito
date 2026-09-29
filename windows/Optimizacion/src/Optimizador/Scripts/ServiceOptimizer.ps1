# Optimizador de Servicios inútiles de Windows
# Este script requiere privilegios de Administrador

Write-Host "Iniciando Optimizador de Servicios..." -ForegroundColor Cyan
Write-Host "========================================="
Write-Host "Deshabilitando servicios de telemetria y caracteristicas raras."
Write-Host "=========================================" -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Array of services to disable
# Note: DiagTrack (Connected User Experiences and Telemetry), WSearch (Windows Search - optional, we'll keep it for now), 
# MapsBroker (Downloaded Maps Manager), Fax (Fax), bthserv (Bluetooth Support Service - keep if laptop), 
# XblAuthManager (Xbox Live Auth - disable if not gaming), WbioSrvc (Windows Biometric Service)

$ServicesToDisable = @(
    "DiagTrack",       # Telemetry
    "MapsBroker",      # Downloaded Maps Manager
    "Fax",             # Fax
    "WbioSrvc",        # Windows Biometric Service (disable if no fingerprint/face scanner)
    "SysMain",         # Superfetch (often causes 100% disk usage on HDDs/SSDs, highly recommended to disable by tweaked OS)
    "lfsvc",           # Geolocation Service
    "RemoteRegistry",  # Remote Registry (Security risk)
    "TrkWks"           # Distributed Link Tracking Client
)

$count = 0
$total = $ServicesToDisable.Count

foreach ($service in $ServicesToDisable) {
    $count++
    Write-Host "[$count/$total] Evaluando servicio: $service..." -ForegroundColor Cyan
    
    $svc = Get-Service -Name $service -ErrorAction SilentlyContinue
    if ($svc) {
        try {
            if ($svc.Status -ne 'Stopped') {
                Stop-Service -Name $service -Force -ErrorAction SilentlyContinue
            }
            Set-Service -Name $service -StartupType Disabled -ErrorAction SilentlyContinue
            Write-Host "  -> Detenido y deshabilitado exitosamente." -ForegroundColor Green
        }
        catch {
            Write-Host "  -> Error intentando deshabilitar (podria estar bloqueado)." -ForegroundColor Red
        }
    }
    else {
        Write-Host "  -> El servicio no existe en este sistema (normal)." -ForegroundColor DarkGray
    }
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "Optimizacion de Servicios Completada." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Start-Sleep -Seconds 3

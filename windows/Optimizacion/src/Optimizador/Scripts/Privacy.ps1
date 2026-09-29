<#
.SYNOPSIS
    Modifica el registro para maximizar la privacidad y detener el rastreo de Windows.
.DESCRIPTION
    (Versión V2) Desactiva telemetría, ID de publicidad, seguimiento de escritura (Keylogger de diagnóstico), y la recolección de actividad de Microsoft.
#>

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "El escudo de privacidad requiere permisos de Administrador."
    exit
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Aplicando Escudo de Privacidad V2 (Anti-Rastreo)" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

$regKeys = @(
    # Bloquear Telemetría de usuario y del sistema
    @{ Path = "HKLM:\Software\Policies\Microsoft\Windows\DataCollection"; Name = "AllowTelemetry"; Value = 0; Type = "DWord" }
    
    # Desactivar ID de publicidad (Ad Tracking)
    @{ Path = "HKCU:\Software\Microsoft\Windows\CurrentVersion\AdvertisingInfo"; Name = "Enabled"; Value = 0; Type = "DWord" }
    
    # Desactivar seguimiento de lanzamiento de apps
    @{ Path = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"; Name = "Start_TrackProgs"; Value = 0; Type = "DWord" }
    
    # Desactivar "Sugerencias" en Windows
    @{ Path = "HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; Name = "SubscribedContent-338389Enabled"; Value = 0; Type = "DWord" }
    
    # Evitar que Windows envíe mi escritura para "mejorar el diccionario" (Diagnóstico Inking & Typing)
    @{ Path = "HKCU:\Software\Microsoft\InputPersonalization"; Name = "RestrictImplicitTextCollection"; Value = 1; Type = "DWord" }
    @{ Path = "HKCU:\Software\Microsoft\InputPersonalization\TrainedDataStore"; Name = "HarvestContacts"; Value = 0; Type = "DWord" }
    
    # Desactivar historial de actividad de la cuenta (Timeline)
    @{ Path = "HKLM:\Software\Policies\Microsoft\Windows\System"; Name = "PublishUserActivities"; Value = 0; Type = "DWord" }
    @{ Path = "HKLM:\Software\Policies\Microsoft\Windows\System"; Name = "UploadUserActivities"; Value = 0; Type = "DWord" }

    # Desactivar Experiencia de Usuario Conectada (DiagnTrack)
    @{ Path = "HKLM:\SYSTEM\CurrentControlSet\Services\DiagTrack"; Name = "Start"; Value = 4; Type = "DWord" }
    @{ Path = "HKLM:\SYSTEM\CurrentControlSet\Services\dmwappushservice"; Name = "Start"; Value = 4; Type = "DWord" }
)

$aplicados = 0

foreach ($reg in $regKeys) {
    try {
        if (!(Test-Path $reg.Path)) {
            New-Item -Path $reg.Path -Force | Out-Null
        }
        Set-ItemProperty -Path $reg.Path -Name $reg.Name -Value $reg.Value -Type $reg.Type -ErrorAction Stop
        Write-Host "Protegido: $($reg.Name)" -ForegroundColor Yellow
        $aplicados++
    }
    catch {
        Write-Host "Ignorado (falta permiso): $($reg.Name)" -ForegroundColor DarkGray
    }
}

Write-Host "Deteniendo servicios espía en segundo plano..."
Stop-Service -Name DiagTrack -Force -ErrorAction SilentlyContinue
Stop-Service -Name dmwappushservice -Force -ErrorAction SilentlyContinue

Write-Host "`n============================" -ForegroundColor Cyan
Write-Host "Escudo levantado. $aplicados políticas de anti-rastreo aplicadas." -ForegroundColor Green
Write-Host "============================" -ForegroundColor Cyan

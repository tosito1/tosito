<#
.SYNOPSIS
    Elimina aplicaciones preinstaladas innecesarias de Windows (Bloatware).
.DESCRIPTION
    Busca y elimina aplicaciones UWP conocidas por ser "bloatware" como juegos, redes sociales de terceros y utilidades no esenciales nativas de Windows 10/11.
#>

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "El proceso Debloat requiere permisos de Administrador."
    exit
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Iniciando Limpieza Extrema (Debloat)" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

$bloatwareApps = @(
    "*BingNews*", "*BingWeather*", "*Microsoft3DViewer*", "*MicrosoftSolitaireCollection*",
    "*MicrosoftStickyNotes*", "*MixedReality.Portal*", "*Office.OneNote*", "*People*",
    "*SkypeApp*", "*WindowsAlarms*", "*WindowsCamera*", "*windowscommunicationsapps*",
    "*WindowsFeedbackHub*", "*WindowsMaps*", "*WindowsSoundRecorder*", "*XboxApp*",
    "*XboxOneSmartGlass*", "*XboxSpeechToTextOverlay*", "*ZuneMusic*", "*ZuneVideo*",
    "*TikTok*", "*Facebook*", "*Instagram*", "*Spotify*", "*Netflix*", "*Disney*",
    "*CandyCrush*", "*Twitter*", "*LinkedIn*"
)

$totalEliminadas = 0

foreach ($app in $bloatwareApps) {
    Write-Host "Buscando $app..." -NoNewline
    $packages = Get-AppxPackage -Name $app -AllUsers -ErrorAction SilentlyContinue

    if ($packages) {
        Write-Host " Encontrado! Eliminando..." -ForegroundColor Yellow
        try {
            foreach ($package in $packages) {
                # Remove for current user
                Remove-AppxPackage -Package $package.PackageFullName -ErrorAction SilentlyContinue
                
                # Remove from provisioned packages (so it doesn't return on new users)
                $provisionedPackage = Get-AppxProvisionedPackage -Online | Where-Object { $_.DisplayName -like $app }
                if ($provisionedPackage) {
                    Remove-AppxProvisionedPackage -Online -PackageName $provisionedPackage.PackageName -ErrorAction SilentlyContinue
                }
            }
            Write-Host " > $app eliminado." -ForegroundColor Green
            $totalEliminadas++
        }
        catch {
            Write-Host " > Error al eliminar $app." -ForegroundColor Red
        }
    }
    else {
        Write-Host " No instalado." -ForegroundColor DarkGray
    }
}

Write-Host "`n============================" -ForegroundColor Cyan
Write-Host "Proceso completado. $totalEliminadas aplicaciones eliminadas." -ForegroundColor Green
Write-Host "============================" -ForegroundColor Cyan

# Extreme Debloat de Aplicaciones UWP Nativas
# Este script requiere privilegios de Administrador

Write-Host "Iniciando Desinstalacion Extrema de Bloatware (UWP)..." -ForegroundColor Cyan
Write-Host "========================================="
Write-Host "Esto eliminara aplicaciones modernas integradas en Windows que consumen espacio y recursos."
Write-Host "No se tocaran aplicaciones criticas (Microsoft Store, Calculadora, etc.)."
Write-Host "=========================================" -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Lista de paquetes UWP a eliminar (bloatware común)
$BloatwareList = @(
    "*3DBuilder*",
    "*WindowsAlarms*",
    "*WindowsCamera*",
    "*officehub*",
    "*skypeapp*",
    "*getstarted*",
    "*zunevideo*",
    "*bingfinance*",
    "*bingnews*",
    "*bingsports*",
    "*bingweather*",
    "*windowscommunicationsapps*", # Mail and Calendar
    "*windowsphone*",
    "*xboxapp*",
    "*XboxOneSmartGlass*",
    "*XboxGamingOverlay*",
    "*XboxIdentityProvider*",
    "*XboxSpeechToTextOverlay*",
    "*solitairecollection*",
    "*people*",
    "*windowsmaps*",
    "*soundrecorder*",
    "*zunemusic*",
    "*feedbackhub*",
    "*YourPhone*",
    "*Todos*",
    "*LinkedInforWindows*",
    "*MixedReality.Portal*"
)

$total = $BloatwareList.Count
$count = 0

foreach ($App in $BloatwareList) {
    $count++
    Write-Host "[$count/$total] Buscando y eliminando: $App..." -ForegroundColor Cyan
    
    # Get package and suppress errors if not found
    $package = Get-AppxPackage -Name $App -ErrorAction SilentlyContinue
    
    if ($package) {
        try {
            # Remove package for current user
            Remove-AppxPackage -Package $package.PackageFullName -ErrorAction SilentlyContinue | Out-Null
            
            # Attempt to remove provisioned package so it doesn't reinstall for new users
            $provisioned = Get-AppxProvisionedPackage -Online | Where-Object { $_.DisplayName -like $App }
            if ($provisioned) {
                Remove-AppxProvisionedPackage -Online -PackageName $provisioned.PackageName -ErrorAction SilentlyContinue | Out-Null
            }
            Write-Host "  -> Eliminado exitosamente." -ForegroundColor Green
        }
        catch {
            Write-Host "  -> Error eliminando (podria ser parte critica del sistema)." -ForegroundColor Red
        }
    }
    else {
        Write-Host "  -> No encontrado o ya eliminado." -ForegroundColor DarkGray
    }
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "Extreme Debloat Completado." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Start-Sleep -Seconds 3

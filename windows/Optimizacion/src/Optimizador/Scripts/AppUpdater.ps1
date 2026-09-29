<#
.SYNOPSIS
    Actualiza silenciosamente las aplicaciones del sistema usando Winget.
.DESCRIPTION
    Busca e instala las actualizaciones disponibles para las aplicaciones nativas y de terceros que soporten Winget.
#>

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Iniciando Actualización de Aplicaciones (Winget)" -ForegroundColor Cyan
Write-Host "Buscando actualizaciones disponibles..." -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Cyan

try {
    # Comprobar si winget está disponible
    $wingetCheck = Get-Command "winget" -ErrorAction SilentlyContinue

    if (-not $wingetCheck) {
        Write-Host "El Administrador de Paquetes de Windows (Winget) no está instalado o no se encuentra en el PATH." -ForegroundColor Red
        Write-Host "Recomendación: Instale el 'Instalador de aplicación' desde la Microsoft Store." -ForegroundColor Yellow
        exit
    }

    Write-Host "`nLista de actualizaciones disponibles (si las hay):" -ForegroundColor Green
    winget upgrade

    Write-Host "`nAplicando actualizaciones silenciosamente (puede demorar)..." -ForegroundColor Green
    winget upgrade --all --silent --accept-package-agreements --accept-source-agreements

    Write-Host "`n============================" -ForegroundColor Cyan
    Write-Host "¡Proceso de actualización completado!" -ForegroundColor Green
    Write-Host "============================" -ForegroundColor Cyan
    
} catch {
    Write-Host "Ocurrió un error al intentar actualizar aplicaciones." -ForegroundColor Red
    Write-Host "Detalle: $($_.Exception.Message)" -ForegroundColor Yellow
}

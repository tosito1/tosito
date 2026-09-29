<#
.SYNOPSIS
    Ad-Blocker a nivel sistema mediante modificación del archivo Hosts.
.DESCRIPTION
    Añade un gran listado de servidores de recolección de telemetría y anuncios (Microsoft, Google, Meta, etc) al archivo de hosts bloqueándolos.
#>

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "El Ad-Blocker del Sistema requiere permisos de Administrador."
    exit
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Iniciando Ad-Blocker (Archivo Hosts)" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

$hostsFile = "$env:windir\System32\drivers\etc\hosts"
$backupFile = "$env:windir\System32\drivers\etc\hosts.backup"

if (!(Test-Path $backupFile)) {
    Copy-Item -Path $hostsFile -Destination $backupFile -Force
    Write-Host "Backup del archivo Hosts guardado en: $backupFile" -ForegroundColor Yellow
}

$blocklist = @(
    "127.0.0.1 telemetry.microsoft.com"
    "127.0.0.1 vortex.data.microsoft.com"
    "127.0.0.1 watson.telemetry.microsoft.com"
    "127.0.0.1 oca.telemetry.microsoft.com"
    "127.0.0.1 reports.wes.df.telemetry.microsoft.com"
    "127.0.0.1 services.wes.df.telemetry.microsoft.com"
    "127.0.0.1 sqmoffice.telemetry.microsoft.com"
    "127.0.0.1 telecommand.telemetry.microsoft.com"
    "127.0.0.1 ads.microsoft.com"
    "127.0.0.1 pagead2.googlesyndication.com"
    "127.0.0.1 adservice.google.com"
    "127.0.0.1 googleads.g.doubleclick.net"
    "127.0.0.1 graph.facebook.com"
    "127.0.0.1 connect.facebook.net"
)

try {
    # Quitar atributo de solo lectura si lo tiene
    Set-ItemProperty -Path $hostsFile -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue

    Write-Host "Reescribiendo Entradas Bloqueadas..."
    # Limpiamos nuestras entradas antiguas si existieran para evitar duplicados
    $currentContent = Get-Content -Path $hostsFile
    $newContent = @()
    foreach ($line in $currentContent) {
        $found = $false
        foreach ($block in $blocklist) {
            if ($line -like "*$($block.Split(' ')[1])*") { $found = $true; break }
        }
        if (!$found -and $line -notmatch "^\s*$") { $newContent += $line }
    }

    # Añadimos titulo de la sección
    $newContent += "`n# --- OPTIMIZADOR AD-BLOCKER ---"
    foreach ($b in $blocklist) { $newContent += $b }

    $newContent | Set-Content -Path $hostsFile -Force

    # Vaciar cache DNS para que surta efecto
    ipconfig /flushdns | Out-Null

    Write-Host "`n============================" -ForegroundColor Cyan
    Write-Host "Ad-Blocker Activado Exitosamente." -ForegroundColor Green
    Write-Host "La telemetría y publicidad del sistema ha sido bloqueada."
    Write-Host "============================" -ForegroundColor Cyan
}
catch {
    Write-Host "Error modificando Hosts: $($_.Exception.Message)" -ForegroundColor Red
}

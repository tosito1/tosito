<#
.SYNOPSIS
    Cambia los servidores DNS a opciones más rápidas y limpia la caché DNS.
.DESCRIPTION
    Configura Cloudflare (1.1.1.1) o Google DNS y vacía la caché local.
#>

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "La optimización de DNS requiere permisos de Administrador."
    exit
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Iniciando Optimización DNS" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

try {
    Write-Host "Vaciando caché DNS..."
    Clear-DnsClientCache
    Write-Host "Caché DNS limpiada con éxito." -ForegroundColor Green

    # Obtener el adaptador de red conectado a Internet
    $adapter = Get-NetAdapter | Where-Object Status -eq "Up" | Select-Object -First 1
    
    if ($adapter) {
        Write-Host "Configurando DNS de Cloudflare (1.1.1.1) para el adaptador: $($adapter.Name)" -ForegroundColor Yellow
        Set-DnsClientServerAddress -InterfaceAlias $adapter.Name -ServerAddresses ("1.1.1.1", "1.0.0.1")
        Write-Host "Servidores DNS actualizados correctamente." -ForegroundColor Green
        
        Write-Host "Renovando IP y aplicando cambios..."
        ipconfig /renew | Out-Null
        
    }
    else {
        Write-Host "No se encontró un adaptador de red activo." -ForegroundColor Red
    }
    
    Write-Host "`n============================" -ForegroundColor Cyan
    Write-Host "Optimización DNS Completada." -ForegroundColor Green
    Write-Host "============================" -ForegroundColor Cyan
}
catch {
    Write-Host "Error durante la optimización DNS: $($_.Exception.Message)" -ForegroundColor Red
}

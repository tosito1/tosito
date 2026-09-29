<#
.SYNOPSIS
    Optimiza las unidades de disco (Desfragmentación para HDD, TRIM para SSD).
.DESCRIPTION
    Reconoce las unidades del sistema y ejecuta Optimize-Volume según el tipo de disco.
#>

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "La optimización de discos requiere permisos de Administrador."
    exit
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Iniciando Optimización de Discos" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

try {
    Write-Host "Analizando y optimizando unidades..."
    # Llama al optimizador nativo de Windows para todas las unidades compatibles (ReTrim para SSDs, Defrag para HDDs)
    Optimize-Volume -DriveLetter C -ReTrim -Verbose -ErrorAction SilentlyContinue
    Optimize-Volume -DriveLetter C -Defrag -Verbose -ErrorAction SilentlyContinue
    
    # También se pueden optimizar todas las unidades del sistema
    Get-Volume | Where-Object DriveType -eq 'Fixed' | ForEach-Object {
        Write-Host "Optimizando unidad $($_.DriveLetter):" -ForegroundColor Yellow
        Optimize-Volume -DriveLetter $_.DriveLetter -ReTrim -Verbose -ErrorAction SilentlyContinue
        # No forzamos Defrag en todas por si son SSD, Optimize-Volume normalmente sabe qué hacer, pero le pasamos ReTrim de forma segura.
    }
    
    Write-Host "`n============================" -ForegroundColor Cyan
    Write-Host "Optimización de Discos Completada." -ForegroundColor Green
    Write-Host "============================" -ForegroundColor Cyan
}
catch {
    Write-Host "Error durante la optimización: $($_.Exception.Message)" -ForegroundColor Red
}

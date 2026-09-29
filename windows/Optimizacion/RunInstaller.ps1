# Script to run installer as admin and wait for completion
$installerPath = "c:\Users\Tosito\Desktop\Tosito\windows\Optimizacion\src\Optimizador\Instalador_Optimizador_Suite.cmd"

Write-Host "Ejecutando el instalador elevado..."
Start-Process -FilePath $installerPath -Verb RunAs -Wait

Write-Host "Instalador completado"
Write-Host "Verificando instalacion..."

# Verificar estructura de instalacion
$installDir = "C:\Program Files\Optimizador"
if (Test-Path $installDir) {
    Write-Host "[OK] Directorio de instalacion existe"
    
    $clientExe = "$installDir\Client\Optimizador.exe"
    $adminExe = "$installDir\Admin\OptimizadorAdmin.exe"
    
    Write-Host ""
    Write-Host "Archivos instalados:"
    if (Test-Path $clientExe) {
        Write-Host "  [OK] Cliente: $clientExe"
    } else {
        Write-Host "  [FALTA] Cliente NO hallado"
    }
    
    if (Test-Path $adminExe) {
        Write-Host "  [OK] Admin: $adminExe"
    } else {
        Write-Host "  [FALTA] Admin NO hallado"
    }
    
    # Contar archivos
    $totalFiles = @(Get-ChildItem $installDir -Recurse -File).Count
    Write-Host ""
    Write-Host "Total de archivos instalados: $totalFiles"
    
} else {
    Write-Host "[ERROR] Directorio de instalacion NO existe"
}

Write-Host ""
Write-Host "Instalacion completada. Presiona Enter para salir..."
Read-Host

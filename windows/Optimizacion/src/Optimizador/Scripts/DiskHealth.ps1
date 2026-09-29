<#
.SYNOPSIS
    Monitor Avanzado de Salud de Discos (S.M.A.R.T).
.DESCRIPTION
    Usa WMI para interrogar a todas las unidades sobre fallos inminentes de hardware o sectores dañados.
#>

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Chequeo de Salud del Disco Duro (S.M.A.R.T)" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

try {
    $drives = Get-WmiObject -Namespace root\wmi -Class MSStorageDriver_FailurePredictStatus -ErrorAction Stop
    $physicalDrives = Get-WmiObject -Class Win32_DiskDrive
    
    $foundIssues = $false

    foreach ($drive in $drives) {
        $pd = $physicalDrives | Where-Object { $drive.InstanceName -match [regex]::Escape($_.PNPDeviceID) }
        $model = if ($pd) { $pd.Model } else { $drive.InstanceName }

        if ($drive.PredictFailure) {
            Write-Host "PELIGRO: El disco '$model' reporta un FALLO INMINENTE (PredictFailure = True)" -ForegroundColor Red
            Write-Host "Razón [código]: $($drive.Reason)" -ForegroundColor Red
            $foundIssues = $true
        }
        else {
            Write-Host "OK: El disco '$model' está SANO." -ForegroundColor Green
        }
    }

    if (!$foundIssues) {
        Write-Host "`n============================" -ForegroundColor Cyan
        Write-Host "Tu almacenamiento está en perfecto estado. No hay riesgos de pérdida de datos a nivel hardware." -ForegroundColor Green
        Write-Host "============================" -ForegroundColor Cyan
    }
    else {
        Write-Host "`n============================" -ForegroundColor Red
        Write-Host "¡ADVERTENCIA CRÍTICA!" -ForegroundColor Red
        Write-Host "Uno o más discos están al borde de la muerte. Realiza copia de seguridad de tus datos INMEDIATAMENTE."
        Write-Host "============================" -ForegroundColor Red
    }
}
catch {
    Write-Host "No se pudo leer la información SMART de este hardware. Podría ser un disco virtual o requerir permisos adicionales." -ForegroundColor DarkGray
    Write-Host "Detalle: $($_.Exception.Message)" -ForegroundColor Red
}

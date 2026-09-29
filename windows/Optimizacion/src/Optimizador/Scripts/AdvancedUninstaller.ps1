<#
.SYNOPSIS
    Módulo para listar y desinstalar programas (Advanced Uninstaller).
.DESCRIPTION
    El script tiene dos modos dependiendo de los argumentos:
    -List : Devuelve un JSON de las aplicaciones instaladas leyendo el registro.
    -Uninstall "Nombre" : Busca la cadena de desinstalación de una aplicación y la ejecuta silenciosamente.
#>

param (
    [Parameter(Mandatory = $true)]
    [ValidateSet("List", "Uninstall")]
    [string]$Action,
    
    [string]$AppName = ""
)

$registryPaths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*"
    "HKLM:\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
)

if ($Action -eq "List") {
    $apps = @()
    foreach ($path in $registryPaths) {
        $keys = Get-ItemProperty $path -ErrorAction SilentlyContinue | 
        Where-Object { $_.DisplayName -and $_.UninstallString }
        
        foreach ($key in $keys) {
            $apps += [PSCustomObject]@{
                Name         = $key.DisplayName
                Publisher    = if ($key.Publisher) { $key.Publisher } else { "Desconocido" }
                Version      = if ($key.DisplayVersion) { $key.DisplayVersion } else { "N/A" }
                UninstallCmd = $key.UninstallString
            }
        }
    }
    
    # Remover duplicados
    $uniqueApps = $apps | Sort-Object Name -Unique
    
    # Devolver JSON para que C# pueda dibujarlo en el nuevo WPF
    $uniqueApps | ConvertTo-Json -Compress
}
elseif ($Action -eq "Uninstall") {
    if ([string]::IsNullOrWhiteSpace($AppName)) {
        Write-Host "Se requiere el nombre exacto del programa para desinstalar."
        exit
    }
    
    if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Warning "AVISO: La desinstalación requiere permisos de Administrador."
    }

    Write-Host "============================" -ForegroundColor Cyan
    Write-Host "Buscando comando de desinstalación para: $AppName" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan

    $found = $false
    foreach ($path in $registryPaths) {
        $match = Get-ItemProperty $path -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -eq $AppName } | Select-Object -First 1
        
        if ($match -and $match.UninstallString) {
            $uninstCmd = $match.UninstallString
            Write-Host "Ejecutando desinstalador: $uninstCmd" -ForegroundColor Yellow
            $found = $true
            
            try {
                # MsiExec requriere argumentos especiales, a veces vienen incluidos.
                if ($uninstCmd -match "^msiexec.exe" -or $uninstCmd -match "(?i)msiexec") {
                    $argsStr = $uninstCmd -replace "msiexec(\.exe)?\s+", ""
                    # Insertar /quiet para ser silencioso
                    $argsStr = $argsStr -replace "/I", "/x" + " /quiet /norestart"
                    Write-Host "Comando MSI: msiexec $argsStr"
                    Start-Process -FilePath "msiexec.exe" -ArgumentList $argsStr -Wait -NoNewWindow
                }
                else {
                    $cmd = $uninstCmd
                    $cmdArgs = ""
                    # Separar si viene con comillas "C:\ruta\uninst.exe" /S
                    if ($uninstCmd -match "^`"(.*?)`"\s*(.*)") {
                        $cmd = $matches[1]
                        $cmdArgs = $matches[2]
                    }
                    Start-Process -FilePath $cmd -ArgumentList $cmdArgs -Wait -NoNewWindow
                }
                Write-Host "¡Comando enviado exitosamente al sistema!" -ForegroundColor Green
            }
            catch {
                Write-Host "Error al intentar ejecutar el desinstalador: $($_.Exception.Message)" -ForegroundColor Red
            }
            break
        }
    }

    if (!$found) {
        Write-Host "No se encontró '$AppName' o no tiene cadena de desinstalación válida." -ForegroundColor Red
    }
}

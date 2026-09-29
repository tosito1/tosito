<#
.SYNOPSIS
    Limpia opciones innecesarias del menú contextual (Clic Derecho).
.DESCRIPTION
    Revisa extensiones de shell en el registro que suelen ralentizar el menú contextual de carpetas y archivos.
#>

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "El gestor de Menu Contextual requiere permisos de Administrador."
    exit
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Limpiador de Menú Contextual" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

# Lista común de basura en Menú Contextual (Nvidia, Intel, Skype, Cast to Device, etc)
$registryPaths = @(
    "HKCR:\Directory\Background\shellex\ContextMenuHandlers\igfxcui"
    "HKCR:\Directory\Background\shellex\ContextMenuHandlers\NvCplDesktopContext"
    "HKCR:\Directory\Background\shellex\ContextMenuHandlers\igfxDTCM"
    "HKLM:\SOFTWARE\Classes\Folder\shell\pintostartscreen"
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\CommandStore\shell\Windows.ModernShare"
)

$removals = 0
foreach ($path in $registryPaths) {
    if (Test-Path $path) {
        try {
            # Hacemos Rename en vez de borrar por si acaso (Backup) añadiendo un .bak
            Rename-Item -Path $path -NewName "$($path.Split('\')[-1]).bak" -ErrorAction Stop
            Write-Host "Desactivado: $path" -ForegroundColor Yellow
            $removals++
        }
        catch {
            # Si ya es .bak, lo ignoramos
        }
    }
}

# Desactivar menú extendido de Windows 11 para volver al estilo rápido de Windows 10
Write-Host "Restaurando diseño rápido del Clic Derecho..."
try {
    $keyPath = "HKCU:\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32"
    if (!(Test-Path $keyPath)) {
        New-Item -Path $keyPath -Force | Out-Null
        Set-ItemProperty -Path $keyPath -Name "(Default)" -Value "" | Out-Null
        $removals++
    }
}
catch {
    Write-Host "Nota: Hubo un problema al tratar de restaurar el menú contextual tradicional." -ForegroundColor DarkGray
}

Write-Host "`n============================" -ForegroundColor Cyan
if ($removals -gt 0) {
    Write-Host "Limpieza Completada. Reinicia Explorer (o tu PC) para ver los cambios." -ForegroundColor Green
}
else {
    Write-Host "El Menú Contextual ya está limpio." -ForegroundColor Green
}
Write-Host "============================" -ForegroundColor Cyan

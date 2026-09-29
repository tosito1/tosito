<#
.SYNOPSIS
    Gestor Inteligente de Perfiles de Energía.
.DESCRIPTION
    Alterna entre el plan de Ahorro de Energía Máximo (para portátiles) y el plan de Alto Rendimiento (para gaming/trabajo pesado).
#>

param (
    [Parameter(Mandatory = $true)]
    [ValidateSet("Rendimiento", "Ahorro")]
    [string]$Plan
)

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "El gestor de energía requiere permisos de Administrador."
    exit
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Cambiando Plan de Batería/Energía a: $Plan" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

# GUIDs por defecto de Windows
$guidRendimiento = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"
$guidAhorro = "a1841308-3541-4fab-bc81-f71556f20b4a"

try {
    if ($Plan -eq "Rendimiento") {
        Write-Host "Restaurando plan Alto Rendimiento (si no existe)..." -ForegroundColor DarkGray
        powercfg /restoredefaultpolicies | Out-Null
        powercfg /setactive $guidRendimiento
        Write-Host "Plan de ALTO RENDIMIENTO activado. Tu procesador funcionará sin restricciones." -ForegroundColor Green
    }
    elseif ($Plan -eq "Ahorro") {
        Write-Host "Restaurando plan Economizador (si no existe)..." -ForegroundColor DarkGray
        powercfg /restoredefaultpolicies | Out-Null
        powercfg /setactive $guidAhorro
        Write-Host "Plan de AHORRO DE ENERGÍA activado. Se reducirá el consumo de batería significativamente." -ForegroundColor Green
    }
}
catch {
    Write-Host "Error cambiando el plan de energía: $($_.Exception.Message)" -ForegroundColor Red
}

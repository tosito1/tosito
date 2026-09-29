<#
.SYNOPSIS
    Administra las tareas programadas para la aplicación Optimizador.
.DESCRIPTION
    Permite registrar o eliminar una tarea programada que ejecuta una limpieza silenciosa en segundo plano.
.PARAMETER Action
    Define la acción a realizar: "Register" o "Unregister".
.PARAMETER TaskName
    El nombre de la tarea programada.
.PARAMETER AppPath
    La ruta al ejecutable de la aplicación para invocar la limpieza.
#>

param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("Register", "Unregister")]
    [string]$Action,

    [Parameter(Mandatory=$false)]
    [string]$TaskName = "Optimizador Limpieza Diaria",

    [Parameter(Mandatory=$false)]
    [string]$AppPath
)

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Este script requiere permisos de Administrador para gestionar Tareas Programadas."
    exit
}

if ($Action -eq "Register") {
    if ([string]::IsNullOrWhiteSpace($AppPath) -or -not (Test-Path $AppPath)) {
        Write-Error "La ruta especificada para la aplicación no es válida o no existe: $AppPath"
        exit
    }

    Write-Host "Registrando tarea programada: $TaskName" -ForegroundColor Cyan
    
    # Crear la acción para ejecutar la aplicación con el parámetro oculto/silencioso (ej: --silent-clean)
    $actionToRun = New-ScheduledTaskAction -Execute $AppPath -Argument "--silent-clean"
    
    # Crear un disparador (Trigger) para que se ejecute diariamente a una hora específica o al iniciar sesión
    $trigger = New-ScheduledTaskTrigger -Daily -At 10:00AM
    
    # Configurar opciones de la tarea
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    try {
        Register-ScheduledTask -Action $actionToRun -Trigger $trigger -TaskName $TaskName -Description "Limpieza automatizada diaria generada por Optimizador." -Settings $settings -RunLevel Highest -Force | Out-Null
        Write-Host "Tarea registrada exitosamente." -ForegroundColor Green
    } catch {
        Write-Host "Error al registrar la tarea: $($_.Exception.Message)" -ForegroundColor Red
    }
}
elseif ($Action -eq "Unregister") {
    Write-Host "Eliminando tarea programada: $TaskName" -ForegroundColor Yellow
    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop
        Write-Host "Tarea eliminada exitosamente." -ForegroundColor Green
    } catch {
        Write-Host "No se encontró la tarea o hubo un error al eliminarla: $($_.Exception.Message)" -ForegroundColor Red
    }
}

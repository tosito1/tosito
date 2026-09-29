<#
.SYNOPSIS
    Realiza una limpieza profunda de la memoria RAM.
.DESCRIPTION
    Utiliza la API de Windows EmptyWorkingSet para minimizar el uso de RAM de todos los procesos activos.
#>

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "La limpieza profunda de RAM requiere permisos de Administrador para procesar todos los procesos."
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "🚀 Iniciando Limpieza Profunda de RAM" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

$code = @"
using System;
using System.Runtime.InteropServices;
using System.Diagnostics;

public class MemoryCleaner {
    [DllImport("psapi.dll")]
    public static extern int EmptyWorkingSet(IntPtr hwProc);

    public static int CleanAll() {
        int count = 0;
        foreach (Process p in Process.GetProcesses()) {
            try {
                if (EmptyWorkingSet(p.Handle) != 0) {
                    count++;
                }
            } catch { }
        }
        return count;
    }
}
"@

Add-Type -TypeDefinition $code

Write-Host "Vaciando Working Sets de los procesos..." -ForegroundColor Yellow
$optimized = [MemoryCleaner]::CleanAll()

# Forzar recolección de basura propia
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Host "✅ Limpieza completada." -ForegroundColor Green
Write-Host "Procesos optimizados: $optimized" -ForegroundColor White
Write-Host "============================" -ForegroundColor Cyan

<#
.SYNOPSIS
    Compila la Consola de Administrador (Tosito Admin Center).
#>

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "👨‍💻 CONSTRUYENDO CONSOLA ADMIN PREMIUM 👨‍💻" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseDir = $PSScriptRoot
$adminProj = Join-Path $baseDir "OptimizadorAdmin\OptimizadorAdmin.csproj"

# 0. Detener procesos activos para poder sobreescribir
Write-Host "Cerrando instancias activas..." -ForegroundColor Gray
Stop-Process -Name "OptimizadorAdmin" -ErrorAction SilentlyContinue
Stop-Process -Name "Tosito_Admin_Center_V2" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1 # Pequeña pausa para asegurar liberación de archivos

# 1. Limpiar versiones anteriores en la carpeta Admin
# No queremos borrar bin si estamos en medio de algo, pero para un build limpio es mejor
# if (Test-Path "OptimizadorAdmin\bin") { Remove-Item "OptimizadorAdmin\bin" -Recurse -Force -ErrorAction SilentlyContinue }

# 2. Publicar la Consola de Administrador
Write-Host "1. Compilando Consola de Administrador (Tosito Admin)..." -ForegroundColor Magenta
# Publicamos como archivo único para que no necesite DLLs sueltas
dotnet publish $adminProj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o "$baseDir\Build_Admin"

if ($LASTEXITCODE -ne 0) { throw "Error al compilar la consola de administrador." }

# 3. Preparar el resultado final
$finalExe = Join-Path $baseDir "Build_Admin\OptimizadorAdmin.exe"
$outName = "Tosito_Admin_Center_V2.exe"
$destPath = Join-Path $baseDir $outName

if (Test-Path $destPath) { Remove-Item $destPath -Force }
Move-Item $finalExe $destPath -Force

# Copia al Escritorio para fácil acceso
$desktopPath = [Environment]::GetFolderPath("Desktop")
Copy-Item $destPath (Join-Path $desktopPath $outName) -Force

# Limpieza de carpeta temporal
Remove-Item "$baseDir\Build_Admin" -Recurse -Force

# Asegurarse que el instalador del cliente esté al lado si queremos enviarlo
# (El código del admin busca Instalar_Tosito_Optimizer_V2.exe para actualizar clientes)

Write-Host "`n✅ ÉXITO TOTAL ✅" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Consola de Administrador: " -NoNewline; Write-Host (Join-Path $baseDir $outName) -ForegroundColor Yellow
Write-Host "Este es el panel desde el que controlarás a todos tus clientes."
Write-Host "========================================" -ForegroundColor Cyan

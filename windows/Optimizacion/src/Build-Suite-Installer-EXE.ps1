<#
.SYNOPSIS
    Compila el Cliente y crea un Instalador EXE Profesional (Todo-en-Uno).
#>

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚧 CONSTRUYENDO INSTALADOR EXE PREMIUM 🚧" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseDir = $PSScriptRoot
$clientProj = Join-Path $baseDir "Optimizador\Optimizador.csproj"
$installerProj = Join-Path $baseDir "OptimizadorInstaller\OptimizadorInstaller.csproj"

# 0. Cerrar instancias para evitar errores de archivo en uso
Write-Host "Limpiando procesos activos..." -ForegroundColor Gray
Stop-Process -Name "Optimizador" -ErrorAction SilentlyContinue
Stop-Process -Name "OptimizadorInstaller" -ErrorAction SilentlyContinue
Stop-Process -Name "Instalar_Tosito_Optimizer_V2" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# 1. Limpiar versiones anteriores
Write-Host "1. Limpiando directorios temporales..." -ForegroundColor Gray
if (Test-Path "bin") { Remove-Item bin -Recurse -Force -ErrorAction SilentlyContinue }
if (Test-Path "OptimizadorInstaller\AppPayload.zip") { Remove-Item "OptimizadorInstaller\AppPayload.zip" -Force }

# 2. Publicar las aplicaciones (Cliente y Admin)
Write-Host "2. Compilando aplicaciones..." -ForegroundColor Magenta
$tempPack = Join-Path $baseDir "temp_pack"
if (Test-Path $tempPack) { Remove-Item $tempPack -Recurse -Force }
New-Item -ItemType Directory -Path "$tempPack\Client" | Out-Null
New-Item -ItemType Directory -Path "$tempPack\Admin" | Out-Null

Write-Host "  Compilando Cliente (Optimizador)..." -ForegroundColor Gray
dotnet publish $clientProj -c Release -r win-x64 --self-contained true -o "$tempPack\Client"

Write-Host "  Compilando Admin (OptimizadorAdmin)..." -ForegroundColor Gray
$adminProj = Join-Path $baseDir "OptimizadorAdmin\OptimizadorAdmin.csproj"
dotnet publish $adminProj -c Release -r win-x64 --self-contained true -o "$tempPack\Admin"

if ($LASTEXITCODE -ne 0) { throw "Error al compilar los proyectos." }

# Para distribución, NO empaquetamos pcid.txt ni pcpin.txt.
# De esta forma, la aplicación generará automáticamente un ID único (GUID)
# y un PIN de 6 dígitos único para cada ordenador la primera vez que se ejecute.

# 3. Comprimir las aplicaciones
Write-Host "3. Creando paquete de datos empaquetado (ZIP)..." -ForegroundColor Magenta
Add-Type -AssemblyName "System.IO.Compression.FileSystem"
$payloadZipPath = Join-Path $baseDir "OptimizadorInstaller\AppPayload.zip"
if (Test-Path $payloadZipPath) { Remove-Item $payloadZipPath -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempPack, $payloadZipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)

# 4. Compilar el Instalador Final
Write-Host "4. Generando INSTALADOR EXE (Professional Build)..." -ForegroundColor Magenta
# -p:PublishSingleFile=true permite que el instalador sea UN SOLO ARCHIVO
dotnet publish $installerProj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o "$baseDir\Final_Installer"

if ($LASTEXITCODE -ne 0) { throw "Error al compilar el instalador." }

# Limpieza final
Remove-Item $tempPack -Recurse -Force
# Movemos el resultado a la raíz para fácil acceso
$finalExe = Join-Path $baseDir "Final_Installer\OptimizadorInstaller.exe"
$outName = "Instalar_Tosito_Suite_V2_Privado.exe"
$destPath = Join-Path $baseDir $outName
Start-Sleep -Seconds 2
if (Test-Path $destPath) { Remove-Item $destPath -Force -ErrorAction SilentlyContinue }
Copy-Item $finalExe $destPath -Force
try {
    Start-Sleep -Seconds 1
    Remove-Item "$baseDir\Final_Installer" -Recurse -Force -ErrorAction SilentlyContinue
} catch {}

# Copia al Escritorio para fácil acceso
$desktopPath = [Environment]::GetFolderPath("Desktop")
Copy-Item $destPath (Join-Path $desktopPath $outName) -Force

Write-Host "`n✅ ÉXITO TOTAL ✅" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instalador Final: " -NoNewline; Write-Host (Join-Path $baseDir $outName) -ForegroundColor Yellow
Write-Host "Este es el único archivo que tienes que pasar a tus clientes."
Write-Host "========================================" -ForegroundColor Cyan

<#
.SYNOPSIS
    Compila y empaqueta ÚNICAMENTE el Cliente (Optimizador) en un instalador ligero.
#>

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Iniciando compilación y empaquetado CLIENTE LIGERO..." -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

$baseDir = $PSScriptRoot
Set-Location $baseDir

# Asegurar que no hay procesos bloqueando archivos (Aggressive Taskkill)
taskkill /F /IM "Optimizador.exe" /T 2>$null
taskkill /F /IM "cloudflared.exe" /T 2>$null
taskkill /F /IM "ssh.exe" /T 2>$null
Start-Sleep -Seconds 1

Write-Host "Limpiando compilaciones previas..."
if (Test-Path "bin") { Remove-Item -Recurse -Force "bin" -ErrorAction SilentlyContinue }

Write-Host "1. Publicando proyecto Cliente..."
Write-Host "Compilando Optimizador (Cliente)..." -ForegroundColor Magenta
dotnet publish -c Release -r win-x64 --self-contained true
if ($LASTEXITCODE -ne 0) {
    Write-Error "Fallo la compilación del Cliente."
    exit 1
}

$publishDirClient = Join-Path $baseDir "bin\Release\net7.0-windows\win-x64\publish"

$packDir = Join-Path $baseDir "TempPackDirClient"
$zipPath = Join-Path $baseDir "OptimizadorClient_Temp.zip"
$installerPath = Join-Path $baseDir "Instalador_Optimizador_Cliente.cmd"

if (Test-Path $packDir) { Remove-Item -Recurse -Force $packDir }
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
if (Test-Path $installerPath) { Remove-Item $installerPath -Force }

New-Item -ItemType Directory -Force -Path $packDir | Out-Null
New-Item -ItemType Directory -Force -Path "$packDir\Client" | Out-Null

Write-Host "2. Comprimiendo archivos (Usando .NET ZipFile)..."
Write-Host "  Copiando Cliente..." -ForegroundColor Gray
Copy-Item -Path "$publishDirClient\*" -Destination "$packDir\Client\" -Recurse -Force

# Para distribución, NO empaquetamos pcid.txt ni pcpin.txt.
# De esta forma, la aplicación generará automáticamente un ID único (GUID)
# y un PIN de 6 dígitos único para cada ordenador la primera vez que se ejecute.

# Cargar ensamblado de compresión
Add-Type -AssemblyName "System.IO.Compression.FileSystem"

try {
    [System.IO.Compression.ZipFile]::CreateFromDirectory($packDir, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
    Write-Host "  ZIP creado exitosamente"
}
catch {
    Write-Error "Error al crear ZIP: $($_.Exception.Message)"
    exit 1
}

Write-Host "3. Convirtiendo a Base64..."
$bytes = [IO.File]::ReadAllBytes($zipPath)
$base64 = [Convert]::ToBase64String($bytes)

Write-Host "4. Generando Instalador Final ($(($base64.Length / 1MB).ToString("F2")) MB de payload)..."

$installerScript = @"
<# :
@echo off
color 0B
echo ========================================
echo   Instalador Optimizador del Sistema (Cliente)
echo ========================================
echo.
NET SESSION >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Este instalador requiere permisos de Administrador.
    echo Pidiendo permisos...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

echo Preparando instalacion...
powershell -noprofile -executionpolicy bypass -Command "`$p='%~f0'; `$lines=Get-Content `$p; `$payloadMatch=`$lines | Select-String '^[ \t]*<PAYLOAD>[ \t]*$' | Select-Object -First 1; `$idx=if(`$payloadMatch){`$payloadMatch.LineNumber-1}else{`$lines.Count}; `$s=`$lines[0..(`$idx-1)] -join [char]10; `$inputArgs=`$p; Invoke-Expression `$s"
pause
exit /b
#>

`$ErrorActionPreference = "Stop"

Write-Host "Extrayendo archivos del Cliente (Total: $(($base64.Length / 1MB).ToString("F2")) MB)..." -ForegroundColor Yellow
`$scriptPath = `$inputArgs
if (!`$scriptPath) { `$scriptPath = `$MyInvocation.MyCommand.Path }

`$sb = New-Object System.Text.StringBuilder
`$inPayload = `$false

try {
    `$reader = [System.IO.File]::OpenText(`$scriptPath)
    while (!`$reader.EndOfStream) {
        `$line = `$reader.ReadLine()
        if (`$line -match '^[ \t]*<PAYLOAD>[ \t]*$') { `$inPayload = `$true; continue }
        if (`$line -match '^[ \t]*</PAYLOAD>[ \t]*$') { `$inPayload = `$false; break }
        
        if (`$inPayload) {
            `$cleaned = `$line -replace '[^A-Za-z0-9+/=]', ''
            [void]`$sb.Append(`$cleaned)
        }
    }
    `$reader.Close()
} catch {
    Write-Host "Error al leer el instalador: `$($_.Exception.Message)" -ForegroundColor Red
    pause; exit 1
}

`$base64Clean = `$sb.ToString()
if (`$base64Clean.Length -eq 0) {
    Write-Host "Error: No se encontraron datos para extraer." -ForegroundColor Red
    pause; exit 1
}

try {
    while (`$base64Clean.Length % 4 -ne 0) { `$base64Clean += "=" }
    
    `$bytes = [Convert]::FromBase64String(`$base64Clean)
    `$tempZip = Join-Path `$env:TEMP "Optimizador_Client_Install.zip"
    [IO.File]::WriteAllBytes(`$tempZip, `$bytes)
} catch {
    Write-Host "Error Crítico: Fallo en la decodificación Base64." -ForegroundColor Red
    Write-Host `$_.Exception.Message
    pause; exit 1
}

`$installDir = "`$env:ProgramFiles\Optimizador"
`$oldInstallPath = "`$env:ProgramFiles\TositoOptimizer"

Write-Host "Verificando instalacion previa..." -ForegroundColor Cyan
if (Test-Path `$installDir -or Test-Path `$oldInstallPath) {
    `$choice = Read-Host "¿Deseas desinstalar la versión anterior antes de continuar? (S/N)"
    if (`$choice -eq 'S' -or `$choice -eq 's') {
        Write-Host "Desinstalando versión anterior..." -ForegroundColor Yellow
        taskkill /f /t /im "Optimizador.exe" 2>$null
        taskkill /f /t /im "cloudflared.exe" 2>$null
        taskkill /f /t /im "ssh.exe" 2>$null
        Stop-Process -Name "Optimizador" -Force -ErrorAction SilentlyContinue
        Stop-Process -Name "cloudflared" -Force -ErrorAction SilentlyContinue
        Stop-Process -Name "ssh" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        if (Test-Path `$installDir) { Remove-Item -Recurse -Force `$installDir -ErrorAction SilentlyContinue }
        if (Test-Path `$oldInstallPath) { Remove-Item -Recurse -Force `$oldInstallPath -ErrorAction SilentlyContinue }
        Write-Host "Desinstalación completada." -ForegroundColor Green
    }
}

if (!(Test-Path `$installDir)) {
    New-Item -ItemType Directory -Force -Path `$installDir | Out-Null
}

Write-Host "Descomprimiendo..."
Expand-Archive -Path `$tempZip -DestinationPath `$installDir -Force

Remove-Item `$tempZip -Force

Write-Host "Creando accesos directos..."
`$wshShell = New-Object -ComObject WScript.Shell
`$desktopPath = [Environment]::GetFolderPath("Desktop")
`$startMenu = [Environment]::GetFolderPath("CommonPrograms")

# --- Accesos Directos Cliente ---
`$shortcut = `$wshShell.CreateShortcut("`$desktopPath\Optimizador de Sistema V2.lnk")
`$shortcut.TargetPath = "`$installDir\Client\Optimizador.exe"
`$shortcut.WorkingDirectory = "`$installDir\Client"
`$shortcut.IconLocation = "`$installDir\Client\Optimizador.exe"
`$shortcut.Save()

`$shortcutSm = `$wshShell.CreateShortcut("`$startMenu\Optimizador de Sistema V2.lnk")
`$shortcutSm.TargetPath = "`$installDir\Client\Optimizador.exe"
`$shortcutSm.WorkingDirectory = "`$installDir\Client"
`$shortcutSm.IconLocation = "`$installDir\Client\Optimizador.exe"
`$shortcutSm.Save()

# --- Auto-inicio ---
`$runKey = "Software\Microsoft\Windows\CurrentVersion\Run"
`$clientExe = "`$installDir\Client\Optimizador.exe"
Set-ItemProperty -Path "HKCU:\`$runKey" -Name "OptimizadorTosito" -Value "`"`$clientExe`""

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instalacion Completada Exitosamente!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ya puedes abrir el programa desde tu Escritorio."
exit 0
"@

# Write Top Script
$utf8NoBOM = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($installerPath, $installerScript, $utf8NoBOM)
[System.IO.File]::AppendAllText($installerPath, "`r`n<PAYLOAD>`r`n", $utf8NoBOM)
[System.IO.File]::AppendAllText($installerPath, $base64, $utf8NoBOM)
[System.IO.File]::AppendAllText($installerPath, "`r`n</PAYLOAD>`r`n", $utf8NoBOM)

if (Test-Path $packDir) { Remove-Item -Recurse -Force $packDir }
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Write-Host "Hecho! Instalador generado en: $installerPath" -ForegroundColor Green

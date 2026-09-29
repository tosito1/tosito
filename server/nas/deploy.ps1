param (
    [string]$ServerIP = "192.168.1.134",
    [string]$Username = "tosito"
)

Write-Host "Iniciando despliegue de la aplicacin NAS en $ServerIP..." -ForegroundColor Cyan

$TempDir = "$env:TEMP\nas_temp_deploy"
if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }
New-Item -ItemType Directory -Path $TempDir | Out-Null

Write-Host "Preparando archivos para despliegue..." -ForegroundColor Yellow

# Copiar todo excepto node_modules, .next y .git
Copy-Item -Path .\* -Destination $TempDir -Recurse -Exclude "node_modules", ".next", ".git"
if (Test-Path ".\.env.local") {
    Copy-Item -Path ".\.env.local" -Destination $TempDir
}
if (Test-Path ".\.gitignore") {
    Copy-Item -Path ".\.gitignore" -Destination $TempDir
}

Write-Host "Enviando archivos al servidor..." -ForegroundColor Yellow
Write-Host "Por favor introduce la contrasea de $Username en $ServerIP cuando se te solicite (es posible que lo pida varias veces, o usar tu clave SSH)." -ForegroundColor Cyan

# Asegurarse de que la carpeta de destino existe y crear backup por si acaso
ssh "${Username}@${ServerIP}" "mkdir -p /home/$Username/nas_app && echo 'Creando backup de seguridad...' && cp -r /home/$Username/nas_app /home/$Username/nas_app_backup_`$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"

# Copiar el contenido al servidor
scp -r "$TempDir\*" "${Username}@${ServerIP}:/home/$Username/nas_app/"
# Scp oculta archivos ocultos si se usa *, mejor enviar los ocultos explcitamente o subir la carpeta
scp "$TempDir\.env.local" "${Username}@${ServerIP}:/home/$Username/nas_app/" 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Precaucin durante la copia al servidor. Comprueba si hubo errores." -ForegroundColor Yellow
}

# 3. Conectar por SSH y ejecutar comandos de inicio
Write-Host "Instalando dependencias, construyendo el proyecto y reiniciando el servicio en el servidor..." -ForegroundColor Yellow
$SSHCommand = @"
    cd /home/$Username/nas_app &&
    npm install &&
    npm run build &&
    pm2 restart nas-app 2>/dev/null || pm2 start npm --name nas-app -- start &&
    pm2 save
"@

ssh "${Username}@${ServerIP}" $SSHCommand

Write-Host "Despliegue finalizado. La aplicacin debera estar corriendo." -ForegroundColor Green

param (
    [string]$ServerIP = "192.168.1.134",
    [string]$Username = "tosito"
)

Write-Host "Iniciando despliegue de Monitoring Dashboard en $ServerIP..." -ForegroundColor Cyan

$TempDir = "$env:TEMP\monitoring_temp_deploy"
if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }
New-Item -ItemType Directory -Path $TempDir | Out-Null

Write-Host "Preparando archivos para despliegue..." -ForegroundColor Yellow

Copy-Item -Path .\server -Destination $TempDir -Recurse
New-Item -ItemType Directory -Path "$TempDir\client" | Out-Null
Copy-Item -Path .\client\dist -Destination "$TempDir\client" -Recurse

# Eliminar node_modules local para no enviarlo pesado
$NodeModulesPath = "$TempDir\server\node_modules"
if (Test-Path $NodeModulesPath) { Remove-Item -Recurse -Force $NodeModulesPath }

Write-Host "Enviando archivos al servidor..." -ForegroundColor Yellow
Write-Host "Por favor introduce la contrasea de $Username en $ServerIP cuando se te solicite (es posible que lo pida varias veces)." -ForegroundColor Cyan

# Asegurarse de que la carpeta de destino existe
ssh "${Username}@${ServerIP}" "mkdir -p /home/$Username/monitoring_app"

# Copiar el contenido al servidor
scp -r "$TempDir\server" "${Username}@${ServerIP}:/home/$Username/monitoring_app/"
scp -r "$TempDir\client" "${Username}@${ServerIP}:/home/$Username/monitoring_app/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al copiar los archivos al servidor." -ForegroundColor Red
    exit
}

# 3. Conectar por SSH y ejecutar comandos de inicio
Write-Host "Instalando dependencias y reiniciando el servicio en el servidor..." -ForegroundColor Yellow
$SSHCommand = @"
    cd /home/$Username/monitoring_app/server &&
    npm install --production &&
    pm2 restart monitoring-dashboard 2>/dev/null || pm2 start index.js --name monitoring-dashboard &&
    pm2 save
"@

ssh "${Username}@${ServerIP}" $SSHCommand

Write-Host "Despliegue finalizado. Puedes acceder al dashboard en http://$ServerIP:4000" -ForegroundColor Green

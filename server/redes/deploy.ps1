param (
    [string]$ServerIP = "192.168.1.134",
    [string]$Username = "tosito"
)

Write-Host "Iniciando despliegue en $ServerIP..." -ForegroundColor Cyan

# 1. Comprimir el proyecto (excluyendo node_modules y .git)
$ZipPath = "$env:TEMP\nexus_app.zip"
if (Test-Path $ZipPath) { Remove-Item $ZipPath }

Write-Host "Comprimiendo archivos..." -ForegroundColor Yellow
# Usamos Compress-Archive pero como no tiene soporte nativo fácil de exclusión, copiamos a temp
$TempDir = "$env:TEMP\nexus_temp_deploy"
if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }
New-Item -ItemType Directory -Path $TempDir | Out-Null

Copy-Item -Path .\backend -Destination $TempDir -Recurse
Copy-Item -Path .\frontend -Destination $TempDir -Recurse
Copy-Item -Path .\server_setup.sh -Destination $TempDir

# Eliminar archivos que no queremos sobreescribir en el servidor (Base de datos y contraseñas)
$NodeModulesPath = "$TempDir\backend\node_modules"
if (Test-Path $NodeModulesPath) { Remove-Item -Recurse -Force $NodeModulesPath }

$DbPath = "$TempDir\backend\network.db"
if (Test-Path $DbPath) { Remove-Item -Force $DbPath }

$PassPath = "$TempDir\backend\password"
if (Test-Path $PassPath) { Remove-Item -Force $PassPath }

# En lugar de comprimir en ZIP (que da problemas con las barras invertidas en Linux), enviamos la carpeta directamente
Write-Host "Enviando archivos al servidor..." -ForegroundColor Yellow
Write-Host "Por favor introduce la contraseña de $Username en $ServerIP cuando se te solicite." -ForegroundColor Cyan

# Asegurarse de que la carpeta de destino existe
ssh "${Username}@${ServerIP}" "mkdir -p /home/$Username/nexus && echo 'Creando backup de seguridad...' && cp -r /home/$Username/nexus /home/$Username/nexus_backup_`$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"

# Copiar el contenido al servidor
scp -r "$TempDir\backend" "${Username}@${ServerIP}:/home/$Username/nexus/"
scp -r "$TempDir\frontend" "${Username}@${ServerIP}:/home/$Username/nexus/"
scp "$TempDir\server_setup.sh" "${Username}@${ServerIP}:/home/$Username/nexus/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al copiar los archivos al servidor." -ForegroundColor Red
    exit
}

# 3. Conectar por SSH y ejecutar setup
Write-Host "Ejecutando actualización en el servidor..." -ForegroundColor Yellow
$SSHCommand = "
    cd /home/$Username/nexus/backend &&
    npm install --production &&
    pm2 restart nexus || pm2 start server.js --name nexus
"

ssh "${Username}@${ServerIP}" $SSHCommand

Write-Host "Despliegue finalizado." -ForegroundColor Green

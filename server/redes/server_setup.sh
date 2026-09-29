#!/bin/bash
# Script de instalación para Servidor Linux (Ubuntu/Debian)

USER_HOME=$1
APP_DIR="/home/$USER_HOME/nexus_app/backend"

echo "[Nexus Setup] Iniciando configuración en el servidor..."

# 1. Instalar dependencias base
echo "[Nexus Setup] Actualizando paquetes..."
sudo apt-get update -y
sudo apt-get install -y curl unzip iptables git

# 2. Instalar Node.js si no existe
if ! command -v node &> /dev/null
then
    echo "[Nexus Setup] Instalando Node.js (v20)..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "[Nexus Setup] Node.js ya está instalado: $(node -v)"
fi

# 3. Instalar PM2 para gestión de procesos
if ! command -v pm2 &> /dev/null
then
    echo "[Nexus Setup] Instalando PM2..."
    sudo npm install -g pm2
fi

# 4. Instalar Tailscale para acceso total remoto
if ! command -v tailscale &> /dev/null
then
    echo "[Nexus Setup] Instalando Tailscale..."
    curl -fsSL https://tailscale.com/install.sh | sh
    echo "[Nexus Setup] Iniciando Tailscale. Se requerirá autenticación."
    sudo tailscale up
else
    echo "[Nexus Setup] Tailscale ya está instalado. IP: $(tailscale ip -4)"
fi

# 5. Configurar la App
echo "[Nexus Setup] Instalando dependencias de la aplicación..."
cd $APP_DIR
sudo -u $USER_HOME npm install --production

# 6. Iniciar la App con PM2
echo "[Nexus Setup] Reiniciando aplicación con PM2..."
sudo -u $USER_HOME pm2 stop nexus-controller || true
sudo -u $USER_HOME pm2 start server.js --name nexus-controller
sudo -u $USER_HOME pm2 save

# Configurar pm2 para arrancar con el sistema
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER_HOME --hp /home/$USER_HOME

echo "[Nexus Setup] ¡Instalación completada!"
echo "Puedes acceder al panel en http://192.168.1.134:3000"
echo "Y si has configurado Tailscale, podrás acceder desde cualquier lugar con la IP de Tailscale de este servidor."

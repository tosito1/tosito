@echo off
chcp 65001 >nul
title Control de Pantalla - Configuración ADB

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║        CONTROL DE PANTALLA - Setup ADB           ║
echo  ║   Configura el PIN automático por hora actual    ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: ── VERIFICAR ADB ─────────────────────────────────────
where adb >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] ADB no encontrado en el PATH.
    echo.
    echo  Opciones:
    echo    1. Abre Android Studio y usa su terminal ^(ya tiene ADB^)
    echo    2. Añade platform-tools al PATH de Windows:
    echo       C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools
    echo.
    pause
    exit /b 1
)

:: ── VERIFICAR DISPOSITIVO CONECTADO ──────────────────
echo  [1/3] Buscando dispositivo conectado...
adb devices | findstr /r "device$" >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] No se encontró ningún dispositivo ADB.
    echo.
    echo  Comprueba que:
    echo    - El USB está conectado
    echo    - La depuración USB está activada
    echo    - Aceptaste el diálogo de "Permitir depuración USB" en el móvil
    echo.
    pause
    exit /b 1
)
echo  [OK] Dispositivo encontrado.
echo.

:: ── ESTABLECER DEVICE OWNER ──────────────────────────
echo  [2/3] Estableciendo Device Owner...
echo.
echo  IMPORTANTE: Antes de continuar, asegúrate de que
echo  el dispositivo NO tiene cuentas de Google añadidas.
echo  (Ajustes -^> Cuentas -^> elimina las cuentas de Google)
echo  Podrás volver a añadirlas después.
echo.
set /p confirm="¿Has eliminado las cuentas de Google? (s/n): "
if /i "%confirm%" neq "s" (
    echo.
    echo  Cancela, elimina las cuentas de Google y vuelve a ejecutar este script.
    pause
    exit /b 0
)

echo.
adb shell dpm set-device-owner com.toust.toust/.ScreenLockAdminReceiver
if %errorlevel% equ 0 (
    echo.
    echo  ✅ Device Owner establecido correctamente.
) else (
    echo.
    echo  [ERROR] No se pudo establecer Device Owner.
    echo.
    echo  Posibles causas:
    echo    - La app no está instalada. Instálala primero desde Android Studio.
    echo    - Aún hay cuentas de Google en el dispositivo.
    echo    - Ya hay otro Device Owner establecido ^(ejecuta: adb shell dpm remove-active-admin^)
    pause
    exit /b 1
)

:: ── CAMBIAR EL PIN AHORA ─────────────────────────────
echo.
echo  [3/3] Cambiando el PIN a la hora actual...
for /f "tokens=1-2 delims=:" %%a in ("%time%") do (
    set HH=%%a
    set MM=%%b
)
:: Eliminar espacios en la hora (hora de 1 dígito tiene espacio al inicio)
set HH=%HH: =0%
set MM=%MM: =0%
set PIN=%HH%%MM%
echo  PIN calculado: %PIN%
echo.
adb shell locksettings set-pin %PIN%
if %errorlevel% equ 0 (
    echo  ✅ PIN cambiado a %PIN%
) else (
    echo  [INFO] No se pudo cambiar via locksettings, la app lo hará automáticamente.
)

echo.
echo  ════════════════════════════════════════════════════
echo  ✅ Configuración completada.
echo.
echo  Ahora:
echo    1. Abre la app "Control de Pantalla" en el móvil
echo    2. Pulsa "Activar cambio automático de PIN"
echo    3. El PIN cambiará cada minuto y al encender pantalla
echo.
echo  Puedes volver a añadir las cuentas de Google en el móvil.
echo  ════════════════════════════════════════════════════
echo.
pause

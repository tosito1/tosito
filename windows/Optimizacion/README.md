# Tosito Remote PC & Optimizer Suite 🚀

Una suite profesional e integral de optimización y control remoto para Windows, acompañada de una aplicación móvil nativa (Android) y un cliente web interactivo (Firebase) que permiten administrar, limpiar y controlar el PC a distancia con latencia ultra-baja.

---

## 🛠️ Componentes de la Suite

El proyecto está compuesto por tres subsistemas principales:

### 1. Servidor y Suite de Windows (`src/`)
Desarrollado en **C# y WPF (.NET 7)**. Ofrece dos herramientas y un instalador:
*   **Optimizador (Cliente):** La aplicación que reside en el equipo del usuario. Realiza tareas de limpieza profunda (archivos temporales, caché de navegadores, optimización de RAM, debloating, DNS, optimización de red) e inicia un servidor local WebSocket (`MobileWebServer` en puerto `54321`) que expone de forma segura la interfaz de control mediante túneles (Cloudflare Tunnel). Genera un código PIN único de 6 dígitos para la vinculación rápida.
*   **OptimizadorAdmin:** Consola de administración centralizada que permite monitorear y dar soporte a múltiples equipos en red mediante TCP.
*   **OptimizadorInstaller:** Aplicación instaladora que empaqueta la suite en un único ejecutable independiente, encargándose de copiar los archivos a `C:\Program Files\Optimizador`, configurar el auto-arranque con Windows y crear accesos directos.

### 2. Aplicación Móvil Android (`remotepc/`)
Desarrollada en **Kotlin y Jetpack Compose**. Se conecta directamente al PC para ofrecer:
*   **Trackpad Remoto:** Control táctil preciso del puntero con gestos de click, doble click, arrastre y scroll.
*   **Teclado Remoto:** Envío de texto directo al PC.
*   **Acciones de Energía:** Apagar, reiniciar, suspender, bloquear y apagar pantalla a distancia.
*   **Optimización en un Click:** Liberar memoria RAM, limpieza express y de caché, arranque de Game Booster y Debloater.
*   **Control Multimedia:** Control total de reproducción y volumen.
*   **Transmisión de Audio:** Reproduce el sonido del PC en tiempo real en los altavoces de tu móvil.
*   **Seguridad:** Vinculación mediante Google Sign-In, base de datos Firestore y autenticación Firebase ID Token con PIN de respaldo.

### 3. Cliente Web Remote (`web-remote/`)
Una interfaz web interactiva de alto rendimiento construida con HTML5, CSS moderno y JavaScript vanilla, preparada para desplegarse en **Firebase Hosting**:
*   **Streaming de Pantalla:** Visualización de la pantalla del PC en tiempo real (`/stream` MJPEG) a través de túneles web seguros.
*   **Trackpad Virtual Web:** Control del mouse y clicks.
*   **Consola de Atajos:** Teclas rápidas como Enter, Borrar, Inicio, Esc.
*   **Monitoreo en Tiempo Real:** Gráficas o indicadores de uso de CPU y RAM del PC controlado.

---

## 📋 Requisitos de Sistema

### Para Windows (Servidor/Suite):
*   Windows 10 o Windows 11.
*   **.NET 7.0 SDK** (o superior) instalado en el sistema de desarrollo.
*   Permisos de Administrador (requerido para tareas de optimización de sistema y creación de túneles).

### Para Android:
*   Android Studio (Ladybug o superior recomendado).
*   **JDK 17** configurado en el entorno de desarrollo de Gradle.
*   Dispositivo físico o emulador con Android 8.0 o superior.

### Para el Cliente Web / Firebase:
*   **Node.js** (versión 16 o superior) y npm.
*   Firebase CLI instalado (`npm install -g firebase-tools`).

---

## 🚀 Guía de Compilación y Lanzamiento

### 1. Compilar y Ejecutar en Windows (WPF)

Desde la raíz del repositorio, ejecuta los siguientes comandos en PowerShell:

*   **Ejecutar el Optimizador en modo desarrollo:**
    ```powershell
    dotnet run --project src/Optimizador/Optimizador.csproj
    ```
*   **Ejecutar la Consola de Administración:**
    ```powershell
    dotnet run --project src/OptimizadorAdmin/OptimizadorAdmin.csproj
    ```

#### Generar el Instalador Standalone (.exe todo en uno)
El proyecto incluye scripts PowerShell automatizados en `src/` que compilan la suite completa de forma óptima en un único instalador profesional autodescomprimible:

*   **Crear el Instalador de la Suite Completa (Cliente + Admin):**
    ```powershell
    powershell.exe -ExecutionPolicy Bypass -File src/Build-Suite-Installer-EXE.ps1
    ```
    *Este script compila los proyectos en modo Release, empaqueta los binarios en un ZIP cifrado/embebido y compila el instalador final, guardando el archivo ejecutable resultante `Instalar_Tosito_Suite_V2_Privado.exe` en la raíz de `src/` y en el Escritorio.*

*   **Crear el Instalador Único del Cliente:**
    ```powershell
    powershell.exe -ExecutionPolicy Bypass -File src/Build-Client-Installer-EXE.ps1
    ```

---

### 2. Compilar la Aplicación Móvil Android

1.  Abre la carpeta `remotepc/` en **Android Studio**.
2.  Asegúrate de que el archivo `local.properties` apunte correctamente al SDK de tu sistema (se genera automáticamente).
3.  Configura Firebase en el proyecto de Android añadiendo tu archivo `google-services.json` en la carpeta `remotepc/app/`.
4.  Realiza un Gradle Sync.
5.  Para compilar y generar la APK:
    *   En Android Studio ve a **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
    *   O desde la terminal en `remotepc/`:
        ```bash
        ./gradlew assembleDebug
        ```
    *   La APK generada estará disponible en: `remotepc/app/build/outputs/apk/debug/app-debug.apk`.

---

### 3. Ejecutar y Desplegar el Web Remote (Firebase)

1.  Navega a la carpeta `web-remote/`:
    ```bash
    cd web-remote
    ```
2.  Configura el CLI de Firebase iniciando sesión:
    ```bash
    firebase login
    ```
3.  Asocia tu proyecto de Firebase activo (por defecto configurado como `tosito-7f923`):
    ```bash
    firebase use --add
    ```
4.  Prueba el servidor web de forma local:
    ```bash
    firebase serve
    ```
5.  Despliega la web de forma global a Firebase Hosting:
    ```bash
    firebase deploy
    ```

---

## 🔒 Flujo de Vinculación y Seguridad

1.  **Inicio en PC:** Al abrir el **Optimizador**, se generará un código PIN dinámico de 6 dígitos en la interfaz. El servidor local HTTP/WebSocket se levantará automáticamente y establecerá el túnel Cloudflare seguro.
2.  **Vinculación:**
    *   **Método PIN (Rápido):** Abre la app móvil o el Cliente Web e ingresa el código PIN de 6 dígitos que se visualiza en la pantalla del PC.
    *   **Método Firebase (Persistente):** Si inicias sesión con tu cuenta de Google en la app móvil, el PC se enlazará a tu UID único en la base de datos Firestore, permitiendo reconexiones instantáneas y automáticas en el futuro sin necesidad de volver a introducir el PIN.
3.  **Control:** Una vez autenticado, el canal WebSocket bidireccional quedará abierto para transmitir coordenadas de mouse, pulsaciones de teclas y órdenes de sistema en milisegundos de forma totalmente cifrada.

---

## 📂 Estructura del Repositorio

```
├── remotepc/                  # Código fuente de la app nativa Android (Kotlin/Compose)
│   ├── app/                   # Aplicación móvil principal
│   └── gradle/                # Configuración de Gradle Wrapper
├── src/                       # Código fuente de las aplicaciones Windows (.NET 7 WPF)
│   ├── Optimizador/           # Servidor local, servicios de túneles y optimizador principal
│   ├── OptimizadorAdmin/      # Panel de administración remota para técnicos
│   ├── OptimizadorInstaller/  # UI del instalador y lógica de descompresión
│   ├── Build-Admin.ps1        # Script para compilar el administrador
│   ├── Build-Client-Installer-EXE.ps1  # Script para compilar instalador cliente
│   └── Build-Suite-Installer-EXE.ps1   # Script para compilar instalador suite
├── web-remote/                # Código fuente del cliente remoto web (HTML/JS/Firebase)
│   ├── public/                # Sitio web estático y archivos públicos
│   └── firebase.json          # Configuración de Firebase Hosting
├── .gitignore                 # Configuración de exclusiones de Git
└── README.md                  # Documentación principal del repositorio (esta guía)
```

---

## 📝 Notas de Licencia y Desarrollo

*   Todas las operaciones de limpieza destructivas o de apagado de sistema solicitan confirmación previa al usuario o están protegidas por elevados privilegios de Windows.
*   El código no almacena credenciales locales. Las configuraciones de autorización se guardan localmente encriptadas en `%LocalAppData%\TositoOptimizer`.
*   Para soporte o contribuciones, contactar con el administrador del repositorio en GitHub.

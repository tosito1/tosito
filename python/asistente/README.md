# Asistente Inteligente de Correo Pro (V2) 🤖📧

Un asistente personal avanzado con interfaz web, memoria semántica y capacidades de voz, diseñado para revolucionar cómo gestionas tu bandeja de entrada.

## Características de la Versión 2

*   **🌐 Interfaz Web Moderna:** Basada en **Streamlit** para una experiencia visual fluida y profesional.
*   **🎙️ Interfaz de Voz Completa:** 
    *   **Lectura IA (TTS):** El asistente te lee los resúmenes de tus correos.
    *   **Dictado (STT):** Dicta tus instrucciones o respuestas directamente usando el micrófono.
*   **🧠 Memoria a Largo Plazo:** Base de datos vectorial local (**ChromaDB**) que permite buscar y preguntar sobre tu historial de correos usando lenguaje natural.
*   **🕵️ Modo Auto-Reply (Vigilante):** Define reglas inteligentes para que el asistente responda automáticamente correos específicos en segundo plano.
*   **🧵 Contexto de Hilos:** La IA entiende la conversación completa, no solo el último mensaje, para dar respuestas mucho más precisas.

## Requisitos y Configuración

1. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configurar variables de entorno:**
   * Asegúrate de tener un archivo `.env` con tus credenciales:
     * `EMAIL_USER` y `EMAIL_APP_PASSWORD` (App Password para Gmail).
     * `GEMINI_API_KEY` (de [Google AI Studio](https://aistudio.google.com/)).

## Uso

Para lanzar la interfaz web, ejecuta el siguiente comando:

```bash
streamlit run app.py
```

Esto abrirá automáticamente una pestaña en tu navegador con el asistente listo para trabajar.

---
*Nota: Para mantener la privacidad, el historial de correos y la base de datos se almacenan localmente en la carpeta `chroma_db`.*


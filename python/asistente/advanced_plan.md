# Advanced Capabilities Plan for Intelligent Email Assistant

## Goal Description
El usuario desea "mejorar muchísimo la aplicación". Actualmente, la aplicación tiene funcionalidades sólidas: lectura de IMAP, envío de SMTP, categorización con Gemini, resumen de correos y redacción de respuestas interactivas en la terminal.

Para llevar la aplicación al siguiente nivel, debemos agregar características que realmente la conviertan de un "lector inteligente" a un "asistente personal proactivo".

## Proposed Advanced Features

### 1. Auto-Reply Mode (Agente Autónomo)
Permitir que el asistente maneje cieros correos de forma completamente automática y en segundo plano.
- **Descripción:** El usuario puede configurar el asistente en un modo "Vigilante". El asistente revisa correos cada X minutos. Si detecta un correo con cierta categoría (ej. "FAQ", "Invitación a Reunión"), utiliza el LLM para generar una respuesta automática basada en un contexto base proveído por el usuario (ej. su calendario, o respuestas predefinidas).
- **Archivos afectados:** `email_client.py`, `ai_engine.py`, `main.py`
- **Requerimientos:** `schedule` o loop de tiempo para revisar en background.

### 2. Búsqueda Semántica de Correos (Memoria a Largo Plazo)
Permitir al usuario buscar información en sus correos usando lenguaje natural ("¿Qué me dijo Carlos sobre el proyecto X la semana pasada?").
- **Descripción:** Descargar un histórico relevante de correos, pasarlos por un modelo de Embeddings (disponible en Google GenAI) y almacenarlos localmente en una base de datos vectorial liviana (ej. ChromaDB o FAISS). Cuando el usuario pregunte, el asistente busca los correos más relevantes y usa el LLM para responder la pregunta usando ese contexto.
- **Archivos afectados:** `[NEW] vector_db.py`, `email_client.py` (para descargar batch de correos), `ai_engine.py` (integración con embeddings), `main.py`
- **Requerimientos:** `chromadb` o `faiss-cpu`, capacidad de generar Embeddings con Gemini.

### 3. Síntesis y Reconocimiento de Voz (Voice Interface)
Hacer que el asistente hable y escuche al usuario, reduciendo la necesidad de usar el teclado.
- **Descripción:** Añadir Text-to-Speech (TTS) para que el asistente "lea" los correos o los resúmenes en voz alta. Añadir Speech-to-Text (STT) para que el usuario pueda dictar las instrucciones de cómo responder o redactar correos.
- **Archivos afectados:** `[NEW] voice_engine.py`, `main.py`
- **Requerimientos:** `gTTS` o `pyttsx3` para hablar. `SpeechRecognition` y `pyaudio` para escuchar, o delegarlo a la API de Whisper de OpenAI/Gemini Audio.

### 4. Soporte para Hilos de Correo Completos (Contexto)
Mejorar la redacción y resumen dándole todo el contexto de una conversación (Thread), no solo el último mensaje.
- **Descripción:** Actualizar las funciones de `imap_tools` para recuperar el hilo completo usando `In-Reply-To` / `References` headers, agruparlos cronológicamente y pasarle el hilo entero a `ai_engine` para que genere resúmenes mucho más informativos o respuestas más acordes.
- **Archivos afectados:** `email_client.py`

## User Review Required
> [!IMPORTANT]
> - ¿Qué priorizamos? ¿Damos el salto al "Auto-Reply Inteligente", conectamos voz para hablar con el asistente, o le damos "Memoria" (Búsqueda semántica) para que recuerde todos tus correos antiguos?
> - Implementar "Memoria" con Base de Datos Vectorial o "Interfaz de Voz" requerirá instalar librerías adicionales pesadas.

## Verification Plan
### Manual Verification
1. Seleccionar la ruta a seguir con el usuario.
2. Actualizar las dependencias.
3. Probar la nueva característica de manera aislada antes de integrarla en el menú principal.

import os
import warnings

# Suprimimos las advertencias inofensivas de "FutureWarning" de librerías de terceros (como huggingface_hub)
# para mantener la consola limpia.
warnings.filterwarnings("ignore", category=FutureWarning)

# Aceptamos automáticamente los términos de la licencia de Coqui TTS para evitar que la app se bloquee en consola
os.environ["COQUI_TOS_AGREED"] = "1" 

# Suprimimos la advertencia de enlaces simbólicos (symlinks) en Windows para Hugging Face
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

import queue
import threading
import time
import io
import speech_recognition as sr
import numpy as np
import torch
import torchaudio # Importamos torchaudio para solucionar el error del codec
import soundfile as sf
from faster_whisper import WhisperModel
from transformers import MarianMTModel, MarianTokenizer
import pygame
import customtkinter as ctk
from tkinter import filedialog

# ==========================================
# PARCHES PARA PYTORCH 2.6+ Y COQUI TTS
# ==========================================
# 1. Parche DEFINITIVO para lectura de audios (Reemplazo total de torchaudio)
# torchaudio 2.6 fuerza el uso de torchcodec a nivel interno de C++. 
# Para evitar instalar más cosas, engañamos a la librería reemplazando sus funciones principales
# con nuestras propias versiones puras de Python usando 'soundfile'.
def _custom_torchaudio_load(filepath, *args, **kwargs):
    data, samplerate = sf.read(filepath, dtype='float32')
    # torchaudio espera que el formato sea (canales, frames)
    if data.ndim == 1:
        data = data.reshape(1, -1) 
    else:
        data = data.T
    return torch.from_numpy(data), samplerate

def _custom_torchaudio_info(filepath, *args, **kwargs):
    info_sf = sf.info(filepath)
    class AudioMetaData:
        sample_rate = info_sf.samplerate
        num_frames = info_sf.frames
        num_channels = info_sf.channels
    return AudioMetaData()

# Inyectamos nuestras funciones antes de importar Coqui TTS
torchaudio.load = _custom_torchaudio_load
torchaudio.info = _custom_torchaudio_info

# 2. Parche para carga de modelos (Evita el error de weights_only)
# Coqui TTS usa torch.load internamente sin especificar weights_only=False.
# Este parche intercepta torch.load y fuerza weights_only=False por defecto
_original_load = torch.load
def _patched_load(*args, **kwargs):
    if 'weights_only' not in kwargs:
        kwargs['weights_only'] = False
    return _original_load(*args, **kwargs)
torch.load = _patched_load
# ==========================================

# Importamos TTS DESPUÉS de aplicar los parches
from TTS.api import TTS

# ==========================================
# MÓDULO 1: CAPTURA DE AUDIO Y STT
# ==========================================
class AudioCaptureSTT:
    def __init__(self, output_queue, ui_queue, language="es"):
        self.output_queue = output_queue
        self.ui_queue = ui_queue
        self.language = language
        self.recognizer = sr.Recognizer()
        
        # MEJORA: Aumentamos el umbral de pausa a 1.5s. 
        # Así no corta tus frases por la mitad si tomas aire, mejorando drásticamente la traducción.
        self.recognizer.pause_threshold = 1.5  
        self.recognizer.non_speaking_duration = 0.5
        
        self.is_running = False
        self.stop_listening = None
        
        self.ui_queue.put(("status", "⚙️ Cargando modelo Whisper (STT) 'large-v3'... (Tardará la 1ra vez)"))
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # MEJORA: Cambiamos al modelo absoluto "large-v3". Es el más inteligente de todos.
        # Entiende el español con precisión casi perfecta, ignorando ruido de fondo.
        self.model = WhisperModel("large-v3", device=self.device, compute_type="float16" if self.device == "cuda" else "int8")

    def start(self):
        if self.is_running: return
        self.is_running = True
        
        self.ui_queue.put(("status", "🎙️ Calibrando micrófono (espera 2s)..."))
        with sr.Microphone() as source:
            self.recognizer.adjust_for_ambient_noise(source, duration=2)
            
        self.ui_queue.put(("status", "✅ Escuchando... ¡Puedes hablar!"))
        
        self.stop_listening = self.recognizer.listen_in_background(
            sr.Microphone(),
            self.audio_callback,
            phrase_time_limit=15 # Aumentamos el límite de frase por si hablas mucho de corrido
        )

    def audio_callback(self, recognizer, audio):
        try:
            raw_data = audio.get_raw_data(convert_rate=16000, convert_width=2)
            audio_np = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32) / 32768.0
            
            # MEJORA: Configuraciones avanzadas para evitar que escuche mal el español
            segments, _ = self.model.transcribe(
                audio_np, 
                beam_size=5, 
                language=self.language,
                vad_filter=True,
                condition_on_previous_text=False, # DESACTIVADO: Evita que un error auditivo cause alucinaciones en cascada
                initial_prompt="Hola, ¿qué tal? Esto es una prueba de transcripción en español claro y neutro." # Afina el idioma
            )
            text = "".join([segment.text for segment in segments]).strip()
            
            if text:
                self.ui_queue.put(("stt", text))
                self.output_queue.put(text)
                
        except Exception as e:
            self.ui_queue.put(("status", f"❌ Error STT: {str(e)[:50]}"))

    def stop(self):
        self.is_running = False
        if self.stop_listening:
            self.stop_listening(wait_for_stop=False)
            self.stop_listening = None


# ==========================================
# MÓDULO 2: TRADUCTOR
# ==========================================
class TranslatorWorker:
    def __init__(self, input_queue, output_queue, ui_queue, source="es", target="en"):
        self.input_queue = input_queue
        self.output_queue = output_queue
        self.ui_queue = ui_queue
        self.is_running = True
        
        self.ui_queue.put(("status", "⚙️ Cargando modelo MarianMT (Traducción)..."))
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        model_name = f"Helsinki-NLP/opus-mt-{source}-{target}"
        
        torch_dtype = torch.float16 if self.device == "cuda" else torch.float32
        
        self.tokenizer = MarianTokenizer.from_pretrained(model_name)
        self.model = MarianMTModel.from_pretrained(model_name, torch_dtype=torch_dtype).to(self.device)

    def start(self):
        threading.Thread(target=self._process, daemon=True).start()

    def _process(self):
        while self.is_running:
            try:
                text = self.input_queue.get(timeout=1)
                self.ui_queue.put(("status", "⚡ Traduciendo..."))
                
                inputs = self.tokenizer(text, return_tensors="pt", padding=True).to(self.device)
                translated_tokens = self.model.generate(**inputs)
                translated = self.tokenizer.decode(translated_tokens[0], skip_special_tokens=True)
                
                self.ui_queue.put(("translation", translated))
                self.output_queue.put(translated)
                self.input_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                self.ui_queue.put(("status", f"❌ Error Trad.: {str(e)[:50]}"))


# ==========================================
# MÓDULO 3: SÍNTESIS DE VOZ Y CLONACIÓN (XTTSv2)
# ==========================================
class TTSWorker:
    def __init__(self, input_queue, ui_queue):
        self.input_queue = input_queue
        self.ui_queue = ui_queue
        self.is_running = True
        self.mode = "cloned" # Modos: "cloned" o "standard"
        self.ref_wav_path = "referencia_voz.wav"
        
        # MEJORA: Forzamos la inicialización de pygame a 24000Hz (nativo de XTTS) 
        # para evitar problemas de compatibilidad de audio y silencios.
        pygame.mixer.init(frequency=24000)
        
        self.ui_queue.put(("status", "⚙️ Cargando modelo XTTSv2 (Clonación de Voz)... Esto puede tardar."))
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Cargamos el modelo XTTSv2 que permite zero-shot cloning
        self.model = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2", progress_bar=False).to(self.device)
        self.sample_rate = 24000 # Frecuencia nativa de XTTS

    def start(self):
        threading.Thread(target=self._process, daemon=True).start()

    def _process(self):
        while self.is_running:
            try:
                text = self.input_queue.get(timeout=1)
                
                if self.mode == "cloned":
                    if not os.path.exists(self.ref_wav_path):
                        self.ui_queue.put(("status", "❌ Falla: No hay muestra de voz para clonar."))
                        self.input_queue.task_done()
                        continue
                    self.ui_queue.put(("status", "⚡ Clonando tu voz..."))
                    audio_data = self.model.tts(text=text, speaker_wav=self.ref_wav_path, language="en")
                else:
                    self.ui_queue.put(("status", "🔊 Generando voz estándar..."))
                    
                    # MEJORA: Buscar un hablante seguro de forma dinámica.
                    safe_speaker = "Claribel Dervla"
                    try:
                        # Obtenemos la lista de voces incluidas en el modelo
                        if hasattr(self.model, "speakers") and self.model.speakers:
                            available_speakers = list(self.model.speakers)
                            # Si Claribel no está instalada en esta versión, tomamos la primera de la lista
                            if safe_speaker not in available_speakers:
                                safe_speaker = available_speakers[0]
                    except Exception:
                        pass # Si falla la validación, intenta con Claribel por defecto
                    
                    audio_data = self.model.tts(text=text, speaker=safe_speaker, language="en")

                audio_np = np.array(audio_data, dtype=np.float32)
                
                wav_io = io.BytesIO()
                sf.write(wav_io, audio_np, self.sample_rate, format='WAV')
                wav_io.seek(0)
                
                self.ui_queue.put(("status", "🔊 Reproduciendo..."))
                pygame.mixer.music.load(wav_io)
                pygame.mixer.music.play()
                
                while pygame.mixer.music.get_busy():
                    pygame.time.Clock().tick(10)

                self.ui_queue.put(("status", "✅ Escuchando... ¡Puedes hablar!"))
                self.input_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                # MEJORA: Aumentamos a 80 caracteres para poder leer mejor el error si vuelve a fallar
                self.ui_queue.put(("status", f"❌ Error TTS: {str(e)[:80]}"))

# ==========================================
# INTERFAZ GRÁFICA PRINCIPAL
# ==========================================
class TranslatorApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        self.title("Traductor IA - Clonación de Voz")
        self.geometry("950x650")
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        
        self.ui_queue = queue.Queue()
        self.stt_queue = queue.Queue()
        self.tts_queue = queue.Queue()
        
        self.stt = None
        self.translator = None
        self.tts = None
        
        self.is_recording = False
        self.models_loaded = False
        self.is_recording_sample = False
        
        self._build_ui()
        self.check_queue()
        threading.Thread(target=self.load_models_background, daemon=True).start()

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(1, weight=1)

        self.status_label = ctk.CTkLabel(self, text="Inicializando interfaz...", font=("Arial", 16, "bold"))
        self.status_label.grid(row=0, column=0, columnspan=2, pady=15)

        self.es_box = ctk.CTkTextbox(self, font=("Arial", 16), wrap="word")
        self.es_box.grid(row=1, column=0, padx=(20, 10), pady=(0, 20), sticky="nsew")
        self.es_box.insert("0.0", "--- ORIGINAL (ESPAÑOL) ---\n\n")
        
        self.en_box = ctk.CTkTextbox(self, font=("Arial", 16), wrap="word", fg_color="#2b2b2b")
        self.en_box.grid(row=1, column=1, padx=(10, 20), pady=(0, 20), sticky="nsew")
        self.en_box.insert("0.0", "--- TRADUCCIÓN (INGLÉS) ---\n\n")

        self.controls_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.controls_frame.grid(row=2, column=0, columnspan=2, pady=(0, 20))
        
        self.btn_record_sample = ctk.CTkButton(self.controls_frame, text="🎤 Grabar Voz", 
                                               font=("Arial", 14, "bold"), height=50, width=120, fg_color="#a86e11", hover_color="#85560b",
                                               command=self.record_voice_sample)
        self.btn_record_sample.pack(side="left", padx=5)

        # NUEVO BOTÓN: Cargar un archivo de audio para máxima calidad
        self.btn_load_sample = ctk.CTkButton(self.controls_frame, text="📁 Cargar Audio", 
                                             font=("Arial", 14, "bold"), height=50, width=120, fg_color="#5334c9", hover_color="#3e269c",
                                             command=self.load_voice_sample)
        self.btn_load_sample.pack(side="left", padx=5)

        # Selector de Modo de Voz
        self.mode_switch = ctk.CTkSegmentedButton(self.controls_frame, 
                                                 values=["Clonada", "Estándar"],
                                                 font=("Arial", 14), height=50,
                                                 command=self.change_voice_mode)
        self.mode_switch.set("Clonada")
        self.mode_switch.pack(side="left", padx=10)

        self.btn_toggle = ctk.CTkButton(self.controls_frame, text="⏳ Cargando Modelos...", 
                                        font=("Arial", 16, "bold"), height=50, width=200, state="disabled",
                                        command=self.toggle_recording)
        self.btn_toggle.pack(side="left", padx=10)
        
        self.btn_export = ctk.CTkButton(self.controls_frame, text="💾 Exportar Chat", 
                                        font=("Arial", 14), height=50, fg_color="#2c8253", hover_color="#1e5c3a",
                                        command=self.export_chat)
        self.btn_export.pack(side="left", padx=5)

    def load_models_background(self):
        self.tts = TTSWorker(self.tts_queue, self.ui_queue)
        self.tts.start()
        
        self.translator = TranslatorWorker(self.stt_queue, self.tts_queue, self.ui_queue)
        self.translator.start()
        
        self.stt = AudioCaptureSTT(self.stt_queue, self.ui_queue)
        
        self.models_loaded = True
        
        # Sincronizamos modo
        current_ui_mode = self.mode_switch.get()
        if self.tts:
            self.tts.mode = "cloned" if current_ui_mode == "Clonada" else "standard"
            
        self.check_ready_state()

    def check_ready_state(self):
        if not self.models_loaded:
            return
            
        current_mode = self.mode_switch.get()
        # Verificamos la ruta dinámica actual del archivo de referencia
        ref_path = self.tts.ref_wav_path if self.tts else "referencia_voz.wav"
        
        if current_mode == "Clonada" and not os.path.exists(ref_path):
            self.ui_queue.put(("status", "⚠️ Modelos listos. ¡Graba o carga un audio para empezar!"))
            self.ui_queue.put(("not_ready", ""))
        else:
            self.ui_queue.put(("ready", "⚡ ¡Todo listo! Pulsa Iniciar."))

    def load_voice_sample(self):
        # Permite al usuario elegir un archivo de audio limpio en su PC
        filepath = filedialog.askopenfilename(
            title="Selecciona una muestra de voz limpia (WAV, FLAC, OGG)",
            filetypes=[("Archivos de Audio", "*.wav *.flac *.ogg")]
        )
        if filepath:
            if self.tts:
                self.tts.ref_wav_path = filepath
            
            # Forzamos visual y técnicamente el modo a "Clonada"
            self.mode_switch.set("Clonada")
            self.change_voice_mode("Clonada")
            
            nombre_archivo = os.path.basename(filepath)
            self.ui_queue.put(("status", f"✅ Audio de alta calidad cargado: {nombre_archivo}"))

    def record_voice_sample(self):
        if self.is_recording or self.is_recording_sample:
            return
        self.is_recording_sample = True
        self.btn_toggle.configure(state="disabled")
        threading.Thread(target=self._record_worker, daemon=True).start()

    def _record_worker(self):
        try:
            # MEJORA: Cancelación de ruido previa a grabar y Sample Rate a 24000Hz (Alta Calidad)
            self.ui_queue.put(("status", "🤫 Silencio... Ajustando ruido de fondo (2s)"))
            r = sr.Recognizer()
            with sr.Microphone(sample_rate=24000) as source:
                r.adjust_for_ambient_noise(source, duration=2)
                
                self.ui_queue.put(("status", "🔴 Prepárate para hablar... 3"))
                time.sleep(1)
                self.ui_queue.put(("status", "🔴 Prepárate para hablar... 2"))
                time.sleep(1)
                self.ui_queue.put(("status", "🔴 Prepárate para hablar... 1"))
                time.sleep(1)
                
                self.ui_queue.put(("status", "🎙️ GRABANDO (10s): Habla claro, sin eco ni ruido de ventiladores"))
                audio = r.record(source, duration=10)

            with open("referencia_voz.wav", "wb") as f:
                f.write(audio.get_wav_data())

            if self.tts:
                self.tts.ref_wav_path = "referencia_voz.wav"

            self.ui_queue.put(("status", "✅ Muestra guardada exitosamente."))
        except Exception as e:
            self.ui_queue.put(("status", f"❌ Error al grabar: {str(e)}"))
        finally:
            self.is_recording_sample = False
            self.check_ready_state()

    def change_voice_mode(self, value):
        if value == "Clonada":
            if self.tts:
                self.tts.mode = "cloned"
            self.ui_queue.put(("status", "🔄 Modo: Voz Clonada (XTTS)"))
            self.btn_record_sample.configure(state="normal")
            self.btn_load_sample.configure(state="normal")
        else:
            if self.tts:
                self.tts.mode = "standard"
            self.ui_queue.put(("status", "🔄 Modo: Voz Estándar"))
            self.btn_record_sample.configure(state="disabled")
            self.btn_load_sample.configure(state="disabled")
        
        self.check_ready_state()

    def toggle_recording(self):
        if not self.is_recording:
            self.btn_toggle.configure(text="🛑 Detener Traducción", fg_color="#c93434", hover_color="#9e2a2a")
            self.is_recording = True
            threading.Thread(target=self.stt.start, daemon=True).start()
        else:
            self.btn_toggle.configure(text="🎙️ Iniciar Traducción", fg_color="#1f6aa5", hover_color="#144870")
            self.is_recording = False
            self.stt.stop()
            self.ui_queue.put(("status", "⏸️ Grabación pausada."))

    def export_chat(self):
        text_es = self.es_box.get("0.0", "end")
        text_en = self.en_box.get("0.0", "end")
        
        filepath = filedialog.asksaveasfilename(defaultextension=".txt", 
                                                filetypes=[("Text Files", "*.txt")],
                                                title="Guardar Conversación")
        if filepath:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(text_es + "\n" + "="*50 + "\n\n" + text_en)
            self.ui_queue.put(("status", "✅ Conversación exportada con éxito."))

    def check_queue(self):
        try:
            while True:
                msg_type, content = self.ui_queue.get_nowait()
                
                if msg_type == "status":
                    self.status_label.configure(text=content)
                elif msg_type == "stt":
                    self.es_box.insert("end", f"Tú: {content}\n\n")
                    self.es_box.see("end") 
                elif msg_type == "translation":
                    self.en_box.insert("end", f"IA: {content}\n\n")
                    self.en_box.see("end") 
                elif msg_type == "ready":
                    self.btn_toggle.configure(state="normal", text="🎙️ Iniciar Traducción")
                    self.status_label.configure(text=content)
                elif msg_type == "not_ready":
                    self.btn_toggle.configure(state="disabled", text="🎙️ Iniciar Traducción")
                    
        except queue.Empty:
            pass
        finally:
            self.after(50, self.check_queue)

if __name__ == "__main__":
    app = TranslatorApp()
    app.mainloop()
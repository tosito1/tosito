import os
import base64
from gtts import gTTS
import uuid

class VoiceEngine:
    def __init__(self, output_dir="./temp_audio"):
        self.output_dir = output_dir
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    def generate_tts(self, text, lang='es'):
        """Genera un archivo de audio TTS y devuelve su ruta."""
        try:
            tts = gTTS(text=text, lang=lang, slow=False)
            filename = f"tts_{uuid.uuid4().hex[:8]}.mp3"
            filepath = os.path.join(self.output_dir, filename)
            tts.save(filepath)
            return filepath
        except Exception as e:
            print(f"Error generando TTS: {e}")
            return None

    def get_audio_html(self, filepath):
        """Devuelve un snippet HTML con un reproductor de audio personalizado para Streamlit."""
        try:
            with open(filepath, "rb") as f:
                data = f.read()
                b64 = base64.b64encode(data).decode()
                # Un reproductor de audio simple que se auto-reproduce
                html = f"""
                    <audio autoplay controls style="width: 100%; margin-top: 10px; border-radius: 10px;">
                    <source src="data:audio/mp3;base64,{b64}" type="audio/mp3">
                    </audio>
                    """
                return html
        except Exception as e:
            print(f"Error leyendo audio: {e}")
            return ""

    def process_stt_file(self, audio_file, ai_engine):
        """Procesa un archivo de audio usando la capacidad de audio de Gemini (STT)."""
        try:
            # Usamos Gemini para transcribir el audio.
            # Asumimos que audio_file es un objeto tipo archivo de Streamlit.
            audio_bytes = audio_file.read()
            
            # Pasamos los datos como inline para archivos pequeños
            prompt = "Transcribe el siguiente audio exactamente sin agregar comentarios extra:"
            response = ai_engine.client.models.generate_content(
                model=ai_engine.model_name,
                contents=[prompt, {"mime_type": "audio/wav", "data": audio_bytes}],
            )
            return response.text.strip()
        except Exception as e:
            print(f"Error en STT: {e}")
            return ""

    def cleanup(self):
        """Limpia los archivos temporales de audio."""
        for filename in os.listdir(self.output_dir):
            file_path = os.path.join(self.output_dir, filename)
            try:
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            except Exception as e:
                pass

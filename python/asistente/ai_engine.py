import os
from google import genai
import ollama
from dotenv import load_dotenv

load_dotenv()

class AIEngine:
    def __init__(self):
        # 1. Configurar Gemini (como respaldo y para Visión)
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            self.gemini_client = genai.Client(api_key=api_key)
            self.gemini_model = 'gemini-2.0-flash'
        else:
            self.gemini_client = None
            print("AVISO: GEMINI_API_KEY no configurada. Visión IA deshabilitada.")

        # 2. Configurar Ollama (IA Local Prioritaria)
        self.local_model = "llama3.1"
        self.ollama_available = self._check_ollama()
        if self.ollama_available:
            print(f"🤖 IA Local Activa: Usando {self.local_model} (Ollama)")
        else:
            print("⚠️ Ollama no detectado. Usando Gemini (IA en la nube) como respaldo.")

    def _check_ollama(self):
        """Verifica si el servidor de Ollama está encendido y tiene el modelo."""
        try:
            ollama.list() # Prueba rápida de conexión
            return True
        except:
            return False

    def _ask_ai(self, prompt, system_instruction="Eres un asistente ejecutivo experto."):
        """Helper para elegir entre IA Local o Nube."""
        # Priorizar Ollama si está disponible
        if self.ollama_available:
            try:
                response = ollama.chat(model=self.local_model, messages=[
                    {'role': 'system', 'content': system_instruction},
                    {'role': 'user', 'content': prompt}
                ])
                return response['message']['content'].strip()
            except Exception as e:
                print(f"Error en IA Local (Ollama): {e}. Reintentando con Gemini...")
                # Continuar hacia el fallback de Gemini si falla
        
        # Fallback a Gemini si Ollama falla o no está disponible
        if self.gemini_client:
            try:
                # Instrucción de sistema en Gemini 2.0 via prompt o config
                full_prompt = f"{system_instruction}\n\nUsuario: {prompt}"
                response = self.gemini_client.models.generate_content(
                    model=self.gemini_model,
                    contents=full_prompt
                )
                return response.text.strip()
            except Exception as e:
                print(f"Error en Gemini IA: {e}")
                return "Error: No hay IA disponible (Local ni Nube)."
        
        return "Error: No se ha configurado ninguna IA (Ollama o Gemini)."

    def summarize_email(self, sender, subject, body, thread_context=None):
        """Genera un resumen usando la IA disponible."""
        prompt = f"Resume este correo en máx 2 frases: De: {sender}, Asunto: {subject}, Cuerpo: {body}"
        if thread_context:
            prompt += f"\nContexto del hilo: {str(thread_context)}"
        return self._ask_ai(prompt, "Resume de forma ultra-concisa y profesional.")

    def categorize_email(self, sender, subject, body, thread_context=None):
        """Clasifica el correo usando la IA disponible."""
        prompt = f"Categoriza este correo entre [Urgente, Trabajo, Personal, Newsletter, Spam, Otro]. Responde SOLO con una palabra: De: {sender}, Asunto: {subject}, Cuerpo: {body}"
        return self._ask_ai(prompt, "Responde únicamente con la categoría exacta.")

    def draft_response(self, sender, subject, body, instructions="", thread_context=None):
        """Redacta una respuesta usando la IA disponible."""
        prompt = f"Redacta una respuesta para: De: {sender}, Asunto: {subject}, Cuerpo: {body}. Instrucciones adicionales: {instructions}"
        return self._ask_ai(prompt, "Eres un asistente redactando un correo profesional y amable.")

    def generate_dashboard_summary(self, emails_data):
        """Genera un resumen ejecutivo para el Dashboard."""
        if not emails_data: return "No hay correos."
        context = "\n".join([f"- De: {e['from']}, Asunto: {e['subject']}" for e in emails_data])
        prompt = f"Analiza estos correos y genera un resumen ejecutivo corto:\n{context}"
        return self._ask_ai(prompt, "Genera 3 frases con lo más importante del día.")

    def detect_tasks(self, emails_data):
        """Identifica tareas pendientes."""
        if not emails_data: return []
        context = "\n".join([f"[ID:{e['uid']}] De: {e['from']}, Asunto: {e['subject']}, Contenido: {e['body'][:300]}" for e in emails_data])
        prompt = f"Extrae tareas pendientes en formato JSON string: [{{'task': '...', 'due': '...', 'source': '...'}}]. Correos:\n{context}"
        res_text = self._ask_ai(prompt, "Analiza correos y devuelve SOLO el JSON, nada de texto extra.")
        
        try:
            # Limpiar por si la IA añade markdown
            import json
            clean_text = res_text.strip()
            if "```" in clean_text:
                clean_text = clean_text.split("```")[1].replace("json", "").strip()
            return json.loads(clean_text)
        except:
            return []

    def translate_text(self, text, target_lang="Español"):
        """Traduce usando la IA disponible."""
        prompt = f"Traduce al {target_lang}:\n\n{text}"
        return self._ask_ai(prompt, "Eres un traductor profesional experto.")

    def extract_event_data(self, email_body, current_date=None):
        """Extrae detalles de un evento de un texto para agendar en calendario."""
        if not current_date:
            from datetime import datetime
            current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
        prompt = f"""
        Dado este texto de un correo y considerando que hoy es {current_date}:
        1. Identifica si hay una propuesta de cita, reunión o evento.
        2. Extrae los detalles en formato JSON:
           - "summary": (Título del evento)
           - "start": (Fecha y hora de inicio en formato ISO 8601, ej: 2024-03-07T15:00:00Z)
           - "end": (Fecha y hora de fin en formato ISO 8601, aprox. 1 hora después si no se indica)
           - "description": (Breve descripción o link de zoom si hay)
           - "location": (Lugar o 'Virtual')
        
        Si no hay evento claro, devuelve {{}}.
        
        Texto: {email_body}
        """
        
        res_text = self._ask_ai(prompt, "Responde SOLO con el JSON válido. Si no hay evento, devuelve {}.")
        
        try:
            import json
            clean_text = res_text.strip()
            if "```" in clean_text:
                clean_text = clean_text.split("```")[1].replace("json", "").strip()
            return json.loads(clean_text)
        except:
            return {}

    def analyze_attachment(self, filename, content_type, b64_data):
        """ESTE MÉTODO USA SIEMPRE GEMINI (Vision) por ser superior en multimodalidad local."""
        if not self.gemini_client:
            return "Error: Gemini no configurada para análisis de visión."
            
        prompt = f"Describe el contenido de este adjunto '{filename}' (un {content_type}). Extrae datos clave."
        try:
            import base64
            contents = [
                prompt,
                {"mime_type": content_type, "data": base64.b64decode(b64_data)}
            ]
            response = self.gemini_client.models.generate_content(model=self.gemini_model, contents=contents)
            return response.text.strip()
        except Exception as e:
            return f"Error analizando adjunto (Cloud): {e}"

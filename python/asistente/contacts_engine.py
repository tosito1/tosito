import os
import chromadb
from google import genai
from dotenv import load_dotenv

load_dotenv()

class ContactsEngine:
    def __init__(self, db_path="./chroma_db"):
        self.client = chromadb.PersistentClient(path=db_path)
        self.collection = self.client.get_or_create_collection(name="contacts_memory")
        
        api_key = os.getenv("GEMINI_API_KEY")
        self.ai_client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-2.0-flash'

    def update_contact_from_email(self, sender_email, email_body, ai_engine):
        """Analiza un correo para extraer información del remitente y actualizar su perfil."""
        prompt = f"""
        Analiza este correo de {sender_email}. 
        Extrae información relevante sobre esta persona: nombre, empresa, cargo, y temas que hemos tratado o acuerdos pendientes.
        Responde en un formato legible.
        
        Correo:
        {email_body[:2000]}
        """
        try:
            res = ai_engine.client.models.generate_content(model=ai_engine.model_name, contents=prompt).text.strip()
            
            # Guardamos/Actualizamos en ChromaDB
            self.collection.upsert(
                ids=[sender_email],
                documents=[res],
                metadatas=[{"email": sender_email}]
            )
            return res
        except:
            return ""

    def get_contact_info(self, email):
        """Recupera la información guardada de un contacto."""
        try:
            res = self.collection.get(ids=[email])
            if res['documents']:
                return res['documents'][0]
            return "No hay información previa de este contacto."
        except:
            return "Error recuperando contacto."

    def list_all_contacts(self):
        """Lista todos los contactos conocidos."""
        try:
            return self.collection.get()
        except:
            return {"ids": [], "documents": []}

import os
import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv

load_dotenv()

class MemoryEngine:
    def __init__(self, db_path="./chroma_db"):
        self.client = chromadb.PersistentClient(path=db_path)
        
        # Usar el motor de embedding local por defecto de ChromaDB (Sentence Transformers)
        # Esto evita errores 404 de modelos de Google y no consume cuota de API (429)
        # Nota: La primera vez descargará un modelo de unos 80MB automáticamente.
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        
        # Crear u obtener la colección con la función local
        self.collection = self.client.get_or_create_collection(
            name="emails_memory",
            embedding_function=self.embedding_fn
        )

    def add_emails(self, emails_list):
        """Añade una lista de diccionarios de correo a la base de datos vectorial local."""
        ids = []
        documents = []
        metadatas = []
        
        for email in emails_list:
            text_content = f"De: {email['from']}\nAsunto: {email['subject']}\n\n{email['body']}"
            doc_id = str(email['uid'])
            
            try:
                # Evitar duplicados
                if len(self.collection.get(ids=[doc_id])['ids']) > 0:
                    continue
            except: pass

            ids.append(doc_id)
            documents.append(text_content)
            metadatas.append({
                "from": email['from'],
                "subject": email['subject'],
                "date": str(email.get('date', ''))
            })
                
        if ids:
            # ChromaDB procesa los documentos localmente sin llamar a ninguna API externa
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            return len(ids)
        return 0

    def semantic_search(self, query, n_results=3):
        """Busca en la memoria local usando el motor offline."""
        try:
            results = self.collection.query(
                query_texts=[query], 
                n_results=n_results
            )
            
            formatted_results = []
            if results['documents'] and results['documents'][0]:
                for i in range(len(results['documents'][0])):
                    formatted_results.append({
                        "id": results['ids'][0][i],
                        "document": results['documents'][0][i],
                        "metadata": results['metadatas'][0][i],
                        "distance": results['distances'][0][i] if 'distances' in results else None
                    })
            return formatted_results
        except Exception as e:
            print(f"Error en búsqueda semántica local: {e}")
            return []

    def answer_question_from_memory(self, question, ai_engine):
        """Busca en la memoria local y usa Gemini solo para sintetizar la respuesta final."""
        relevant_docs = self.semantic_search(question, n_results=5)
        
        if not relevant_docs:
            return "No encontré correos relevantes en tu historial para responder a esto."
            
        context_str = "\n\n---\n\n".join([doc['document'] for doc in relevant_docs])
        
        prompt = f"""
        Eres un asistente personal con memoria perfecta de los correos del usuario.
        Responde a la pregunta del usuario utilizando ÚNICAMENTE el contexto de los correos proporcionados.
        Si la respuesta no está en los correos, di que no lo sabes basado en el historial.
        
        Pregunta: {question}
        
        Correos Relevantes Recuperados:
        {context_str}
        """
        
        try:
             response = ai_engine.client.models.generate_content(
                model=ai_engine.model_name,
                contents=prompt,
            )
             return response.text.strip()
        except Exception as e:
            print(f"Error al generar respuesta de memoria: {e}")
            return "Ocurrió un error al consultar la memoria."

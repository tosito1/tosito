import os
from google import genai
from dotenv import load_dotenv
load_dotenv()
try:
    client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
    models = list(client.models.list())
    print("Found models:", [m.name for m in models])
    for m in ['text-embedding-004', 'embedding-001', 'models/text-embedding-004', 'models/embedding-001']:
        try:
            client.models.embed_content(model=m, contents='test')
            print(f"OK: {m}")
        except Exception as e:
            print(f"FAIL: {m}: {e}")
except Exception as e:
    print(f"Critical error: {e}")

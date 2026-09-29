import ollama
import json

class LLMClient:
    def __init__(self, model="qwen2.5-coder:7b"):
        self.model = model
        self.client = ollama.Client()

    def chat(self, messages, format=None):
        """
        Send a list of messages to the local Ollama instance.
        """
        try:
            response = self.client.chat(
                model=self.model,
                messages=messages,
                format=format
            )
            return response['message']['content']
        except Exception as e:
            return f"Error communicating with Ollama: {str(e)}"

    def generate_json(self, system_prompt, user_prompt):
        """
        Helper to get structured JSON output from the LLM.
        """
        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt}
        ]
        response_text = self.chat(messages, format="json")
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON", "raw": response_text}

if __name__ == "__main__":
    # Test connection
    client = LLMClient()
    print("Testing Ollama connection...")
    resp = client.chat([{'role': 'user', 'content': 'Hello, are you there?'}])
    print(f"Response: {resp}")

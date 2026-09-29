import os
import sys
import json

# Add modes to path
sys.path.append(os.path.join(os.getcwd(), 'modes'))

from llm_client import LLMClient
import system_tools
import windows_mode
import dev_mode
import personal_mode
import game_mode

class WindowsAgent:
    def __init__(self, model="qwen2.5-coder:7b"):
        self.llm = LLMClient(model=model)
        self.mode = "windows"  # Default mode
        self.modes = {
            "windows": "Asistente de Windows. Te encargas de monitorizar recursos y configurar el sistema.",
            "programming": "Agente de Programación. Ayudas a escribir, depurar y optimizar código.",
            "gaming": "Agente de Juegos. Analizas la pantalla y sugieres jugadas o automatizas tareas con PyAutoGUI.",
            "personal": "Asistente Personal. Gestionas tareas, correos y calendario."
        }
        
    def set_mode(self, mode_name):
        if mode_name in self.modes:
            self.mode = mode_name
            return f"Modo cambiado a: {mode_name.capitalize()}"
        return f"Modo '{mode_name}' no reconocido."

    def get_system_prompt(self):
        base_prompt = (
            f"Eres un asistente IA altamente avanzado para Windows trabajando en modo: {self.mode.capitalize()}.\n"
            f"Descripción del modo: {self.modes[self.mode]}\n"
            "Puedes usar herramientas del sistema para realizar tareas.\n"
            "Responde de forma concisa y profesional en Español."
        )
        return base_prompt

    def run(self):
        print("======== AGENTE DE WINDOWS CON OLLAMA ========")
        print(f"Modo actual: {self.mode.capitalize()}")
        print("Comandos especiales: /mode [name], /exit")
        
        while True:
            user_input = input("\nTú > ")
            
            if user_input.lower() == "/exit":
                print("Hasta pronto!")
                break
                
            if user_input.startswith("/mode "):
                new_mode = user_input.split(" ")[1].lower()
                print(self.set_mode(new_mode))
                continue
            
            messages = [
                {'role': 'system', 'content': self.get_system_prompt()},
                {'role': 'user', 'content': user_input}
            ]
            
            print("Pensando...", end="\r")
            
            # Dispatch based on mode
            if self.mode == "windows":
                response = windows_mode.handle_windows_request(user_input, self)
            elif self.mode == "programming":
                response = dev_mode.handle_dev_request(user_input, self)
            elif self.mode == "personal":
                response = personal_mode.handle_personal_request(user_input, self)
            elif self.mode == "gaming":
                response = game_mode.handle_game_request(user_input, self)
            else:
                response = self.llm.chat(messages)
                
            print("Assistant >", response)

if __name__ == "__main__":
    agent = WindowsAgent()
    agent.run()

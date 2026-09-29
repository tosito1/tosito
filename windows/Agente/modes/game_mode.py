import system_tools
import pyautogui
import time

def handle_game_request(request, agent):
    """
    Handles logic for the Gaming Agent mode.
    """
    system_prompt = (
        "Eres el Agente de Juegos. Analizas la pantalla y sugieres o ejecutas acciones.\n"
        "Puedes capturar pantalla y simular teclas.\n"
        "Responde siempre en JSON con el siguiente formato:\n"
        "{\"thought\": \"tu razonamiento\", \"tool\": \"nombre_de_herramienta\", \"params\": {}, \"message\": \"tu respuesta al usuario\"}\n"
        "Herramientas disponibles: take_screenshot, press_key, click_at"
    )
    
    response = agent.llm.generate_json(system_prompt, request)
    
    if "tool" in response:
        tool_name = response["tool"]
        params = response.get("params", {})
        
        if tool_name == "take_screenshot":
            result = system_tools.take_screenshot("game_view.png")
            return f"{response['message']}\n\nResultado: {result}"
            
        elif tool_name == "press_key":
            key = params.get("key", "space")
            pyautogui.press(key)
            return f"{response['message']}\n\nTecla presionada: {key}"
            
        elif tool_name == "click_at":
            x = params.get("x", 0)
            y = params.get("y", 0)
            pyautogui.click(x, y)
            return f"{response['message']}\n\nClic realizado en ({x}, {y})"
            
    return response.get("message", "No pude procesar la solicitud de juego.")

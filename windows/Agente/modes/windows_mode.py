import system_tools

def handle_windows_request(request, agent):
    """
    Handles logic specific to the Windows Assistant mode.
    """
    system_prompt = (
        "Eres el Asistente de Windows. Tienes acceso a herramientas del sistema.\n"
        "Si el usuario pide estadísticas, usa la herramienta de estadísticas.\n"
        "Si pide cambiar el volumen, usa la herramienta de volumen.\n"
        "Responde siempre en JSON con el siguiente formato:\n"
        "{\"thought\": \"tu razonamiento\", \"tool\": \"nombre_de_herramienta\", \"params\": {}, \"message\": \"tu respuesta al usuario\"}\n"
        "Herramientas disponibles: get_system_stats, set_volume, list_processes, take_screenshot"
    )
    
    response = agent.llm.generate_json(system_prompt, request)
    
    if "tool" in response:
        tool_name = response["tool"]
        params = response.get("params", {})
        
        if tool_name == "get_system_stats":
            result = system_tools.get_system_stats()
            return f"{response['message']}\n\nEstadísticas actuales: {result}"
        
        elif tool_name == "set_volume":
            level = params.get("level")
            if level is None: return "Falta el parámetro 'level'."
            result = system_tools.set_volume(level)
            return f"{response['message']}\n\nResultado: {result}"
            
        elif tool_name == "list_processes":
            result = system_tools.list_processes()
            return f"{response['message']}\n\nTop procesos: {result}"
            
        elif tool_name == "take_screenshot":
            result = system_tools.take_screenshot()
            return f"{response['message']}\n\nResultado: {result}"
            
    return response.get("message", "No pude procesar la solicitud.")

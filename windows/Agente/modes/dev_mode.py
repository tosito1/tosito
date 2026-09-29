import os
import subprocess

def handle_dev_request(request, agent):
    """
    Handles logic specific to the Programming Agent mode.
    """
    system_prompt = (
        "Eres el Agente de Programación. Ayudas con el desarrollo de software.\n"
        "REGLA DE ORO: Usa SIEMPRE nombres de archivo relativos al directorio actual (ej. 'archivo.txt').\n"
        "NUNCA uses rutas de ejemplo como '/ruta/al/archivo/'.\n"
        "Si el usuario no especifica una ruta, asume el directorio raíz donde te encuentras.\n"
        "Ejemplo para 'escribir un hola mundo':\n"
        "{\"thought\": \"Crearé el archivo\", \"tool\": \"write_file\", \"params\": {\"path\": \"main.py\", \"content\": \"print('hello')\"}, \"message\": \"Archivo creado\"}\n"
        "Responde SIEMPRE en este formato JSON estricto.\n"
        "Herramientas: read_file, write_file, run_command"
    )
    
    response = agent.llm.generate_json(system_prompt, request)
    
    if "tool" in response:
        tool_name = response["tool"]
        params = response.get("params", {})
        msg = response.get("message", "Procesando tarea de programación...")
        
        if tool_name == "read_file":
            path = params.get("path")
            if not path: return "Falta el parámetro 'path'."
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return f"{msg}\n\nContenido de {path}:\n```\n{content}\n```"
            return f"El archivo {path} no existe."
            
        elif tool_name == "write_file":
            path = params.get("path")
            content = params.get("content", "")
            if not path: return "Falta el parámetro 'path'."
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return f"{msg}\n\nArchivo {path} escrito correctamente."
            
        elif tool_name == "run_command":
            cmd = params.get("command")
            if not cmd: return "Falta el parámetro 'command'."
            try:
                result = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT).decode()
                return f"{msg}\n\nSalida del comando:\n```\n{result}\n```"
            except Exception as e:
                return f"Error ejecutando el comando: {str(e)}"
                
    return response.get("message", "No pude procesar la solicitud de programación.")

import os
import json

TASK_FILE = "tasks.json"

def handle_personal_request(request, agent):
    """
    Handles logic for the Personal Assistant mode.
    """
    system_prompt = (
        "Eres el Asistente Personal. Gestionas tareas y agenda.\n"
        "Puedes añadir tareas, listar tareas y eliminar tareas.\n"
        "Responde siempre en JSON con el siguiente formato:\n"
        "{\"thought\": \"tu razonamiento\", \"tool\": \"nombre_de_herramienta\", \"params\": {}, \"message\": \"tu respuesta al usuario\"}\n"
        "Herramientas disponibles: add_task, list_tasks, delete_task"
    )
    
    response = agent.llm.generate_json(system_prompt, request)
    
    if "tool" in response:
        tool_name = response["tool"]
        params = response.get("params", {})
        
        if tool_name == "add_task":
            content = params.get("task")
            if not content: return "Falta el parámetro 'task'."
            tasks = _load_tasks()
            tasks.append(content)
            _save_tasks(tasks)
            return f"{response['message']}\n\nTarea añadida: {content}"
            
        elif tool_name == "list_tasks":
            tasks = _load_tasks()
            if not tasks:
                return f"{response['message']}\n\nNo tienes tareas pendientes."
            task_list = "\n".join([f"- {t}" for t in tasks])
            return f"{response['message']}\n\nMis tareas:\n{task_list}"
            
        elif tool_name == "delete_task":
            idx = params.get("index")
            tasks = _load_tasks()
            if idx is not None and 0 <= idx < len(tasks):
                removed = tasks.pop(idx)
                _save_tasks(tasks)
                return f"{response['message']}\n\nTarea eliminada: {removed}"
            return "No pude eliminar la tarea (índice inválido)."
            
    return response.get("message", "No pude procesar la solicitud personal.")

def _load_tasks():
    if os.path.exists(TASK_FILE):
        with open(TASK_FILE, 'r') as f:
            return json.load(f)
    return []

def _save_tasks(tasks):
    with open(TASK_FILE, 'w') as f:
        json.dump(tasks, f)

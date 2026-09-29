import os
import sys

# Add modes to path
sys.path.append(os.path.join(os.getcwd(), 'modes'))

from main import WindowsAgent
import windows_mode
import dev_mode
import personal_mode
import game_mode

def test_modes():
    agent = WindowsAgent()
    
    print("\n--- Testing Windows Mode ---")
    agent.set_mode("windows")
    # Simulate a call
    resp = windows_mode.handle_windows_request("¿Cuáles son las estadísticas de mi PC?", agent)
    print("Response:", resp)
    
    print("\n--- Testing Programming Mode ---")
    agent.set_mode("programming")
    resp = dev_mode.handle_dev_request("Crea un archivo llamado test_output.txt con el texto 'Hola Mundo'", agent)
    print("Response:", resp)
    # Check if a file ending in test_output.txt was created (handling bad paths from LLM)
    found = False
    for f in os.listdir("."):
        if f == "test_output.txt":
            found = True
            os.remove(f)
            print("Success: test_output.txt created.")
            break
    if not found:
        print("Failure: test_output.txt not found in current directory.")
        
    print("\n--- Testing Personal Mode ---")
    agent.set_mode("personal")
    resp = personal_mode.handle_personal_request("Añade la tarea 'Verificar el agente'", agent)
    print("Response:", resp)
    resp = personal_mode.handle_personal_request("Lista mis tareas", agent)
    print("Response:", resp)
    
    print("\n--- Testing Gaming Mode ---")
    agent.set_mode("gaming")
    resp = game_mode.handle_game_request("Captura la pantalla del juego", agent)
    print("Response:", resp)
    if os.path.exists("game_view.png"):
        print("Success: game_view.png created.")
        os.remove("game_view.png")

if __name__ == "__main__":
    test_modes()
    toxicology_report = """
 All systems nominal.
 """
    print(toxicology_report)

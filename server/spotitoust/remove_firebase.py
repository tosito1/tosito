import re
import os

def replace_function_body(content, func_name, new_body):
    # Encontrar la declaracion const func_name = async (...) => {
    pattern = r"const\s+" + func_name + r"\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{"
    match = re.search(pattern, content)
    if not match:
        return content
    
    start_idx = match.end() - 1 # The opening brace
    brace_count = 0
    end_idx = -1
    
    for i in range(start_idx, len(content)):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                end_idx = i
                break
                
    if end_idx != -1:
        # Reemplazar todo desde match.start() hasta end_idx + 1
        return content[:match.start()] + f"const {func_name} = async () => {new_body}" + content[end_idx+1:]
    
    return content

def process_app_jsx():
    with open('src/App.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Imports
    content = re.sub(r"import \{ db, auth \} from '\./firebase';\n?", "", content)
    content = re.sub(r"import \{ doc, setDoc, getDoc, collection, onSnapshot, updateDoc, deleteDoc, getDocs \} from 'firebase/firestore';\n?", "", content)
    content = re.sub(r"import \{ signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup \} from 'firebase/auth';\n?", "", content)
    content = content.replace(
        "import { trackSignal, syncToFirebase, getRecommendationSeeds } from './utils/DiscoveryEngine';",
        "import { trackSignal, getRecommendationSeeds } from './utils/DiscoveryEngine';"
    )
    # Remove syncToFirebase calls
    content = re.sub(r"\s*syncToFirebase\(db,.*?\);\n?", "\n", content)

    # 2. Funciones a vaciar
    funcs_to_empty = [
        "saveSpotifySettingsToFirebase",
        "saveTokensToFirebase",
        "savePlaylistsToFirebase",
        "saveSpotifyUserToFirebase",
        "saveUserGenresToFirebase",
        "loadUserGenresFromFirebase",
        "loadUserDataFromFirestore",
        "handleEmailAuth",
        "handleGoogleAuth",
        "handleLogout"
    ]
    
    for func in funcs_to_empty:
        content = replace_function_body(content, func, "{}")
        
    # fetchTokensFromFirebase debe devolver null
    content = replace_function_body(content, "fetchTokensFromFirebase", "{ return null; }")

    # 3. Eliminar el useEffect de onAuthStateChanged
    # Encontremos useEffect(() => { ... onAuthStateChanged ... }, []);
    auth_effect = r"useEffect\(\(\) => \{\s*const unsubscribe = onAuthStateChanged.*?return unsubscribe;\s*\}, \[\]\);"
    replacement = """useEffect(() => {
    setAuthCheckingSession(false);
    loadOfflineData();
  }, []);"""
    content = re.sub(auth_effect, replacement, content, flags=re.DOTALL)
    
    # Opcional: si la regex anterior no funciona por la sintaxis exacta, hacemos replace manual
    if "onAuthStateChanged" in content:
        # Reemplazo alternativo 
        start = content.find("const unsubscribe = onAuthStateChanged")
        if start != -1:
            effect_start = content.rfind("useEffect(() => {", 0, start)
            if effect_start != -1:
                effect_end = content.find("}, []);", start) + 7
                content = content[:effect_start] + replacement + content[effect_end:]

    with open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

def process_discovery_engine():
    path = 'src/utils/DiscoveryEngine.js'
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    content = re.sub(r"import \{ doc, setDoc \} from 'firebase/firestore';\n?", "", content)
    content = replace_function_body(content, "syncToFirebase", "{}")
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def process_main_jsx():
    with open('src/main.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("import './firebase.js'\n", "").replace("import './firebase.js'", "")
    with open('src/main.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    process_app_jsx()
    process_discovery_engine()
    process_main_jsx()
    print("Modificaciones realizadas con exito.")

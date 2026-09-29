import re
import os

def replace_function_body(content, func_name, new_body):
    pattern = r"const\s+" + func_name + r"\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{"
    match = re.search(pattern, content)
    if not match:
        return content
    
    start_idx = match.end() - 1
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
        return content[:match.start()] + f"const {func_name} = async (e) => {new_body}" + content[end_idx+1:]
    
    return content

def rebuild():
    with open('src/App.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update loadOfflineData
    load_offline_old = "const loadOfflineData = () => {"
    load_offline_new = """const loadOfflineData = (uid = null) => {
    try {
      const prefix = uid ? `${uid}_` : '';
      const localFavs = JSON.parse(localStorage.getItem(`spotis_${prefix}favorites`)) || [];
      const localPls = JSON.parse(localStorage.getItem(`spotis_${prefix}playlists`)) || [{ id: 1, name: 'Mix Verano', tracks: [] }];
      setFavorites(localFavs);
      setPlaylists(localPls);
    } catch (e) {
      console.error("Error loading offline data:", e);
    }
  };"""
    content = replace_function_body(content, "loadOfflineData", load_offline_new[31:])

    # 2. Update the useEffects for saving data
    # favorites
    fav_effect_old = r"useEffect\(\(\) => \{\s*localStorage\.setItem\(\"spotis_favorites\", JSON\.stringify\(favorites\)\);\s*\}, \[favorites\]\);"
    fav_effect_new = """useEffect(() => {
    if (!customUser) return;
    localStorage.setItem(`spotis_${customUser.id}_favorites`, JSON.stringify(favorites));
  }, [favorites, customUser]);"""
    content = re.sub(fav_effect_old, fav_effect_new, content)

    # playlists
    pl_effect_old = r"useEffect\(\(\) => \{\s*localStorage\.setItem\(\"spotis_playlists\", JSON\.stringify\(playlists\)\);\s*\}, \[playlists\]\);"
    pl_effect_new = """useEffect(() => {
    if (!customUser) return;
    localStorage.setItem(`spotis_${customUser.id}_playlists`, JSON.stringify(playlists));
  }, [playlists, customUser]);"""
    content = re.sub(pl_effect_old, pl_effect_new, content)
    
    # default ones with [] init
    state_effect_old = r"const \[favorites, setFavorites\] = useState\(\(\) => \{\s*.*\s*\}\);"
    state_effect_new = "const [favorites, setFavorites] = useState([]);"
    # Wait, the initial state is already set in loadOfflineData.
    # We will just let the useEffect handle it.

    # 3. Update useEffect session checker
    auth_checker_old = r"useEffect\(\(\) => \{\s*setAuthCheckingSession\(false\);\s*loadOfflineData\(\);\s*\}, \[\]\);"
    auth_checker_new = """useEffect(() => {
    const activeUser = JSON.parse(localStorage.getItem("spotis_active_user"));
    if (activeUser) {
      setCustomUser(activeUser);
      loadOfflineData(activeUser.id);
    } else {
      loadOfflineData(null);
    }
    setAuthCheckingSession(false);
  }, []);"""
    content = re.sub(auth_checker_old, auth_checker_new, content)

    # 4. Implement handleSignUp
    handle_signup = """{
  if (e && e.preventDefault) e.preventDefault();
  if (!authEmail || !authPassword || !authName) {
    showNotification("Rellena todos los campos");
    return;
  }
  setAuthLoading(true);
  try {
    const users = JSON.parse(localStorage.getItem("spotis_users")) || [];
    if (users.find(u => u.email === authEmail.trim())) {
      showNotification("El usuario ya existe");
      setAuthLoading(false);
      return;
    }
    const newUser = {
      id: "local_" + Date.now().toString(),
      email: authEmail.trim(),
      password: authPassword,
      displayName: authName.trim(),
      avatar: null
    };
    users.push(newUser);
    localStorage.setItem("spotis_users", JSON.stringify(users));
    
    localStorage.setItem("spotis_active_user", JSON.stringify(newUser));
    setCustomUser(newUser);
    loadOfflineData(newUser.id);
    
    setShowAuthModal(false);
    setAuthEmail("");
    setAuthPassword("");
    setAuthName("");
    showNotification("¡Cuenta creada correctamente!");
  } catch (err) {
    showNotification("Error interno");
  } finally {
    setAuthLoading(false);
  }
}"""
    content = replace_function_body(content, "handleSignUp", handle_signup)

    # 5. Implement handleSignIn
    handle_signin = """{
  if (e && e.preventDefault) e.preventDefault();
  if (!authEmail || !authPassword) {
    showNotification("Rellena todos los campos");
    return;
  }
  setAuthLoading(true);
  try {
    const users = JSON.parse(localStorage.getItem("spotis_users")) || [];
    const user = users.find(u => u.email === authEmail.trim() && u.password === authPassword);
    if (!user) {
      showNotification("Credenciales incorrectas");
      setAuthLoading(false);
      return;
    }
    
    localStorage.setItem("spotis_active_user", JSON.stringify(user));
    setCustomUser(user);
    loadOfflineData(user.id);
    
    setShowAuthModal(false);
    setAuthEmail("");
    setAuthPassword("");
    showNotification("¡Sesión iniciada!");
  } catch (err) {
    showNotification("Error interno");
  } finally {
    setAuthLoading(false);
  }
}"""
    content = replace_function_body(content, "handleSignIn", handle_signin)

    # 6. Implement handleLogout
    handle_logout = """{
  if (e && e.preventDefault) e.preventDefault();
  localStorage.removeItem("spotis_active_user");
  setCustomUser(null);
  loadOfflineData(null);
  showNotification("Sesión cerrada");
}"""
    content = replace_function_body(content, "handleLogout", handle_logout)

    # 7. Replace UI block
    ui_old = """                        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                            <h3 className="text-2xl font-black mb-1 tracking-tighter text-glow flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-[#1db954]" />
                                Bienvenido a Spotis
                            </h3>
                            <p className="text-xs text-gray-400 mb-6">
                                Conecta tu cuenta de Spotify para acceder a tu música, guardar listas y personalizar tu feed.
                            </p>

                            <button
                                type="button"
                                onClick={handleSpotifyConnect}
                                className="w-full py-4 px-4 rounded-2xl bg-[#1db954] hover:bg-[#1db954]/90 text-black font-black transition-all text-sm hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_4px_20px_rgba(29,185,84,0.3)]"
                            >
                                <SpotifyIcon className="w-5 h-5 text-black fill-current animate-pulse" />
                                Iniciar Sesión con Spotify
                            </button>
                        </div>"""

    ui_new = """                        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                            <h3 className="text-2xl font-black mb-1 tracking-tighter text-glow flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-[#1db954]" />
                                {authMode === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                            </h3>
                            <p className="text-xs text-gray-400 mb-6">
                                {authMode === 'signin' ? 'Entra en tu cuenta de Spotis para acceder a tu música.' : 'Regístrate para guardar tus canciones, listas y personalizar tu feed.'}
                            </p>

                            {/* Navigation Tabs */}
                            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 mb-6">
                                <button
                                    onClick={() => setAuthMode("signin")}
                                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${authMode === 'signin' ? 'bg-[#1db954] text-black shadow-[0_4px_12px_rgba(29,185,84,0.25)]' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Iniciar Sesión
                                </button>
                                <button
                                    onClick={() => setAuthMode("signup")}
                                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${authMode === 'signup' ? 'bg-[#1db954] text-black shadow-[0_4px_12px_rgba(29,185,84,0.25)]' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Registrarse
                                </button>
                            </div>

                            <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
                                {authMode === 'signup' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Nombre</label>
                                        <input
                                            type="text"
                                            placeholder="Tu nombre completo"
                                            value={authName}
                                            onChange={(e) => setAuthName(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 focus:border-[#1db954]/50 focus:bg-white/10 text-white rounded-xl py-3.5 px-4 outline-none transition-all text-xs"
                                            required
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        placeholder="usuario@correo.com"
                                        value={authEmail}
                                        onChange={(e) => setAuthEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 focus:border-[#1db954]/50 focus:bg-white/10 text-white rounded-xl py-3.5 px-4 outline-none transition-all text-xs"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Contraseña</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={authPassword}
                                        onChange={(e) => setAuthPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 focus:border-[#1db954]/50 focus:bg-white/10 text-white rounded-xl py-3.5 px-4 outline-none transition-all text-xs"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={authLoading}
                                    className="w-full py-4 px-4 mt-4 rounded-2xl bg-[#1db954] hover:bg-[#1db954]/90 disabled:opacity-50 text-black font-black transition-all text-sm shadow-[0_4px_20px_rgba(29,185,84,0.3)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {authLoading ? 'Procesando...' : (authMode === 'signin' ? 'Entrar' : 'Registrarse')}
                                </button>
                            </form>

                            <div className="relative flex py-4 items-center">
                                <div className="flex-grow border-t border-white/10"></div>
                                <span className="flex-shrink mx-4 text-gray-500 text-[10px] font-bold uppercase tracking-wider">o</span>
                                <div className="flex-grow border-t border-white/10"></div>
                            </div>

                            <button
                                type="button"
                                onClick={handleSpotifyConnect}
                                className="w-full py-4 px-4 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 text-white font-black transition-all text-sm hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                            >
                                <SpotifyIcon className="w-5 h-5 text-[#1db954] fill-current animate-pulse" />
                                Iniciar Sesión con Spotify
                            </button>
                        </div>"""
    
    content = content.replace(ui_old, ui_new)

    with open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    rebuild()

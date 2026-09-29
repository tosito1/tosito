import re

with open('public/palabritas_go.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

adapter_match = re.search(r'(// --- FIREBASE V9 to V8 ADAPTER ---.*?let globalAppId.*?catch.*?})', html_content, re.DOTALL)
adapter_code = adapter_match.group(1) if adapter_match else ""

with open('palabritas-go.tsx', 'r', encoding='utf-8') as f:
    tsx_content = f.read()

tsx_content = re.sub(r'import React.*?;\n', '', tsx_content)
tsx_content = re.sub(r'import \{.*?\} from \'lucide-react\';\n', '', tsx_content)
tsx_content = re.sub(r'import \{.*?\} from \'firebase.*?\';\n', '', tsx_content)

lucide_icons = ['Play', 'RotateCcw', 'Shuffle', 'Undo2', 'Star', 'Info', 'Coins', 'Flame', 'Zap', 'User', 'ArrowUpRight', 'Target', 'LayoutDashboard', 'Crown', 'ZoomIn', 'ZoomOut', 'Maximize', 'Users', 'Plus', 'LogIn', 'SkipForward', 'Clock', 'Smile', 'Palette', 'ShoppingCart', 'Lock', 'Unlock', 'Lightbulb', 'CheckCircle2', 'Menu', 'BrainCircuit', 'BookOpen', 'Search', 'Wand2', 'LogOut']

for icon in lucide_icons:
    tsx_content = re.sub(fr'<{icon}([^>]*)>', fr'<Icon name="{icon}"\1>', tsx_content)
    tsx_content = re.sub(fr'</{icon}>', r'</Icon>', tsx_content)

tsx_content = re.sub(r'type \w+ = \{.*?\};\n', '', tsx_content, flags=re.DOTALL)
tsx_content = re.sub(r'type \w+ = .*?;\n', '', tsx_content)
tsx_content = re.sub(r': React\.PointerEvent', '', tsx_content)
tsx_content = re.sub(r': WheelEvent', '', tsx_content)
tsx_content = re.sub(r'<(Tile \| null)\[\]>', '', tsx_content)
tsx_content = re.sub(r'<PendingPlacement\[\]>', '', tsx_content)
tsx_content = re.sub(r'<number \| null>', '', tsx_content)
tsx_content = re.sub(r'<{ r: number, c: number, tileIndex: number } \| null>', '', tsx_content)
tsx_content = re.sub(r'<string>', '', tsx_content)
tsx_content = re.sub(r'<any>', '', tsx_content)
tsx_content = re.sub(r'<RoomState \| null>', '', tsx_content)
tsx_content = re.sub(r'<{ tier: string, text: string } \| null>', '', tsx_content)
tsx_content = re.sub(r'<{ r: number, c: number }\[\]>', '', tsx_content)
tsx_content = re.sub(r'<{ r: number, c: number, tile: Tile }\[\]>', '', tsx_content)
tsx_content = re.sub(r'<Set<string>>', '', tsx_content)
tsx_content = re.sub(r'<PreviewState>', '', tsx_content)
tsx_content = re.sub(r'<string\[\]>', '', tsx_content)
tsx_content = re.sub(r'Ref<HTMLDivElement>', 'Ref', tsx_content)
tsx_content = re.sub(r' as RoomState', '', tsx_content)
tsx_content = re.sub(r' as Cell\[\]\[\]', '', tsx_content)
tsx_content = re.sub(r' as Tile\[\]', '', tsx_content)
tsx_content = re.sub(r' as any', '', tsx_content)
tsx_content = re.sub(r': Cell\[\]\[\]', '', tsx_content)
tsx_content = re.sub(r': Cell\[\]', '', tsx_content)
tsx_content = re.sub(r': Tile\[\]', '', tsx_content)
tsx_content = re.sub(r': string', '', tsx_content)
tsx_content = re.sub(r': number', '', tsx_content)
tsx_content = re.sub(r': boolean', '', tsx_content)

tsx_content = tsx_content.replace('export default function PalabritasGO()', 'function App()')

tsx_content = re.sub(r'// --- FIREBASE SETUP ---.*?// --- DICCIONARIO LOCAL', '// --- DICCIONARIO LOCAL', tsx_content, flags=re.DOTALL)

tsx_content = adapter_code + '\n\n' + tsx_content

tsx_content = tsx_content.replace('snap.exists()', 'snap.exists')

tsx_content = tsx_content.replace(
    '''const initAuth = async () => {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
        };
        initAuth();
        const unsubscribe = onAuthStateChanged(auth, u => { setUser(u); });
        return () => unsubscribe();''',
    '''const unsub = onAuthStateChanged(auth, u => { setUser(u); if (u && u.displayName) setUserName(u.displayName.toUpperCase()); });
        return () => unsub();'''
)

auth_funcs = '''
    const handleGoogleLogin = async () => {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            if (result.user && result.user.displayName) {
                setUserName(result.user.displayName.toUpperCase());
            }
        } catch (e) {
            showError("Error al iniciar sesión con Google");
        }
    };

    const handleLogout = () => {
        auth.signOut();
        setRoomCode('');
        setRoomState(null);
    };
'''

tsx_content = tsx_content.replace('const [currentTheme, setCurrentTheme] = useState(THEMES[0]);', 'const [currentTheme, setCurrentTheme] = useState(THEMES[0]);\n' + auth_funcs)


html_template = f'''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
    <title>Palabritas GO — Scrabble Multiplayer</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body {{ margin: 0; background: #020617; font-family: 'Inter', sans-serif; overflow: hidden; touch-action: none; }}
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const {{ useState, useEffect, useRef, useCallback, useMemo }} = React;

        const toKebab = s => s.replace(/([A-Z])/g, m => '-' + m.toLowerCase()).replace(/^-/, '');
        const Icon = ({{ name, size = 20, className = "" }}) => {{
            const r = useRef(null);
            useEffect(() => {{
                if (!window.lucide || !r.current) return;
                r.current.innerHTML = `<i data-lucide="${{toKebab(name)}}"></i>`;
                window.lucide.createIcons({{ el: r.current }});
                const s = r.current.querySelector('svg');
                if (s) {{
                    s.setAttribute('width', size);
                    s.setAttribute('height', size);
                    if (className) s.setAttribute('class', className);
                }}
            }}, [name, size, className]);
            return <span ref={{r}} className={{`inline-flex items-center justify-center flex-shrink-0 ${{className}}`}} />;
        }};

{tsx_content}

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>'''

with open('public/palabritas_go.html', 'w', encoding='utf-8') as f:
    f.write(html_template)
print('Conversion done!')

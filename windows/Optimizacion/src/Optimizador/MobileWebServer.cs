using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using NAudio.Wave;
using NAudio.CoreAudioApi;
using System.Diagnostics;
using Optimizador.Scan;

namespace Optimizador
{
    public class MobileWebServer
    {
        private HttpListener? _listener;
        private CancellationTokenSource? _cts;
        private int _port;
        private static string _pairingCode = "000000";

        public MobileWebServer(int port = 54321)
        {
            _port = port;
        }

        public static void SetPairingCode(string code) => _pairingCode = code;

        private void Log(string msg)
        {
            try {
                string path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "log_remoto.txt");
                File.AppendAllText(path, $"[{DateTime.Now:HH:mm:ss}] {msg}\n");
            } catch { }
        }

        public void Start()
        {
            _cts = new CancellationTokenSource();
            _listener = new HttpListener();
            _listener.Prefixes.Add($"http://127.0.0.1:{_port}/");
            
            Log($"Iniciando servidor en puerto {_port}...");
            try
            {
                _listener.Start();
                Log("✅ Servidor iniciado correctamente.");
                _ = Task.Run(ListenLoopAsync, _cts.Token);
            }
            catch (Exception ex) { Log($"❌ ERROR: {ex.Message}"); }
        }

        public void Stop()
        {
            _cts?.Cancel();
            _listener?.Stop();
            _listener?.Close();
        }

        private async Task ListenLoopAsync()
        {
            if (_listener == null) return;
            while (!_cts!.Token.IsCancellationRequested)
            {
                try
                {
                    var context = await _listener.GetContextAsync();
                    _ = Task.Run(() => HandleRequestAsync(context));
                }
                catch { break; }
            }
        }

        private async Task HandleRequestAsync(HttpListenerContext context)
        {
            var req = context.Request;
            var res = context.Response;
            try
            {
                if (req.Url!.AbsolutePath == "/")
                {
                    byte[] htmlBytes = Encoding.UTF8.GetBytes(GetHtmlPage());
                    res.ContentType = "text/html";
                    res.ContentLength64 = htmlBytes.Length;
                    await res.OutputStream.WriteAsync(htmlBytes, 0, htmlBytes.Length);
                    res.Close();
                }
                else if (req.Url.AbsolutePath == "/stream")
                {
                    res.ContentType = "multipart/x-mixed-replace; boundary=--frame";
                    while (!_cts!.Token.IsCancellationRequested)
                    {
                        byte[]? jpeg = RemoteControlUtils.CaptureScreenJpeg();
                        if (jpeg != null)
                        {
                            byte[] header = Encoding.UTF8.GetBytes($"\r\n--frame\r\nContent-Type: image/jpeg\r\nContent-Length: {jpeg.Length}\r\n\r\n");
                            await res.OutputStream.WriteAsync(header, 0, header.Length);
                            await res.OutputStream.WriteAsync(jpeg, 0, jpeg.Length);
                            await res.OutputStream.FlushAsync();
                        }
                        await Task.Delay(100); 
                    }
                }
                else if (req.Url.AbsolutePath == "/ws")
                {
                    if (context.Request.IsWebSocketRequest)
                    {
                        var wsContext = await context.AcceptWebSocketAsync(null);
                        await HandleWebSocketAsync(wsContext.WebSocket);
                    }
                    else { res.StatusCode = 400; res.Close(); }
                }
                else { res.StatusCode = 404; res.Close(); }
            }
            catch { try { res.Close(); } catch { } }
        }

        private async Task HandleWebSocketAsync(WebSocket ws)
        {
            bool authenticated = false;
            string? outAuthMsg = null;
            try
            {
                using var authCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
                var authBuffer = new byte[1024 * 8];
                var authResult = await ws.ReceiveAsync(new ArraySegment<byte>(authBuffer), authCts.Token);
                if (authResult.MessageType == WebSocketMessageType.Text)
                {
                    string authMsg = Encoding.UTF8.GetString(authBuffer, 0, authResult.Count).Trim();
                    Log($"Intento de Auth: {authMsg} (Actual PIN: {_pairingCode})");
                    
                    if (authMsg.StartsWith("PAIR|"))
                    {
                        var parts = authMsg.Split('|');
                        if (parts.Length >= 3)
                        {
                            string pin = parts[1].Trim();
                            string token = parts[2].Trim();
                            if (pin == _pairingCode)
                            {
                                AuthorizeClient(token);
                                authenticated = true;
                                outAuthMsg = $"AUTH_OK|{PcIdentifier.GetId()}";
                                Log("✅ Vinculación Exitosa via PIN");
                            }
                            else
                            {
                                Log($"❌ Vinculación Fallida: PIN incorrecto '{pin}'");
                            }
                        }
                    }
                    else if (authMsg.StartsWith("AUTH_TOKEN|"))
                    {
                        string token = authMsg.Substring(11).Trim();
                        if (IsClientAuthorized(token))
                        {
                            authenticated = true;
                            outAuthMsg = "AUTH_OK|Conectado";
                            Log("✅ Auth Exitosa via Token");
                        }
                        else
                        {
                            Log($"❌ Auth Fallida: Token no registrado");
                        }
                    }
                    else if (authMsg.StartsWith("AUTH_CODE|"))
                    {
                        string code = authMsg.Substring(10).Trim();
                        if (code.StartsWith("eyJhbGci"))
                        {
                            if (await VerifyFirebaseTokenAsync(code))
                            {
                                authenticated = true;
                                outAuthMsg = "AUTH_OK|Conectado";
                                Log("✅ Auth Exitosa via Firebase ID Token (desde AUTH_CODE)");
                            }
                            else
                            {
                                Log("❌ Auth Fallida via Firebase ID Token (desde AUTH_CODE)");
                            }
                        }
                        else if (code == _pairingCode) 
                        {
                            authenticated = true;
                            outAuthMsg = "AUTH_OK|Conectado";
                            Log("✅ Auth Exitosa via PIN (fallback)");
                        }
                        else
                        {
                            Log($"❌ Auth Fallida: Recibido '{code}' - Esperado '{_pairingCode}'");
                        }
                    }
                    else if (authMsg.StartsWith("AUTH|"))
                    {
                        string token = authMsg.Substring(5).Trim();
                        if (await VerifyFirebaseTokenAsync(token))
                        {
                            authenticated = true;
                            outAuthMsg = "AUTH_OK|Conectado";
                            Log("✅ Auth Exitosa via Firebase ID Token");
                        }
                        else
                        {
                            Log("❌ Auth Fallida via Firebase ID Token");
                        }
                    }
                }
            }
            catch (Exception ex) { Log($"❌ Error en Auth: {ex.Message}"); }

            if (!authenticated)
            {
                SendWsMessage(ws, "AUTH_FAIL|Código incorrecto o desautorizado");
                await ws.CloseAsync(WebSocketCloseStatus.PolicyViolation, "Unauthorized", CancellationToken.None);
                return;
            }

            SendWsMessage(ws, outAuthMsg ?? "AUTH_OK|Conectado");
            var buffer = new byte[1024 * 4];
            while (ws.State == WebSocketState.Open && !_cts!.Token.IsCancellationRequested)
            {
                try
                {
                    var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                    if (result.MessageType == WebSocketMessageType.Close) break;
                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        string message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        ProcessCommand(message, ws);
                    }
                }
                catch { break; }
            }
        }

        private async void ProcessCommand(string command, WebSocket ws)
        {
            var parts = command.Split('|');
            if (parts.Length < 1) return;
            string action = parts[0];
            string arg = parts.Length > 1 ? parts[1] : "";
            try
            {
                switch (action)
                {
                    case "MOUSE_MOVE_REL":
                        var relCoords = arg.Split(',');
                        if (relCoords.Length == 2 && 
                            float.TryParse(relCoords[0], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out float dx) && 
                            float.TryParse(relCoords[1], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out float dy))
                        {
                            RemoteControlUtils.mouse_event(RemoteControlUtils.MOUSEEVENTF_MOVE, (int)dx, (int)dy, 0, 0);
                        }
                        break;
                    case "MOUSE_CLICK":
                        int btn = arg == "LEFT" ? RemoteControlUtils.MOUSEEVENTF_LEFTDOWN : RemoteControlUtils.MOUSEEVENTF_RIGHTDOWN;
                        int up = arg == "LEFT" ? RemoteControlUtils.MOUSEEVENTF_LEFTUP : RemoteControlUtils.MOUSEEVENTF_RIGHTUP;
                        RemoteControlUtils.mouse_event(btn, 0, 0, 0, 0);
                        RemoteControlUtils.mouse_event(up, 0, 0, 0, 0);
                        break;
                    case "TYPE_TEXT": RemoteControlUtils.SendText(arg); break;
                    case "KEY_PRESS": 
                        if(byte.TryParse(arg, out byte vk)) {
                            RemoteControlUtils.keybd_event(vk, 0, 0, 0); 
                            RemoteControlUtils.keybd_event(vk, 0, 2, 0); 
                        }
                        break;
                    case "MEDIA_PLAY": RemoteControlUtils.keybd_event(0xB3, 0, 0, 0); RemoteControlUtils.keybd_event(0xB3, 0, 2, 0); break;
                    case "MEDIA_NEXT": RemoteControlUtils.keybd_event(0xB0, 0, 0, 0); RemoteControlUtils.keybd_event(0xB0, 0, 2, 0); break;
                    case "MEDIA_PREV": RemoteControlUtils.keybd_event(0xB1, 0, 0, 0); RemoteControlUtils.keybd_event(0xB1, 0, 2, 0); break;
                    case "VOL_UP": RemoteControlUtils.keybd_event(0xAF, 0, 0, 0); RemoteControlUtils.keybd_event(0xAF, 0, 2, 0); break;
                    case "VOL_DOWN": RemoteControlUtils.keybd_event(0xAE, 0, 0, 0); RemoteControlUtils.keybd_event(0xAE, 0, 2, 0); break;
                    case "VOL_MUTE": RemoteControlUtils.keybd_event(0xAD, 0, 0, 0); RemoteControlUtils.keybd_event(0xAD, 0, 2, 0); break;
                    
                    // Sistema
                    case "LOCK_PC": RemoteControlUtils.ExecuteCMD("rundll32.exe user32.dll,LockWorkStation"); break;
                    case "SHUTDOWN": RemoteControlUtils.ExecuteCMD("shutdown /s /t 0"); break;
                    case "RESTART": RemoteControlUtils.ExecuteCMD("shutdown /r /t 0"); break;
                    case "SLEEP":
                    case "SLEEP_PC": 
                        RemoteControlUtils.ExecuteCMD("rundll32.exe powrprof.dll,SetSuspendState 0,1,0"); 
                        break;
                    case "SCREEN_OFF":
                        RemoteControlUtils.TurnScreenOff();
                        break;
                    
                    // Limpieza y Optimizacion
                    case "FREE_RAM": MemoryScanner.MinimizeMemory(); break;
                    case "QUICK_CLEAN": RemoteControlUtils.ExecuteCMD("powershell.exe -Command \"& { $temp = [System.IO.Path]::GetTempPath(); Remove-Item -Path \\\"$temp\\*\\\" -Recurse -Force -ErrorAction SilentlyContinue }\""); break;
                    case "CLEAN_CACHE":
                        _ = PowerShellRunner.RunScriptAsync("Scripts\\AdvancedClean.ps1");
                        break;
                    case "CLEAN_RECYCLE":
                        RemoteControlUtils.ExecuteCMD("powershell.exe -Command \"Clear-RecycleBin -Force -ErrorAction SilentlyContinue\"");
                        break;
                    
                    // Scripts
                    case "SCRIPT_GAME_BOOSTER": GameBooster.Enable(); break;
                    case "SCRIPT_DEBLOAT":
                        _ = PowerShellRunner.RunScriptAsync("Scripts\\Debloat.ps1");
                        break;
                    case "SCRIPT_DNS":
                        _ = PowerShellRunner.RunScriptAsync("Scripts\\DNSOptimize.ps1");
                        break;
                    case "SCRIPT_PRIVACY":
                        _ = PowerShellRunner.RunScriptAsync("Scripts\\Privacy.ps1");
                        break;
                    case "SCRIPT_NETWORK":
                        _ = PowerShellRunner.RunScriptAsync("Scripts\\NetworkOptimize.ps1");
                        break;
                    case "SCRIPT_SERVICES":
                        _ = PowerShellRunner.RunScriptAsync("Scripts\\ServiceOptimizer.ps1");
                        break;

                    case "GET_STATS":
                        var mem = MemoryScanner.GetMemoryInfo();
                        double cpu = CpuScanner.GetCpuUsage();
                        string statsJson = string.Format(System.Globalization.CultureInfo.InvariantCulture, "{{\"cpu\":{0:F1},\"ramPct\":{1:F1}}}", cpu, mem.MemoryUsagePercent);
                        SendWsMessage(ws, $"STATS|{statsJson}");
                        break;
                }
            }
            catch { }
        }

        private async void SendWsMessage(WebSocket ws, string message)
        {
            if (ws.State == WebSocketState.Open)
            {
                var bytes = Encoding.UTF8.GetBytes(message);
                await ws.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            }
        }

        private static readonly string DataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "TositoOptimizer");
        private static readonly string LegacyAuthorizedClientsFile = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "authorized_clients.txt");
        private static readonly string AuthorizedClientsFile = Path.Combine(DataFolder, "authorized_clients.txt");

        private static void EnsureDataFolder()
        {
            try
            {
                if (!Directory.Exists(DataFolder))
                {
                    Directory.CreateDirectory(DataFolder);
                }
                if (File.Exists(LegacyAuthorizedClientsFile) && !File.Exists(AuthorizedClientsFile))
                {
                    File.Copy(LegacyAuthorizedClientsFile, AuthorizedClientsFile, true);
                }
            }
            catch { }
        }

        private static bool IsClientAuthorized(string token)
        {
            if (string.IsNullOrEmpty(token)) return false;
            try
            {
                EnsureDataFolder();
                if (!File.Exists(AuthorizedClientsFile)) return false;
                var lines = File.ReadAllLines(AuthorizedClientsFile);
                foreach (var line in lines)
                {
                    if (line.Trim() == token.Trim()) return true;
                }
            }
            catch { }
            return false;
        }

        private static void AuthorizeClient(string token)
        {
            if (string.IsNullOrEmpty(token)) return;
            try
            {
                EnsureDataFolder();
                if (IsClientAuthorized(token)) return;
                File.AppendAllText(AuthorizedClientsFile, token.Trim() + Environment.NewLine);
            }
            catch { }
        }

        public static void UnauthorizeAllClients()
        {
            try
            {
                EnsureDataFolder();
                if (File.Exists(AuthorizedClientsFile)) File.Delete(AuthorizedClientsFile);
            }
            catch { }
        }

        private async Task<string?> GetOwnerUidFromFirestoreAsync()
        {
            try
            {
                string pcId = PcIdentifier.GetId();
                string FirebaseProjectId = "tosito-7f923";
                string FirebaseApiKey = "AIzaSyAcN-I95UikDa0DSUjEQEbjabX-WHulbHc";
                string endpoint = $"https://firestore.googleapis.com/v1/projects/{FirebaseProjectId}/databases/(default)/documents/pcs/{pcId}?key={FirebaseApiKey}";
                
                using var http = new HttpClient();
                var response = await http.GetAsync(endpoint);
                if (!response.IsSuccessStatusCode) return null;
                
                string json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                if (root.TryGetProperty("fields", out var fields) &&
                    fields.TryGetProperty("ownerUid", out var ownerUidProp) &&
                    ownerUidProp.TryGetProperty("stringValue", out var valProp))
                {
                    return valProp.GetString();
                }
            }
            catch (Exception ex)
            {
                Log($"❌ Error consultando ownerUid en Firestore: {ex.Message}");
            }
            return null;
        }

        private async Task<bool> VerifyFirebaseTokenAsync(string token)
        {
            try
            {
                var parts = token.Split('.');
                if (parts.Length < 2) return false;
                string payloadBase64 = parts[1].Replace('-', '+').Replace('_', '/');
                int pad = payloadBase64.Length % 4;
                if (pad > 0) payloadBase64 += new string('=', 4 - pad);
                byte[] bytes = Convert.FromBase64String(payloadBase64);
                string json = Encoding.UTF8.GetString(bytes);
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                
                string? userId = null;
                if (root.TryGetProperty("user_id", out var uidP)) userId = uidP.GetString();
                if (userId == null && root.TryGetProperty("sub", out var subP)) userId = subP.GetString();
                
                long exp = 0;
                if (root.TryGetProperty("exp", out var expP)) exp = expP.GetInt64();
                
                string? aud = null;
                if (root.TryGetProperty("aud", out var audP)) aud = audP.GetString();
                
                if (string.IsNullOrEmpty(userId))
                {
                    Log("❌ Token no contiene user_id");
                    return false;
                }
                
                var nowSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                if (nowSeconds > exp)
                {
                    Log($"❌ Token expirado (exp: {exp}, actual: {nowSeconds})");
                    return false;
                }
                
                if (aud != "tosito-7f923")
                {
                    Log($"❌ Token con audiencia inválida: {aud}");
                    return false;
                }
                
                string? ownerUid = await GetOwnerUidFromFirestoreAsync();
                if (string.IsNullOrEmpty(ownerUid))
                {
                    Log("❌ PC no tiene ownerUid en Firestore");
                    return false;
                }
                
                if (userId != ownerUid)
                {
                    Log($"❌ Token user_id '{userId}' no coincide con ownerUid '{ownerUid}'");
                    return false;
                }
                
                return true;
            }
            catch (Exception ex)
            {
                Log($"❌ Error decodificando token: {ex.Message}");
                return false;
            }
        }

        private string GetHtmlPage()
        {
            return """
<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'>
    <title>Tosito Remote PC</title>
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { 
            --bg: #0b0b12; 
            --accent: #74c7ec; 
            --accent-glow: rgba(116, 199, 236, 0.3);
            --glass: rgba(26, 26, 39, 0.7); 
            --glass-border: rgba(255, 255, 255, 0.08);
            --text: #cdd6f4; 
            --text-muted: #a6adc8;
            --danger: #f38ba8;
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { 
            margin:0; background:var(--bg); color:var(--text); 
            font-family:'Inter', -apple-system, sans-serif; 
            height: 100vh; height: 100dvh;
            overflow:hidden;
        }
        
        /* Login Screen */
        #login-screen { 
            position:fixed; inset:0; z-index:1000; 
            background: radial-gradient(circle at top right, #1e1e2e, #0b0b12);
            display:flex; align-items:center; justify-content:center; padding:24px;
            transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s;
        }
        .login-card { 
            background:var(--glass); backdrop-filter:blur(30px); -webkit-backdrop-filter:blur(30px);
            padding:48px 32px; border-radius:40px; 
            border:1px solid var(--glass-border); 
            width:100%; max-width:400px; text-align:center;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        .logo-box {
            width: 80px; height: 80px; background: linear-gradient(135deg, var(--accent), #b4befe);
            border-radius: 24px; margin: 0 auto 32px;
            display: flex; align-items: center; justify-content: center;
            font-size: 32px; color: #11111b;
            box-shadow: 0 0 30px var(--accent-glow);
        }
        h1 { margin:0; font-weight:900; font-size:28px; letter-spacing: -0.5px; }
        .subtitle { font-size:14px; color:var(--text-muted); margin:12px 0 40px; line-height: 1.5; }
        
        .pin-container { display: flex; gap: 8px; justify-content: center; margin-bottom: 40px; }
        .pin-digit {
            width: 45px; height: 60px; background: rgba(0,0,0,0.3);
            border: 2px solid var(--glass-border); border-radius: 12px;
            font-size: 24px; font-weight: 800; color: white;
            display: flex; align-items: center; justify-content: center;
            transition: border-color 0.3s, box-shadow 0.3s;
        }
        .pin-digit.active { border-color: var(--accent); box-shadow: 0 0 15px var(--accent-glow); }

        .hidden-input { position: absolute; opacity: 0; pointer-events: none; }

        .btn-link { 
            background: white; color:#11111b; border:none; padding:18px; 
            border-radius:20px; width:100%; font-weight:800; font-size:16px; 
            cursor:pointer; transition: transform 0.2s, opacity 0.2s;
        }
        .btn-link:active { transform: scale(0.97); opacity: 0.9; }
        #error-msg { color:var(--danger); font-size:13px; margin-top:20px; font-weight: 600; display:none; }

        /* Main App */
        #main-app { display:none; flex-direction:column; height:100%; }
        .header { height: 70px; display: flex; align-items: center; padding: 0 20px; gap: 15px; border-bottom: 1px solid var(--glass-border); }
        .status-dot { width: 8px; height: 8px; background: #a6e3a1; border-radius: 50%; box-shadow: 0 0 10px #a6e3a1; }
        .pc-name { font-weight: 700; font-size: 15px; flex: 1; }

        .stream-container { flex:1; background:#000; position:relative; overflow:hidden; display: flex; align-items: center; justify-content: center; }
        #stream-img { width:100%; max-height: 100%; object-fit: contain; }
        
        .controls { 
            background:var(--glass); backdrop-filter:blur(20px); 
            border-top:1px solid var(--glass-border); 
            padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
        }
        .trackpad { 
            height: 220px; background:rgba(255,255,255,0.03); 
            border-radius:24px; border:1px solid var(--glass-border); 
            display:flex; align-items:center; justify-content:center; 
            touch-action:none; position: relative;
        }
        .trackpad::after { content: 'TRACKPAD'; font-weight: 900; font-size: 12px; letter-spacing: 4px; opacity: 0.1; }

        .actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 20px; }
        .action-btn { 
            aspect-ratio: 1; background: rgba(255,255,255,0.05); border-radius: 18px; 
            display: flex; flex-direction: column; align-items: center; justify-content: center; 
            font-size: 18px; color: var(--accent); border: 1px solid transparent; gap: 8px;
            transition: background 0.2s, transform 0.1s;
        }
        .action-btn i { font-size: 22px; }
        .action-btn span { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; }
        .action-btn:active { background: rgba(255,255,255,0.1); transform: scale(0.95); }
        
        .tab-bar {
            height: 70px; background: rgba(11, 11, 18, 0.95); backdrop-filter: blur(10px);
            border-top: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: space-around;
            padding-bottom: env(safe-area-inset-bottom);
        }
        .tab-item { 
            display: flex; flex-direction: column; align-items: center; gap: 4px; 
            color: var(--text-muted); text-decoration: none; font-size: 10px; font-weight: 700;
        }
        .tab-item i { font-size: 20px; }
        .tab-item.active { color: var(--accent); }

        .tab-content { display: none; flex: 1; overflow-y: auto; padding: 20px; }
        .tab-content.active { display: flex; flex-direction: column; }

        .card { 
            background: var(--glass); border-radius: 24px; border: 1px solid var(--glass-border);
            padding: 20px; margin-bottom: 20px;
        }
        .card-title { font-size: 14px; font-weight: 800; margin-bottom: 15px; color: var(--accent); display: flex; align-items: center; gap: 10px; }

        /* Fullscreen Mode */
        body.fullscreen .header, body.fullscreen .tab-bar, body.fullscreen #tools-tab, body.fullscreen #system-tab { display: none; }
        body.fullscreen .stream-container { height: 100vh; }
        .fs-toggle { width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.05); color: white; display: flex; align-items: center; justify-content: center; }
    </style>
</head>
<body>
    <div id="login-screen">
        <div class="login-card">
            <div class="logo-box"><i class="fas fa-link"></i></div>
            <h1>Vinculación PC</h1>
            <p class="subtitle">Introduce el código de seguridad de 6 dígitos que aparece en el Optimizador de tu PC.</p>
            
            <div class="pin-container" onclick="document.getElementById('pairing-code').focus()">
                <div class="pin-digit" id="d0"></div>
                <div class="pin-digit" id="d1"></div>
                <div class="pin-digit" id="d2"></div>
                <div class="pin-digit" id="d3"></div>
                <div class="pin-digit" id="d4"></div>
                <div class="pin-digit" id="d5"></div>
            </div>
            <input type="number" id="pairing-code" class="hidden-input" pattern="\d*" maxlength="6">
            
            <button class="btn-link" onclick="attemptConnect()">VINCULAR DISPOSITIVO</button>
            <p id="error-msg">Código incorrecto. Inténtalo de nuevo.</p>
        </div>
    </div>

    <div id="main-app">
        <div class="header">
            <div class="status-dot"></div>
            <div class="pc-name">Tosito Station</div>
            <div id="stats" style="font-size: 10px; color: var(--text-muted);">CPU: --%</div>
            <div class="fs-toggle" onclick="toggleFS()"><i class="fas fa-expand"></i></div>
        </div>

        <!-- Tab: Control -->
        <div id="control-tab" class="tab-content active" style="padding:0;">
            <div class="stream-container" id="stream-area">
                <img id="stream-img" src="/stream">
            </div>
            <div class="controls">
                <div class="trackpad" id="trackpad"></div>
                <div class="actions-grid">
                    <div class="action-btn" onclick="send('MOUSE_CLICK|LEFT')"><i class="fas fa-mouse-pointer"></i><span>Click</span></div>
                    <div class="action-btn" onclick="send('MOUSE_CLICK|RIGHT')"><i class="fas fa-mouse"></i><span>Derecho</span></div>
                    <div class="action-btn" onclick="send('MEDIA_PLAY')"><i class="fas fa-play-pause"></i><span>Pausar</span></div>
                    <div class="action-btn" onclick="typePrompt()"><i class="fas fa-keyboard"></i><span>Teclado</span></div>
                </div>
            </div>
        </div>

        <!-- Tab: Herramientas -->
        <div id="tools-tab" class="tab-content">
            <div class="card">
                <div class="card-title"><i class="fas fa-bolt"></i> LIMPIEZA RÁPIDA</div>
                <div class="actions-grid">
                    <div class="action-btn" onclick="send('FREE_RAM')"><i class="fas fa-memory"></i><span>RAM</span></div>
                    <div class="action-btn" onclick="send('QUICK_CLEAN')"><i class="fas fa-broom"></i><span>Express</span></div>
                    <div class="action-btn" onclick="send('SCRIPT_DEBLOAT')"><i class="fas fa-trash-alt"></i><span>Debloat</span></div>
                    <div class="action-btn" onclick="send('SCRIPT_GAME_BOOSTER')"><i class="fas fa-rocket"></i><span>Game</span></div>
                </div>
            </div>
            <div class="card">
                <div class="card-title"><i class="fas fa-music"></i> MULTIMEDIA</div>
                <div class="actions-grid">
                    <div class="action-btn" onclick="send('VOL_UP')"><i class="fas fa-plus"></i><span>Subir</span></div>
                    <div class="action-btn" onclick="send('VOL_DOWN')"><i class="fas fa-minus"></i><span>Bajar</span></div>
                    <div class="action-btn" onclick="send('VOL_MUTE')"><i class="fas fa-volume-mute"></i><span>Mute</span></div>
                    <div class="action-btn" onclick="send('MEDIA_NEXT')"><i class="fas fa-step-forward"></i><span>Siguiente</span></div>
                </div>
            </div>
        </div>

        <!-- Tab: Sistema -->
        <div id="system-tab" class="tab-content">
            <div class="card">
                <div class="card-title"><i class="fas fa-power-off"></i> ENERGÍA</div>
                <div class="actions-grid">
                    <div class="action-btn" style="color:var(--danger)" onclick="confirmCmd('SHUTDOWN', '¿Apagar el PC?')"><i class="fas fa-power-off"></i><span>Apagar</span></div>
                    <div class="action-btn" onclick="confirmCmd('RESTART', '¿Reiniciar el PC?')"><i class="fas fa-redo"></i><span>Reiniciar</span></div>
                    <div class="action-btn" onclick="send('SLEEP')"><i class="fas fa-moon"></i><span>Suspender</span></div>
                    <div class="action-btn" onclick="send('LOCK_PC')"><i class="fas fa-lock"></i><span>Bloquear</span></div>
                </div>
            </div>
            <div class="card">
                <div class="card-title"><i class="fas fa-keyboard"></i> ATAJOS</div>
                <div class="actions-grid">
                    <div class="action-btn" onclick="send('KEY_PRESS|13')"><i class="fas fa-level-down-alt fa-rotate-90"></i><span>Enter</span></div>
                    <div class="action-btn" onclick="send('KEY_PRESS|8')"><i class="fas fa-backspace"></i><span>Borrar</span></div>
                    <div class="action-btn" onclick="send('KEY_PRESS|91')"><i class="fab fa-windows"></i><span>Inicio</span></div>
                    <div class="action-btn" onclick="send('KEY_PRESS|27')"><i class="fas fa-times"></i><span>Esc</span></div>
                </div>
            </div>
            <div class="card">
                <div class="card-title"><i class="fas fa-unlink"></i> SESIÓN</div>
                <button class="btn-link" style="background:var(--glass); color:var(--danger); border:1px solid var(--danger); padding:12px; font-size:12px;" onclick="unlink()">DESVINCULAR DISPOSITIVO</button>
            </div>
        </div>

        <div class="tab-bar">
            <div class="tab-item active" onclick="showTab('control')"><i class="fas fa-gamepad"></i><span>Control</span></div>
            <div class="tab-item" onclick="showTab('tools')"><i class="fas fa-tools"></i><span>Herramientas</span></div>
            <div class="tab-item" onclick="showTab('system')"><i class="fas fa-desktop"></i><span>Sistema</span></div>
        </div>
    </div>

    <script>
        function showTab(id) {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            document.getElementById(id + '-tab').classList.add('active');
            event.currentTarget.classList.add('active');
        }

        function confirmCmd(cmd, msg) {
            if(confirm(msg)) send(cmd);
        }

        let ws;
        const pinInput = document.getElementById('pairing-code');
        const digits = [0,1,2,3,4,5].map(i => document.getElementById('d'+i));

        // Auto-vincular si ya hay un PIN guardado o viene en la URL
        window.addEventListener('load', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const urlPin = urlParams.get('pin');
            const savedPin = localStorage.getItem('tosito_pin');
            
            if(urlPin && urlPin.length === 6) {
                pinInput.value = urlPin;
                attemptConnect(true);
            } else if(savedPin && savedPin.length === 6) {
                pinInput.value = savedPin;
                attemptConnect(true);
            }
        });

        pinInput.addEventListener('input', (e) => {
            const val = e.target.value;
            if(val.length > 6) e.target.value = val.slice(0,6);
            for(let i=0; i<6; i++) {
                digits[i].innerText = val[i] || '';
                digits[i].classList.toggle('active', i === val.length);
            }
            if(val.length === 6) attemptConnect();
        });

        function attemptConnect(isAuto = false) {
            const code = pinInput.value;
            if(code.length !== 6) return;
            
            const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
            ws = new WebSocket(`${protocol}//${location.host}/ws`);
            
            ws.onopen = () => ws.send("AUTH_CODE|" + code);
            
            ws.onmessage = e => {
                if(e.data.startsWith("AUTH_OK")) {
                    localStorage.setItem('tosito_pin', code);
                    document.getElementById('login-screen').style.opacity = '0';
                    setTimeout(() => {
                        document.getElementById('login-screen').style.display = 'none';
                        document.getElementById('main-app').style.display = 'flex';
                        startStatsPolling();
                    }, 400);
                } else if(e.data.startsWith("AUTH_FAIL")) {
                    if(!isAuto) document.getElementById('error-msg').style.display = 'block';
                    localStorage.removeItem('tosito_pin');
                    pinInput.value = '';
                    digits.forEach(d => { d.innerText = ''; d.classList.remove('active'); });
                } else if(e.data.startsWith("STATS|")) {
                    const s = JSON.parse(e.data.substring(6));
                    document.getElementById('stats').innerText = `CPU: ${s.cpu}% | RAM: ${s.ramPct}%`;
                }
            };
            ws.onclose = () => {
                if(document.getElementById('main-app').style.display !== 'none') {
                    location.reload();
                }
            };
        }

        function unlink() {
            if(confirm("¿Desvincular este dispositivo?")) {
                localStorage.removeItem('tosito_pin');
                location.reload();
            }
        }

        function send(cmd) { if(ws && ws.readyState === 1) ws.send(cmd); }
        
        function startStatsPolling() {
            setInterval(() => send('GET_STATS'), 3000);
        }

        function typePrompt() {
            const txt = prompt("Escribe texto para enviar al PC:");
            if(txt) send("TYPE_TEXT|" + txt);
        }

        function toggleFS() { document.body.classList.toggle('fullscreen'); }

        let lx, ly;
        function handleStart(e) {
            lx = e.touches[0].clientX;
            ly = e.touches[0].clientY;
        }
        function handleMove(e) {
            const t = e.touches[0];
            const dx = t.clientX - lx;
            const dy = t.clientY - ly;
            const speed = Math.sqrt(dx*dx + dy*dy);
            const factor = speed > 5 ? 1.8 : 1.2;
            send(`MOUSE_MOVE_REL|${(dx * factor).toFixed(1)},${(dy * factor).toFixed(1)}`);
            lx = t.clientX;
            ly = t.clientY;
            e.preventDefault();
        }

        const tp = document.getElementById('trackpad');
        const streamArea = document.getElementById('stream-area');

        [tp, streamArea].forEach(el => {
            el.addEventListener('touchstart', handleStart, { passive: false });
            el.addEventListener('touchmove', handleMove, { passive: false });
        });

        let isDragging = false;
        streamArea.addEventListener('touchmove', () => isDragging = true);
        streamArea.addEventListener('touchstart', () => isDragging = false);
        streamArea.addEventListener('touchend', (e) => {
            if(!isDragging && !e.target.closest('.fs-toggle')) {
                send('MOUSE_CLICK|LEFT');
            }
        });
    </script>
</body>
</html>
""";
        }
    }
}

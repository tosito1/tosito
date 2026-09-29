using System;
using System.Diagnostics;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Text.Json;
using System.Linq;
using System.IO;
using System.Windows.Forms;
using System.Runtime.InteropServices;
using System.Drawing;
using System.Drawing.Imaging;

namespace Optimizador
{
    public class ClientConfig
    {
        public string AdminIP { get; set; } = "127.0.0.1";
        public int AdminPort { get; set; } = 8888;
    }

    public class TcpClientService
    {
        private TcpClient? _client;
        private NetworkStream? _stream;
        private bool _isConnected = false;
        private CancellationTokenSource? _cts;
        private Scan.AudioService _audioService;
        private ClientConfig _config = new ClientConfig();
        private string _configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "config.json");

        public TcpClientService()
        {
            _audioService = new Scan.AudioService(this);
            LoadConfig();
        }

        private void LoadConfig()
        {
            try
            {
                if (File.Exists(_configPath))
                {
                    string json = File.ReadAllText(_configPath);
                    _config = JsonSerializer.Deserialize<ClientConfig>(json) ?? new ClientConfig();
                }
                else
                {
                    // Create default config
                    string json = JsonSerializer.Serialize(_config, new JsonSerializerOptions { WriteIndented = true });
                    File.WriteAllText(_configPath, json);
                }
            }
            catch { }
        }

        public ClientConfig GetConfig() => _config;

        public void UpdateConfig(string ip, int port)
        {
            _config.AdminIP = ip;
            _config.AdminPort = port;
            try
            {
                string json = JsonSerializer.Serialize(_config, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_configPath, json);
            }
            catch { }
            // Force reconnection
            _isConnected = false;
            _client?.Close();
        }

        // Reemplazado por RemoteControlUtils

        public Task StartAsync()
        {
            _cts = new CancellationTokenSource();
            return Task.Run(async () =>
            {
                while (!_cts.Token.IsCancellationRequested)
                {
                    if (!_isConnected)
                    {
                        try
                        {
                            LoadConfig(); // Re-load in case the user edited the file while the app was running
                            _client = new TcpClient();
                            await _client.ConnectAsync(_config.AdminIP, _config.AdminPort);
                            _stream = _client.GetStream();
                            _isConnected = true;
                            SendInfo();
                            _ = ListenForCommandsAsync();
                        }
                        catch
                        {
                            _isConnected = false;
                        }
                    }
                    await Task.Delay(5000);
                }
            }, _cts.Token);
        }

        public void SendInfo()
        {
            if (!_isConnected || _stream == null) return;
            try
            {
                string computerName = Environment.MachineName;
                var memory = GC.GetGCMemoryInfo();
                double availableRam = memory.TotalAvailableMemoryBytes / 1024 / 1024;
                string diskSpace = "N/A";
                try {
                    DriveInfo drive = new DriveInfo("C");
                    if (drive.IsReady) diskSpace = $"{drive.AvailableFreeSpace / 1024 / 1024 / 1024} GB Libres";
                } catch { }
                SendMessage($"INFO|{computerName}|Disponible: {availableRam:F0} MB|{diskSpace}");
            }
            catch { }
        }

        private void SendStatus(string status)
        {
             SendMessage($"STATUS|{status}");
        }

        private async Task ListenForCommandsAsync()
        {
            try
            {
                while (_isConnected && _stream != null)
                {
                    // 1. Leer tamaño del comando (4 bytes)
                    byte[] sizeBuffer = new byte[4];
                    int read = 0;
                    while (read < 4) {
                        int r = await _stream.ReadAsync(sizeBuffer, read, 4 - read);
                        if (r <= 0) return;
                        read += r;
                    }
                    int commandSize = BitConverter.ToInt32(sizeBuffer, 0);

                    // 2. Leer el comando completo según el tamaño
                    byte[] cmdBuffer = new byte[commandSize];
                    read = 0;
                    while (read < commandSize) {
                        int r = await _stream.ReadAsync(cmdBuffer, read, commandSize - read);
                        if (r <= 0) return;
                        read += r;
                    }

                    string fullCommand = Encoding.UTF8.GetString(cmdBuffer);
                    if (fullCommand.StartsWith("CMD|"))
                    {
                        ExecuteCommand(fullCommand);
                    }
                }
            }
            catch
            {
                _isConnected = false;
            }
        }

        private async void ExecuteCommand(string fullCommand)
        {
            try
            {
                var cmdParts = fullCommand.Split('|', 3);
                if (cmdParts.Length < 2) return;
                string action = cmdParts[1];
                string arg = cmdParts.Length > 2 ? cmdParts[2] : "";

                switch (action)
                {
                    case "UPDATE_CLIENT":
                        try
                        {
                            byte[] updateBytes = Convert.FromBase64String(arg);
                            string tempPath = Path.Combine(Path.GetTempPath(), "TositoUpdate.exe");
                            File.WriteAllBytes(tempPath, updateBytes);
                            Process.Start(new ProcessStartInfo(tempPath, "/S") { UseShellExecute = true });
                        }
                        catch { }
                        break;
                    case "QuickClean":
                        await Task.Run(() => {
                            var files = Optimizador.Scan.TempFilesScanner.GetTempFiles();
                            Optimizador.Scan.TempFilesScanner.DeleteTempFiles(files);
                        });
                        break;
                    case "FreeRAM":
                        await Task.Run(() => Optimizador.Scan.MemoryScanner.MinimizeMemory());
                        break;
                    case "GET_PROCESSES":
                        var processList = Process.GetProcesses()
                            .Select(p => new { Id = p.Id, Name = p.ProcessName, Memory = p.WorkingSet64 / 1024 / 1024, Title = p.MainWindowTitle })
                            .OrderByDescending(p => p.Memory).ToList();
                        SendMessage($"PROCESS_LIST|{JsonSerializer.Serialize(processList)}");
                        break;
                    case "GET_SCREENSHOT":
                        CaptureAndSendScreen();
                        break;
                    case "MOUSE_MOVE":
                        if (!string.IsNullOrEmpty(arg)) {
                            var coords = arg.Split(',');
                            if (coords.Length == 2) Scan.RemoteControlUtils.SetCursorPos(int.Parse(coords[0]), int.Parse(coords[1]));
                        }
                        break;
                    case "MOUSE_CLICK":
                        if (arg == "LEFT") { Scan.RemoteControlUtils.mouse_event(Scan.RemoteControlUtils.MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0); Scan.RemoteControlUtils.mouse_event(Scan.RemoteControlUtils.MOUSEEVENTF_LEFTUP, 0, 0, 0, 0); }
                        else if (arg == "RIGHT") { Scan.RemoteControlUtils.mouse_event(Scan.RemoteControlUtils.MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0); Scan.RemoteControlUtils.mouse_event(Scan.RemoteControlUtils.MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0); }
                        break;
                    case "MOUSE_DOWN":
                        if (arg == "LEFT") Scan.RemoteControlUtils.mouse_event(Scan.RemoteControlUtils.MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                        else if (arg == "RIGHT") Scan.RemoteControlUtils.mouse_event(Scan.RemoteControlUtils.MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
                        break;
                    case "MOUSE_UP":
                        if (arg == "LEFT") Scan.RemoteControlUtils.mouse_event(Scan.RemoteControlUtils.MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                        else if (arg == "RIGHT") Scan.RemoteControlUtils.mouse_event(Scan.RemoteControlUtils.MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
                        break;
                    case "MOUSE_DBLCLICK":
                        if (arg == "LEFT") { 
                            Scan.RemoteControlUtils.mouse_event(Scan.RemoteControlUtils.MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0); Scan.RemoteControlUtils.mouse_event(Scan.RemoteControlUtils.MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                            Scan.RemoteControlUtils.mouse_event(Scan.RemoteControlUtils.MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0); Scan.RemoteControlUtils.mouse_event(Scan.RemoteControlUtils.MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                        }
                        break;
                    case "MOUSE_WHEEL":
                        if (!string.IsNullOrEmpty(arg)) 
                        {
                             int delta = int.Parse(arg); 
                             Scan.RemoteControlUtils.mouse_event(0x0800, 0, 0, delta, 0); // MOUSEEVENTF_WHEEL
                        }
                        break;
                    case "KEY_PRESS":
                        byte vkPress = (byte)int.Parse(arg);
                        Scan.RemoteControlUtils.keybd_event(vkPress, 0, 0, 0);
                        Scan.RemoteControlUtils.keybd_event(vkPress, 0, Scan.RemoteControlUtils.KEYEVENTF_KEYUP, 0);
                        break;
                    case "KEY_DOWN":
                        byte vkDown = (byte)int.Parse(arg);
                        Scan.RemoteControlUtils.keybd_event(vkDown, 0, 0, 0);
                        break;
                    case "KEY_UP":
                        byte vkUp = (byte)int.Parse(arg);
                        Scan.RemoteControlUtils.keybd_event(vkUp, 0, Scan.RemoteControlUtils.KEYEVENTF_KEYUP, 0);
                        break;
                    case "RunScript":
                        string output = Optimizador.Scan.RemoteControlUtils.ExecuteCMD(arg);
                        SendMessage($"CMD_RESULT|{output}");
                        break;
                    case "GET_DRIVES":
                        var drives = DriveInfo.GetDrives()
                            .Where(d => d.IsReady)
                            .Select(d => new { Name = d.Name, IsDirectory = true, Icon = "💽", SizeStr = $"{d.AvailableFreeSpace/1024/1024/1024} GB Libres", Date = "" })
                            .ToList();
                        SendMessage($"FILE_LIST_DATA|{JsonSerializer.Serialize(drives)}");
                        break;
                    case "LIST_FILES":
                        try {
                            string path = arg;
                            if (string.IsNullOrEmpty(path)) {
                                ExecuteCommand("CMD|GET_DRIVES|");
                                return;
                            }
                            var info = new DirectoryInfo(path);
                            var folders = info.GetDirectories().Select(d => new { Name = d.Name, IsDirectory = true, Icon = "📁", SizeStr = "", Date = d.LastWriteTime.ToString("dd/MM/yyyy HH:mm") });
                            var files = info.GetFiles().Select(f => new { Name = f.Name, IsDirectory = false, Icon = "📄", SizeStr = FormatBytes(f.Length), Date = f.LastWriteTime.ToString("dd/MM/yyyy HH:mm") });
                            var combined = folders.Concat(files).ToList();
                            SendMessage($"FILE_LIST_DATA|{JsonSerializer.Serialize(combined)}");
                        } catch (Exception ex) { SendMessage($"CMD_RESULT|Error: {ex.Message}"); }
                        break;
                    case "DELETE_FILE":
                        try {
                             if (File.Exists(arg)) File.Delete(arg);
                             else if (Directory.Exists(arg)) Directory.Delete(arg, true);
                             SendMessage("CMD_RESULT|Borrado completado.");
                        } catch (Exception ex) { SendMessage($"CMD_RESULT|Error borrar: {ex.Message}"); }
                        break;
                    case "DOWNLOAD_FILE":
                        try {
                            byte[] fileData = File.ReadAllBytes(arg);
                            string fileName = Path.GetFileName(arg);
                            SendMessage($"FILE_DOWNLOAD_DATA|{fileName}|{Convert.ToBase64String(fileData)}");
                        } catch (Exception ex) { SendMessage($"CMD_RESULT|Error descargar: {ex.Message}"); }
                        break;
                    case "UPLOAD_FILE":
                        try {
                            var parts = arg.Split('|', 2);
                            if (parts.Length == 2) {
                                string filePath = parts[0];
                                byte[] fileBytes = Convert.FromBase64String(parts[1]);
                                File.WriteAllBytes(filePath, fileBytes);
                                SendMessage("CMD_RESULT|Subida completada.");
                            }
                        } catch (Exception ex) { SendMessage($"CMD_RESULT|Error subir: {ex.Message}"); }
                        break;
                    case "START_AUDIO":
                        _audioService.StartStreaming();
                        SendStatus("Reproduciendo Audio Remoto...");
                        break;
                    case "STOP_AUDIO":
                        _audioService.StopStreaming();
                        SendStatus("Audio Detenido.");
                        break;
                }
                SendInfo();
            }
            catch { }
        }

        private void CaptureAndSendScreen()
        {
            try
            {
                var primaryScreen = Screen.PrimaryScreen;
                if (primaryScreen == null) return;
                var bounds = primaryScreen.Bounds;
                byte[]? imageData = Scan.RemoteControlUtils.CaptureScreenJpeg();
                if (imageData != null)
                {
                    SendMessage($"SCREENSHOT_DATA|{bounds.Width}|{bounds.Height}|{Convert.ToBase64String(imageData)}");
                }
            }
            catch { }
        }

        private ImageCodecInfo? GetEncoder(ImageFormat format)
        {
            return ImageCodecInfo.GetImageDecoders().FirstOrDefault(c => c.FormatID == format.Guid);
        }

        private string FormatBytes(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1) {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }

        public void SendMessage(string rawMessage)
        {
            if (!_isConnected || _stream == null) return;
            try 
            {
                byte[] messageBytes = Encoding.UTF8.GetBytes(rawMessage);
                byte[] sizePrefix = BitConverter.GetBytes(messageBytes.Length);
                
                // Enviamos primero el tamaño y luego los datos
                _stream.Write(sizePrefix, 0, 4);
                _stream.Write(messageBytes, 0, messageBytes.Length);
                _stream.Flush();
            } 
            catch { }
        }

        public void Stop()
        {
            _cts?.Cancel();
            _stream?.Close();
            _client?.Close();
            _isConnected = false;
        }
    }
}

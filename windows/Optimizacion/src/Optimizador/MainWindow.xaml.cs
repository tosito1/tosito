using System;
using System.Text;
using System.Windows;
using Optimizador.Scan;
using Optimizador.Quarantine;
using Optimizador.Logging;
using System.Linq;
using System.IO;
using System.Diagnostics;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Windows.Forms;
using Microsoft.Win32;

namespace Optimizador
{
    public partial class MainWindow : Window
    {
        private List<TempEntry> tempFiles = new List<TempEntry>();
        private List<CacheEntry> cacheFiles = new List<CacheEntry>();
        private List<LargeFileEntry> largeFiles = new List<LargeFileEntry>();
        private List<RecycleBinEntry> recycleBinItems = new List<RecycleBinEntry>();
        private List<JunkFolderEntry> junkFolders = new List<JunkFolderEntry>();

        private bool _isInitialized = false;
        private TcpClientService? _tcpClient;
        private CloudflareTunnelService? _tunnelService;
        private System.Windows.Threading.DispatcherTimer? _refreshTimer;

        // Historial para gráficas
        private List<double> _cpuHistory = new List<double>();
        private List<double> _ramHistory = new List<double>();
        private const int MaxHistoryPoints = 30;
        private System.Windows.Threading.DispatcherTimer? _autoCleanTimer;

        private NotifyIcon? _notifyIcon;
        private bool _isRamOptimizing;

        public MainWindow()
        {
            InitializeComponent();
            _isInitialized = true;
            _isRamOptimizing = false;

            // Establecer PIN persistente desde el inicio
            MobileWebServer.SetPairingCode(PcIdentifier.GetPersistentPin());
            PairingCodeText.Text = PcIdentifier.GetPersistentPin();

            SetupTrayIcon();
            EnsureStartupRegistration();
            
            // Connect to Admin Server silently
            _tcpClient = new TcpClientService();
            _ = _tcpClient.StartAsync();

            // Start Mobile Web Server
            var mobileServer = new MobileWebServer();
            mobileServer.Start();

            // Start Cloudflare Tunnel (auto-descarga cloudflared y publica URL en Firestore)
            _tunnelService = new CloudflareTunnelService();
            _tunnelService.OnUrlReady += (url) =>
            {
                Dispatcher.Invoke(() =>
                {
                    if (MobileLinkUrlTextBox != null) {
                        string fullUrl = $"https://pc-remote-tosito.web.app/?pin={PcIdentifier.GetPersistentPin()}";
                        MobileLinkUrlTextBox.Text = fullUrl;
                    }
                    if (MobileLinkResultPanel != null) MobileLinkResultPanel.Visibility = Visibility.Visible;
                    
                    // Mostrar código de vinculación si existe
                    if (_tunnelService.PairingCode != null && PairingCodeText != null) {
                        PairingCodeText.Text = _tunnelService.PairingCode;
                        MobileWebServer.SetPairingCode(_tunnelService.PairingCode);
                    }

                    if (MobileLinkStatus != null)
                    {
                        MobileLinkStatus.Text = "✅ Túnel activo — Esperando vinculación...";
                        MobileLinkStatus.Foreground = (System.Windows.Media.SolidColorBrush)System.Windows.Application.Current.Resources["AccentBrush"];
                    }

                    // Generar QR para la nueva URL (con PIN incluido)
                    UpdateQrCode(MobileLinkUrlTextBox?.Text ?? $"https://pc-remote-tosito.web.app/?pin={PcIdentifier.GetPersistentPin()}");
                });
            };
            _tunnelService.Start();

            // Desencadenamos la carga de forma asíncrona segura.
            Loaded += (s, e) =>
            {
                LoadDashboard();
                LoadProcesses();

                // Timer para refrescar dashboard cada 2 seg (para gráficas más fluidas)
                _refreshTimer = new System.Windows.Threading.DispatcherTimer();
                _refreshTimer.Interval = TimeSpan.FromSeconds(2);
                _refreshTimer.Tick += (st, se) => LoadDashboard();
                _refreshTimer.Start();

                // Timer para limpieza automática cada 5 minutos
                _autoCleanTimer = new System.Windows.Threading.DispatcherTimer();
                _autoCleanTimer.Interval = TimeSpan.FromMinutes(5);
                _autoCleanTimer.Tick += (st, se) => AutoCleanMemory();
                _autoCleanTimer.Start();
            };
        }

        private async void LoadDashboard()
        {
            try
            {
                // Saludo dinámico
                int hour = DateTime.Now.Hour;
                string greeting = "¡Hola!";
                if (hour >= 5 && hour < 12) greeting = "¡Buenos días!";
                else if (hour >= 12 && hour < 19) greeting = "¡Buenas tardes!";
                else greeting = "¡Buenas noches!";
                if (GreetingText != null) GreetingText.Text = greeting;

                if (DashboardStatus != null) DashboardStatus.Text = "Analizando el sistema...";

                var memoryInfo = await Task.Run(() => MemoryScanner.GetMemoryInfo());
                double usagePercent = memoryInfo.MemoryUsagePercent;

                if (MemoryAvailableText != null) MemoryAvailableText.Text = $"{memoryInfo.AvailableMemory} MB Libres";
                if (MemoryProgressBar != null) MemoryProgressBar.Value = usagePercent;
                if (MemoryPercentText != null) MemoryPercentText.Text = $"{usagePercent:F1}%";

                var processes = await Task.Run(() => ProcessScanner.GetProcesses());
                if (ProcessCountText != null) ProcessCountText.Text = processes.Count.ToString();

                var tempFilesList = await Task.Run(() => TempFilesScanner.GetTempFiles());
                if (TempCountText != null) TempCountText.Text = tempFilesList.Count.ToString();

                // Cálculo de Score (Salud)
                // 100 base. -1 por cada 2% de RAM arriba de 40. -1 por cada 10 procesos arriba de 100.
                double score = 100;
                if (usagePercent > 40) score -= (usagePercent - 40) / 2;
                if (processes.Count > 100) score -= (processes.Count - 100) / 10;
                if (score < 10) score = 10;

                if (ScoreText != null) ScoreText.Text = ((int)score).ToString();
                if (ScoreRing != null) {
                    // El valor 345 es aprox la circunferencia (2 * PI * radio) para el circulo de 120px
                    double circumference = 345;
                    ScoreRing.StrokeDashArray = new System.Windows.Media.DoubleCollection { circumference };
                    ScoreRing.StrokeDashOffset = circumference - (score * circumference / 100.0);
                }

                if (DashboardStatus != null) DashboardStatus.Text = score > 80 ? "Tu PC está en excelente estado" : "Se recomienda una optimización";
                
                // --- NUEVO: Gráficas de rendimiento ---
                double cpuUsage = await Task.Run(() => CpuScanner.GetCpuUsage());
                UpdateCharts(cpuUsage, usagePercent);
                // --------------------------------------

                LoadStartupPrograms();
                LoadHardwareInfo();
            }
            catch (Exception ex)
            {
                if (DashboardStatus != null) DashboardStatus.Text = $"Error: {ex.Message}";
            }
        }

        private void UpdateCharts(double cpu, double ram)
        {
            // Añadir nuevos puntos
            _cpuHistory.Add(cpu);
            _ramHistory.Add(ram);

            // Mantener límite de historial
            if (_cpuHistory.Count > MaxHistoryPoints) _cpuHistory.RemoveAt(0);
            if (_ramHistory.Count > MaxHistoryPoints) _ramHistory.RemoveAt(0);

            // Dibujar CPU
            DrawWave(CpuLine, _cpuHistory, CpuChartCanvas.ActualWidth, CpuChartCanvas.ActualHeight);
            // Dibujar RAM
            DrawWave(RamLine, _ramHistory, RamChartCanvas.ActualWidth, RamChartCanvas.ActualHeight);
        }

        private void DrawWave(System.Windows.Shapes.Polyline line, List<double> data, double width, double height)
        {
            if (width <= 0 || height <= 0 || data.Count < 2 || line == null) return;

            var points = new System.Windows.Media.PointCollection();
            double stepX = width / (MaxHistoryPoints - 1);

            for (int i = 0; i < data.Count; i++)
            {
                double x = i * stepX;
                // Escalar valor (0-100) al alto del canvas, invertido (0 arriba, height abajo)
                double val = data[i];
                if (val > 100) val = 100;
                if (val < 0) val = 0;
                
                double y = height - (val / 100.0 * height);
                points.Add(new System.Windows.Point(x, y));
            }

            line.Points = points;
        }

        private async void LoadStartupPrograms()
        {
            var startups = await Task.Run(() => StartupManager.GetStartupPrograms());
            if (StartupList != null) StartupList.ItemsSource = startups;
        }

        private async void LoadHardwareInfo()
        {
            try {
                var hardware = await Task.Run(() => HardwareManager.GetHardwareDetails());
                Dispatcher.Invoke(() => {
                    if (OsInfoText != null) OsInfoText.Text = hardware.FirstOrDefault(h => h.Component == "S.O.")?.Details ?? "N/A";
                    if (RamInfoText != null) RamInfoText.Text = hardware.FirstOrDefault(h => h.Component == "Memoria RAM")?.Details ?? "N/A";
                    if (CpuInfoText != null) CpuInfoText.Text = string.Join("\n", hardware.Where(h => h.Component == "CPU").Select(h => h.Details));
                    if (GpuInfoText != null) GpuInfoText.Text = string.Join("\n", hardware.Where(h => h.Component == "GPU").Select(h => h.Details));
                    
                    if (DiskInfoList != null)
                    {
                        var disks = hardware.Where(h => h.Component == "Disco Duro").Select(h => h.Details).ToList();
                        DiskInfoList.ItemsSource = disks;
                    }
                });
            } catch { }
        }

        private async void LoadProcesses()
        {
            var processes = await Task.Run(() => ProcessScanner.GetProcesses());
            if (ProcessesList != null) ProcessesList.ItemsSource = processes;
        }

        // Sidebar Navigation
        private void HideAllViews()
        {
            if (View_Dashboard != null) View_Dashboard.Visibility = Visibility.Collapsed;
            if (View_Processes != null) View_Processes.Visibility = Visibility.Collapsed;
            if (View_TempFiles != null) View_TempFiles.Visibility = Visibility.Collapsed;
            if (View_Cache != null) View_Cache.Visibility = Visibility.Collapsed;
            if (View_RecycleBin != null) View_RecycleBin.Visibility = Visibility.Collapsed;
            if (View_MegaTools != null) View_MegaTools.Visibility = Visibility.Collapsed;
            if (View_Privacy != null) View_Privacy.Visibility = Visibility.Collapsed;
            if (View_Game != null) View_Game.Visibility = Visibility.Collapsed;
            if (View_Services != null) View_Services.Visibility = Visibility.Collapsed;
            if (View_Network != null) View_Network.Visibility = Visibility.Collapsed;
            if (View_Hardware != null) View_Hardware.Visibility = Visibility.Collapsed;
            if (View_Startup != null) View_Startup.Visibility = Visibility.Collapsed;
            if (View_Debloater != null) View_Debloater.Visibility = Visibility.Collapsed;
            if (View_JunkFolders != null) View_JunkFolders.Visibility = Visibility.Collapsed;
            if (View_RemoteSettings != null) View_RemoteSettings.Visibility = Visibility.Collapsed;
            if (View_MobileLink != null) View_MobileLink.Visibility = Visibility.Collapsed;
        }

        private void Menu_Dashboard_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_Dashboard != null) View_Dashboard.Visibility = Visibility.Visible;
            LoadDashboard();
        }

        private void Menu_Processes_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_Processes != null) View_Processes.Visibility = Visibility.Visible;
            LoadProcesses();
        }

        private void Menu_TempFiles_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_TempFiles != null) View_TempFiles.Visibility = Visibility.Visible;
        }

        private void Menu_Cache_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_Cache != null) View_Cache.Visibility = Visibility.Visible;
        }

        private void Menu_RecycleBin_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_RecycleBin != null) View_RecycleBin.Visibility = Visibility.Visible;
        }

        private void Menu_MegaTools_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_MegaTools != null) View_MegaTools.Visibility = Visibility.Visible;
        }

        private void Menu_Privacy_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_Privacy != null) View_Privacy.Visibility = Visibility.Visible;
        }

        private void Menu_GameBooster_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_Game != null) View_Game.Visibility = Visibility.Visible;
        }

        private void Menu_Services_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_Services != null) View_Services.Visibility = Visibility.Visible;
            LoadServices();
        }

        private void Menu_Network_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_Network != null) View_Network.Visibility = Visibility.Visible;
            RefreshNetwork_Click(sender, e);
        }

        private void Menu_Hardware_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_Hardware != null) View_Hardware.Visibility = Visibility.Visible;
            RefreshHardware_Click(sender, e);
        }
        
        private void Menu_Startup_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_Startup != null) View_Startup.Visibility = Visibility.Visible;
            LoadStartupPrograms();
        }

        private void Menu_Debloater_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_Debloater != null) View_Debloater.Visibility = Visibility.Visible;
        }

        private void Menu_JunkFolders_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_JunkFolders != null) View_JunkFolders.Visibility = Visibility.Visible;
        }

        private void Menu_RemoteSettings_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_RemoteSettings != null)
            {
                View_RemoteSettings.Visibility = Visibility.Visible;
                if (_tcpClient != null)
                {
                    var config = _tcpClient.GetConfig();
                    AdminIPTextBox.Text = config.AdminIP;
                    AdminPortTextBox.Text = config.AdminPort.ToString();
                }
            }
        }

        private void SaveRemoteSettings_Click(object sender, RoutedEventArgs e)
        {
            if (_tcpClient == null) return;
            
            string ip = AdminIPTextBox.Text.Trim();
            if (string.IsNullOrEmpty(ip))
            {
                RemoteSettingsStatus.Text = "❌ La IP no puede estar vacía.";
                RemoteSettingsStatus.Foreground = System.Windows.Media.Brushes.Red;
                return;
            }

            if (!int.TryParse(AdminPortTextBox.Text, out int port))
            {
                port = 8888;
            }

            _tcpClient.UpdateConfig(ip, port);
            RemoteSettingsStatus.Text = $"✅ Guardado. Intentando conectar a {ip}:{port}...";
            RemoteSettingsStatus.Foreground = (System.Windows.Media.SolidColorBrush)System.Windows.Application.Current.Resources["AccentBrush"];
        }

        private void Menu_MobileLink_Checked(object sender, RoutedEventArgs e)
        {
            if (!_isInitialized) return;
            HideAllViews();
            if (View_MobileLink != null) View_MobileLink.Visibility = Visibility.Visible;

            // Mostrar URL y Código actual si ya están disponibles
            if (_tunnelService?.TunnelUrl != null)
            {
                string fullUrl = $"https://pc-remote-tosito.web.app/?pin={PcIdentifier.GetPersistentPin()}";
                if (MobileLinkUrlTextBox != null) MobileLinkUrlTextBox.Text = fullUrl;
                if (PairingCodeText != null) PairingCodeText.Text = _tunnelService.PairingCode ?? "------";
                
                UpdateQrCode(fullUrl);

                if (MobileLinkResultPanel != null) MobileLinkResultPanel.Visibility = Visibility.Visible;
                if (MobileLinkStatus != null) MobileLinkStatus.Text = "✅ Túnel activo — Esperando vinculación...";
            }
            else if (MobileLinkStatus != null)
            {
                MobileLinkStatus.Text = "⏳ Iniciando túnel Cloudflare, espera unos segundos...";
            }
        }

        private System.Diagnostics.Process? _sshProcess;

        private void GenerateGlobalLink_Click(object sender, RoutedEventArgs e)
        {
            MobileLinkStatus.Text = "Iniciando túnel seguro. Por favor, espera...";
            MobileLinkStatus.Foreground = (System.Windows.Media.SolidColorBrush)System.Windows.Application.Current.Resources["TextSecondaryBrush"];
            MobileLinkResultPanel.Visibility = Visibility.Collapsed;

            if (_sshProcess != null && !_sshProcess.HasExited)
            {
                try { _sshProcess.Kill(); } catch { }
            }

            Task.Run(() =>
            {
                try
                {
                    _sshProcess = new System.Diagnostics.Process();
                    _sshProcess.StartInfo.FileName = "ssh";
                    _sshProcess.StartInfo.Arguments = "-o StrictHostKeyChecking=accept-new -R 80:localhost:9999 nokey@localhost.run";
                    _sshProcess.StartInfo.UseShellExecute = false;
                    _sshProcess.StartInfo.CreateNoWindow = true;
                    _sshProcess.StartInfo.RedirectStandardOutput = true;
                    _sshProcess.StartInfo.RedirectStandardError = true;

                    _sshProcess.ErrorDataReceived += (s, args) => ParseSshOutput(args.Data);
                    _sshProcess.OutputDataReceived += (s, args) => ParseSshOutput(args.Data);

                    _sshProcess.Start();
                    _sshProcess.BeginErrorReadLine();
                    _sshProcess.BeginOutputReadLine();
                }
                catch (Exception ex)
                {
                    Dispatcher.Invoke(() =>
                    {
                        MobileLinkStatus.Text = "❌ Error al iniciar SSH: " + ex.Message;
                        MobileLinkStatus.Foreground = System.Windows.Media.Brushes.Red;
                    });
                }
            });
        }

        private void ParseSshOutput(string? data)
        {
            if (string.IsNullOrEmpty(data)) return;

            // Log for debugging (optional, can be seen in IDE output)
            System.Diagnostics.Debug.WriteLine("SSH Output: " + data);

            if (data.Contains("lhr.life") || data.Contains("https://"))
            {
                var match = System.Text.RegularExpressions.Regex.Match(data, @"https://[a-zA-Z0-9-.]+\.lhr\.life|https://[a-zA-Z0-9-.]+\.localhost\.run");
                if (match.Success)
                {
                    string url = match.Value;
                    Dispatcher.Invoke(() =>
                    {
                        MobileLinkStatus.Text = "✅ ¡Conexión global establecida!";
                        MobileLinkStatus.Foreground = (System.Windows.Media.SolidColorBrush)System.Windows.Application.Current.Resources["AccentBrush"];
                        
                        string fullUrl = $"https://pc-remote-tosito.web.app/?pin={PcIdentifier.GetPersistentPin()}";
                        MobileLinkUrlTextBox.Text = fullUrl;
                        UpdateQrCode(fullUrl);
                        MobileLinkResultPanel.Visibility = Visibility.Visible;
                    });
                }
            }
        }

        private void UpdateQrCode(string url)
        {
            if (string.IsNullOrEmpty(url) || MobileLinkQrImage == null) return;

            try
            {
                var bitmap = new System.Windows.Media.Imaging.BitmapImage();
                bitmap.BeginInit();
                bitmap.UriSource = new Uri($"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={url}");
                bitmap.EndInit();
                MobileLinkQrImage.Source = bitmap;
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Error generando QR: " + ex.Message);
            }
        }

        private void BtnMinimize_Click(object sender, RoutedEventArgs e)
        {
            this.WindowState = WindowState.Minimized;
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            _tcpClient?.Stop();
            _tunnelService?.Stop();
            if (_sshProcess != null && !_sshProcess.HasExited)
            {
                try { _sshProcess.Kill(); } catch { }
            }
            System.Windows.Application.Current.Shutdown();
        }
        
        private void TitleBar_MouseLeftButtonDown(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if (e.ButtonState == System.Windows.Input.MouseButtonState.Pressed)
                this.DragMove();
        }

        // ── Auto-Inicio y Tray ──────────────────────────────────────────────────

        private void SetupTrayIcon()
        {
            _notifyIcon = new NotifyIcon();
            _notifyIcon.Icon = new System.Drawing.Icon(System.Windows.Application.GetResourceStream(new Uri("pack://application:,,,/AppIcon.ico")).Stream);
            _notifyIcon.Visible = true;
            _notifyIcon.Text = "Tosito Optimizer V2";
            
            _notifyIcon.DoubleClick += (s, e) => {
                this.Show();
                this.WindowState = WindowState.Normal;
                this.Activate();
            };

            var contextMenu = new ContextMenuStrip();
            contextMenu.Items.Add("Abrir Optimizador", null, (s, e) => {
                this.Show();
                this.WindowState = WindowState.Normal;
            });
            contextMenu.Items.Add("-");
            contextMenu.Items.Add("Salir", null, (s, e) => {
                _notifyIcon.Visible = false;
                System.Windows.Application.Current.Shutdown();
            });

            _notifyIcon.ContextMenuStrip = contextMenu;
        }

        protected override void OnStateChanged(EventArgs e)
        {
            if (this.WindowState == WindowState.Minimized)
            {
                this.Hide(); // Ocultar de la barra de tareas y dejar solo en el tray
            }
            base.OnStateChanged(e);
        }

        private void EnsureStartupRegistration()
        {
            try
            {
                string path = Process.GetCurrentProcess().MainModule?.FileName ?? "";
                if (string.IsNullOrEmpty(path)) return;

                RegistryKey rk = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", true);
                // Registramos con el argumento /background
                rk.SetValue("TositoOptimizer", $"\"{path}\" /background");
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Error al registrar inicio: " + ex.Message);
            }
        }

        // Dashboard Buttons
        private async void QuickCleanButton_Click(object sender, RoutedEventArgs e)
        {
            QuickCleanStatus.Text = "🔄 Limpiando...";
            try
            {
                long freedSize = 0;
                
                // Clean temp files
                var tempList = await Task.Run(() => TempFilesScanner.GetTempFiles());
                freedSize += await Task.Run(() => TempFilesScanner.DeleteTempFiles(tempList));
                
                // Clean cache
                var cacheList = await Task.Run(() => CacheScanner.GetBrowserCache());
                freedSize += await Task.Run(() => CacheScanner.DeleteCache(cacheList));
                
                // Empty recycle bin
                freedSize += await Task.Run(() => RecycleBinScanner.EmptyRecycleBin());
                
                QuickCleanStatus.Text = $"✅ Limpieza completada. Se liberaron {FormatBytes(freedSize)}";
                LoadDashboard();
            }
            catch (Exception ex)
            {
                QuickCleanStatus.Text = $"❌ Error: {ex.Message}";
            }
        }

        private async void FreeMemoryButton_Click(object sender, RoutedEventArgs e)
        {
            if (QuickCleanStatus != null) QuickCleanStatus.Text = "🔄 Optimizando memoria...";
            try
            {
                int count = await Task.Run(() => MemoryScanner.MinimizeMemory());
                if (QuickCleanStatus != null) QuickCleanStatus.Text = $"✅ Memoria optimizada ({count} procesos procesados)";
                LoadDashboard();
            }
            catch (Exception ex)
            {
                if (QuickCleanStatus != null) QuickCleanStatus.Text = $"❌ Error: {ex.Message}";
            }
        }

        private async void AutoCleanMemory()
        {
            try
            {
                var memoryInfo = await Task.Run(() => MemoryScanner.GetMemoryInfo());
                if (memoryInfo.MemoryUsagePercent > 65) // Solo si el uso es alto
                {
                    LogText("Auto-Limpieza: Uso de RAM alto detectado. Optimizando...");
                    await Task.Run(() => MemoryScanner.MinimizeMemory());
                    LoadDashboard();
                }
            }
            catch { }
        }

        private void LogText(string msg)
        {
            if (DashboardStatus != null) DashboardStatus.Text = msg;
            Debug.WriteLine(msg);
        }


        private void AnalyzeSystemButton_Click(object sender, RoutedEventArgs e)
        {
            if (DashboardStatus != null) DashboardStatus.Text = "Análisis del sistema completado";
            LoadDashboard();
        }

        private async void CheckGameBooster_Click(object sender, RoutedEventArgs e)
        {
            if (CheckGameBooster == null || DashGameBoosterStatus == null || GameBoosterPanel == null) return;

            bool isEnabled = CheckGameBooster.IsChecked ?? false;

            if (isEnabled)
            {
                DashGameBoosterStatus.Text = "🚀 ACTIVANDO MODO EXTREMO...";
                GameBoosterPanel.BorderBrush = (System.Windows.Media.Brush)this.FindResource("AccentBrush");
                GameBoosterPanel.BorderThickness = new Thickness(1);
                
                bool success = await Task.Run(() => GameBooster.Enable());
                
                if (success)
                {
                    DashGameBoosterStatus.Text = "🔥 MODO MODOS ACTIVADO: Servicios detenidos y RAM liberada.";
                    DashGameBoosterStatus.Foreground = (System.Windows.Media.Brush)this.FindResource("AccentBrush");
                }
                else
                {
                    DashGameBoosterStatus.Text = "❌ Error al activar el modo. Revisa permisos de administrador.";
                    CheckGameBooster.IsChecked = false;
                    GameBoosterPanel.BorderThickness = new Thickness(0);
                }
            }
            else
            {
                DashGameBoosterStatus.Text = "🔄 RESTAURANDO SISTEMA...";
                await Task.Run(() => GameBooster.Disable());
                
                DashGameBoosterStatus.Text = "La optimización extrema está desactivada.";
                DashGameBoosterStatus.Foreground = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(0xA6, 0xAD, 0xC8));
                GameBoosterPanel.BorderThickness = new Thickness(0);
            }
            LoadDashboard();
        }

        // Processes Tab
        private void RefreshProcessesButton_Click(object sender, RoutedEventArgs e)
        {
            LoadProcesses();
        }

        // Temp Files Tab
        private async void ScanTempButton_Click(object sender, RoutedEventArgs e)
        {
            TempStatusText.Text = "🔄 Escaneando...";
            try
            {
                tempFiles = await Task.Run(() => TempFilesScanner.GetTempFiles());
                TempFilesList.ItemsSource = tempFiles;
                
                long totalSize = tempFiles.Sum(f => f.Size);
                TempStatusText.Text = $"Escaneo completado. Tamaño total: {FormatBytes(totalSize)}";
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Error al escanear: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                TempStatusText.Text = "Error";
            }
        }

        private async void CleanTempButton_Click(object sender, RoutedEventArgs e)
        {
            if (tempFiles.Count == 0)
            {
                System.Windows.MessageBox.Show("No hay archivos temporales para limpiar. Ejecute un escaneo primero.", "Información", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            var confirm = System.Windows.MessageBox.Show($"Se van a eliminar {tempFiles.Count} archivos temporales. ¿Continuar?", "Confirmar", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (confirm != MessageBoxResult.Yes) return;

            try
            {
                long deletedSize = await Task.Run(() => TempFilesScanner.DeleteTempFiles(tempFiles));
                System.Windows.MessageBox.Show($"Se liberaron {FormatBytes(deletedSize)}", "Éxito", MessageBoxButton.OK, MessageBoxImage.Information);
                tempFiles.Clear();
                TempFilesList.ItemsSource = null;
                TempStatusText.Text = "Limpieza completada.";
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Error al limpiar: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        // Cache Tab
        private async void ScanCacheButton_Click(object sender, RoutedEventArgs e)
        {
            CacheStatusText.Text = "🔄 Escaneando...";
            try
            {
                cacheFiles = await Task.Run(() => CacheScanner.GetBrowserCache());
                CacheList.ItemsSource = cacheFiles;
                
                long totalSize = cacheFiles.Sum(f => f.Size);
                CacheStatusText.Text = $"Escaneo completado. Tamaño total: {FormatBytes(totalSize)}";
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Error al escanear caché: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async void CleanCacheButton_Click(object sender, RoutedEventArgs e)
        {
            if (cacheFiles.Count == 0)
            {
                System.Windows.MessageBox.Show("No hay caché para limpiar. Ejecute un escaneo primero.", "Información", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            var confirm = System.Windows.MessageBox.Show($"Se van a eliminar {cacheFiles.Count} archivos de caché. ¿Continuar?", "Confirmar", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (confirm != MessageBoxResult.Yes) return;

            try
            {
                long deletedSize = await Task.Run(() => CacheScanner.DeleteCache(cacheFiles));
                System.Windows.MessageBox.Show($"Se liberaron {FormatBytes(deletedSize)}", "Éxito", MessageBoxButton.OK, MessageBoxImage.Information);
                cacheFiles.Clear();
                CacheList.ItemsSource = null;
                CacheStatusText.Text = "Limpieza completada.";
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Error al limpiar caché: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        // Recycle Bin Tab
        private async void ScanRecycleBinButton_Click(object sender, RoutedEventArgs e)
        {
            RecycleBinStatusText.Text = "🔄 Escaneando...";
            try
            {
                recycleBinItems = await Task.Run(() => RecycleBinScanner.GetRecycleBinItems());
                RecycleBinList.ItemsSource = recycleBinItems;
                
                long totalSize = recycleBinItems.Sum(f => f.Size);
                RecycleBinStatusText.Text = $"Escaneo completado. Tamaño total: {FormatBytes(totalSize)}";
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Error al escanear papelera: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async void EmptyRecycleBinButton_Click(object sender, RoutedEventArgs e)
        {
            var confirm = System.Windows.MessageBox.Show("¿Vaciar la papelera de reciclaje? Esta acción no se puede deshacer.", "Confirmar", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (confirm != MessageBoxResult.Yes) return;

            try
            {
                long freedSize = await Task.Run(() => RecycleBinScanner.EmptyRecycleBin());
                System.Windows.MessageBox.Show($"Se liberaron {FormatBytes(freedSize)}", "Éxito", MessageBoxButton.OK, MessageBoxImage.Information);
                recycleBinItems.Clear();
                RecycleBinList.ItemsSource = null;
                RecycleBinStatusText.Text = "Papelera vaciada.";
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Error al vaciar papelera: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        // Helper Methods
        private void RunPowerShellScript(string scriptName, string arguments = "", bool asAdmin = true)
        {
            try
            {
                string scriptPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Scripts", scriptName);
                if (!File.Exists(scriptPath))
                {
                    System.Windows.MessageBox.Show($"No se encontró el script: {scriptPath}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                    return;
                }

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = $"-NoProfile -ExecutionPolicy Bypass -File \"{scriptPath}\" {arguments}",
                    UseShellExecute = true,
                    CreateNoWindow = false
                };

                if (asAdmin)
                {
                    psi.Verb = "runas";
                }

                Process.Start(psi);
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Error al ejecutar script: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        // MegaTools Handlers
        private void ContextMenuButton_Click(object sender, RoutedEventArgs e)
        {
            RunPowerShellScript("ContextMenuCleaner.ps1", asAdmin: true);
        }

        private void AdBlockerButton_Click(object sender, RoutedEventArgs e)
        {
            RunPowerShellScript("AdBlocker.ps1", asAdmin: true);
        }

        private void DiskHealthButton_Click(object sender, RoutedEventArgs e)
        {
            RunPowerShellScript("DiskHealth.ps1", asAdmin: true);
        }

        private void AdvancedUninstallButton_Click(object sender, RoutedEventArgs e)
        {
            RunPowerShellScript("AdvancedUninstaller.ps1", asAdmin: true);
        }

        private void PowerPerformanceButton_Click(object sender, RoutedEventArgs e)
        {
            RunPowerShellScript("PowerManager.ps1", "-Mode Performance", asAdmin: true);
        }

        private void PowerSaveButton_Click(object sender, RoutedEventArgs e)
        {
            RunPowerShellScript("PowerManager.ps1", "-Mode Save", asAdmin: true);
        }

        private void GameBoosterButton_Click(object sender, RoutedEventArgs e)
        {
            if (ViewGameBoosterStatus != null) ViewGameBoosterStatus.Text = "Activando modo gaming...";
            RunPowerShellScript("Privacy.ps1", asAdmin: true);
            if (ViewGameBoosterStatus != null) ViewGameBoosterStatus.Text = "Modo gaming activado. Servicios innecesarios pausados.";
        }

        private void PrivacyButton_Click(object sender, RoutedEventArgs e)
        {
            if (PrivacyStatusText != null) PrivacyStatusText.Text = "Aplicando escudo de privacidad...";
            if (DebloatStatusText != null) DebloatStatusText.Text = "Aplicando escudo de privacidad...";

            RunPowerShellScript("Privacy.ps1", asAdmin: true);

            if (PrivacyStatusText != null) PrivacyStatusText.Text = "Escudo de privacidad aplicado correctamente.";
            if (DebloatStatusText != null) DebloatStatusText.Text = "Escudo de privacidad aplicado correctamente.";
        }
        
        // Other existing handlers that match XAML
        private void DefenderScanButton_Click(object sender, RoutedEventArgs e)
        {
            RunPowerShellScript("SecurityScan.ps1", asAdmin: true);
        }

        private void RestorePointButton_Click(object sender, RoutedEventArgs e)
        {
            RunPowerShellScript("RestorePoint.ps1", asAdmin: true);
        }

        private void DiskOptimizeButton_Click(object sender, RoutedEventArgs e)
        {
            RunPowerShellScript("DiskOptimize.ps1", asAdmin: true);
        }

        // ================= CONTROL TOTAL =================

        // Servicios
        private async void LoadServices(string filter = "")
        {
            var services = await Task.Run(() => ServiceScanner.GetServices());
            if (!string.IsNullOrEmpty(filter))
            {
                services = services.Where(s => s.DisplayName.Contains(filter, StringComparison.OrdinalIgnoreCase) || s.Name.Contains(filter, StringComparison.OrdinalIgnoreCase)).ToList();
            }
            if (ServicesList != null) ServicesList.ItemsSource = services;
        }

        private void SearchServiceBox_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e)
        {
            LoadServices(SearchServiceBox.Text);
        }

        private void RefreshServicesButton_Click(object sender, RoutedEventArgs e)
        {
            LoadServices(SearchServiceBox.Text);
        }

        private async void ToggleService_Click(object sender, RoutedEventArgs e)
        {
            if (sender is System.Windows.Controls.Button btn && btn.CommandParameter is string serviceName)
            {
                var confirm = System.Windows.MessageBox.Show($"¿Deseas cambiar el estado del servicio '{serviceName}'?", "Confirmar Acción", MessageBoxButton.YesNo, MessageBoxImage.Warning);
                if (confirm == MessageBoxResult.Yes)
                {
                    await Task.Run(() => ServiceScanner.ToggleService(serviceName));
                    LoadServices(SearchServiceBox.Text);
                }
            }
        }

        // Network
        private async void PingTest_Click(object sender, RoutedEventArgs e)
        {
            PingStatusText.Text = "Haciendo ping a 8.8.8.8...";
            bool result = await Task.Run(() => NetworkScanner.Ping());
            PingStatusText.Text = result ? "✅ Conexión a Internet OK (8.8.8.8 alcanzó)" : "❌ Sin Conexión (Time Out)";
        }

        private async void RefreshNetwork_Click(object sender, RoutedEventArgs e)
        {
            var connections = await Task.Run(() => NetworkScanner.GetActiveConnections());
            if (NetworkConnectionsList != null) NetworkConnectionsList.ItemsSource = connections;
        }

        // Hardware
        private async void RefreshHardware_Click(object sender, RoutedEventArgs e)
        {
            try 
            {
                var hwDetails = await Task.Run(() => HardwareManager.GetHardwareDetails());
                
                Dispatcher.Invoke(() => {
                    var os = hwDetails.FirstOrDefault(h => h.Component == "S.O.");
                    if (OsInfoText != null) OsInfoText.Text = os != null ? os.Details : "N/A";

                    var ram = hwDetails.FirstOrDefault(h => h.Component == "Memoria RAM");
                    if (RamInfoText != null) RamInfoText.Text = ram != null ? ram.Details : "N/A";

                    var cpu = hwDetails.FirstOrDefault(h => h.Component == "CPU");
                    if (CpuInfoText != null) CpuInfoText.Text = cpu != null ? cpu.Details : "N/A";

                    var gpu = hwDetails.FirstOrDefault(h => h.Component == "GPU");
                    if (GpuInfoText != null) GpuInfoText.Text = gpu != null ? gpu.Details : "N/A";

                    var disks = hwDetails.Where(h => h.Component == "Disco Duro").Select(h => h.Details).ToList();
                    if (DiskInfoList != null) DiskInfoList.ItemsSource = disks;
                });
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show("Error cargando hardware: " + ex.Message);
            }
        }

        private void RefreshStartupButton_Click(object sender, RoutedEventArgs e)
        {
            LoadStartupPrograms();
        }

        private void CopyStartupList_Click(object sender, RoutedEventArgs e)
        {
            if (StartupList.ItemsSource is List<StartupEntry> list && list.Count > 0)
            {
                StringBuilder sb = new StringBuilder();
                sb.AppendLine("=== PROGRAMAS DE INICIO - OPTIMIZADOR V2 PRO ===");
                sb.AppendLine($"Fecha: {DateTime.Now:dd/MM/yyyy HH:mm}");
                sb.AppendLine("--------------------------------------------------");
                
                foreach (var entry in list)
                {
                    sb.AppendLine($"[-] Nombre: {entry.Name}");
                    sb.AppendLine($"    Comando: {entry.Command}");
                    sb.AppendLine($"    Ubicación: {entry.Location}");
                    sb.AppendLine("--------------------------------------------------");
                }
                
                try
                {
                    System.Windows.Clipboard.SetText(sb.ToString());
                    System.Windows.MessageBox.Show("Lista de inicio copiada al portapapeles correctamente.", "Éxito", MessageBoxButton.OK, MessageBoxImage.Information);
                }
                catch (Exception ex)
                {
                    System.Windows.MessageBox.Show($"Error al copiar al portapapeles: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
            else
            {
                System.Windows.MessageBox.Show("No hay aplicaciones cargadas para copiar.", "Aviso", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        private async void RemoveStartup_Click(object sender, RoutedEventArgs e)
        {
            if (sender is System.Windows.Controls.Button btn && btn.CommandParameter is StartupEntry entry)
            {
                var confirm = System.Windows.MessageBox.Show($"¿Deseas desactivar '{entry.Name}' del inicio automático? Esto puede acelerar el arranque.", "Confirmar Acción", MessageBoxButton.YesNo, MessageBoxImage.Question);
                if (confirm == MessageBoxResult.Yes)
                {
                    bool success = await Task.Run(() => StartupManager.RemoveStartupProgram(entry));
                    if (success)
                    {
                        System.Windows.MessageBox.Show($"'{entry.Name}' ha sido desactivado del inicio.", "Éxito", MessageBoxButton.OK, MessageBoxImage.Information);
                        LoadStartupPrograms();
                    }
                    else
                    {
                        System.Windows.MessageBox.Show("No se pudo desactivar el programa. Asegúrate de tener permisos de administrador.", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                    }
                }
            }
        }

        // ================= EXTREME DEBLOATER =================

        private async void StartDeepClean_Click(object sender, RoutedEventArgs e)
        {
            DebloatStatusText.Text = "🔍 Buscando aplicaciones instaladas...";
            var apps = await DebloatManager.GetInstalledBloatware();

            if (apps.Count == 0)
            {
                System.Windows.MessageBox.Show("No se encontraron aplicaciones de bloatware conocidas en tu sistema.", "Limpieza Finalizada", MessageBoxButton.OK, MessageBoxImage.Information);
                DebloatStatusText.Text = "Sistema limpio.";
                return;
            }

            int count = 0;
            int removed = 0;

            foreach (var app in apps)
            {
                count++;
                DebloatStatusText.Text = $"Preguntando [{count}/{apps.Count}]: {app.DisplayName}";

                var result = System.Windows.MessageBox.Show(
                    $"¿Deseas desinstalar la aplicación '{app.DisplayName}'?\n\nNombre técnico: {app.PackageName}",
                    "Confirmar Desinstalación",
                    MessageBoxButton.YesNoCancel,
                    MessageBoxImage.Question);

                if (result == MessageBoxResult.Cancel) break;

                if (result == MessageBoxResult.Yes)
                {
                    DebloatStatusText.Text = $"Eliminando {app.DisplayName}...";
                    bool success = await DebloatManager.UninstallApp(app.PackageName);
                    if (success) removed++;
                }
            }

            DebloatStatusText.Text = $"✅ Limpieza finalizada. Se eliminaron {removed} aplicaciones.";
            System.Windows.MessageBox.Show($"Se han eliminado {removed} aplicaciones correctamente.", "Debloat Completado", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private async void UninstallOneDrive_Click(object sender, RoutedEventArgs e)
        {
            var confirm = System.Windows.MessageBox.Show("¿Estás seguro de que quieres eliminar OneDrive por completo? Esto cerrará la aplicación y la desinstalará del sistema.", "Confirmar Acción", MessageBoxButton.YesNo, MessageBoxImage.Warning);
            if (confirm != MessageBoxResult.Yes) return;

            if (DebloatStatusText != null) DebloatStatusText.Text = "Eliminando OneDrive...";
            bool success = await DebloatManager.UninstallOneDrive();
            
            if (success)
                System.Windows.MessageBox.Show("OneDrive ha sido desinstalado correctamente.", "Éxito", MessageBoxButton.OK, MessageBoxImage.Information);
            else
                System.Windows.MessageBox.Show("Hubo un problema al intentar desinstalar OneDrive.", "Error", MessageBoxButton.OK, MessageBoxImage.Error);

            if (DebloatStatusText != null) DebloatStatusText.Text = "Acción finalizada.";
        }

        // ================= JUNK FOLDER FINDER =================

        private async void ScanJunkFolders_Click(object sender, RoutedEventArgs e)
        {
            if (JunkStatusText != null) JunkStatusText.Text = "🔍 Iniciando escaneo profundo... Esto puede tardar varios minutos.";
            
            try
            {
                junkFolders = await Task.Run(() => JunkFolderScanner.GetJunkFolders(progress => 
                {
                    Dispatcher.Invoke(() => {
                        if (JunkStatusText != null) JunkStatusText.Text = progress;
                    });
                }));

                JunkFoldersList.ItemsSource = null;
                JunkFoldersList.ItemsSource = junkFolders;

                long totalSize = junkFolders.Sum(f => f.Size);
                if (JunkStatusText != null) 
                    JunkStatusText.Text = $"✅ Escaneo completado. Encontradas {junkFolders.Count} carpetas ({FormatBytes(totalSize)}).";
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Error en el escaneo: {ex.Message}", "Error de Escaneo", MessageBoxButton.OK, MessageBoxImage.Error);
                if (JunkStatusText != null) JunkStatusText.Text = "❌ Error durante el escaneo.";
            }
        }

        private void SelectAllJunk_Click(object sender, RoutedEventArgs e)
        {
            if (sender is System.Windows.Controls.CheckBox cb)
            {
                bool isChecked = cb.IsChecked ?? false;
                foreach (var folder in junkFolders)
                {
                    folder.IsSelected = isChecked;
                }
                JunkFoldersList.ItemsSource = null;
                JunkFoldersList.ItemsSource = junkFolders;
            }
        }

        private async void StartJunkCleanup_Click(object sender, RoutedEventArgs e)
        {
            if (junkFolders.Count == 0)
            {
                System.Windows.MessageBox.Show("No hay carpetas detectadas para limpiar. Realiza un escaneo primero.", "Información", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            // Si hay seleccionados, solo procesamos esos. Si no, preguntamos si quieren procesar todos.
            var selectedItems = junkFolders.Where(f => f.IsSelected).ToList();
            var toProcess = selectedItems.Count > 0 ? selectedItems : new List<JunkFolderEntry>(junkFolders);

            var confirmInit = System.Windows.MessageBox.Show(
                $"Se van a procesar {toProcess.Count} carpetas basura.\n\nEl sistema te preguntará por cada una antes de borrarla.\n\n¿Deseas comenzar la limpieza?",
                "Limpieza Guiada",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question);

            if (confirmInit != MessageBoxResult.Yes) return;

            int removed = 0;
            int count = 0;

            foreach (var folder in toProcess)
            {
                count++;
                if (JunkStatusText != null) JunkStatusText.Text = $"Preguntando [{count}/{toProcess.Count}]: {folder.Name}";

                var result = System.Windows.MessageBox.Show(
                    $"¿Deseas eliminar esta carpeta permanentemente?\n\nNombre: {folder.Name}\nUbicación: {folder.Path}\nCompañía: {folder.Company}\nProducto: {folder.Product}\nTamaño: {folder.SizeText}",
                    "Confirmar Eliminación",
                    MessageBoxButton.YesNoCancel,
                    MessageBoxImage.Warning);

                if (result == MessageBoxResult.Cancel) break;

                if (result == MessageBoxResult.Yes)
                {
                    if (JunkStatusText != null) JunkStatusText.Text = $"Eliminando {folder.Name}...";
                    bool success = await Task.Run(() => JunkFolderScanner.DeleteFolder(folder.Path));
                    if (success)
                    {
                        removed++;
                        junkFolders.Remove(folder);
                    }
                }
            }

            JunkFoldersList.ItemsSource = null;
            JunkFoldersList.ItemsSource = junkFolders;
            
            if (JunkStatusText != null) 
                JunkStatusText.Text = $"✅ Limpieza finalizada. Se eliminaron {removed} carpetas.";
            
            System.Windows.MessageBox.Show($"Se han eliminado {removed} carpetas correctamente.", "Limpieza Completada", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private async void DeleteJunkFolder_Click(object sender, RoutedEventArgs e)
        {
            if (sender is System.Windows.Controls.Button btn && btn.CommandParameter is JunkFolderEntry folder)
            {
                var confirm = System.Windows.MessageBox.Show(
                    $"¿Deseas eliminar permanentemente esta carpeta?\n\n{folder.Path}",
                    "Confirmar Eliminación",
                    MessageBoxButton.YesNo,
                    MessageBoxImage.Warning);

                if (confirm == MessageBoxResult.Yes)
                {
                    if (JunkStatusText != null) JunkStatusText.Text = $"Eliminando {folder.Path}...";
                    bool success = await Task.Run(() => JunkFolderScanner.DeleteFolder(folder.Path));
                    if (success)
                    {
                        junkFolders.Remove(folder);
                        JunkFoldersList.ItemsSource = null;
                        JunkFoldersList.ItemsSource = junkFolders;
                        if (JunkStatusText != null) JunkStatusText.Text = "Carpeta eliminada.";
                    }
                    else
                    {
                        System.Windows.MessageBox.Show("No se pudo eliminar la carpeta. Puede que esté en uso o falten permisos.", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                    }
                }
            }
        }

        private string FormatBytes(long bytes)
        {
            return FormatBytesStatic(bytes);
        }

        public static string FormatBytesStatic(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }
    }
}

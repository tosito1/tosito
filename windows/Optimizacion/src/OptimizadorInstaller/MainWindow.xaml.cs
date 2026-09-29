using System;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Diagnostics;

namespace OptimizadorInstaller
{
    public partial class MainWindow : Window
    {
        private const string AppName = "Optimizador Suite V2";
        private const string InstallPath = @"C:\Program Files\Optimizador";
        private const string OldInstallPath = @"C:\Program Files\TositoOptimizer";

        public MainWindow()
        {
            InitializeComponent();
            CheckSilentMode();
            CheckExistingInstallation();
        }

        private void CheckExistingInstallation()
        {
            if (Directory.Exists(InstallPath) || Directory.Exists(OldInstallPath))
            {
                var result = MessageBox.Show("Se ha detectado una versión instalada del Optimizador.\n\n¿Deseas desinstalar la versión anterior antes de continuar?", "Versión Detectada", MessageBoxButton.YesNo, MessageBoxImage.Question);
                if (result == MessageBoxResult.Yes)
                {
                    PerformUninstallation();
                }
            }
        }

        private void PerformUninstallation()
        {
            try
            {
                StopRunningProcesses();
                System.Threading.Thread.Sleep(1000);

                if (Directory.Exists(InstallPath)) Directory.Delete(InstallPath, true);
                if (Directory.Exists(OldInstallPath)) Directory.Delete(OldInstallPath, true);

                UnregisterAutoStart();

                // Eliminar accesos directos
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                string[] shortcuts = { "Optimizador de Sistema V2.lnk", "Tosito Optimizer V2.lnk", "Optimizador Consola de Mando.lnk" };
                foreach (var s in shortcuts)
                {
                    string path = Path.Combine(desktop, s);
                    if (File.Exists(path)) File.Delete(path);
                }

                MessageBox.Show("Desinstalación completada. Ahora puedes proceder con la instalación limpia.", "Desinstalado", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error durante la desinstalación: " + ex.Message, "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async void CheckSilentMode()
        {
            string[] args = Environment.GetCommandLineArgs();
            bool isSilent = false;
            foreach (var arg in args) if (arg.ToUpper() == "/S") isSilent = true;

            if (isSilent)
            {
                this.Hide();
                this.ShowInTaskbar = false;
                await PerformSilentInstallation();
            }
        }

        private async Task PerformSilentInstallation()
        {
            if (!IsAdministrator()) return;
            try
            {
                StopRunningProcesses();
                if (Directory.Exists(InstallPath)) Directory.Delete(InstallPath, true);
                Directory.CreateDirectory(InstallPath);
                await ExtractEmbeddedPayload();
                CreateDesktopShortcuts();
            }
            catch { }
            Application.Current.Shutdown();
        }

        private void Window_MouseDown(object sender, MouseButtonEventArgs e)
        {
            if (e.ChangedButton == MouseButton.Left) DragMove();
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private async void BtnInstall_Click(object sender, RoutedEventArgs e)
        {
            if (!IsAdministrator())
            {
                MessageBox.Show("El instalador requiere permisos de administrador.", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            InitialControls.Visibility = Visibility.Collapsed;
            ProgressPanel.Visibility = Visibility.Visible;
            bool createShortcut = ChkShortcut.IsChecked ?? true;

            try
            {
                UpdateStatus("Preparando directorios...", 10);
                StopRunningProcesses();
                await Task.Delay(1000);

                if (!Directory.Exists(InstallPath))
                {
                    Directory.CreateDirectory(InstallPath);
                }

                UpdateStatus("Extrayendo archivos de sistema...", 40);
                await ExtractEmbeddedPayload();

                if (createShortcut)
                {
                    UpdateStatus("Creando accesos directos...", 80);
                    CreateDesktopShortcuts();
                }
                
                RegisterAutoStart();

                UpdateStatus("¡Instalación completa!", 100);

                var result = MessageBox.Show("Instalación completada exitosamente. ¿Deseas abrir el Optimizador?", "Éxito", MessageBoxButton.YesNo, MessageBoxImage.Information);
                if (result == MessageBoxResult.Yes)
                {
                    string clientExe = Path.Combine(InstallPath, "Client", "Optimizador.exe");
                    string rootExe = Path.Combine(InstallPath, "Optimizador.exe");
                    string targetExe = File.Exists(clientExe) ? clientExe : (File.Exists(rootExe) ? rootExe : null);

                    if (targetExe != null)
                    {
                        Process.Start(new ProcessStartInfo(targetExe) { UseShellExecute = true, WorkingDirectory = Path.GetDirectoryName(targetExe) });
                    }
                }
                Application.Current.Shutdown();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error durante la instalación:\n{ex.Message}", "Fallo Crítico", MessageBoxButton.OK, MessageBoxImage.Error);
                InitialControls.Visibility = Visibility.Visible;
                ProgressPanel.Visibility = Visibility.Collapsed;
            }
        }

        private void RegisterAutoStart()
        {
            try
            {
                string clientExe = Path.Combine(InstallPath, "Client", "Optimizador.exe");
                if (!File.Exists(clientExe)) return;

                using (var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true))
                {
                    if (key != null)
                    {
                        key.SetValue("OptimizadorTosito", $"\"{clientExe}\"");
                    }
                }
            }
            catch { }
        }

        private void UnregisterAutoStart()
        {
            try
            {
                using (var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true))
                {
                    if (key != null)
                    {
                        key.DeleteValue("OptimizadorTosito", false);
                    }
                }
            }
            catch { }
        }

        private void UpdateStatus(string message, double progress)
        {
            StatusText.Text = message;
            InstallProgress.Value = progress;
        }

        private async Task ExtractEmbeddedPayload()
        {
            await Task.Run(() =>
            {
                var assembly = Assembly.GetExecutingAssembly();
                string resourceName = "OptimizadorInstaller.AppPayload.zip";

                using (Stream? stream = assembly.GetManifestResourceStream(resourceName))
                {
                    if (stream == null) throw new Exception("No se encontró el paquete de instalación (Resource missing)");

                    using (ZipArchive archive = new ZipArchive(stream))
                    {
                        foreach (ZipArchiveEntry entry in archive.Entries)
                        {
                            string destinationPath = Path.GetFullPath(Path.Combine(InstallPath, entry.FullName));
                            if (!destinationPath.StartsWith(InstallPath, StringComparison.OrdinalIgnoreCase)) continue;

                            if (string.IsNullOrEmpty(entry.Name))
                            {
                                Directory.CreateDirectory(destinationPath);
                                continue;
                            }

                            Directory.CreateDirectory(Path.GetDirectoryName(destinationPath)!);
                            entry.ExtractToFile(destinationPath, true);
                        }
                    }
                }
            });
        }

        private void CreateDesktopShortcuts()
        {
            try
            {
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                string clientExe = Path.Combine(InstallPath, "Client", "Optimizador.exe");
                string rootExe = Path.Combine(InstallPath, "Optimizador.exe");
                string adminExe = Path.Combine(InstallPath, "Admin", "OptimizadorAdmin.exe");

                string actualClientExe = File.Exists(clientExe) ? clientExe : rootExe;

                string script = $@"
                    $ws = New-Object -ComObject WScript.Shell
                    if (Test-Path '{actualClientExe}') {{
                        $s = $ws.CreateShortcut('{Path.Combine(desktop, "Optimizador de Sistema V2.lnk")}');
                        $s.TargetPath = '{actualClientExe}';
                        $s.WorkingDirectory = '{Path.GetDirectoryName(actualClientExe)}';
                        $s.Save();
                    }}
                    if (Test-Path '{adminExe}') {{
                        $s = $ws.CreateShortcut('{Path.Combine(desktop, "Optimizador Consola de Mando.lnk")}');
                        $s.TargetPath = '{adminExe}';
                        $s.WorkingDirectory = '{Path.GetDirectoryName(adminExe)}';
                        $s.Save();
                    }}";

                var bytes = System.Text.Encoding.Unicode.GetBytes(script);
                string encoded = Convert.ToBase64String(bytes);
                Process.Start(new ProcessStartInfo("powershell.exe", $"-ExecutionPolicy Bypass -EncodedCommand {encoded}") { CreateNoWindow = true, UseShellExecute = false });
            }
            catch { }
        }

        private bool IsAdministrator()
        {
            using (var identity = System.Security.Principal.WindowsIdentity.GetCurrent())
            {
                var principal = new System.Security.Principal.WindowsPrincipal(identity);
                return principal.IsInRole(System.Security.Principal.WindowsBuiltInRole.Administrator);
            }
        }

        private void StopRunningProcesses()
        {
            try
            {
                // Kill all Optimizador processes and wait for them to finish
                foreach (var process in Process.GetProcessesByName("Optimizador"))
                {
                    try
                    {
                        process.Kill(true); // Kill the entire process tree
                        process.WaitForExit(3000);
                    }
                    catch { }
                }

                foreach (var process in Process.GetProcessesByName("OptimizadorAdmin"))
                {
                    try
                    {
                        process.Kill(true);
                        process.WaitForExit(3000);
                    }
                    catch { }
                }

                foreach (var process in Process.GetProcessesByName("cloudflared"))
                {
                    try
                    {
                        process.Kill(true);
                        process.WaitForExit(3000);
                    }
                    catch { }
                }

                foreach (var process in Process.GetProcessesByName("ssh"))
                {
                    try
                    {
                        process.Kill(true);
                        process.WaitForExit(3000);
                    }
                    catch { }
                }

                // Force kill via CMD taskkill for absolute certainty
                var psi = new ProcessStartInfo("cmd.exe", "/c taskkill /f /t /im Optimizador.exe /im OptimizadorAdmin.exe /im cloudflared.exe /im ssh.exe")
                {
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                var p = Process.Start(psi);
                p?.WaitForExit(3000);
            }
            catch { }
        }
    }
}


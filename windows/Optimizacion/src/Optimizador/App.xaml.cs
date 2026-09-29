using System;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using Optimizador.Scan;
using Optimizador.Logging;

namespace Optimizador
{
    public partial class App : System.Windows.Application
    {
        protected override async void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            if (e.Args.Contains("--silent-clean"))
            {
                await PerformSilentCleanAsync();
                Current.Shutdown();
            }
            else
            {
                var mainWindow = new MainWindow();
                
                // Si se inicia en segundo plano, no llamamos a Show() de inmediato
                // o lo iniciamos minimizado (que disparará el OnStateChanged y Hide)
                if (e.Args.Contains("/background"))
                {
                    mainWindow.WindowState = WindowState.Minimized;
                    // Forzamos el Hide() inicial porque OnStateChanged no se dispara si ya nace minimizado
                    mainWindow.Hide();
                }
                else
                {
                    mainWindow.Show();
                }
            }
        }

        private async Task PerformSilentCleanAsync()
        {
            try
            {
                long freedSize = 0;
                
                var tempList = await Task.Run(() => TempFilesScanner.GetTempFiles());
                if (tempList.Any())
                    freedSize += await Task.Run(() => TempFilesScanner.DeleteTempFiles(tempList));
                
                var cacheList = await Task.Run(() => CacheScanner.GetBrowserCache());
                if (cacheList.Any())
                    freedSize += await Task.Run(() => CacheScanner.DeleteCache(cacheList));
                
                freedSize += await Task.Run(() => RecycleBinScanner.EmptyRecycleBin());
                
                Logger.LogAction("AutoClean", $"Completado silenciosamente. Liberado: {FormatBytes(freedSize)}");
            }
            catch (Exception ex)
            {
                Logger.LogAction("AutoCleanError", $"Error: {ex.Message}");
            }
        }

        private string FormatBytes(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB" };
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

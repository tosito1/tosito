using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;

namespace Optimizador
{
    public static class PowerShellRunner
    {
        public static async Task RunScriptAsync(string relativeScriptPath)
        {
            await Task.Run(() => 
            {
                try
                {
                    string scriptPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, relativeScriptPath);
                    if (!File.Exists(scriptPath))
                        return;

                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = "powershell.exe",
                        Arguments = $"-NoProfile -ExecutionPolicy Bypass -File \"{scriptPath}\"",
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };
                    
                    using (var process = Process.Start(psi))
                    {
                        process?.WaitForExit();
                    }
                }
                catch
                {
                    // Falla silenciosa si no existe el script o no hay permisos
                }
            });
        }
    }
}

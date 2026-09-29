using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace Optimizador.Scan
{
    public class DebloatApp
    {
        public string DisplayName { get; set; } = string.Empty;
        public string PackageName { get; set; } = string.Empty;
        public bool IsInstalled { get; set; }
    }

    public static class DebloatManager
    {
        private static readonly List<string> BloatwareTargets = new List<string>
        {
            "Microsoft.BingNews", "Microsoft.BingWeather", "Microsoft.Microsoft3DViewer",
            "Microsoft.MicrosoftSolitaireCollection", "Microsoft.StickyNotes",
            "Microsoft.MixedReality.Portal", "Microsoft.Office.OneNote",
            "Microsoft.People", "Microsoft.SkypeApp", "Microsoft.WindowsAlarms",
            "Microsoft.WindowsCamera", "microsoft.windowscommunicationsapps",
            "Microsoft.WindowsFeedbackHub", "Microsoft.WindowsMaps",
            "Microsoft.WindowsSoundRecorder", "Microsoft.XboxApp",
            "Microsoft.XboxOneSmartGlass", "Microsoft.XboxSpeechToTextOverlay",
            "Microsoft.ZuneMusic", "Microsoft.ZuneVideo", "TikTok", "Facebook",
            "Instagram", "Spotify", "Netflix", "Disney", "CandyCrush", "Twitter",
            "LinkedIn", "Microsoft.YourPhone", "Microsoft.GetHelp", "Microsoft.Getstarted",
            "Microsoft.Messaging", "Microsoft.OneConnect", "Microsoft.StorePurchaseApp"
        };

        public static async Task<List<DebloatApp>> GetInstalledBloatware()
        {
            return await Task.Run(() =>
            {
                var installedApps = new List<DebloatApp>();
                try
                {
                    string script = "Get-AppxPackage -AllUsers | Select-Object Name";
                    var processInfo = new ProcessStartInfo
                    {
                        FileName = "powershell.exe",
                        Arguments = $"-NoProfile -ExecutionPolicy Bypass -Command \"{script}\"",
                        RedirectStandardOutput = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };

                    using (var process = Process.Start(processInfo))
                    {
                        if (process != null)
                        {
                            string output = process.StandardOutput.ReadToEnd();
                            foreach (var target in BloatwareTargets)
                            {
                                if (output.Contains(target, StringComparison.OrdinalIgnoreCase))
                                {
                                    installedApps.Add(new DebloatApp
                                    {
                                        DisplayName = target.Replace("Microsoft.", "").Replace("windowscommunicationsapps", "Mail & Calendar"),
                                        PackageName = target,
                                        IsInstalled = true
                                    });
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Debug.WriteLine("Error scanning for bloatware: " + ex.Message);
                }
                return installedApps;
            });
        }

        public static async Task<bool> UninstallApp(string packageName)
        {
            return await Task.Run(() =>
            {
                try
                {
                    // Remove for current user and provisioned
                    string script = $@"
                        $package = Get-AppxPackage -Name '*{packageName}*' -ErrorAction SilentlyContinue
                        if ($package) {{
                            Remove-AppxPackage -Package $package.PackageFullName -ErrorAction SilentlyContinue
                        }}
                        $provisioned = Get-AppxProvisionedPackage -Online | Where-Object {{ $_.DisplayName -like '*{packageName}*' }}
                        if ($provisioned) {{
                            Remove-AppxProvisionedPackage -Online -PackageName $provisioned.PackageName -ErrorAction SilentlyContinue 
                        }}
                    ";

                    var processInfo = new ProcessStartInfo
                    {
                        FileName = "powershell.exe",
                        Arguments = $"-NoProfile -ExecutionPolicy Bypass -Command \"{script}\"",
                        Verb = "runas", // Request admin
                        UseShellExecute = true,
                        CreateNoWindow = true
                    };

                    var process = Process.Start(processInfo);
                    process?.WaitForExit();
                    return true;
                }
                catch
                {
                    return false;
                }
            });
        }

        public static async Task<bool> UninstallOneDrive()
        {
            return await Task.Run(() =>
            {
                try
                {
                    string script = @"
                        Write-Host 'Deteniendo OneDrive...'
                        taskkill /f /im OneDrive.exe /ErrorAction SilentlyContinue
                        
                        $os = [System.Environment]::Is64BitOperatingSystem
                        if ($os) {
                            $setup = ""$env:SystemRoot\SysWOW64\OneDriveSetup.exe""
                        } else {
                            $setup = ""$env:SystemRoot\System32\OneDriveSetup.exe""
                        }
                        
                        if (Test-Path $setup) {
                            Write-Host 'Ejecutando desinstalador...'
                            Start-Process $setup -ArgumentList '/uninstall' -Wait
                        }
                        
                        # Limpiar carpetas residuales
                        Remove-Item ""$env:UserProfile\OneDrive"" -Recurse -Force -ErrorAction SilentlyContinue
                        Remove-Item ""$env:LocalAppData\Microsoft\OneDrive"" -Recurse -Force -ErrorAction SilentlyContinue
                        Remove-Item ""$env:ProgramData\Microsoft OneDrive"" -Recurse -Force -ErrorAction SilentlyContinue
                    ";

                    var processInfo = new ProcessStartInfo
                    {
                        FileName = "powershell.exe",
                        Arguments = $"-NoProfile -ExecutionPolicy Bypass -Command \"{script}\"",
                        Verb = "runas",
                        UseShellExecute = true,
                        CreateNoWindow = true
                    };

                    var process = Process.Start(processInfo);
                    process?.WaitForExit();
                    return true;
                }
                catch
                {
                    return false;
                }
            });
        }
    }
}

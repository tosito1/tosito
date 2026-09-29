using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Win32;
using Optimizador.Logging;

namespace Optimizador.Scan
{
    public class JunkFolderEntry
    {
        public string Path { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public long Size { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime LastModified { get; set; }
        public int ExeCount { get; set; }
        public string Company { get; set; } = "Desconocido";
        public string Product { get; set; } = "Desconocido";
        public bool IsSelected { get; set; } = false;
        public string SizeText => FormatSize(Size);

        private static string FormatSize(long bytes)
        {
            string[] Suffix = { "B", "KB", "MB", "GB", "TB" };
            int i;
            double dblSByte = bytes;
            for (i = 0; i < Suffix.Length && bytes >= 1024; i++, bytes /= 1024)
            {
                dblSByte = bytes / 1024.0;
            }
            return $"{dblSByte:0.##} {Suffix[i]}";
        }
    }

    public static class JunkFolderScanner
    {
        private static readonly string[] ExcludePaths = { 
            "Windows", "$Recycle.Bin", "System Volume Information", "PerfLogs"
        };

        public static List<JunkFolderEntry> GetJunkFolders(Action<string>? onProgressUpdate = null)
        {
            var results = new List<JunkFolderEntry>();
            var legitPaths = GetInstalledAppPaths();

            foreach (var drive in DriveInfo.GetDrives().Where(d => d.DriveType == DriveType.Fixed && d.IsReady))
            {
                onProgressUpdate?.Invoke($"Escaneando unidad {drive.Name}...");
                ScanDrive(drive.RootDirectory.FullName, legitPaths, results, onProgressUpdate);
            }

            return results.OrderByDescending(x => x.Size).ToList();
        }

        private static HashSet<string> GetInstalledAppPaths()
        {
            var paths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            
            try 
            {
                // HKLM
                AddPathsFromRegistry(Registry.LocalMachine, @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", paths);
                AddPathsFromRegistry(Registry.LocalMachine, @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall", paths);
                
                // HKCU
                AddPathsFromRegistry(Registry.CurrentUser, @"Software\Microsoft\Windows\CurrentVersion\Uninstall", paths);

                // Add standard program folders
                paths.Add(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles).TrimEnd('\\'));
                paths.Add(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86).TrimEnd('\\'));
                paths.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Microsoft").TrimEnd('\\'));
            }
            catch { }

            return paths;
        }

        private static void AddPathsFromRegistry(RegistryKey rootKey, string subKeyPath, HashSet<string> paths)
        {
            try
            {
                using (var key = rootKey.OpenSubKey(subKeyPath))
                {
                    if (key == null) return;
                    foreach (var subKeyName in key.GetSubKeyNames())
                    {
                        try
                        {
                            using (var subKey = key.OpenSubKey(subKeyName))
                            {
                                var installLocation = subKey?.GetValue("InstallLocation")?.ToString();
                                if (!string.IsNullOrEmpty(installLocation) && Directory.Exists(installLocation))
                                {
                                    paths.Add(installLocation.TrimEnd('\\', '\"', ' '));
                                }

                                // Advanced Discovery: Parse Icon and Uninstall paths
                                var iconPath = GetDirectoryFromPath(subKey?.GetValue("DisplayIcon")?.ToString());
                                if (iconPath != null) paths.Add(iconPath);

                                var uninstallPath = GetDirectoryFromPath(subKey?.GetValue("UninstallString")?.ToString());
                                if (uninstallPath != null) paths.Add(uninstallPath);
                            }
                        }
                        catch { }
                    }
                }
            }
            catch { }
        }

        private static string? GetDirectoryFromPath(string? path)
        {
            if (string.IsNullOrEmpty(path)) return null;
            try
            {
                path = path.Trim('\"', ' ');
                // If it's a command line with arguments (like uninstall.exe /quiet), take the first part
                if (path.StartsWith("\"")) {
                    int endQuote = path.IndexOf("\"", 1);
                    if (endQuote > 0) path = path.Substring(1, endQuote - 1);
                } else if (path.Contains(".exe", StringComparison.OrdinalIgnoreCase)) {
                    int exeIndex = path.IndexOf(".exe", StringComparison.OrdinalIgnoreCase);
                    path = path.Substring(0, exeIndex + 4);
                }

                if (File.Exists(path)) return Path.GetDirectoryName(path);
                if (Directory.Exists(path)) return path;
            }
            catch { }
            return null;
        }

        private static void ScanDrive(string path, HashSet<string> legitPaths, List<JunkFolderEntry> results, Action<string>? onProgressUpdate)
        {
            try
            {
                // Skip excluded paths
                if (ExcludePaths.Any(ex => path.Contains(ex, StringComparison.OrdinalIgnoreCase)))
                    return;

                var dir = new DirectoryInfo(path);
                
                bool hasExe = false;
                int exeCount = 0;
                try {
                    var exes = dir.GetFiles("*.exe", SearchOption.TopDirectoryOnly);
                    exeCount = exes.Length;
                    hasExe = exeCount > 0;
                } catch { }

                if (hasExe)
                {
                    bool isLegit = IsPathLegit(path, legitPaths);
                    
                    if (!isLegit)
                    {
                        long size = GetDirectorySize(path);
                        // Deep detection: even small folders (<1MB) can be important utilities
                        if (size > 100 * 1024) 
                        {
                            var mainExe = dir.GetFiles("*.exe").OrderByDescending(f => f.Length).FirstOrDefault();
                            string company = "Desconocido";
                            string product = "Desconocido";

                            if (mainExe != null)
                            {
                                try {
                                    var info = System.Diagnostics.FileVersionInfo.GetVersionInfo(mainExe.FullName);
                                    company = info.CompanyName ?? "Desconocido";
                                    product = info.ProductName ?? "Desconocido";
                                } catch { }
                            }

                            results.Add(new JunkFolderEntry
                            {
                                Path = path,
                                Name = dir.Name,
                                Size = size,
                                ExeCount = exeCount,
                                LastModified = dir.LastWriteTime,
                                Company = company,
                                Product = product,
                                Reason = company != "Desconocido" ? $"App de {company} no registrada" : "Aplicación/Juego huérfano"
                            });
                            
                            onProgressUpdate?.Invoke($"Encontrado: {dir.Name} [{company}] ({FormatBytes(size)})");
                            return; 
                        }
                    }
                }

                // Recursion
                foreach (var subdir in dir.GetDirectories())
                {
                    ScanDrive(subdir.FullName, legitPaths, results, onProgressUpdate);
                }
            }
            catch (UnauthorizedAccessException) { }
            catch (Exception) { }
        }

        private static bool IsPathLegit(string path, HashSet<string> legitPaths)
        {
            string current = path.TrimEnd('\\', ' ');
            while (!string.IsNullOrEmpty(current))
            {
                if (legitPaths.Contains(current)) return true;
                var parent = Path.GetDirectoryName(current);
                if (string.IsNullOrEmpty(parent) || parent == current) break;
                current = parent;
            }
            return false;
        }

        private static long GetDirectorySize(string path)
        {
            long size = 0;
            try
            {
                var dir = new DirectoryInfo(path);
                foreach (var file in dir.EnumerateFiles("*", SearchOption.AllDirectories))
                {
                    try { size += file.Length; } catch { }
                }
            }
            catch { }
            return size;
        }

        private static string FormatBytes(long bytes)
        {
            string[] Suffix = { "B", "KB", "MB", "GB", "TB" };
            int i;
            double dblSByte = bytes;
            for (i = 0; i < Suffix.Length && bytes >= 1024; i++, bytes /= 1024)
            {
                dblSByte = bytes / 1024.0;
            }
            return $"{dblSByte:0.##} {Suffix[i]}";
        }

        public static bool DeleteFolder(string path)
        {
            try
            {
                if (Directory.Exists(path))
                {
                    Directory.Delete(path, true);
                    return true;
                }
            }
            catch (Exception ex)
            {
                Logger.LogAction("JunkDeleteError", $"Falló al eliminar {path}: {ex.Message}");
            }
            return false;
        }
    }
}

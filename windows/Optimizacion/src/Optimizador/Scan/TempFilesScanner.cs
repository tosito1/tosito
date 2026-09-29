using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Optimizador.Logging;

namespace Optimizador.Scan
{
    public class TempEntry
    {
        public string Path { get; set; } = string.Empty;
        public long Size { get; set; }
        public DateTime Modified { get; set; }
        public string Type { get; set; } = string.Empty;
    }

    public static class TempFilesScanner
    {
        public static List<TempEntry> GetTempFiles()
        {
            var results = new List<TempEntry>();

            try
            {
                // Windows Temp directory
                var tempPath = Path.GetTempPath();
                results.AddRange(ScanDirectory(tempPath, "Windows Temp"));

                // Prefetch
                var prefetchPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows), "Prefetch");
                if (Directory.Exists(prefetchPath))
                    results.AddRange(ScanDirectory(prefetchPath, "Prefetch"));

                // SoftwareDistribution (Updates Cache)
                var swDistPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows), "SoftwareDistribution", "Download");
                if (Directory.Exists(swDistPath))
                    results.AddRange(ScanDirectory(swDistPath, "Windows Update Cache"));

                // Recent files
                var recentPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Microsoft\\Windows\\Recent");
                if (Directory.Exists(recentPath))
                    results.AddRange(ScanDirectory(recentPath, "Recent Files"));

                Logger.LogAction("TempScan", $"Found {results.Count} temp files ({results.Count(r => r.Type == "Windows Update Cache")} WU Cache).");
            }
            catch (Exception ex)
            {
                Logger.LogAction("TempScanError", ex.Message);
            }

            return results;
        }

        private static List<TempEntry> ScanDirectory(string path, string type)
        {
            var results = new List<TempEntry>();

            try
            {
                var dir = new DirectoryInfo(path);
                var files = dir.GetFiles("*", SearchOption.TopDirectoryOnly);

                foreach (var file in files)
                {
                    try
                    {
                        results.Add(new TempEntry
                        {
                            Path = file.FullName,
                            Size = file.Length,
                            Modified = file.LastWriteTime,
                            Type = type
                        });
                    }
                    catch { }
                }
            }
            catch { }

            return results;
        }

        public static long DeleteTempFiles(List<TempEntry> entries)
        {
            long deletedSize = 0;

            foreach (var entry in entries)
            {
                try
                {
                    if (File.Exists(entry.Path))
                    {
                        deletedSize += entry.Size;
                        File.Delete(entry.Path);
                    }
                }
                catch (Exception ex)
                {
                    Logger.LogAction("TempDeleteError", $"Failed to delete {entry.Path}: {ex.Message}");
                }
            }

            return deletedSize;
        }
    }
}

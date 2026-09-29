using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Optimizador.Logging;

namespace Optimizador.Scan
{
    public class LargeFileEntry
    {
        public string Path { get; set; } = string.Empty;
        public long Size { get; set; }
        public string Extension { get; set; } = string.Empty;
    }

    public static class LargeFilesScanner
    {
        private static readonly long MIN_SIZE = 100 * 1024 * 1024; // 100 MB
        private static readonly string[] EXCLUDE_EXTENSIONS = { ".exe", ".dll", ".sys", ".exe", ".scr" };
        private static readonly string[] EXCLUDE_PATHS = { "Windows", "Program Files", "Program Files (x86)", "System32" };

        public static List<LargeFileEntry> GetLargeFiles(string rootPath = "", long minSize = 0)
        {
            var results = new List<LargeFileEntry>();
            var size = minSize > 0 ? minSize : MIN_SIZE;

            try
            {
                var startPath = string.IsNullOrEmpty(rootPath) ? 
                    Environment.GetFolderPath(Environment.SpecialFolder.UserProfile) : rootPath;

                ScanDirectoryForLargeFiles(startPath, results, size);
                
                Logger.LogAction("LargeFilesScan", $"Found {results.Count} large files");
            }
            catch (Exception ex)
            {
                Logger.LogAction("LargeFilesScanError", ex.Message);
            }

            return results.OrderByDescending(x => x.Size).Take(100).ToList();
        }

        private static void ScanDirectoryForLargeFiles(string path, List<LargeFileEntry> results, long minSize, int depth = 0)
        {
            if (depth > 5) return; // Limit depth

            try
            {
                var dir = new DirectoryInfo(path);

                // Skip excluded paths
                if (EXCLUDE_PATHS.Any(ex => path.Contains(ex)))
                    return;

                var files = dir.GetFiles("*", SearchOption.TopDirectoryOnly);

                foreach (var file in files)
                {
                    try
                    {
                        if (file.Length >= minSize && !EXCLUDE_EXTENSIONS.Contains(file.Extension.ToLower()))
                        {
                            results.Add(new LargeFileEntry
                            {
                                Path = file.FullName,
                                Size = file.Length,
                                Extension = file.Extension
                            });
                        }
                    }
                    catch { }
                }

                var subdirs = dir.GetDirectories("*", SearchOption.TopDirectoryOnly);
                foreach (var subdir in subdirs)
                {
                    try
                    {
                        ScanDirectoryForLargeFiles(subdir.FullName, results, minSize, depth + 1);
                    }
                    catch { }
                }
            }
            catch { }
        }
    }
}

using System;
using System.Collections.Generic;
using System.IO;
using System.Diagnostics;
using Optimizador.Logging;

namespace Optimizador.Scan
{
    public class RecycleBinEntry
    {
        public string FileName { get; set; } = string.Empty;
        public long Size { get; set; }
        public DateTime DeletedDate { get; set; }
    }

    public static class RecycleBinScanner
    {
        public static List<RecycleBinEntry> GetRecycleBinItems()
        {
            var results = new List<RecycleBinEntry>();

            try
            {
                var sid = System.Security.Principal.WindowsIdentity.GetCurrent().User;
                if (sid == null) return results;
                string currentUserSid = sid.Value;
                string recycleBinPath = Path.Combine(Environment.GetEnvironmentVariable("SystemDrive") ?? "C:\\", "$Recycle.Bin", currentUserSid);

                if (Directory.Exists(recycleBinPath))
                {
                    var dir = new DirectoryInfo(recycleBinPath);
                    var files = dir.GetFiles("*", new EnumerationOptions { IgnoreInaccessible = true, RecurseSubdirectories = true });

                    foreach (var file in files)
                    {
                        try
                        {
                            results.Add(new RecycleBinEntry
                            {
                                FileName = file.Name,
                                Size = file.Length,
                                DeletedDate = file.LastWriteTime
                            });
                        }
                        catch { }
                    }
                }

                Logger.LogAction("RecycleBinScan", $"Found {results.Count} items in trash");
            }
            catch (Exception ex)
            {
                Logger.LogAction("RecycleBinScanError", ex.Message);
            }

            return results;
        }

        public static long EmptyRecycleBin()
        {
            long freedSpace = 0;

            try
            {
                var sid = System.Security.Principal.WindowsIdentity.GetCurrent().User;
                if (sid == null) return freedSpace;
                string currentUserSid = sid.Value;
                string recycleBinPath = Path.Combine(Environment.GetEnvironmentVariable("SystemDrive") ?? "C:\\", "$Recycle.Bin", currentUserSid);

                if (Directory.Exists(recycleBinPath))
                {
                    var dir = new DirectoryInfo(recycleBinPath);
                    var files = dir.GetFiles("*", new EnumerationOptions { IgnoreInaccessible = true, RecurseSubdirectories = true });

                    foreach (var file in files)
                    {
                        try
                        {
                            freedSpace += file.Length;
                            file.Delete();
                        }
                        catch { }
                    }
                }

                Logger.LogAction("RecycleBinEmpty", $"Emptied recycle bin, freed {FormatBytes(freedSpace)}");
            }
            catch (Exception ex)
            {
                Logger.LogAction("RecycleBinEmptyError", ex.Message);
            }

            return freedSpace;
        }

        private static string FormatBytes(long bytes)
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

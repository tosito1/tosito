using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Optimizador.Logging;

namespace Optimizador.Scan
{
    public class CacheEntry
    {
        public string Path { get; set; } = string.Empty;
        public long Size { get; set; }
        public string Browser { get; set; } = string.Empty;
    }

    public static class CacheScanner
    {
        public static List<CacheEntry> GetBrowserCache()
        {
            var results = new List<CacheEntry>();

            try
            {
                // Chrome Cache
                var chromeCache = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "Google\\Chrome\\User Data\\Default\\Cache");
                results.AddRange(ScanCache(chromeCache, "Chrome"));

                // Edge Cache
                var edgeCache = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "Microsoft\\Edge\\User Data\\Default\\Cache");
                results.AddRange(ScanCache(edgeCache, "Edge"));

                // Firefox Cache
                var firefoxBase = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "Mozilla\\Firefox\\Profiles");
                if (Directory.Exists(firefoxBase))
                {
                    try
                    {
                        var profiles = Directory.GetDirectories(firefoxBase);
                        foreach (var profile in profiles)
                        {
                            var cacheDir = Path.Combine(profile, "cache2");
                            results.AddRange(ScanCache(cacheDir, "Firefox"));
                        }
                    }
                    catch { }
                }

                Logger.LogAction("CacheScan", $"Found {results.Count} cache entries");
            }
            catch (Exception ex)
            {
                Logger.LogAction("CacheScanError", ex.Message);
            }

            return results;
        }

        private static List<CacheEntry> ScanCache(string path, string browser)
        {
            var results = new List<CacheEntry>();

            if (!Directory.Exists(path))
                return results;

            try
            {
                var dir = new DirectoryInfo(path);
                var files = dir.GetFiles("*", new EnumerationOptions { IgnoreInaccessible = true, RecurseSubdirectories = true });

                foreach (var file in files)
                {
                    try
                    {
                        results.Add(new CacheEntry
                        {
                            Path = file.FullName,
                            Size = file.Length,
                            Browser = browser
                        });
                    }
                    catch { }
                }
            }
            catch { }

            return results;
        }

        public static long DeleteCache(List<CacheEntry> entries)
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
                    Logger.LogAction("CacheDeleteError", $"Failed to delete {entry.Path}: {ex.Message}");
                }
            }

            return deletedSize;
        }
    }
}

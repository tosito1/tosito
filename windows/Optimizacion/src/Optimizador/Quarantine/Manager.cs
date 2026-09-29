using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Optimizador.Logging;

namespace Optimizador.Quarantine
{
    public class QuarantineRecord
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string OriginalPath { get; set; } = string.Empty;
        public string QuarantinePath { get; set; } = string.Empty;
        public DateTime QuarantinedAt { get; set; } = DateTime.UtcNow;
    }

    public static class Manager
    {
        private static readonly object _lock = new object();
        private const string RecordsFileName = "records.json";

        public static string GetQuarantineRoot()
        {
            var root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Optimizador", "Quarantine");
            return root;
        }

        private static string GetRecordsPath()
        {
            return Path.Combine(GetQuarantineRoot(), RecordsFileName);
        }

        private static void EnsureQuarantineRoot()
        {
            var root = GetQuarantineRoot();
            if (!Directory.Exists(root)) Directory.CreateDirectory(root);
        }

        public static IReadOnlyList<QuarantineRecord> ListRecords()
        {
            lock (_lock)
            {
                try
                {
                    EnsureQuarantineRoot();
                    var path = GetRecordsPath();
                    if (!File.Exists(path)) return new List<QuarantineRecord>();
                    var json = File.ReadAllText(path);
                    var records = JsonSerializer.Deserialize<List<QuarantineRecord>>(json);
                    return records ?? new List<QuarantineRecord>();
                }
                catch
                {
                    Logger.LogAction("ListRecordsError", "Failed to read quarantine records");
                    return Array.Empty<QuarantineRecord>();
                }
            }
        }

        private static void SaveRecords(List<QuarantineRecord> records)
        {
            lock (_lock)
            {
                EnsureQuarantineRoot();
                var path = GetRecordsPath();
                var json = JsonSerializer.Serialize(records, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(path, json);
            }
        }

        public static QuarantineRecord? QuarantineFile(string originalPath)
        {
            if (string.IsNullOrEmpty(originalPath) || !File.Exists(originalPath)) return null;
            try
            {
                EnsureQuarantineRoot();
                var records = ListRecords().ToList();
                var id = Guid.NewGuid().ToString();
                var ext = Path.GetExtension(originalPath);
                var fileName = Path.GetFileNameWithoutExtension(originalPath);
                var safeName = SanitizeFileName(fileName);
                var destFileName = $"{safeName}_{DateTime.UtcNow:yyyyMMddHHmmss}_{id}{ext}";
                var destPath = Path.Combine(GetQuarantineRoot(), destFileName);

                try
                {
                    File.Move(originalPath, destPath);
                }
                catch
                {
                    // fallback to copy+delete
                    File.Copy(originalPath, destPath, overwrite: true);
                    try { File.Delete(originalPath); } catch { }
                }

                var rec = new QuarantineRecord
                {
                    Id = id,
                    OriginalPath = originalPath,
                    QuarantinePath = destPath,
                    QuarantinedAt = DateTime.UtcNow
                };

                records.Add(rec);
                SaveRecords(records);
                Logger.LogAction("QuarantineFile", $"Id={id}; From={originalPath}; To={destPath}");
                return rec;
            }
            catch
            {
                Logger.LogAction("QuarantineFileError", $"Failed to quarantine {originalPath}");
                return null;
            }
        }

        public static bool RestoreRecord(string id)
        {
            lock (_lock)
            {
                try
                {
                    var records = ListRecords().ToList();
                    var rec = records.FirstOrDefault(r => r.Id == id);
                    if (rec == null) return false;
                    if (!File.Exists(rec.QuarantinePath))
                    {
                        // remove missing file
                        records.Remove(rec);
                        SaveRecords(records);
                        Logger.LogAction("RestoreRecord", $"Missing quarantine file for Id={id}");
                        return false;
                    }

                    var targetDir = Path.GetDirectoryName(rec.OriginalPath) ?? Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                    if (!Directory.Exists(targetDir)) Directory.CreateDirectory(targetDir);

                    var restorePath = rec.OriginalPath;
                    if (File.Exists(restorePath))
                    {
                        // avoid overwrite: append suffix
                        var baseName = Path.GetFileNameWithoutExtension(restorePath);
                        var ext = Path.GetExtension(restorePath);
                        restorePath = Path.Combine(targetDir, baseName + "_restored_" + DateTime.UtcNow.ToString("yyyyMMddHHmmss") + ext);
                    }

                    File.Move(rec.QuarantinePath, restorePath);

                    records.Remove(rec);
                    SaveRecords(records);
                    Logger.LogAction("RestoreRecord", $"Id={id}; RestoredTo={restorePath}");
                    return true;
                }
                catch
                {
                    Logger.LogAction("RestoreRecordError", $"Failed to restore Id={id}");
                    return false;
                }
            }
        }

        public static bool DeleteRecordPermanently(string id)
        {
            lock (_lock)
            {
                try
                {
                    var records = ListRecords().ToList();
                    var rec = records.FirstOrDefault(r => r.Id == id);
                    if (rec == null) return false;
                    if (File.Exists(rec.QuarantinePath))
                    {
                        try { File.Delete(rec.QuarantinePath); } catch { }
                    }
                    records.Remove(rec);
                    SaveRecords(records);
                    Logger.LogAction("DeleteRecordPermanently", $"Id={id}; Path={rec.QuarantinePath}");
                    return true;
                }
                catch
                {
                    Logger.LogAction("DeleteRecordError", $"Failed to delete Id={id}");
                    return false;
                }
            }
        }

        private static string SanitizeFileName(string name)
        {
            foreach (var c in Path.GetInvalidFileNameChars()) name = name.Replace(c, '_');
            return name;
        }
    }
}

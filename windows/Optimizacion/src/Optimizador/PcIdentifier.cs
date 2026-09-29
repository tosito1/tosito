using System;
using System.IO;

namespace Optimizador
{
    public static class PcIdentifier
    {
        private static readonly string DataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "TositoOptimizer");
        private static readonly string LegacyIdFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "pcid.txt");
        private static readonly string LegacyPinFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "pcpin.txt");
        private static readonly string IdFilePath = Path.Combine(DataFolder, "pcid.txt");
        private static readonly string PinFilePath = Path.Combine(DataFolder, "pcpin.txt");
        private static string? _cachedId;
        private static string? _cachedPin;

        private static void EnsureDataFolder()
        {
            try
            {
                if (!Directory.Exists(DataFolder))
                {
                    Directory.CreateDirectory(DataFolder);
                }
                if (File.Exists(LegacyIdFilePath) && !File.Exists(IdFilePath))
                {
                    File.Copy(LegacyIdFilePath, IdFilePath, true);
                }
                if (File.Exists(LegacyPinFilePath) && !File.Exists(PinFilePath))
                {
                    File.Copy(LegacyPinFilePath, PinFilePath, true);
                }
            }
            catch { }
        }

        public static string GetId()
        {
            if (_cachedId != null) return _cachedId;

            EnsureDataFolder();

            if (File.Exists(IdFilePath))
            {
                _cachedId = File.ReadAllText(IdFilePath).Trim();
            }
            else
            {
                _cachedId = "pc_" + Guid.NewGuid().ToString("n").Substring(0, 12);
                try { File.WriteAllText(IdFilePath, _cachedId); } catch { }
            }
            return _cachedId;
        }

        public static string GetPersistentPin()
        {
            if (_cachedPin != null) return _cachedPin;

            EnsureDataFolder();

            if (File.Exists(PinFilePath))
            {
                _cachedPin = File.ReadAllText(PinFilePath).Trim();
            }
            else
            {
                _cachedPin = new Random().Next(100000, 999999).ToString();
                try { File.WriteAllText(PinFilePath, _cachedPin); } catch { }
            }
            return _cachedPin;
        }
    }
}

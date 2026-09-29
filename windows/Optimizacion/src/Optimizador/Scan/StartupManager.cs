using System;
using System.Collections.Generic;
using Microsoft.Win32;
using System.IO;

namespace Optimizador.Scan
{
    public class StartupEntry
    {
        public string Name { get; set; } = string.Empty;
        public string Command { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty; // HKLM, HKCU, folder, etc.
        public string FilePath { get; set; } = string.Empty; // If it's a file in the Startup folder
        public bool IsRegistry { get; set; }
    }

    public static class StartupManager
    {
        public static List<StartupEntry> GetStartupPrograms()
        {
            var entries = new List<StartupEntry>();

            // Current User Registry
            entries.AddRange(GetEntriesFromKey(Registry.CurrentUser, @"Software\Microsoft\Windows\CurrentVersion\Run", "Registro (Usuario)"));
            
            // Local Machine Registry
            entries.AddRange(GetEntriesFromKey(Registry.LocalMachine, @"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", "Registro (Sistema)"));
            
            // WOW6432Node Registry
            entries.AddRange(GetEntriesFromKey(Registry.LocalMachine, @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run", "Registro (Sistema 32-bit)"));

            // Startup Folders
            entries.AddRange(GetEntriesFromFolder(Environment.GetFolderPath(Environment.SpecialFolder.Startup), "Carpeta Inicio (Usuario)"));
            entries.AddRange(GetEntriesFromFolder(Environment.GetFolderPath(Environment.SpecialFolder.CommonStartup), "Carpeta Inicio (Sistema)"));

            return entries;
        }

        private static List<StartupEntry> GetEntriesFromKey(RegistryKey rootKey, string subKeyPath, string locationName)
        {
            var list = new List<StartupEntry>();
            try
            {
                using (RegistryKey? key = rootKey.OpenSubKey(subKeyPath, false))
                {
                    if (key != null)
                    {
                        foreach (string valueName in key.GetValueNames())
                        {
                            list.Add(new StartupEntry
                            {
                                Name = valueName,
                                Command = key.GetValue(valueName)?.ToString() ?? "Desconocido",
                                Location = locationName,
                                IsRegistry = true
                            });
                        }
                    }
                }
            }
            catch { }
            return list;
        }

        private static List<StartupEntry> GetEntriesFromFolder(string folderPath, string locationName)
        {
            var list = new List<StartupEntry>();
            try
            {
                if (Directory.Exists(folderPath))
                {
                    foreach (var file in Directory.GetFiles(folderPath))
                    {
                        list.Add(new StartupEntry
                        {
                            Name = Path.GetFileName(file),
                            Command = file,
                            Location = locationName,
                            FilePath = file,
                            IsRegistry = false
                        });
                    }
                }
            }
            catch { }
            return list;
        }

        public static bool RemoveStartupProgram(StartupEntry entry)
        {
            try
            {
                if (entry.IsRegistry)
                {
                    RegistryKey rootKey;
                    if (entry.Location.Contains("Usuario"))
                        rootKey = Registry.CurrentUser;
                    else
                        rootKey = Registry.LocalMachine;

                    string subKeyPath;
                    if (entry.Location.Contains("32-bit"))
                        subKeyPath = @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run";
                    else
                        subKeyPath = @"SOFTWARE\Microsoft\Windows\CurrentVersion\Run";

                    using (RegistryKey? key = rootKey.OpenSubKey(subKeyPath, true))
                    {
                        if (key != null && key.GetValue(entry.Name) != null)
                        {
                            key.DeleteValue(entry.Name, false);
                            return true;
                        }
                    }
                }
                else if (!string.IsNullOrEmpty(entry.FilePath) && File.Exists(entry.FilePath))
                {
                    File.Delete(entry.FilePath);
                    return true;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error removing startup program: {ex.Message}");
            }
            return false;
        }
    }
}

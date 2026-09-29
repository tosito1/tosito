using System;
using System.Collections.Generic;
using System.Diagnostics;

namespace Optimizador.Scan
{
    public class ProcessEntry
    {
        public int PID { get; set; }
        public string Name { get; set; } = "";
        public string Path { get; set; } = "";
        public bool IsSystem { get; set; }
    }

    public static class ProcessScanner
    {
        public static List<ProcessEntry> GetProcesses()
        {
            var list = new List<ProcessEntry>();
            foreach (var p in Process.GetProcesses())
            {
                string path = string.Empty;
                try
                {
                    // Accessing MainModule can throw for protected/system processes
                    path = p.MainModule?.FileName ?? string.Empty;
                }
                catch
                {
                    path = string.Empty;
                }

                bool isSystem = false;
                try
                {
                    if (!string.IsNullOrEmpty(path))
                    {
                        var windir = Environment.GetFolderPath(Environment.SpecialFolder.Windows);
                        isSystem = path.StartsWith(windir, StringComparison.OrdinalIgnoreCase);
                    }
                }
                catch { }

                list.Add(new ProcessEntry
                {
                    PID = p.Id,
                    Name = p.ProcessName,
                    Path = path,
                    IsSystem = isSystem
                });
            }
            return list;
        }
    }
}

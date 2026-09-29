using System;
using System.IO;
using System.Text;

namespace Optimizador.Logging
{
    public static class Logger
    {
        private static readonly object _lock = new object();

        public static string GetLogsRoot()
        {
            var root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Optimizador", "logs");
            return root;
        }

        public static string GetActionsLogPath()
        {
            var root = GetLogsRoot();
            Directory.CreateDirectory(root);
            return Path.Combine(root, "actions.log");
        }

        public static void Log(string message)
        {
            try
            {
                lock (_lock)
                {
                    var path = GetActionsLogPath();
                    var line = $"{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC | {message}" + Environment.NewLine;
                    File.AppendAllText(path, line, Encoding.UTF8);
                }
            }
            catch { }
        }

        public static void LogAction(string action, string details)
        {
            Log($"{action} | {details}");
        }
    }
}

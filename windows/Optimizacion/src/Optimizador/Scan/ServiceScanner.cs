using System;
using System.Collections.Generic;
using System.ServiceProcess;
using System.Linq;

namespace Optimizador.Scan
{
    public class ServiceInfo
    {
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        // For UI Binding
        public string CanStop { get; set; } = "Collapsed";
        public string CanStart { get; set; } = "Collapsed";
    }

    public static class ServiceScanner
    {
        public static List<ServiceInfo> GetServices()
        {
            var list = new List<ServiceInfo>();
            try
            {
                foreach (var sc in ServiceController.GetServices().OrderBy(s => s.DisplayName))
                {
                    bool isRunning = sc.Status == ServiceControllerStatus.Running;
                    list.Add(new ServiceInfo
                    {
                        Name = sc.ServiceName,
                        DisplayName = sc.DisplayName,
                        Status = sc.Status.ToString(),
                        CanStop = isRunning ? "Visible" : "Collapsed",
                        CanStart = !isRunning ? "Visible" : "Collapsed"
                    });
                }
            }
            catch { }
            return list;
        }

        public static void ToggleService(string serviceName)
        {
            try
            {
                using (ServiceController sc = new ServiceController(serviceName))
                {
                    if (sc.Status == ServiceControllerStatus.Running)
                    {
                        if (sc.CanStop) sc.Stop();
                    }
                    else if (sc.Status == ServiceControllerStatus.Stopped)
                    {
                        sc.Start();
                    }
                }
            }
            catch { }
        }
    }
}

using System;
using System.Collections.Generic;
using System.Management;

namespace Optimizador.Scan
{
    public class HardwareInfo
    {
        public string Component { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
    }

    public static class HardwareManager
    {
        public static List<HardwareInfo> GetHardwareDetails()
        {
            var hardware = new List<HardwareInfo>();

            // 1. OS Info (Environment is fast & safe)
            try
            {
                string osName = System.Runtime.InteropServices.RuntimeInformation.OSDescription;
                string arch = System.Runtime.InteropServices.RuntimeInformation.OSArchitecture.ToString();
                hardware.Add(new HardwareInfo { Component = "S.O.", Details = $"{osName} ({arch})" });
            }
            catch { hardware.Add(new HardwareInfo { Component = "S.O.", Details = "Windows 10/11 (Unknown)" }); }

            // 2. CPU
            try
            {
                using (var searcher = new ManagementObjectSearcher("SELECT Name, NumberOfCores FROM Win32_Processor"))
                {
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        hardware.Add(new HardwareInfo { Component = "CPU", Details = $"{obj["Name"]} ({obj["NumberOfCores"]} Núcleos)" });
                    }
                }
            }
            catch (Exception ex) { hardware.Add(new HardwareInfo { Component = "CPU", Details = "Error CPU: " + ex.Message }); }

            // 3. RAM (Usando MemoryScanner que es más fiable)
            try
            {
                var mem = MemoryScanner.GetMemoryInfo();
                if (mem.TotalMemory > 0)
                {
                    hardware.Add(new HardwareInfo { Component = "Memoria RAM", Details = $"{mem.TotalMemory} MB Totales ({mem.AvailableMemory} MB Libres)" });
                }
                else
                {
                    hardware.Add(new HardwareInfo { Component = "Memoria RAM", Details = "N/A" });
                }
            }
            catch { hardware.Add(new HardwareInfo { Component = "Memoria RAM", Details = "Error detectando RAM" }); }

            // 4. GPU
            try
            {
                using (var searcher = new ManagementObjectSearcher("SELECT Name FROM Win32_VideoController"))
                {
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        hardware.Add(new HardwareInfo { Component = "GPU", Details = $"{obj["Name"]}" });
                    }
                }
            }
            catch { hardware.Add(new HardwareInfo { Component = "GPU", Details = "N/A" }); }

            // 5. Disks
            try
            {
                using (var searcher = new ManagementObjectSearcher("SELECT Model, Size FROM Win32_DiskDrive"))
                {
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        if (obj["Size"] != null)
                        {
                            hardware.Add(new HardwareInfo { Component = "Disco Duro", Details = $"{obj["Model"]} - {FormatBytes(Convert.ToInt64(obj["Size"]))}" });
                        }
                    }
                }
            }
            catch { hardware.Add(new HardwareInfo { Component = "Disco Duro", Details = "No detectado" }); }

            return hardware;
        }

        private static string FormatBytes(long bytes)
        {
            if (bytes < 0) return "Desconocido"; // handle negative wraparound in WMI
            
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
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

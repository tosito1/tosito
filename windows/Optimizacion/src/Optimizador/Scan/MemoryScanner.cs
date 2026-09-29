using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using Optimizador.Logging;

namespace Optimizador.Scan
{
    public class MemoryInfo
    {
        public long TotalMemory { get; set; }
        public long UsedMemory { get; set; }
        public long AvailableMemory { get; set; }
        public double MemoryUsagePercent { get; set; }
    }

    public static class MemoryScanner
    {
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
        private class MEMORYSTATUSEX
        {
            public uint dwLength;
            public uint dwMemoryLoad;
            public ulong ullTotalPhys;
            public ulong ullAvailPhys;
            public ulong ullTotalPageFile;
            public ulong ullAvailPageFile;
            public ulong ullTotalVirtual;
            public ulong ullAvailVirtual;
            public ulong ullAvailExtendedVirtual;
            public MEMORYSTATUSEX()
            {
                this.dwLength = (uint)Marshal.SizeOf(typeof(MEMORYSTATUSEX));
            }
        }

        [return: MarshalAs(UnmanagedType.Bool)]
        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern bool GlobalMemoryStatusEx([In, Out] MEMORYSTATUSEX lpBuffer);

        [DllImport("psapi.dll")]
        private static extern int EmptyWorkingSet(IntPtr hwProc);

        public static MemoryInfo GetMemoryInfo()
        {
            try
            {
                MEMORYSTATUSEX memStatus = new MEMORYSTATUSEX();
                if (GlobalMemoryStatusEx(memStatus))
                {
                    long totalMB = (long)(memStatus.ullTotalPhys / (1024 * 1024));
                    long availMB = (long)(memStatus.ullAvailPhys / (1024 * 1024));
                    long usedMB = totalMB - availMB;
                    
                    double usagePercent = 0.0;
                    if (totalMB > 0)
                    {
                        usagePercent = ((double)usedMB * 100.0) / totalMB;
                    }

                    return new MemoryInfo
                    {
                        TotalMemory = totalMB,
                        AvailableMemory = availMB,
                        UsedMemory = usedMB,
                        MemoryUsagePercent = usagePercent
                    };
                }
                return new MemoryInfo { TotalMemory = 0, UsedMemory = 0, AvailableMemory = 0 };
            }
            catch (Exception ex)
            {
                Logger.LogAction("MemoryScanError", ex.Message);
                return new MemoryInfo { TotalMemory = 0, UsedMemory = 0, AvailableMemory = 0 };
            }
        }

        public static int MinimizeMemory()
        {
            int optimizedCount = 0;
            try
            {
                // Primero limpieza propia
                GC.Collect();
                GC.WaitForPendingFinalizers();
                GC.Collect();
                
                // Limpieza global de procesos
                foreach (Process process in Process.GetProcesses())
                {
                    try
                    {
                        // Intentar vaciar el working set de cada proceso
                        // Nota: Requiere privilegios para procesos de sistema/otros usuarios
                        if (EmptyWorkingSet(process.Handle) != 0)
                        {
                            optimizedCount++;
                        }
                    }
                    catch
                    {
                        // Ignorar procesos que no podemos acceder
                    }
                }
                
                Logger.LogAction("MemoryMinimized", $"Deep memory cleanup performed. Optimized {optimizedCount} processes.");
            }
            catch (Exception ex)
            {
                Logger.LogAction("MemoryMinimizeError", ex.Message);
            }
            return optimizedCount;
        }

    }
}


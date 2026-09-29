using System;
using System.Diagnostics;
using System.Linq;

namespace Optimizador.Scan
{
    public static class CpuScanner
    {
        private static PerformanceCounter? cpuCounter;

        static CpuScanner()
        {
            try
            {
                cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
                // The first call usually returns 0, so we initialize it once.
                cpuCounter.NextValue();
            }
            catch
            {
                // In some systems, PerformanceCounter might fail due to permissions or configuration.
                cpuCounter = null;
            }
        }

        public static double GetCpuUsage()
        {
            if (cpuCounter == null) return 0.0;
            try
            {
                return cpuCounter.NextValue();
            }
            catch
            {
                return 0.0;
            }
        }
    }
}

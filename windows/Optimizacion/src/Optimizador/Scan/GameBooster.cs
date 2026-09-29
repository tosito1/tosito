using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.ServiceProcess;
using Optimizador.Logging;

namespace Optimizador.Scan
{
    public static class GameBooster
    {
        private static readonly string[] ServicesToStop = {
            "DiagTrack", // Telemetría
            "Spooler",   // Cola de Impresión
            "wuauserv",  // Windows Update
            "Bits",      // Background Intelligent Transfer Service
            "SysMain"    // Superfetch (Pre-carga de aplicaciones)
        };

        private static bool _isActive = false;
        public static bool IsActive => _isActive;

        public static bool Enable()
        {
            try
            {
                Logger.LogAction("GameBooster", "Activando modo Game Booster...");
                
                foreach (string serviceName in ServicesToStop)
                {
                    StopService(serviceName);
                }

                // Limpieza agresiva de memoria
                MemoryScanner.MinimizeMemory();
                
                _isActive = true;
                Logger.LogAction("GameBooster", "Modo Game Booster EXTREMO activado.");
                return true;
            }
            catch (Exception ex)
            {
                Logger.LogAction("GameBoosterError", ex.Message);
                return false;
            }
        }

        public static bool Disable()
        {
            try
            {
                Logger.LogAction("GameBooster", "Desactivando modo Game Booster...");

                foreach (string serviceName in ServicesToStop)
                {
                    StartService(serviceName);
                }

                _isActive = false;
                Logger.LogAction("GameBooster", "Modo normal restaurado.");
                return true;
            }
            catch (Exception ex)
            {
                Logger.LogAction("GameBoosterError", ex.Message);
                return false;
            }
        }

        private static void StopService(string serviceName)
        {
            try
            {
                using (ServiceController sc = new ServiceController(serviceName))
                {
                    if (sc.Status != ServiceControllerStatus.Stopped && sc.Status != ServiceControllerStatus.StopPending)
                    {
                        sc.Stop();
                        sc.WaitForStatus(ServiceControllerStatus.Stopped, TimeSpan.FromSeconds(5));
                        Logger.LogAction("ServiceManager", $"Servicio detenido: {serviceName}");
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.LogAction("ServiceManagerError", $"Fallo al detener {serviceName}: {ex.Message}");
            }
        }

        private static void StartService(string serviceName)
        {
            try
            {
                using (ServiceController sc = new ServiceController(serviceName))
                {
                    if (sc.Status == ServiceControllerStatus.Stopped || sc.Status == ServiceControllerStatus.StopPending)
                    {
                        sc.Start();
                        sc.WaitForStatus(ServiceControllerStatus.Running, TimeSpan.FromSeconds(5));
                        Logger.LogAction("ServiceManager", $"Servicio restaurado: {serviceName}");
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.LogAction("ServiceManagerError", $"Fallo al restaurar {serviceName}: {ex.Message}");
            }
        }
    }
}

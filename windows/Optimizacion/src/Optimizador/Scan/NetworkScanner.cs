using System;
using System.Collections.Generic;
using System.Net.NetworkInformation;

namespace Optimizador.Scan
{
    public class NetworkConnectionInfo
    {
        public string LocalEndpoint { get; set; } = string.Empty;
        public string RemoteEndpoint { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ProcessName { get; set; } = string.Empty;
    }

    public static class NetworkScanner
    {
        public static bool Ping(string target = "8.8.8.8")
        {
            try
            {
                using (Ping myPing = new Ping())
                {
                    PingReply reply = myPing.Send(target, 1000);
                    return (reply.Status == IPStatus.Success);
                }
            }
            catch
            {
                return false;
            }
        }

        public static List<NetworkConnectionInfo> GetActiveConnections()
        {
            var list = new List<NetworkConnectionInfo>();
            try
            {
                IPGlobalProperties properties = IPGlobalProperties.GetIPGlobalProperties();
                TcpConnectionInformation[] connections = properties.GetActiveTcpConnections();
                
                foreach (TcpConnectionInformation c in connections)
                {
                    list.Add(new NetworkConnectionInfo
                    {
                        LocalEndpoint = c.LocalEndPoint.ToString(),
                        RemoteEndpoint = c.RemoteEndPoint.ToString(),
                        State = c.State.ToString(),
                        ProcessName = "Sistema/Privado" // To get actual Process name requires elevated P/Invoke to GetExtendedTcpTable. We use this for simplicity in this iteration.
                    });
                }
            }
            catch { }
            return list;
        }
    }
}

using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace Optimizador
{
    public class CloudflareTunnelService
    {
        private const string FirebaseProjectId = "tosito-7f923";
        private const string FirebaseApiKey    = "AIzaSyAcN-I95UikDa0DSUjEQEbjabX-WHulbHc";

        private Process? _process;
        private CancellationTokenSource? _cts;

        private readonly string _pcId = PcIdentifier.GetId();
        private readonly string _machineName = Environment.MachineName;

        public string? PairingCode { get; private set; }
        public string? TunnelUrl { get; private set; }
        public event Action<string>? OnUrlReady;

        public CloudflareTunnelService() { }

        private void Log(string msg)
        {
            try {
                string path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "log_remoto.txt");
                File.AppendAllText(path, $"[{DateTime.Now:HH:mm:ss}] [TUNEL] {msg}\n");
            } catch { }
        }

        public void Start()
        {
            _cts = new CancellationTokenSource();
            _ = Task.Run(RunAsync, _cts.Token);
        }

        public void Stop()
        {
            _cts?.Cancel();
            try { _process?.Kill(); } catch { }
        }

        private async Task RunAsync()
        {
            try
            {
                _process = new Process();
                _process.StartInfo = new ProcessStartInfo
                {
                    FileName               = "ssh",
                    // Conexión a localhost.run vía SSH puerto 54321
                    Arguments              = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -T -R 80:127.0.0.1:54321 nokey@localhost.run",
                    UseShellExecute        = false,
                    CreateNoWindow         = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError  = true
                };

                Log("Iniciando túnel SSH hacia localhost.run en puerto 54321...");
                _process.OutputDataReceived += (s, e) => { if(e.Data != null) { Log("Salida: " + e.Data); ParseOutput(e.Data); } };
                _process.ErrorDataReceived  += (s, e) => { if(e.Data != null) Log("Status: " + e.Data); };

                _process.Start();
                _process.BeginOutputReadLine();
                _process.BeginErrorReadLine();

                await _process.WaitForExitAsync(_cts?.Token ?? CancellationToken.None);
            }
            catch (Exception ex)
            {
                Log($"[Tunnel] Error Fatal: {ex.Message}");
            }
        }

        private void ParseOutput(string? data)
        {
            if (string.IsNullOrEmpty(data)) return;

            // Detectar la URL de localhost.run
            var match = Regex.Match(data, @"https://[a-zA-Z0-9-.]+\.(lhr\.life|localhost\.run)");
            if (match.Success && match.Value != TunnelUrl)
            {
                TunnelUrl = match.Value;
                Log($"✅ URL detectada: {TunnelUrl}");
                PairingCode = PcIdentifier.GetPersistentPin();

                OnUrlReady?.Invoke(TunnelUrl);
                _ = PublishToFirestoreAsync(TunnelUrl);
            }
        }

        private async Task PublishToFirestoreAsync(string url)
        {
            try
            {
                string endpoint = $"https://firestore.googleapis.com/v1/projects/{FirebaseProjectId}/databases/(default)/documents/pcs/{_pcId}?key={FirebaseApiKey}&updateMask.fieldPaths=tunnelUrl&updateMask.fieldPaths=machineName&updateMask.fieldPaths=pcId&updateMask.fieldPaths=pairingCode&updateMask.fieldPaths=updatedAt&updateMask.fieldPaths=port";
                string body = $$"""
                {
                  "fields": {
                    "tunnelUrl": { "stringValue": "{{url}}" },
                    "machineName": { "stringValue": "{{_machineName}}" },
                    "pcId": { "stringValue": "{{_pcId}}" },
                    "pairingCode": { "stringValue": "{{PairingCode}}" },
                    "updatedAt": { "stringValue": "{{DateTime.UtcNow:o}}" },
                    "port": { "integerValue": "54321" }
                  }
                }
                """;

                using var http = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Patch, endpoint) { Content = new StringContent(body, Encoding.UTF8, "application/json") };
                var response = await http.SendAsync(request);
                Log($"Firestore Update Status: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                Log($"Error Firestore: {ex.Message}");
            }
        }
    }
}

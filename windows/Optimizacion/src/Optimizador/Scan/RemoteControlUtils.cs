using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace Optimizador.Scan
{
    public static class RemoteControlUtils
    {
        [DllImport("user32.dll")]
        public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);

        [DllImport("user32.dll")]
        public static extern bool SetCursorPos(int X, int Y);

        [DllImport("user32.dll")]
        public static extern void keybd_event(byte bVk, byte bScan, int dwFlags, int dwExtraInfo);

        [DllImport("user32.dll")]
        public static extern bool GetCursorPos(out POINT lpPoint);

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        [StructLayout(LayoutKind.Sequential)]
        public struct POINT
        {
            public int X;
            public int Y;
        }

        public const int MOUSEEVENTF_MOVE = 0x0001;
        public const int MOUSEEVENTF_LEFTDOWN = 0x02;
        public const int MOUSEEVENTF_LEFTUP = 0x04;
        public const int MOUSEEVENTF_RIGHTDOWN = 0x08;
        public const int MOUSEEVENTF_RIGHTUP = 0x10;
        public const int KEYEVENTF_KEYUP = 0x0002;

        [DllImport("user32.dll")]
        public static extern bool GetCursorInfo(out CURSORINFO pci);

        [DllImport("user32.dll")]
        public static extern bool GetIconInfo(IntPtr hIcon, out ICONINFO piconinfo);

        [StructLayout(LayoutKind.Sequential)]
        public struct CURSORINFO
        {
            public int cbSize;
            public int flags;
            public IntPtr hCursor;
            public POINT ptScreenPos;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct ICONINFO
        {
            public bool fIcon;
            public int xHotspot;
            public int yHotspot;
            public IntPtr hbmMask;
            public IntPtr hbmColor;
        }

        public const int CURSOR_SHOWING = 0x00000001;

        public static byte[]? CaptureScreenJpeg(long quality = 40L)
        {
            try
            {
                var primaryScreen = Screen.PrimaryScreen;
                if (primaryScreen == null) return null;
                var bounds = primaryScreen.Bounds;
                using (Bitmap bitmap = new Bitmap(bounds.Width, bounds.Height))
                {
                    using (Graphics g = Graphics.FromImage(bitmap))
                    {
                        g.CopyFromScreen(Point.Empty, Point.Empty, bounds.Size);

                        // Draw Cursor
                        CURSORINFO pci;
                        pci.cbSize = Marshal.SizeOf(typeof(CURSORINFO));
                        if (GetCursorInfo(out pci) && pci.flags == CURSOR_SHOWING)
                        {
                            try
                            {
                                ICONINFO ii;
                                if (GetIconInfo(pci.hCursor, out ii))
                                {
                                    int x = pci.ptScreenPos.X - ii.xHotspot;
                                    int y = pci.ptScreenPos.Y - ii.yHotspot;
                                    using (Icon icon = Icon.FromHandle(pci.hCursor))
                                    {
                                        g.DrawIcon(icon, x, y);
                                    }
                                    
                                    // Clean up GDI handles from GetIconInfo
                                    if (ii.hbmMask != IntPtr.Zero) DeleteObject(ii.hbmMask);
                                    if (ii.hbmColor != IntPtr.Zero) DeleteObject(ii.hbmColor);
                                }
                            }
                            catch { }
                        }
                    }
                    using (MemoryStream ms = new MemoryStream())
                    {
                        var encoder = ImageCodecInfo.GetImageDecoders().FirstOrDefault(c => c.FormatID == ImageFormat.Jpeg.Guid);
                        if (encoder == null) return null;
                        var encoderParams = new EncoderParameters(1);
                        encoderParams.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, quality);
                        bitmap.Save(ms, encoder, encoderParams);
                        return ms.ToArray();
                    }
                }
            }
            catch { return null; }
        }

        [DllImport("gdi32.dll")]
        public static extern bool DeleteObject(IntPtr hObject);

        public static void TurnScreenOff()
        {
            try
            {
                SendMessage((IntPtr)0xFFFF, 0x0112, (IntPtr)0xF170, (IntPtr)2);
            }
            catch { }
        }

        public static string ExecuteCMD(string command)
        {
            try
            {
                var processInfo = new ProcessStartInfo("cmd.exe", "/c " + command)
                {
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                };

                using (var process = Process.Start(processInfo))
                {
                    if (process == null) return "[Error al iniciar el proceso CMD]";
                    string output = process.StandardOutput.ReadToEnd();
                    string error = process.StandardError.ReadToEnd();
                    process.WaitForExit(10000);
                    
                    if (!string.IsNullOrEmpty(error))
                        return output + "\n[ERROR]:\n" + error;
                        
                    return string.IsNullOrEmpty(output) ? "[Ejecutado sin salida]" : output;
                }
            }
            catch (Exception ex)
            {
                return $"Error ejecutando comando: {ex.Message}";
            }
        }

        public static void SendText(string text)
        {
            try { System.Windows.Forms.SendKeys.SendWait(text); }
            catch { }
        }
    }
}

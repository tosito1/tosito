using System;
using System.Runtime.InteropServices;
using Apariencia.Core;

namespace Apariencia.Services
{
    public static class ThemeEngine
    {
        public static void ApplyMicaEffect(IntPtr windowHandle)
        {
            int trueValue = 1;
            NativeMethods.DwmSetWindowAttribute(windowHandle, NativeMethods.DWMWA_MICA_EFFECT, ref trueValue, Marshal.SizeOf(typeof(int)));
            
            // Forzar esquinas redondeadas
            int roundValue = NativeMethods.DWMWCP_ROUND;
            NativeMethods.DwmSetWindowAttribute(windowHandle, NativeMethods.DWMWA_WINDOW_CORNER_PREFERENCE, ref roundValue, Marshal.SizeOf(typeof(int)));
        }
    }
}

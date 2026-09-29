using System;
using Apariencia.Core;

namespace Apariencia.Core
{
    public static class TaskbarManager
    {
        public static void HideTaskbar()
        {
            IntPtr hwnd = NativeMethods.FindWindow("Shell_TrayWnd", "");
            NativeMethods.ShowWindow(hwnd, NativeMethods.SW_HIDE);
            
            // Ocultar botón de inicio de Windows 11
            IntPtr hwndStart = NativeMethods.FindWindow("Button", "Start");
            if (hwndStart != IntPtr.Zero) 
                NativeMethods.ShowWindow(hwndStart, NativeMethods.SW_HIDE);
        }

        public static void ShowTaskbar()
        {
            IntPtr hwnd = NativeMethods.FindWindow("Shell_TrayWnd", "");
            NativeMethods.ShowWindow(hwnd, NativeMethods.SW_SHOW);
            
            IntPtr hwndStart = NativeMethods.FindWindow("Button", "Start");
            if (hwndStart != IntPtr.Zero) 
                NativeMethods.ShowWindow(hwndStart, NativeMethods.SW_SHOW);
        }
    }
}

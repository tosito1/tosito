using System;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using Apariencia.Core;
using Apariencia.Services;

namespace Apariencia.UI.MenuBar
{
    public partial class MenuBarWindow : Window
    {
        public MenuBarWindow()
        {
            InitializeComponent();
            this.Loaded += MenuBarWindow_Loaded;
            this.Closed += MenuBarWindow_Closed;
            
            // Posicionar arriba
            this.Left = 0;
            this.Top = 0;
            this.Width = SystemParameters.PrimaryScreenWidth;
        }

        private void MenuBarWindow_Loaded(object? sender, RoutedEventArgs e)
        {
            IntPtr hwnd = new WindowInteropHelper(this).Handle;
            ThemeEngine.ApplyMicaEffect(hwnd);
            RegisterAppBar(true);
        }

        private void MenuBarWindow_Closed(object? sender, EventArgs e)
        {
            RegisterAppBar(false);
        }

        private void RegisterAppBar(bool register)
        {
            IntPtr hwnd = new WindowInteropHelper(this).Handle;
            NativeMethods.APPBARDATA abd = new NativeMethods.APPBARDATA();
            abd.cbSize = Marshal.SizeOf(typeof(NativeMethods.APPBARDATA));
            abd.hWnd = hwnd;

            if (register)
            {
                NativeMethods.SHAppBarMessage(NativeMethods.ABM_NEW, ref abd);
                
                abd.uEdge = NativeMethods.ABE_TOP;
                abd.rc.Left = 0;
                abd.rc.Top = 0;
                abd.rc.Right = (int)SystemParameters.PrimaryScreenWidth;
                abd.rc.Bottom = (int)this.Height;

                NativeMethods.SHAppBarMessage(NativeMethods.ABM_QUERYPOS, ref abd);
                NativeMethods.SHAppBarMessage(NativeMethods.ABM_SETPOS, ref abd);
            }
            else
            {
                NativeMethods.SHAppBarMessage(NativeMethods.ABM_REMOVE, ref abd);
            }
        }
    }
}

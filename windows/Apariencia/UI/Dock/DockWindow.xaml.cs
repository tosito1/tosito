using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Interop;
using System.Collections.Generic;
using Apariencia.Services;

namespace Apariencia.UI.Dock
{
    public partial class DockWindow : Window
    {
        private List<DockApp>? _apps;

        public DockWindow()
        {
            InitializeComponent();
            this.Loaded += DockWindow_Loaded;
            this.MouseMove += DockWindow_MouseMove;
            this.MouseLeave += DockWindow_MouseLeave;
            
            InitializeApps();
            
            var settings = App.Settings;
            settings.PropertyChanged += (s, e) => {
                if (e.PropertyName == nameof(settings.DockPosition)) UpdatePosition();
            };
            
            UpdatePosition();
        }

        private void UpdatePosition()
        {
            var settings = App.Settings;
            double screenWidth = SystemParameters.PrimaryScreenWidth;
            double screenHeight = SystemParameters.PrimaryScreenHeight;

            switch (settings.DockPosition)
            {
                case "left":
                    this.Left = 0;
                    this.Top = (screenHeight - this.Height) / 2;
                    break;
                case "right":
                    this.Left = screenWidth - this.Width;
                    this.Top = (screenHeight - this.Height) / 2;
                    break;
                default: // bottom
                    this.Left = (screenWidth - this.Width) / 2;
                    this.Top = screenHeight - this.Height - 20;
                    break;
            }
        }

        private void InitializeApps()
        {
            _apps = new List<DockApp>
            {
                new DockApp { Name = "Finder", Color = "#3b82f6", IconData = "M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z" },
                new DockApp { Name = "Safari", Color = "#ffffff", IconData = "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M7.13,16.87L9.55,14.45L14.45,14.45L14.45,9.55L16.87,7.13L15.35,15.35L7.13,16.87Z" },
                new DockApp { Name = "Mail", Color = "#06b6d4", IconData = "M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4M20,18H4V8L12,13L20,8V18M20,6L12,11L4,6V6H20V6Z" },
                new DockApp { Name = "Terminal", Color = "#1f2937", IconData = "M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4M12,10H8V8H12V10M16,16H8V14H16V16M16,13H8V11H16V13Z" }
            };
            DockIcons.ItemsSource = _apps;
        }

        private void DockWindow_MouseMove(object sender, MouseEventArgs e)
        {
            var settings = this.DataContext as UI.Settings.SettingsViewModel;
            if (settings == null) return;

            Point mousePos = e.GetPosition(DockIcons);
            double maxMagnification = settings.Magnification; 
            double spread = 80.0;

            for (int i = 0; i < DockIcons.Items.Count; i++)
            {
                var container = DockIcons.ItemContainerGenerator.ContainerFromIndex(i) as FrameworkElement;
                if (container == null) continue;

                var scaleTransform = FindVisualChild<ScaleTransform>(container);
                if (scaleTransform == null) continue;

                // Calcular centro del icono relativo al ItemsControl
                Point iconCenter = container.TranslatePoint(new Point(container.ActualWidth / 2, container.ActualHeight / 2), DockIcons);
                
                double distance = Math.Abs(mousePos.X - iconCenter.X);
                
                // Función Gaussiana para la magnificación
                double magnification = 1.0 + (maxMagnification - 1.0) * Math.Exp(-Math.Pow(distance, 2) / (2 * Math.Pow(spread, 2)));
                
                scaleTransform.ScaleX = magnification;
                scaleTransform.ScaleY = magnification;
            }
        }

        private void DockWindow_MouseLeave(object sender, MouseEventArgs e)
        {
            // Reset scales
            for (int i = 0; i < DockIcons.Items.Count; i++)
            {
                var container = DockIcons.ItemContainerGenerator.ContainerFromIndex(i) as FrameworkElement;
                if (container != null)
                {
                    var scaleTransform = FindVisualChild<ScaleTransform>(container);
                    if (scaleTransform != null)
                    {
                        scaleTransform.ScaleX = 1.0;
                        scaleTransform.ScaleY = 1.0;
                    }
                }
            }
        }

        private void DockWindow_Loaded(object sender, RoutedEventArgs e)
        {
            IntPtr hwnd = new WindowInteropHelper(this).Handle;
            ThemeEngine.ApplyMicaEffect(hwnd);
        }

        private T? FindVisualChild<T>(DependencyObject? obj) where T : DependencyObject
        {
            if (obj == null) return null;
            for (int i = 0; i < VisualTreeHelper.GetChildrenCount(obj); i++)
            {
                DependencyObject child = VisualTreeHelper.GetChild(obj, i);
                if (child != null && child is T tChild) return tChild;
                T? childOfChild = FindVisualChild<T>(child);
                if (childOfChild != null) return childOfChild;
            }
            return null;
        }
    }

    public class DockApp
    {
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public string IconData { get; set; } = string.Empty;
    }
}

using System;
using System.Windows;
using Apariencia.Core;

namespace Apariencia
{
    public partial class App : Application
    {
        public static UI.Settings.SettingsViewModel Settings { get; private set; } = new UI.Settings.SettingsViewModel();

        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            AppDomain.CurrentDomain.UnhandledException += (s, ev) => 
            {
                TaskbarManager.ShowTaskbar();
                MessageBox.Show($"Error crítico: {ev.ExceptionObject}", "WinmacOS Engine Crash", MessageBoxButton.OK, MessageBoxImage.Error);
            };

            // Ocultar barra de tareas nativa
            TaskbarManager.HideTaskbar();

            // Iniciar el Dock
            var dock = new Apariencia.UI.Dock.DockWindow();
            dock.DataContext = Settings;
            dock.Show();

            // Iniciar la Menu Bar
            var menuBar = new Apariencia.UI.MenuBar.MenuBarWindow();
            menuBar.DataContext = Settings;
            menuBar.Show();
        }

        protected override void OnExit(ExitEventArgs e)
        {
            TaskbarManager.ShowTaskbar();
            base.OnExit(e);
        }
    }
}

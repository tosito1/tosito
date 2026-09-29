using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;

namespace Apariencia.UI.Settings
{
    public class SettingsViewModel : INotifyPropertyChanged
    {
        private string _activeTab = "dock";
        private string _currentSection = "Dock Principal";
        private bool _dockEnabled = true;
        private double _dockSize = 56;
        private double _magnification = 1.4;
        private string _dockPosition = "bottom";
        private bool _dockAutoHide = false;
        private bool _menuBarEnabled = true;
        private bool _acrylicEnabled = true;
        private string _accentColor = "blue";
        private string _theme = "dark";
        private bool _menuBarShowApp = true;
        private double _menuBarOpacity = 80;
        private bool _dynamicTheme = false;
        private string _wallpaper = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";
        private string _activeIconPack = "sonoma";
        private bool _windowShadows = true;

        public string ActiveTab
        {
            get => _activeTab;
            set { _activeTab = value; OnPropertyChanged(); }
        }

        public bool DockEnabled
        {
            get => _dockEnabled;
            set { _dockEnabled = value; OnPropertyChanged(); }
        }

        public double DockSize
        {
            get => _dockSize;
            set { _dockSize = value; OnPropertyChanged(); }
        }

        public double Magnification
        {
            get => _magnification;
            set { _magnification = value; OnPropertyChanged(); }
        }

        public string CurrentSection
        {
            get => _currentSection;
            set { _currentSection = value; OnPropertyChanged(); }
        }

        public string DockPosition
        {
            get => _dockPosition;
            set { _dockPosition = value; OnPropertyChanged(); }
        }

        public bool DockAutoHide
        {
            get => _dockAutoHide;
            set { _dockAutoHide = value; OnPropertyChanged(); }
        }

        public bool MenuBarEnabled
        {
            get => _menuBarEnabled;
            set { _menuBarEnabled = value; OnPropertyChanged(); }
        }

        public bool MenuBarShowApp
        {
            get => _menuBarShowApp;
            set { _menuBarShowApp = value; OnPropertyChanged(); }
        }

        public double MenuBarOpacity
        {
            get => _menuBarOpacity;
            set { _menuBarOpacity = value; OnPropertyChanged(); }
        }

        public bool AcrylicEnabled
        {
            get => _acrylicEnabled;
            set { _acrylicEnabled = value; OnPropertyChanged(); }
        }

        public string AccentColor
        {
            get => _accentColor;
            set { _accentColor = value; OnPropertyChanged(); }
        }

        public string Theme
        {
            get => _theme;
            set { _theme = value; OnPropertyChanged(); }
        }

        public bool DynamicTheme
        {
            get => _dynamicTheme;
            set { _dynamicTheme = value; OnPropertyChanged(); }
        }

        public string Wallpaper
        {
            get => _wallpaper;
            set { _wallpaper = value; OnPropertyChanged(); }
        }

        public string ActiveIconPack
        {
            get => _activeIconPack;
            set { _activeIconPack = value; OnPropertyChanged(); }
        }

        public bool WindowShadows
        {
            get => _windowShadows;
            set { _windowShadows = value; OnPropertyChanged(); }
        }

        public event PropertyChangedEventHandler? PropertyChanged;
        protected void OnPropertyChanged([CallerMemberName] string? name = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        }
    }
}

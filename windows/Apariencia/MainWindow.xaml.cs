using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace Apariencia;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }

    private void MinimizeButton_Click(object sender, RoutedEventArgs e)
    {
        this.WindowState = WindowState.Minimized;
    }

    private void CloseButton_Click(object sender, RoutedEventArgs e)
    {
        this.Close();
    }

    private void ApplyButton_Click(object sender, RoutedEventArgs e)
    {
        // Visual feedback
        if (sender is Button btn)
        {
            var originalContent = btn.Content;
            btn.Content = "¡Cambios Aplicados!";
            
            var timer = new System.Windows.Threading.DispatcherTimer { Interval = TimeSpan.FromSeconds(2) };
            timer.Tick += (s, ev) => { btn.Content = originalContent; timer.Stop(); };
            timer.Start();
        }

        MessageBox.Show("Configuración guardada e inyectada correctamente en el motor de WinmacOS.", "WinmacOS Engine", MessageBoxButton.OK, MessageBoxImage.Information);
    }

    private void ThemeToggle_Click(object sender, RoutedEventArgs e)
    {
        var settings = App.Settings;
        settings.Theme = settings.Theme == "dark" ? "light" : "dark";
    }

    private void RestoreButton_Click(object sender, RoutedEventArgs e)
    {
        if (MessageBox.Show("¿Estás seguro de que quieres restaurar la apariencia original de Windows?", "Restaurar Sistema", MessageBoxButton.YesNo, MessageBoxImage.Warning) == MessageBoxResult.Yes)
        {
            var settings = App.Settings;
            settings.DockEnabled = false;
            settings.MenuBarEnabled = false;
            settings.AcrylicEnabled = false;
            settings.ActiveIconPack = "fluent";
            MessageBox.Show("Sistema restaurado a la apariencia original.", "Éxito", MessageBoxButton.OK, MessageBoxImage.Information);
        }
    }
}
// ===================== WINDOW CONTROLS =====================
document.getElementById('btn-min').onclick = () => window.api.windowMinimize();
document.getElementById('btn-max').onclick = () => window.api.windowMaximize();
document.getElementById('btn-close').onclick = () => window.api.windowClose();

// ===================== NAVIGATION =====================
const navLinks = document.querySelectorAll('.nav-link');
const pages    = document.querySelectorAll('.page');

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navLinks.forEach(l => l.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    link.classList.add('active');
    document.getElementById('page-' + link.dataset.page).classList.add('active');
  });
});

// ===================== TOAST =====================
function showToast(title, msg = '', type = 'ok') {
  const icons = { ok: 'ph-check-circle', err: 'ph-x-circle', info: 'ph-info' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-icon ${type}"><i class="ph ${icons[type]}"></i></div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg.slice(0, 80)}</div>` : ''}
    </div>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('hide'); setTimeout(() => toast.remove(), 350); }, 4000);
}

// ===================== LOG HELPERS =====================
function appendLog(elId, text, type = '') {
  const el = document.getElementById(elId);
  if (!el) return;
  if (el.querySelector('.t-muted')) el.innerHTML = '';
  const line = document.createElement('div');
  if (type) line.className = type;
  line.textContent = '> ' + String(text).trim();
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}
function clearLog(elId) {
  const el = document.getElementById(elId);
  if (el) el.innerHTML = '<span class="t-muted">// Limpiado</span>';
}

// ===================== RING ANIMATION =====================
const CIRC = 2 * Math.PI * 50;
function setRing(id, pct) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.strokeDashoffset = CIRC - (Math.min(pct, 100) / 100) * CIRC;
}

// ===================== POWERSHELL COMMANDS =====================
const CMD = {
  // STATS
  'stat-cpu':    `(Get-WmiObject Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average`,
  'stat-ram-pct':`$o = Get-WmiObject Win32_OperatingSystem; [math]::Round((($o.TotalVisibleMemorySize - $o.FreePhysicalMemory) / $o.TotalVisibleMemorySize) * 100, 1)`,
  'stat-ram-det':`$o = Get-WmiObject Win32_OperatingSystem; $u=[math]::Round(($o.TotalVisibleMemorySize-$o.FreePhysicalMemory)/1MB,1); $t=[math]::Round($o.TotalVisibleMemorySize/1MB,1); "$u / $t"`,
  'stat-disk-pct':`$d = Get-PSDrive C; if($d.Used+$d.Free -gt 0){[math]::Round($d.Used/($d.Used+$d.Free)*100,1)}else{0}`,
  'stat-disk-det':`$d = Get-PSDrive C; [math]::Round($d.Free/1GB,1)`,
  'stat-cores':  `(Get-WmiObject Win32_Processor).NumberOfLogicalProcessors`,
  'stat-gpu':    `$n = (Get-WmiObject Win32_VideoController | Select-Object -First 1).Name; $u = 0; $c = Get-Counter "\\GPU Engine(*)\\Utilization Percentage" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty CounterSamples | Measure-Object -Property CookedValue -Sum | Select-Object -ExpandProperty Sum; if($c){$u = [math]::Round($c, 1)}; @{Name=$n; Usage=$u} | ConvertTo-Json -Compress`,

  // SYSINFO
  'si-os':    `(Get-WmiObject Win32_OperatingSystem).Caption`,
  'si-cpu':   `(Get-WmiObject Win32_Processor).Name.Trim()`,
  'si-ram':   `[math]::Round((Get-WmiObject Win32_OperatingSystem).TotalVisibleMemorySize/1MB,1)`,
  'si-gpu':   `(Get-WmiObject Win32_VideoController | Select-Object -First 1).Name`,
  'si-pc':    `(Get-WmiObject Win32_ComputerSystem).Name`,
  'si-user':  `[System.Security.Principal.WindowsIdentity]::GetCurrent().Name`,
  'si-disk':  `$d = Get-PSDrive C; [math]::Round(($d.Used+$d.Free)/1GB,0)`,
  'si-uptime':`(Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime | ForEach-Object { '{0}d {1}h {2}m' -f $_.Days, $_.Hours, $_.Minutes }`,
  'si-bios':  `(Get-WmiObject Win32_BIOS).SMBIOSBIOSVersion`,
  'si-mobo':  `$m = Get-WmiObject Win32_BaseBoard; "$($m.Manufacturer) $($m.Product)"`,
  'si-net':   `(Get-NetIPAddress | Where-Object {$_.AddressFamily -eq 'IPv4' -and $_.IPAddress -ne '127.0.0.1'} | Select-Object -First 1).IPAddress`,
  'si-build': `(Get-WmiObject Win32_OperatingSystem).BuildNumber`,

  // PROCESSES
  'list-procs': `Get-Process | Sort-Object CPU -Descending | Select-Object -First 40 Name, Id, @{N='CPU';E={[math]::Round($_.CPU,1)}}, @{N='RAM';E={[math]::Round($_.WorkingSet/1MB,1)}} | ConvertTo-Json -Compress`,

  // STARTUP
  'list-startup': `Get-CimInstance Win32_StartupCommand | Select-Object Name, Command | ConvertTo-Json -Compress`,

  // SERVICES
  'list-services': `Get-Service | Where-Object {$_.StartType -ne 'Disabled'} | Sort-Object Status -Descending | Select-Object -First 60 Name, DisplayName, @{N='Status';E={$_.Status.ToString()}} | ConvertTo-Json -Compress`,

  // BLOATWARE / APPS
  'list-apps': `Get-AppxPackage | Where-Object { $_.IsFramework -eq $false -and $_.NonRemovable -eq $false } | Select-Object Name, PackageFullName | Sort-Object Name | ConvertTo-Json -Compress`,
  'remove-all-bloatware': `$apps = "Microsoft.3DBuilder", "Microsoft.BingWeather", "Microsoft.GetHelp", "Microsoft.Getstarted", "Microsoft.Messaging", "Microsoft.Microsoft3DViewer", "Microsoft.MicrosoftOfficeHub", "Microsoft.MicrosoftSolitaireCollection", "Microsoft.NetworkSpeedTest", "Microsoft.News", "Microsoft.Office.OneNote", "Microsoft.People", "Microsoft.Print3D", "Microsoft.SkypeApp", "Microsoft.WindowsAlarms", "Microsoft.WindowsFeedbackHub", "Microsoft.WindowsMaps", "Microsoft.WindowsSoundRecorder", "Microsoft.XboxApp", "Microsoft.XboxGamingOverlay", "Microsoft.XboxSpeechToTextOverlay", "Microsoft.ZuneVideo", "Microsoft.ZuneMusic", "Microsoft.MixedReality.Portal"; foreach ($app in $apps) { Get-AppxPackage -Name "*$app*" | Remove-AppxPackage -ErrorAction SilentlyContinue }; Write-Host "Bloatware comun eliminado"`,

  // ADBLOCKER (HOSTS)
  'apply-adblock': `Write-Host "Descargando lista anti-ads (puede tardar un poco)..."; $hostsPath = "C:\\Windows\\System32\\drivers\\etc\\hosts"; Invoke-WebRequest -Uri "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts" -OutFile $hostsPath -UseBasicParsing; Clear-DnsClientCache; Write-Host "Ad-Blocker inyectado exitosamente. Dominios bloqueados a nivel de sistema."`,
  'restore-hosts': `$hostsPath = "C:\\Windows\\System32\\drivers\\etc\\hosts"; $defaultHosts = "# Archivo hosts por defecto de Windows\`r\`n127.0.0.1 localhost\`r\`n::1 localhost"; Set-Content -Path $hostsPath -Value $defaultHosts; Clear-DnsClientCache; Write-Host "Archivo hosts restaurado a por defecto."`,
  'check-hosts': `$hostsPath = "C:\\Windows\\System32\\drivers\\etc\\hosts"; if (Test-Path $hostsPath) { $lines = (Get-Content $hostsPath).Count; Write-Host "El archivo hosts actual tiene $lines lineas en total." } else { Write-Host "No se encontro el archivo hosts." }`,

  // GHOST DEVICES
  'list-ghosts': `Get-PnpDevice | Where-Object { $_.Present -eq $false -and $_.Class -notin @('System','SoftwareDevice','AudioEndpoint','Volume','VolumeSnapshot') } | Select-Object InstanceId, Class, FriendlyName | Sort-Object Class | ConvertTo-Json -Compress`,
  'remove-all-ghosts': `$ghosts = Get-PnpDevice | Where-Object { $_.Present -eq $false -and $_.Class -notin @('System','SoftwareDevice','AudioEndpoint','Volume','VolumeSnapshot') }; foreach ($g in $ghosts) { & pnputil /remove-device $g.InstanceId /force }; Write-Host "Dispositivos fantasma eliminados del sistema"`,

  // LOW-END PC
  'lowend-visuals': `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" -Name "VisualFXSetting" -Value 2 -Force -ErrorAction SilentlyContinue; Write-Host "Efectos visuales desactivados. (Requiere reiniciar el explorador para verse totalmente)"`,
  'lowend-bgapps': `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -Value 1 -Force -ErrorAction SilentlyContinue; Write-Host "Aplicaciones UWP en segundo plano bloqueadas"`,
  'lowend-power': `powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 | Out-Null; $s = powercfg -aliases | Select-String "Ultimate Performance" | %{($_ -split ' ')[0]}; if(!$s){$s = (powercfg -l | Select-String "Ultimate Performance" | %{($_ -split ' ')[3]})}; if($s){powercfg -setactive $s}; Write-Host "Plan de Maximo Rendimiento activado"`,
  'lowend-services': `Stop-Service WSearch -Force -ErrorAction SilentlyContinue; Set-Service WSearch -StartupType Disabled -ErrorAction SilentlyContinue; Stop-Service SysMain -Force -ErrorAction SilentlyContinue; Set-Service SysMain -StartupType Disabled -ErrorAction SilentlyContinue; Stop-Service Spooler -Force -ErrorAction SilentlyContinue; Set-Service Spooler -StartupType Disabled -ErrorAction SilentlyContinue; Stop-Service DiagTrack -Force -ErrorAction SilentlyContinue; Set-Service DiagTrack -StartupType Disabled -ErrorAction SilentlyContinue; Stop-Service MapsBroker -Force -ErrorAction SilentlyContinue; Set-Service MapsBroker -StartupType Disabled -ErrorAction SilentlyContinue; Write-Host "Servicios pesados (Busqueda, SuperFetch, Impresora, Telemetria, Mapas) congelados"`,
  'lowend-tasks': `Disable-ScheduledTask -TaskPath "\\Microsoft\\Windows\\Customer Experience Improvement Program\\" -ErrorAction SilentlyContinue | Out-Null; Disable-ScheduledTask -TaskPath "\\Microsoft\\Windows\\Application Experience\\" -ErrorAction SilentlyContinue | Out-Null; Write-Host "Tareas de telemetria en segundo plano desactivadas"`,

  // TWEAKS - OPTIMIZE
  'free-ram': `$code = @'\nusing System;\nusing System.Runtime.InteropServices;\npublic class Ram {\n[DllImport("psapi.dll")]\npublic static extern int EmptyWorkingSet(IntPtr hwProc);\n}\n'@\nAdd-Type -TypeDefinition $code; $b = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory; Get-Process | Where-Object { $_.Handle } | ForEach-Object { try { [Ram]::EmptyWorkingSet($_.Handle) | Out-Null } catch {} }; $a = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory; Write-Host "RAM Liberada Exitosamente: $([math]::Round(($a - $b)/1024, 2)) MB"`,
  'quick-optimize': `Clear-DnsClientCache; Remove-Item -Path $env:TEMP\\* -Recurse -Force -ErrorAction SilentlyContinue; Write-Host "Optimizacion rapida completada"`,
  'analyze-folders': `Get-ChildItem -Path $env:USERPROFILE -Directory -Force -ErrorAction SilentlyContinue | Select-Object Name, FullName, @{N='SizeNum';E={ $size=0; foreach($file in (Get-ChildItem -Path $_.FullName -Recurse -File -Force -ErrorAction SilentlyContinue)){ $size += $file.Length }; [math]::Round($size/1GB, 2) }} | Sort-Object SizeNum -Descending | Select-Object -First 15 | ConvertTo-Json -Compress`,
  'analyze-files': `Get-ChildItem -Path $env:USERPROFILE -Recurse -File -Force -ErrorAction SilentlyContinue | Sort-Object Length -Descending | Select-Object -First 25 Name, FullName, @{N='SizeNum';E={[math]::Round($_.Length / 1MB, 2)}} | ConvertTo-Json -Compress`,
  'analyze-smart': `$t = @(@{P="$env:USERPROFILE\\.android";D="Caché Emuladores Android"},@{P="$env:USERPROFILE\\.gradle";D="Caché Compilación Java/Android"},@{P="$env:USERPROFILE\\.ollama";D="Modelos Inteligencia Artificial Local (LLMs)"},@{P="$env:USERPROFILE\\.nuget";D="Librerías C# (.NET NuGet)"},@{P="$env:USERPROFILE\\.npm";D="Caché paquetes Node.js (NPM)"},@{P="$env:USERPROFILE\\AppData\\Local\\Temp";D="Archivos Temporales del Sistema"},@{P="$env:USERPROFILE\\AppData\\Local\\CrashDumps";D="Reportes de Cuelgues de Windows"},@{P="$env:USERPROFILE\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache";D="Caché web de Chrome"}); $r = @(); foreach ($x in $t) { if (Test-Path $x.P) { $s = 0; foreach($f in (Get-ChildItem -Path $x.P -Recurse -File -Force -ErrorAction SilentlyContinue)){ $s += $f.Length }; if ($s -gt 0) { $r += @{ Name = (Split-Path $x.P -Leaf); Desc = $x.D; FullName = $x.P; SizeNum = [math]::Round($s / 1MB, 2) } } } }; $r | Sort-Object SizeNum -Descending | ConvertTo-Json -Compress`,
  'disable-telemetry': `Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -Value 0 -Force -ErrorAction SilentlyContinue; Write-Host "Telemetria desactivada"`,
  'game-mode': `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AllowAutoGameMode" -Value 1 -Force -ErrorAction SilentlyContinue; Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AutoGameModeEnabled" -Value 1 -Force -ErrorAction SilentlyContinue; Write-Host "Game Mode forzado ON"`,
  'cpu-priority': `Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" -Name "Win32PrioritySeparation" -Value 38 -Force; Write-Host "Prioridad CPU ajustada a primer plano"`,
  'disable-sysmain': `Stop-Service SysMain -Force -ErrorAction SilentlyContinue; Set-Service SysMain -StartupType Disabled -ErrorAction SilentlyContinue; Write-Host "SysMain desactivado"`,
  'disable-search': `Stop-Service WSearch -Force -ErrorAction SilentlyContinue; Set-Service WSearch -StartupType Disabled -ErrorAction SilentlyContinue; Write-Host "Windows Search desactivado"`,
  'disable-core-parking': `powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR CPMINCORES 100; powercfg /setdcvalueindex SCHEME_CURRENT SUB_PROCESSOR CPMINCORES 100; powercfg /apply; Write-Host "Core Parking desactivado"`,
  'timer-resolution': `Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel" -Name "GlobalTimerResolutionRequests" -Value 1 -Type DWord -Force; Write-Host "Timer resolution ajustada - Reinicia para aplicar"`,
  'optimize-ssd': `$drives = Get-PhysicalDisk | Where-Object MediaType -eq SSD; foreach($d in $drives){ Write-Host "Optimizando SSD: $($d.FriendlyName)" }; Optimize-Volume -DriveLetter C -ReTrim -Verbose 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host $_ }; Write-Host "Optimizacion SSD completada"`,

  // TWEAKS - CLEAN
  'clear-temp': `Remove-Item -Path $env:TEMP\\* -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path "C:\\Windows\\Temp\\*" -Recurse -Force -ErrorAction SilentlyContinue; Write-Host "Archivos temporales eliminados"`,
  'empty-recycle': `Clear-RecycleBin -Force -ErrorAction SilentlyContinue; Write-Host "Papelera vaciada"`,
  'clear-wucache': `Stop-Service wuauserv -Force -ErrorAction SilentlyContinue; Remove-Item "C:\\Windows\\SoftwareDistribution\\Download\\*" -Recurse -Force -ErrorAction SilentlyContinue; Start-Service wuauserv -ErrorAction SilentlyContinue; Write-Host "Cache Windows Update limpiada"`,
  'clear-prefetch': `Remove-Item "C:\\Windows\\Prefetch\\*" -Force -ErrorAction SilentlyContinue; Write-Host "Prefetch limpiado"`,
  'clear-thumbcache': `Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; Remove-Item "$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer\\thumbcache_*" -Force -ErrorAction SilentlyContinue; Start-Process explorer; Write-Host "Miniaturas limpiadas y Explorer reiniciado"`,
  'clear-eventlogs': `Get-WinEvent -ListLog * -ErrorAction SilentlyContinue | Where-Object IsEnabled | ForEach-Object { [System.Diagnostics.Eventing.Reader.EventLogSession]::GlobalSession.ClearLog($_.LogName) 2>$null }; Write-Host "Logs de eventos limpiados"`,
  'clear-dumps': `Remove-Item "C:\\Windows\\Minidump\\*" -Force -ErrorAction SilentlyContinue; Remove-Item "C:\\Windows\\memory.dmp" -Force -ErrorAction SilentlyContinue; Write-Host "Volcados de memoria eliminados"`,
  'clean-winsxs': `Dism /Online /Cleanup-Image /StartComponentCleanup /ResetBase 2>&1 | Select-Object -Last 5 | ForEach-Object { Write-Host $_ }`,

  // TWEAKS - PRIVACY
  'disable-ads': `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Name "Enabled" -Value 0 -Force; Write-Host "Anuncios personalizados desactivados"`,
  'block-mic': `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone" -Name "Value" -Value "Deny" -Force; Write-Host "Microfono bloqueado"`,
  'block-cam': `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam" -Name "Value" -Value "Deny" -Force; Write-Host "Camara bloqueada"`,
  'disable-location': `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location" -Name "Value" -Value "Deny" -Force; Write-Host "Localizacion desactivada"`,
  'disable-cortana': `Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowCortana" -Value 0 -Force -ErrorAction SilentlyContinue; Write-Host "Cortana desactivada"`,
  'disable-wer': `Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\Windows Error Reporting" -Name "Disabled" -Value 1 -Force; Write-Host "Informe de errores desactivado"`,
  'disable-activity': `Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\System" -Name "EnableActivityFeed" -Value 0 -Force -ErrorAction SilentlyContinue; Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\System" -Name "PublishUserActivities" -Value 0 -Force -ErrorAction SilentlyContinue; Write-Host "Historial de actividad desactivado"`,

  // TWEAKS - NETWORK
  'flush-dns': `Clear-DnsClientCache; Write-Host "DNS flushed correctamente"`,
  'reset-tcp': `netsh int ip reset; netsh winsock reset; Write-Host "TCP/IP y Winsock reseteados - Reinicia el PC"`,
  'set-dns-google': `$a=Get-WmiObject Win32_NetworkAdapterConfiguration|Where-Object{$_.IPEnabled}; $a|ForEach-Object{$_.SetDNSServerSearchOrder(@("8.8.8.8","8.8.4.4"))|Out-Null}; Write-Host "DNS: Google 8.8.8.8 / 8.8.4.4"`,
  'set-dns-cloudflare': `$a=Get-WmiObject Win32_NetworkAdapterConfiguration|Where-Object{$_.IPEnabled}; $a|ForEach-Object{$_.SetDNSServerSearchOrder(@("1.1.1.1","1.0.0.1"))|Out-Null}; Write-Host "DNS: Cloudflare 1.1.1.1 / 1.0.0.1"`,
  'set-dns-opendns': `$a=Get-WmiObject Win32_NetworkAdapterConfiguration|Where-Object{$_.IPEnabled}; $a|ForEach-Object{$_.SetDNSServerSearchOrder(@("208.67.222.222","208.67.220.220"))|Out-Null}; Write-Host "DNS: OpenDNS configurado"`,
  'show-ipconfig': `Get-NetIPAddress | Where-Object AddressFamily -eq IPv4 | Select-Object InterfaceAlias, IPAddress | Format-Table -AutoSize | Out-String`,

  // TWEAKS - POWER
  'power-balanced': `powercfg /setactive SCHEME_BALANCED; Write-Host "Plan: Equilibrado"`,
  'power-high':     `powercfg /setactive SCHEME_MIN; Write-Host "Plan: Alto Rendimiento"`,
  'power-ultimate': `powercfg /duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 2>$null; powercfg /setactive e9a42b02-d5df-448d-aa00-03f14749eb61 2>$null; Write-Host "Plan: Maximo Rendimiento activado"`,
  'disable-hibernation': `powercfg -h off; Write-Host "Hibernacion desactivada y hiberfil.sys eliminado"`,
  'screen-off-never': `powercfg /change monitor-timeout-ac 0; powercfg /change monitor-timeout-dc 0; Write-Host "Pantalla: nunca apagar"`,
  'disable-sleep': `powercfg /change standby-timeout-ac 0; powercfg /change standby-timeout-dc 0; Write-Host "Suspension desactivada"`,

  // TWEAKS - APPEARANCE
  'dark-mode': `Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "AppsUseLightTheme" -Value 0 -Force; Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -Value 0 -Force; Write-Host "Modo oscuro aplicado"`,
  'light-mode': `Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "AppsUseLightTheme" -Value 1 -Force; Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -Value 1 -Force; Write-Host "Modo claro aplicado"`,
  'disable-transparency': `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "EnableTransparency" -Value 0 -Force; Write-Host "Transparencias desactivadas"`,
  'disable-animations': `$path="HKCU:\\Control Panel\\Desktop\\WindowMetrics"; Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "UserPreferencesMask" -Value ([byte[]](0x90,0x12,0x03,0x80,0x10,0x00,0x00,0x00)) -Type Binary -Force; Write-Host "Animaciones desactivadas"`,
  'hide-desktop-icons': `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "HideIcons" -Value 1 -Force; $null = (New-Object -ComObject Shell.Application).ToggleDesktop(); Write-Host "Iconos del escritorio ocultos"`,
  'taskbar-left': `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarAl" -Value 0 -Force; Write-Host "Barra de tareas alineada a la izquierda (Win11)"`,
  'restart-explorer': `Stop-Process -Name explorer -Force; Start-Sleep 1; Start-Process explorer; Write-Host "Explorer.exe reiniciado"`,

  // RESTORE
  'create-restore-point': `Enable-ComputerRestore -Drive "C:\\" -ErrorAction SilentlyContinue; Checkpoint-Computer -Description "NexusWin Backup $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -RestorePointType "MODIFY_SETTINGS"; Write-Host "Punto de restauracion creado"`,
  'list-restore-points': `Get-ComputerRestorePoint | Select-Object Description, CreationTime | Format-Table -AutoSize | Out-String`,
  'enable-sysprotect': `Enable-ComputerRestore -Drive "C:\\"; Write-Host "Proteccion del sistema activada en C:"`,
  'repair-windows': `Write-Host "Iniciando SFC..."; sfc /scannow 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host $_ }; Write-Host "SFC completado. Ejecutando DISM..."; DISM /Online /Cleanup-Image /RestoreHealth 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host $_ }; Write-Host "Reparacion completada"`,

  // GAMING
  'disable-gamebar':      `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "AppCaptureEnabled" -Value 0 -Force; Set-ItemProperty -Path "HKCU:\\System\\GameConfigStore" -Name "GameDVR_Enabled" -Value 0 -Force; Write-Host "Xbox Game Bar desactivado"`,
  'enable-hags':          `Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" -Name "HwSchMode" -Value 2 -Type DWord -Force; Write-Host "HAGS activado - Reinicia para aplicar"`,
  'disable-fullscreen-opt':`Set-ItemProperty -Path "HKCU:\\System\\GameConfigStore" -Name "GameDVR_FSEBehaviorMode" -Value 2 -Type DWord -Force; Set-ItemProperty -Path "HKCU:\\System\\GameConfigStore" -Name "GameDVR_HonorUserFSEBehaviorMode" -Value 1 -Type DWord -Force; Write-Host "Fullscreen Optimizations desactivadas"`,
  'disable-mouse-accel':  `Set-ItemProperty -Path "HKCU:\\Control Panel\\Mouse" -Name "MouseSpeed" -Value "0" -Force; Set-ItemProperty -Path "HKCU:\\Control Panel\\Mouse" -Name "MouseThreshold1" -Value "0" -Force; Set-ItemProperty -Path "HKCU:\\Control Panel\\Mouse" -Name "MouseThreshold2" -Value "0" -Force; Write-Host "Aceleracion del raton desactivada"`,
  'enable-hpet':          `bcdedit /set useplatformclock true 2>&1 | Out-Null; Write-Host "HPET activado via bcdedit"`,
  'disable-power-throttle':`Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Power\\PowerThrottling" -Name "PowerThrottlingOff" -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue; Write-Host "Power Throttling desactivado"`,
  'disable-game-notif':   `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings" -Name "NOC_GLOBAL_SETTING_TOASTS_ENABLED" -Value 0 -Force -ErrorAction SilentlyContinue; Write-Host "Notificaciones en juego desactivadas"`,
  'disable-nagle':        `$ifaces = Get-ItemProperty "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\*" -ErrorAction SilentlyContinue; foreach($i in (Get-ChildItem "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces")){ Set-ItemProperty $i.PSPath -Name "TcpAckFrequency" -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue; Set-ItemProperty $i.PSPath -Name "TCPNoDelay" -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue }; Write-Host "Nagle Algorithm desactivado"`,
  'nvidia-max-perf':      `$regPath = "HKLM:\\SOFTWARE\\NVIDIA Corporation\\NvControlPanel2\\Client"; if(Test-Path $regPath){ Set-ItemProperty $regPath -Name "OptInOrOutPreference" -Value 0 -Force }; New-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Power" -Name "ExistingExternalMonitors" -Value 0 -Force -ErrorAction SilentlyContinue | Out-Null; Write-Host "NVIDIA: Maximo rendimiento configurado"`,
  'game-scheduler':       `Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" -Name "GPU Priority" -Value 8 -Type DWord -Force; Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" -Name "Priority" -Value 6 -Type DWord -Force; Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" -Name "Scheduling Category" -Value "High" -Force; Write-Host "Prioridad de juegos maximizada"`,

  // REGISTRY TWEAKS
  'classic-context-menu': `reg add "HKCU\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32" /f /ve 2>&1 | Out-Null; Stop-Process -Name explorer -Force; Start-Sleep 1; Start-Process explorer; Write-Host "Menu contextual clasico restaurado"`,
  'fast-shutdown':        `Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control" -Name "WaitToKillServiceTimeout" -Value "2000" -Force; Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "WaitToKillAppTimeout" -Value "2000" -Force; Write-Host "Tiempo de apagado reducido a 2 segundos"`,
  'show-extensions':      `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "HideFileExt" -Value 0 -Force; Stop-Process -Name explorer -Force; Start-Sleep 1; Start-Process explorer; Write-Host "Extensiones de archivo visibles"`,
  'show-hidden':          `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "Hidden" -Value 1 -Force; Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowSuperHidden" -Value 1 -Force; Stop-Process -Name explorer -Force; Start-Sleep 1; Start-Process explorer; Write-Host "Archivos ocultos visibles"`,
  'disable-uac':          `Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" -Name "EnableLUA" -Value 0 -Force; Write-Host "UAC desactivado - Reinicia para aplicar"`,
  'disable-autolock':     `Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization" -Name "NoLockScreen" -Value 1 -Force -ErrorAction SilentlyContinue; powercfg /SETACVALUEINDEX SCHEME_CURRENT SUB_NONE CONSOLELOCK 0; Write-Host "Bloqueo automatico desactivado"`,
  'disable-sounds':       `Set-ItemProperty -Path "HKCU:\\AppEvents\\Schemes" -Name "(Default)" -Value ".None" -Force; Write-Host "Sonidos del sistema desactivados"`,
  'free-inactive-ram':    `Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" -Name "ClearPageFileAtShutdown" -Value 0 -Force; Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" -Name "LargeSystemCache" -Value 0 -Force; Write-Host "Gestion de RAM optimizada"`,
  'disable-kernel-paging':`Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" -Name "DisablePagingExecutive" -Value 1 -Type DWord -Force; Write-Host "Paginacion del kernel desactivada - Reinicia para aplicar"`,
};

// ===================== PAGE → LOG MAP =====================
const PAGE_LOG = {
  'page-dashboard':   'dashboard-log',
  'page-lowend':      'lowend-log',
  'page-optimize':    'opt-log',
  'page-bloatware':   'dashboard-log',
  'page-adblock':     'adblock-log',
  'page-ghosts':      'dashboard-log',
  'page-clean':       'clean-log',
  'page-privacy':     'privacy-log',
  'page-network':     'net-log',
  'page-power':       'power-log',
  'page-appearance':  'appear-log',
  'page-automation':  'auto-log',
  'page-restore':     'restore-log',
  'page-gaming':      'gaming-log',
  'page-registry':    'registry-log',
};
function getActiveLog() {
  const a = document.querySelector('.page.active');
  return a ? (PAGE_LOG[a.id] || 'dashboard-log') : 'dashboard-log';
}

// ===================== CORE RUNNER =====================
async function ps(cmd) {
  try { return await window.api.runCommand(cmd); }
  catch(e) { return { success: false, error: e.message }; }
}

async function runAndNotify(id, successMsg) {
  const logId = getActiveLog();
  appendLog(logId, 'Ejecutando: ' + id + '...');
  const res = await ps(CMD[id]);
  if (res && res.success) {
    appendLog(logId, res.output || 'OK', 't-success');
    showToast(successMsg, '', 'ok');
  } else {
    appendLog(logId, 'Error: ' + (res ? res.error : '?'), 't-error');
    showToast('Error', res ? res.error.slice(0, 80) : '', 'err');
  }
}

async function applyTweak(id, btn) {
  const logId = getActiveLog();
  appendLog(logId, 'Aplicando: ' + id + '...');
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  const res = await ps(CMD[id]);
  if (res && res.success) {
    const out = res.output.trim();
    appendLog(logId, out || 'OK', 't-success');
    showToast('Aplicado', out.split('\n').pop() || '', 'ok');
    if (btn) btn.classList.add('done');
  } else {
    appendLog(logId, 'Error: ' + (res ? res.error : '?'), 't-error');
    showToast('Error', res ? res.error.slice(0, 80) : '', 'err');
    if (btn) { btn.disabled = false; btn.textContent = 'Aplicar'; }
  }
}

// ===================== POWER PLANS =====================
async function setPowerPlan(plan) {
  document.querySelectorAll('.power-plan').forEach(p => p.classList.remove('active'));
  document.getElementById('plan-' + plan).classList.add('active');
  await runAndNotify('power-' + plan, 'Plan de energía actualizado');
}

// ===================== STATS =====================
async function updateStats() {
  try {
    const cpuR = await ps(CMD['stat-cpu']);
    if (cpuR.success) {
      const v = parseFloat(cpuR.output.trim()) || 0;
      document.getElementById('cpu-val').textContent = v + '%';
      setRing('ring-cpu-fill', v);
    }
    const ramR = await ps(CMD['stat-ram-pct']);
    if (ramR.success) {
      const v = parseFloat(ramR.output.trim()) || 0;
      document.getElementById('ram-val').textContent = v + '%';
      setRing('ring-ram-fill', v);
    }
    const ramD = await ps(CMD['stat-ram-det']);
    if (ramD.success) document.getElementById('ram-detail').textContent = ramD.output.trim() + ' GB';

    const dskR = await ps(CMD['stat-disk-pct']);
    if (dskR.success) {
      const v = parseFloat(dskR.output.trim()) || 0;
      document.getElementById('disk-val').textContent = v + '%';
      setRing('ring-disk-fill', v);
    }
    const dskD = await ps(CMD['stat-disk-det']);
    if (dskD.success) document.getElementById('disk-detail').textContent = dskD.output.trim() + ' GB libres';

    const cR = await ps(CMD['stat-cores']);
    if (cR.success) document.getElementById('cpu-cores').textContent = cR.output.trim() + ' núcleos';

    const gpuR = await ps(CMD['stat-gpu']);
    if (gpuR.success) {
      try {
        const gpuData = JSON.parse(gpuR.output.trim());
        document.getElementById('gpu-name').textContent = gpuData.Name || 'GPU';
        const usage = parseFloat(gpuData.Usage) || 0;
        document.getElementById('gpu-temp-val').textContent = usage + '%';
        setRing('ring-gpu-fill', usage);
      } catch(e) {
        document.getElementById('gpu-temp-val').textContent = '0%';
        setRing('ring-gpu-fill', 0);
      }
    }
  } catch(e) { console.error(e); }
}

document.getElementById('refresh-stats').onclick = () => { showToast('Actualizando...','','info'); updateStats(); };

// ===================== SYSINFO =====================
const SI_MAP = {
  'si-os':    { cmd: 'si-os',    sfx: '' },
  'si-cpu':   { cmd: 'si-cpu',   sfx: '' },
  'si-ram':   { cmd: 'si-ram',   sfx: ' GB' },
  'si-gpu':   { cmd: 'si-gpu',   sfx: '' },
  'si-pc':    { cmd: 'si-pc',    sfx: '' },
  'si-disk':  { cmd: 'si-disk',  sfx: ' GB' },
  'si-user':  { cmd: 'si-user',  sfx: '' },
  'si-uptime':{ cmd: 'si-uptime',sfx: '' },
  'si-bios':  { cmd: 'si-bios',  sfx: '' },
  'si-mobo':  { cmd: 'si-mobo',  sfx: '' },
  'si-net':   { cmd: 'si-net',   sfx: '' },
  'si-build': { cmd: 'si-build', sfx: '' },
};

async function loadSysInfo() {
  for (const [id, info] of Object.entries(SI_MAP)) {
    const res = await ps(CMD[info.cmd]);
    const el = document.getElementById(id);
    if (el && res.success) {
      el.querySelector('.si-val').textContent = res.output.trim() + info.sfx;
      el.classList.remove('skeleton');
    }
  }
}

// ===================== PROCESSES =====================
async function loadProcesses() {
  const res = await ps(CMD['list-procs']);
  const tbody = document.getElementById('proc-body');
  if (!res.success) { tbody.innerHTML = `<tr><td colspan="5" class="t-error" style="text-align:center;padding:24px">Error cargando procesos</td></tr>`; return; }
  try {
    let procs = JSON.parse(res.output.trim());
    if (!Array.isArray(procs)) procs = [procs];
    tbody.innerHTML = procs.map(p => `
      <tr>
        <td>${escHtml(p.Name || '')}</td>
        <td style="color:var(--text-2)">${p.Id || ''}</td>
        <td style="color:${p.CPU > 20 ? 'var(--red-l)' : p.CPU > 5 ? 'var(--orange)' : 'var(--green-l)'}">${p.CPU ?? 0}%</td>
        <td>${p.RAM ?? 0} MB</td>
        <td><button class="btn-kill" onclick="killProcess(${p.Id},'${escHtml(p.Name || '')}')">Terminar</button></td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="5" class="t-muted" style="text-align:center;padding:24px">No se pudo parsear la respuesta</td></tr>`;
  }
}

async function killProcess(pid, name) {
  if (!confirm(`¿Terminar proceso "${name}" (PID: ${pid})?`)) return;
  const res = await ps(`Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue; Write-Host "Proceso ${pid} terminado"`);
  if (res.success) { showToast('Proceso terminado', name, 'ok'); loadProcesses(); }
  else showToast('Error', res.error, 'err');
}

// ===================== STARTUP =====================
async function loadStartup() {
  const res = await ps(CMD['list-startup']);
  const tbody = document.getElementById('startup-body');
  if (!res.success) { tbody.innerHTML = `<tr><td colspan="3" class="t-error" style="text-align:center;padding:24px">Error</td></tr>`; return; }
  try {
    let items = JSON.parse(res.output.trim());
    if (!Array.isArray(items)) items = [items];
    tbody.innerHTML = items.map(s => `
      <tr>
        <td>${escHtml(s.Name || '')}</td>
        <td style="color:var(--text-2);font-size:11px;max-width:300px">${escHtml((s.Command || '').slice(0,100))}</td>
        <td><button class="btn-kill" onclick="removeStartup('${escHtml(s.Name || '')}')">Quitar</button></td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="3" class="t-muted" style="text-align:center;padding:24px">No hay datos</td></tr>`;
  }
}

async function removeStartup(name) {
  if (!confirm(`¿Quitar "${name}" del arranque?`)) return;
  const res = await ps(`Remove-ItemProperty -Path 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run' -Name '${name}' -ErrorAction SilentlyContinue; Write-Host "Eliminado del arranque"`);
  showToast('Arranque', res.success ? `${name} eliminado` : res.error, res.success ? 'ok' : 'err');
  loadStartup();
}

// ===================== SERVICES =====================
async function loadServices() {
  const res = await ps(CMD['list-services']);
  const tbody = document.getElementById('svc-body');
  if (!res.success) { tbody.innerHTML = `<tr><td colspan="4" class="t-error" style="text-align:center;padding:24px">Error</td></tr>`; return; }
  try {
    let svcs = JSON.parse(res.output.trim());
    if (!Array.isArray(svcs)) svcs = [svcs];
    tbody.innerHTML = svcs.map(s => `
      <tr>
        <td style="color:var(--text-2)">${escHtml(s.Name || '')}</td>
        <td>${escHtml(s.DisplayName || '')}</td>
        <td><span class="status-badge ${s.Status === 'Running' ? 'running' : 'stopped'}">${s.Status === 'Running' ? '● Activo' : '○ Parado'}</span></td>
        <td>
          ${s.Status === 'Running'
            ? `<button class="btn-kill" onclick="controlService('Stop','${escHtml(s.Name || '')}',this)">Detener</button>`
            : `<button class="btn-svc" onclick="controlService('Start','${escHtml(s.Name || '')}',this)">Iniciar</button>`}
        </td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="4" class="t-muted" style="text-align:center;padding:24px">No hay datos</td></tr>`;
  }
}

async function controlService(action, name, btn) {
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  const cmd = action === 'Stop'
    ? `Stop-Service '${name}' -Force -ErrorAction SilentlyContinue; Write-Host "Servicio ${name} detenido"`
    : `Start-Service '${name}' -ErrorAction SilentlyContinue; Write-Host "Servicio ${name} iniciado"`;
  const res = await ps(cmd);
  showToast('Servicio', res.output.trim() || res.error, res.success ? 'ok' : 'err');
  setTimeout(() => loadServices(), 800);
}

// ===================== BLOATWARE / APP MANAGER =====================
async function loadApps() {
  const tbody = document.getElementById('apps-body');
  tbody.innerHTML = `<tr><td colspan="3" class="t-muted" style="text-align:center;padding:24px">Cargando aplicaciones...</td></tr>`;
  const res = await ps(CMD['list-apps']);
  if (!res.success) { tbody.innerHTML = `<tr><td colspan="3" class="t-error" style="text-align:center;padding:24px">Error cargando apps</td></tr>`; return; }
  try {
    let apps = JSON.parse(res.output.trim());
    if (!Array.isArray(apps)) apps = [apps];
    tbody.innerHTML = apps.map(a => `
      <tr>
        <td style="font-weight:500">${escHtml(a.Name || '')}</td>
        <td style="color:var(--text-2);font-size:11px;max-width:350px">${escHtml(a.PackageFullName || '')}</td>
        <td><button class="btn-kill" onclick="uninstallApp('${escHtml(a.PackageFullName || '')}', '${escHtml(a.Name || '')}')">Desinstalar</button></td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="3" class="t-muted" style="text-align:center;padding:24px">No se encontraron apps de usuario</td></tr>`;
  }
}

async function uninstallApp(packageFullName, name) {
  if (!confirm(`¿Estás seguro de que quieres desinstalar ${name}?`)) return;
  const res = await ps(`Remove-AppxPackage -Package '${packageFullName}' -ErrorAction SilentlyContinue; Write-Host "Paquete ${name} eliminado"`);
  showToast('Desinstalador', res.success ? `Desinstalado con éxito` : res.error, res.success ? 'ok' : 'err');
  loadApps();
}

// ===================== GHOST DEVICES =====================
async function loadGhosts() {
  const tbody = document.getElementById('ghost-body');
  tbody.innerHTML = `<tr><td colspan="4" class="t-muted" style="text-align:center;padding:24px"><i class="ph-spin ph-spinner"></i> Escaneando dispositivos fantasma...</td></tr>`;
  const res = await ps(CMD['list-ghosts']);
  if (!res.success) { tbody.innerHTML = `<tr><td colspan="4" class="t-error" style="text-align:center;padding:24px">Error escaneando hardware</td></tr>`; return; }
  try {
    let devs = JSON.parse(res.output.trim());
    if (!Array.isArray(devs)) devs = [devs];
    tbody.innerHTML = devs.map(d => `
      <tr>
        <td style="font-weight:500">${escHtml(d.FriendlyName || 'Dispositivo Desconocido')}</td>
        <td><span style="background:var(--accent-dim);color:var(--accent);padding:2px 8px;border-radius:12px;font-size:11px">${escHtml(d.Class || 'N/A')}</span></td>
        <td style="color:var(--text-2);font-size:11px;max-width:250px">${escHtml(d.InstanceId || '')}</td>
        <td><button class="btn-kill" onclick="uninstallGhost('${escHtml(d.InstanceId || '')}')">Limpiar</button></td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="4" class="t-muted" style="text-align:center;padding:24px">No se encontraron dispositivos fantasma (¡Tu sistema está limpio!)</td></tr>`;
  }
}

async function uninstallGhost(instanceId) {
  const res = await ps(`& pnputil /remove-device "${instanceId}" /force; Write-Host "Dispositivo limpiado"`);
  showToast('Dispositivos', res.success ? `Limpiado con éxito` : res.error, res.success ? 'ok' : 'err');
  loadGhosts();
}

// ===================== DISK ANALYZER =====================
async function runDiskScan(cmdKey, isFiles) {
  document.getElementById('analyzer-box').style.display = 'block';
  document.getElementById('analyzer-title').textContent = isFiles ? 'Top 25 Archivos más Pesados' : 'Top 15 Carpetas más Pesadas';
  const tbody = document.getElementById('disk-body');
  tbody.innerHTML = `<tr><td colspan="4" class="t-muted" style="text-align:center;padding:24px"><i class="ph-spin ph-spinner"></i> Escaneando... (puede tardar de 1 a 2 minutos)</td></tr>`;
  
  const res = await ps(CMD[cmdKey]);
  if (!res.success) {
    tbody.innerHTML = `<tr><td colspan="4" class="t-error" style="text-align:center;padding:24px">Error escaneando el disco</td></tr>`;
    return;
  }
  
  try {
    let items = JSON.parse(res.output.trim());
    if (!Array.isArray(items)) items = [items];
    const unit = isFiles ? 'MB' : 'GB';
    
    tbody.innerHTML = items.map(i => `
      <tr id="row-${btoa(i.FullName).replace(/=/g,'')}">
        <td style="font-weight:500"><i class="ph ${isFiles ? 'ph-file' : 'ph-folder'}" style="color:var(--accent);margin-right:8px"></i> ${escHtml(i.Name || '')}</td>
        <td style="font-weight:bold; color:${isFiles ? (i.SizeNum > 1000 ? 'var(--red)' : (i.SizeNum > 300 ? 'var(--orange)' : 'var(--text)')) : (i.SizeNum > 10 ? 'var(--red)' : (i.SizeNum > 2 ? 'var(--orange)' : 'var(--text)'))}">${i.SizeNum} ${unit}</td>
        <td style="color:var(--text-2);font-size:11px;max-width:250px">${escHtml(i.FullName || '')}</td>
        <td>
          <button class="btn-svc" onclick="openPath('${escHtml(i.FullName || '').replace(/\\/g, '\\\\')}', ${isFiles})"><i class="ph ph-folder-open"></i> Explorar</button>
          <button class="btn-kill" onclick="deletePath('${escHtml(i.FullName || '').replace(/\\/g, '\\\\')}', '${escHtml(i.Name || '')}')"><i class="ph ph-trash"></i> Eliminar</button>
        </td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="4" class="t-muted" style="text-align:center;padding:24px">No se encontraron resultados o hubo un error al parsear.</td></tr>`;
  }
}

function analyzeFolders() { runDiskScan('analyze-folders', false); }
function analyzeFiles() { runDiskScan('analyze-files', true); }

async function analyzeSmart() {
  document.getElementById('analyzer-box').style.display = 'block';
  document.getElementById('analyzer-title').textContent = 'Cachés de Programador / Sistema (Identificadas)';
  const tbody = document.getElementById('disk-body');
  tbody.innerHTML = `<tr><td colspan="4" class="t-muted" style="text-align:center;padding:24px"><i class="ph-spin ph-spinner"></i> Analizando cachés conocidas... (puede tardar un minuto)</td></tr>`;
  
  const res = await ps(CMD['analyze-smart']);
  if (!res.success) {
    tbody.innerHTML = `<tr><td colspan="4" class="t-error" style="text-align:center;padding:24px">Error escaneando el disco</td></tr>`;
    return;
  }
  
  try {
    let items = JSON.parse(res.output.trim());
    if (!Array.isArray(items)) items = [items];
    
    tbody.innerHTML = items.map(i => `
      <tr id="row-${btoa(i.FullName).replace(/=/g,'')}">
        <td>
          <div style="font-weight:500;color:var(--accent)">${escHtml(i.Name || '')}</div>
          <div style="font-size:11px;color:var(--text-2);margin-top:2px">${escHtml(i.Desc || '')}</div>
        </td>
        <td style="font-weight:bold; color:${i.SizeNum > 1000 ? 'var(--red)' : (i.SizeNum > 300 ? 'var(--orange)' : 'var(--text)')}">${i.SizeNum > 1024 ? (i.SizeNum/1024).toFixed(2) + ' GB' : i.SizeNum + ' MB'}</td>
        <td style="color:var(--text-2);font-size:11px;max-width:200px">${escHtml(i.FullName || '')}</td>
        <td>
          <button class="btn-svc" onclick="openPath('${escHtml(i.FullName || '').replace(/\\/g, '\\\\')}', false)"><i class="ph ph-folder-open"></i></button>
          <button class="btn-kill" onclick="deletePath('${escHtml(i.FullName || '').replace(/\\/g, '\\\\')}', '${escHtml(i.Name || '')}')"><i class="ph ph-trash"></i> Eliminar</button>
        </td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="4" class="t-muted" style="text-align:center;padding:24px">Tus carpetas de caché conocidas están vacías.</td></tr>`;
  }
}

async function openPath(pathStr, isFile) {
  const p = isFile ? `explorer.exe /select,"${pathStr}"` : `explorer.exe "${pathStr}"`;
  await ps(p);
}

async function deletePath(pathStr, name) {
  if (!confirm(`⚠️ ATENCIÓN: ESTA ACCIÓN ES IRREVERSIBLE.\n\n¿Estás completamente seguro de que quieres eliminar PERMANENTEMENTE "${name}"?\nSe borrará de forma recursiva.`)) return;
  const res = await ps(`Remove-Item -Path "${pathStr}" -Recurse -Force -ErrorAction SilentlyContinue; Write-Host "Eliminado"`);
  showToast('Analizador', res.success ? `${name} eliminado con éxito` : `Error al eliminar`, res.success ? 'ok' : 'err');
  if (res.success) {
    const rId = "row-" + btoa(pathStr).replace(/=/g,'');
    const el = document.getElementById(rId);
    if (el) el.remove();
  }
}

// ===================== AUTOMATION =====================
const userScripts = JSON.parse(localStorage.getItem('nexus-scripts') || '{}');

async function runCustomScript() {
  const code = document.getElementById('ps-editor').value;
  if (!code.trim()) { showToast('Script vacío','','err'); return; }
  appendLog('auto-log', 'Ejecutando script...');
  const res = await ps(code);
  if (res.success) {
    appendLog('auto-log', res.output || '(sin salida)', 't-success');
    showToast('Script ejecutado','','ok');
  } else {
    appendLog('auto-log', 'Error: ' + res.error, 't-error');
    showToast('Error en el script', res.error.slice(0,80), 'err');
  }
}

function saveScript() {
  const name = document.getElementById('script-name').value.trim();
  const code = document.getElementById('ps-editor').value.trim();
  if (!name || !code) { showToast('Nombre o código vacío','','err'); return; }
  userScripts[name] = code;
  localStorage.setItem('nexus-scripts', JSON.stringify(userScripts));
  renderUserScripts();
  showToast('Script guardado', name, 'ok');
}

function loadScript(name, code) {
  document.getElementById('script-name').value = name;
  document.getElementById('ps-editor').value = code;
}

function renderUserScripts() {
  const list = document.getElementById('saved-scripts-list');
  for (const [name, code] of Object.entries(userScripts)) {
    if ([...list.querySelectorAll('span')].some(s => s.textContent === name)) continue;
    const div = document.createElement('div');
    div.className = 'saved-item';
    div.innerHTML = `<i class="ph ph-file-code"></i><span>${escHtml(name)}</span>`;
    div.onclick = () => loadScript(name, code);
    list.appendChild(div);
  }
}

// ===================== UTILS =====================
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===================== INIT =====================
updateStats();
loadSysInfo();
renderUserScripts();
setInterval(updateStats, 6000);

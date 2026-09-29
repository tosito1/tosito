$src = "C:\Users\Tosito\Downloads\cudnn_temp\cudnn-windows-x86_64-8.9.7.29_cuda12-archive"
$dest = "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.4"
Copy-Item -Path "$src\bin\*" -Destination "$dest\bin\" -Force -ErrorAction Stop
Copy-Item -Path "$src\include\*" -Destination "$dest\include\" -Force -ErrorAction Stop
Copy-Item -Path "$src\lib\x64\*" -Destination "$dest\lib\x64\" -Force -ErrorAction Stop
Write-Host "Copia de cuDNN completada con exito. Esta ventana se cerrara en 5 segundos."
Start-Sleep -Seconds 5

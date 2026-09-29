$i = 1
Get-Content 'src\\Optimizador\\Instalador_Optimizador_Suite.cmd' | ForEach-Object {
    if ($i -le 25) { Write-Host "$($i): $_" }
    if ($i -le 25 -and $_ -match '<PAYLOAD>') { Write-Host "*** found payload marker on line $i ***" }
    $i++
}
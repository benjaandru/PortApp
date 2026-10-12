# =========================================================================
# SCRIPT DE INICIO DEL ENTORNO DE DESARROLLO (WINDOWS 11 / POWERSHELL)
# Finanzas & Portfolio PWA
# =========================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Iniciando Entorno de Desarrollo - Finanzas PWA         " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Comprobar que Node.js y npm están instalados
try {
    $nodeVersion = node -v
    $npmVersion = npm -v
    Write-Host "[OK] Node.js detectado: $nodeVersion" -ForegroundColor Green
    Write-Host "[OK] npm detectado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js no está instalado o no se encuentra en el PATH." -ForegroundColor Red
    Write-Host "Descárgalo e instálalo desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 2. Comprobar y configurar archivo .env
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "[CONFIG] Se ha creado '.env' a partir de '.env.example'." -ForegroundColor Yellow
        Write-Host "         -> Recuerda editar '.env' y colocar tu URL de Apps Script." -ForegroundColor Magenta
    } else {
        Set-Content -Path ".env" -Value "VITE_SHEETS_API_URL=https://script.google.com/macros/s/TU_SCRIPT_ID/exec"
        Write-Host "[CONFIG] Archivo '.env' generado con valor de plantilla." -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] Archivo '.env' existente detectado." -ForegroundColor Green
}

# 3. Comprobar si las dependencias (node_modules) están instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "[INSTALANDO] 'node_modules' no encontrado. Instalando dependencias..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Falló la instalación de dependencias." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Dependencias instaladas con éxito." -ForegroundColor Green
} else {
    Write-Host "[OK] Dependencias 'node_modules' listas." -ForegroundColor Green
}

# 4. Obtener la IP local de la máquina para probar desde el iPhone en la misma red Wi-Fi
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { 
        $_.InterfaceAlias -notmatch 'Loopback|vEthernet|Virtual|Pseudo' -and 
        $_.IPAddress -notlike '169.254*' -and 
        $_.IPAddress -notlike '127.*' 
    } | Select-Object -ExpandProperty IPAddress -First 1)

Write-Host ""
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host " [PC Local]     http://localhost:5173" -ForegroundColor White
if ($localIp) {
    Write-Host " [iPhone Wi-Fi] http://$($localIp):5173" -ForegroundColor Cyan
    Write-Host "                (Abre esta dirección en Safari de tu iPhone)" -ForegroundColor DarkCyan
}
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Presiona [Ctrl + C] para detener el servidor en cualquier momento." -ForegroundColor DarkGray
Write-Host ""

# 5. Ejecutar Vite en modo host
npm run dev -- --host

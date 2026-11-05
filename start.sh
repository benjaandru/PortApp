#!/bin/bash

# =========================================================================
# SCRIPT DE INICIO DEL ENTORNO DE DESARROLLO (macOS / Zsh)
# Finanzas & Portfolio PWA
# =========================================================================

# Definición de colores
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
NC='\033[0m' # Sin color

echo -e "${CYAN}==========================================================${NC}"
echo -e "${YELLOW}   Iniciando Entorno de Desarrollo - Finanzas PWA         ${NC}"
echo -e "${CYAN}==========================================================${NC}"

# 1. Comprobar que Node.js y npm están instalados
if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}[OK] Node.js detectado: $NODE_VERSION${NC}"
    echo -e "${GREEN}[OK] npm detectado: $NPM_VERSION${NC}"
else
    echo -e "${RED}[ERROR] Node.js no está instalado o no se encuentra en el PATH.${NC}"
    echo -e "${YELLOW}Descárgalo e instálalo desde: https://nodejs.org/${NC}"
    exit 1
fi

# 2. Comprobar y configurar archivo .env
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}[CONFIG] Se ha creado '.env' a partir de '.env.example'.${NC}"
        echo -e "${MAGENTA}         -> Recuerda editar '.env' y colocar tu URL de Apps Script.${NC}"
    else
        echo "VITE_SHEETS_API_URL=https://script.google.com/macros/s/TU_SCRIPT_ID/exec" > .env
        echo -e "${YELLOW}[CONFIG] Archivo '.env' generado con valor de plantilla.${NC}"
    fi
else
    echo -e "${GREEN}[OK] Archivo '.env' existente detectado.${NC}"
fi

# 3. Comprobar si las dependencias (node_modules) están instaladas
if [ ! -d "node_modules" ]; then
    echo -e "${CYAN}[INSTALANDO] 'node_modules' no encontrado. Instalando dependencias...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR] Falló la instalación de dependencias.${NC}"
        exit 1
    fi
    echo -e "${GREEN}[OK] Dependencias instaladas con éxito.${NC}"
else
    echo -e "${GREEN}[OK] Dependencias 'node_modules' listas.${NC}"
fi

# 4. Obtener la IP local de la máquina para probar desde el iPhone en la misma red Wi-Fi
# En Mac, 'en0' suele ser la interfaz de Wi-Fi.
LOCAL_IP=$(ipconfig getifaddr en0)

# Alternativa por si el internet viene por cable u otra interfaz (en1)
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ipconfig getifaddr en1)
fi

echo ""
echo -e "----------------------------------------------------------"
echo -e " [Mac Local]    http://localhost:5173"
if [ ! -z "$LOCAL_IP" ]; then
    echo -e "${CYAN} [iPhone Wi-Fi] http://$LOCAL_IP:5173${NC}"
    echo -e "                (Abre esta dirección en Safari de tu iPhone)"
fi
echo -e "----------------------------------------------------------"
echo -e "Presiona [Ctrl + C] para detener el servidor en cualquier momento."
echo ""

# 5. Ejecutar Vite en modo host
npm run dev -- --host
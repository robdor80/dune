// --- CONFIGURACIÓN TÉCNICA PLANTA 0 (CUADRADOS PERFECTOS) ---
const BASE_WIDTH = 10; // Cimientos de ancho
const BASE_DEPTH = 6;  // Cimientos de fondo

const mapWrapper = document.getElementById('mapWrapper');
const markersLayer = document.getElementById('markersLayer');

function initBaseMap() {
    // La rejilla ya está definida en el CSS con background-size: 10% 16.666%
    // Esto garantiza que cada cuadro sea un cuadrado real.
    drawFloorPlan();
}

function drawFloorPlan() {
    // Limpiamos elementos previos para evitar duplicados al recargar
    const oldWalls = document.querySelectorAll('.wall-line');
    oldWalls.forEach(el => el.remove());

    // 1. PERÍMETRO EXTERIOR (Caja de 10x6)
    // Usamos grosores de 2px o 3px para que se vean como planos técnicos
    createWall(0, 0, 100, 2);    // Pared Norte
    createWall(0, 99.5, 100, 2); // Pared Sur (ajustada al borde inferior)
    createWall(0, 0, 0.5, 100);  // Pared Oeste
    createWall(99.5, 0, 0.5, 100);// Pared Este

    // 2. DIVISIONES INTERNAS (Alineadas con la rejilla)
    
    // División Zona Industrial (Tras 4 cimientos = 40%)
    // Ponemos 40.1% o similar para que pise justo la línea gris
    createWall(40, 0, 0.3, 100); 
    
    // División Zona Paso/Agua (Tras 7 cimientos = 70%)
    createWall(70, 0, 0.3, 100);

    // 3. INDICADOR DE PORTÓN (Opcional: Línea roja sutil en Zona Agua)
    // Ocupa los últimos 3 cimientos del sur (del 70% al 100%)
    const gate = document.createElement('div');
    gate.style.position = "absolute";
    gate.style.backgroundColor = "#ff4444";
    gate.style.left = "70%";
    gate.style.bottom = "0";
    gate.style.width = "30%";
    gate.style.height = "4px";
    gate.style.boxShadow = "0 0 10px #ff4444";
    gate.style.zIndex = "3";
    mapWrapper.appendChild(gate);
}

// Función auxiliar para crear paredes con precisión
function createWall(left, top, width, height) {
    const wall = document.createElement('div');
    wall.className = 'wall-line';
    wall.style.left = left + "%";
    wall.style.top = top + "%";
    // Si el ancho es pequeño (ej. 0.5), le damos píxeles fijos para que no desaparezca
    wall.style.width = (width < 1) ? "3px" : width + "%";
    wall.style.height = (height < 1) ? "3px" : height + "%";
    mapWrapper.appendChild(wall);
}

// 4. CAPTURA DE CLICS PARA COORDENADAS
mapWrapper.addEventListener('click', (e) => {
    const rect = mapWrapper.getBoundingClientRect();
    
    // Calculamos el porcentaje relativo al contenedor
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(2);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(2);

    const display = document.getElementById('coordDisplay');
    if (display) {
        display.style.display = 'block';
        display.innerHTML = `<strong>COORDENADAS:</strong> X: ${x}%, Y: ${y}%`;
    }

    placeMarker(x, y);
});

function placeMarker(x, y) {
    let marker = document.querySelector('.temp-marker');
    if (!marker) {
        marker = document.createElement('div');
        marker.className = 'map-marker temp-marker';
        markersLayer.appendChild(marker);
    }
    marker.style.left = x + '%';
    marker.style.top = y + '%';
}

window.onload = initBaseMap;
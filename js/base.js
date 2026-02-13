// --- CONFIGURACIÓN TÉCNICA PLANTA 0 (MODO SANDBOX) ---
const BASE_WIDTH = 10;
const BASE_DEPTH = 6;
const MARGIN = 5; // 5% de margen a cada lado (total 90% de tamaño)

const mapWrapper = document.getElementById('mapWrapper');
const markersLayer = document.getElementById('markersLayer');

function initBaseMap() {
    // Rejilla infinita de fondo (líneas grises finas)
    mapWrapper.style.backgroundColor = "#001a33";
    mapWrapper.style.backgroundImage = `
        linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
    `;
    mapWrapper.style.backgroundSize = "5% 5%"; // Rejilla decorativa global

    drawFloorPlan();
}

function drawFloorPlan() {
    // Limpiamos elementos previos
    const oldElements = document.querySelectorAll('.wall-line, .door-line');
    oldElements.forEach(el => el.remove());

    // 1. PERÍMETRO DE LA BASE (al 90% del contenedor)
    // Creamos un contenedor visual para la base
    const baseArea = document.createElement('div');
    baseArea.className = 'wall-line';
    baseArea.style.left = MARGIN + "%";
    baseArea.style.top = MARGIN + "%";
    baseArea.style.width = (100 - (MARGIN * 2)) + "%";
    baseArea.style.height = (100 - (MARGIN * 2)) + "%";
    baseArea.style.border = "3px solid white";
    baseArea.style.backgroundColor = "rgba(255,255,255,0.02)";
    baseArea.style.pointerEvents = "none";
    mapWrapper.appendChild(baseArea);

    // 2. DIVISIONES INTERNAS (Calculadas sobre el 90%)
    const innerWidth = 100 - (MARGIN * 2);
    
    // Pared Industria/Paso (a los 4 de 10 cimientos)
    const wall1Pos = MARGIN + (innerWidth * 0.4);
    createWallLine(wall1Pos, MARGIN, 2, 100 - (MARGIN * 2));
    
    // Pared Paso/Agua (a los 7 de 10 cimientos)
    const wall2Pos = MARGIN + (innerWidth * 0.7);
    createWallLine(wall2Pos, MARGIN, 2, 100 - (MARGIN * 2));

    // 3. INDICADOR PORTÓN VEHÍCULOS (Línea roja gruesa en el borde sur)
    const gateWidth = innerWidth * 0.3; // 3 cimientos de ancho
    const gatePos = MARGIN + (innerWidth * 0.7);
    const gate = document.createElement('div');
    gate.style.position = "absolute";
    gate.style.backgroundColor = "#ff4444";
    gate.style.left = gatePos + "%";
    gate.style.top = (100 - MARGIN - 1) + "%";
    gate.style.width = gateWidth + "%";
    gate.style.height = "5px";
    gate.style.boxShadow = "0 0 10px #ff4444";
    mapWrapper.appendChild(gate);
}

function createWallLine(left, top, widthPx, heightPct) {
    const wall = document.createElement('div');
    wall.className = 'wall-line';
    wall.style.left = left + "%";
    wall.style.top = top + "%";
    wall.style.width = widthPx + "px";
    wall.style.height = heightPct + "%";
    mapWrapper.appendChild(wall);
}

// Capturador de clics (mantiene la lógica de coordenadas globales)
mapWrapper.addEventListener('click', (e) => {
    const rect = mapWrapper.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(2);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(2);

    document.getElementById('coordDisplay').style.display = 'block';
    document.getElementById('currentCoords').innerText = `X: ${x}%, Y: ${y}%`;

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
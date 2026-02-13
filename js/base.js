// --- CONFIGURACIÓN TÉCNICA DE LA PLANTA 0 ---
const BASE_WIDTH = 10; // Cimientos de ancho
const BASE_DEPTH = 6;  // Cimientos de fondo

const mapWrapper = document.getElementById('mapWrapper');
const markersLayer = document.getElementById('markersLayer');

function setupBaseMap() {
    // 1. Fondo Azul Técnico y Rejilla de Cimientos
    mapWrapper.style.backgroundColor = "#001a33";
    
    // Calculamos el tamaño de la rejilla basado en el ancho total (10 cimientos)
    // Esto hace que la rejilla coincida perfectamente con tus piezas del juego
    const gridSpacing = (100 / BASE_WIDTH) + "%";
    const gridSpacingY = (100 / BASE_DEPTH) + "%";

    mapWrapper.style.backgroundImage = `
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
    `;
    mapWrapper.style.backgroundSize = `${100 / BASE_WIDTH}% ${100 / BASE_DEPTH}%`;

    // 2. Dibujamos las Paredes (Silueta Blanca)
    drawWalls();
}

function drawWalls() {
    // Limpiamos capa de dibujo si existiera
    const drawingLayer = document.getElementById('mapImage');
    drawingLayer.style.position = "absolute";
    drawingLayer.style.width = "100%";
    drawingLayer.style.height = "100%";
    drawingLayer.style.border = "4px solid white"; // Perímetro exterior total
    
    // Añadimos las divisiones internas (Paredes de las zonas)
    // Pared derecha de Zona Industrial (a los 4 cimientos)
    const wall1 = createWall(40, 0, 1, 100); 
    // Pared izquierda de Zona Agua (a los 7 cimientos: 4+3)
    const wall2 = createWall(70, 0, 1, 100);
    
    mapWrapper.appendChild(wall1);
    mapWrapper.appendChild(wall2);
}

function createWall(left, top, width, height) {
    const wall = document.createElement('div');
    wall.style.position = "absolute";
    wall.style.backgroundColor = "white";
    wall.style.left = left + "%";
    wall.style.top = top + "%";
    wall.style.width = width === 1 ? "3px" : width + "%";
    wall.style.height = height === 1 ? "3px" : height + "%";
    wall.style.boxShadow = "0 0 10px rgba(255,255,255,0.5)";
    return wall;
}

// 3. Captura de clics para colocar máquinas
mapWrapper.addEventListener('click', (e) => {
    const rect = mapWrapper.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(2);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(2);

    document.getElementById('coordDisplay').style.display = 'block';
    document.getElementById('currentCoords').innerText = `Punto de anclaje -> X: ${x}%, Y: ${y}%`;

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

window.onload = setupBaseMap;
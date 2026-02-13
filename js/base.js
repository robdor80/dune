const mapWrapper = document.getElementById('mapWrapper');
const markersLayer = document.getElementById('markersLayer');

function initBaseMap() {
    // 1. Crear la rejilla de cimientos (10 ancho x 6 fondo)
    mapWrapper.style.backgroundImage = `
        linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
    `;
    // Cada cuadro es el 10% del ancho (10 cimientos) y 16.6% del alto (6 cimientos)
    mapWrapper.style.backgroundSize = "10% 16.66%";

    drawFloorPlan();
}

function drawFloorPlan() {
    // Limpiamos por si acaso
    const existingWalls = document.querySelectorAll('.wall-line');
    existingWalls.forEach(w => w.remove());

    // PAREDES EXTERIORES (El rectángulo de 10x6)
    createWall(0, 0, 100, 2);   // Norte
    createWall(0, 98, 100, 2);  // Sur
    createWall(0, 0, 1, 100);   // Oeste
    createWall(99, 0, 1, 100);  // Este

    // DIVISIONES INTERNAS (Según tu dibujo)
    // Pared entre Industria (4) y Paso (3) -> Al 40%
    createWall(40, 0, 1, 100); 
    
    // Pared entre Paso (3) y Agua (3) -> Al 70% (4+3)
    createWall(70, 0, 1, 100);

    // MARCAR LAS PUERTAS (Puntos rojos)
    createDoor(40, 50); // Puerta Industria
    createDoor(70, 30); // Puerta Agua
    createDoor(85, 98, true); // Portón vehículos (al sur)
}

function createWall(left, top, width, height) {
    const wall = document.createElement('div');
    wall.className = 'wall-line';
    wall.style.left = left + "%";
    wall.style.top = top + "%";
    wall.style.width = width === 1 ? "3px" : width + "%";
    wall.style.height = height === 2 ? "3px" : height + "%";
    mapWrapper.appendChild(wall);
}

function createDoor(x, y, isLarge = false) {
    const door = document.createElement('div');
    door.style.position = "absolute";
    door.style.backgroundColor = "#ff4444";
    door.style.left = x + "%";
    door.style.top = y + "%";
    door.style.width = isLarge ? "15%" : "10px";
    door.style.height = isLarge ? "5px" : "15px";
    door.style.transform = "translate(-50%, -50%)";
    door.style.boxShadow = "0 0 10px #ff4444";
    door.style.zIndex = "4";
    mapWrapper.appendChild(door);
}

// Captura de clics
mapWrapper.addEventListener('click', (e) => {
    const rect = mapWrapper.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(2);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(2);

    document.getElementById('coordDisplay').style.display = 'block';
    document.getElementById('currentCoords').innerText = `X: ${x}%, Y: ${y}%`;

    let marker = document.querySelector('.temp-marker');
    if (!marker) {
        marker = document.createElement('div');
        marker.className = 'map-marker temp-marker';
        markersLayer.appendChild(marker);
    }
    marker.style.left = x + '%';
    marker.style.top = y + '%';
});

window.onload = initBaseMap;
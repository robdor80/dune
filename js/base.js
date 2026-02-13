const censusForm = document.getElementById('censusForm');
const censusContainer = document.getElementById('censusContainer');
const censusRef = db.collection("dune_census");

// 1. CARGAR DESPLEGABLE CON TU CATÁLOGO REAL
async function loadItemSelect() {
    try {
        const snap = await itemsRef.orderBy('nombre').get();
        const select = document.getElementById('censusItem');
        select.innerHTML = '<option value="">-- Selecciona Máquina --</option>';
        
        snap.forEach(doc => {
            const item = doc.data();
            // Filtramos para no meter ingredientes básicos en el censo de máquinas
            if (item.categoria !== "Basicos") {
                const opt = document.createElement('option');
                opt.value = item.nombre;
                const mk = item.version && item.version !== 'Base' ? ` [${item.version}]` : '';
                opt.textContent = item.nombre + mk;
                select.appendChild(opt);
            }
        });
    } catch (e) { console.error("Error catálogo:", e); }
}

// 2. GUARDAR REGISTRO
censusForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        planta: document.getElementById('censusFloor').value,
        zona: document.getElementById('censusZone').value,
        nombre: document.getElementById('censusItem').value,
        cantidad: parseInt(document.getElementById('censusQty').value),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await censusRef.add(data);
        censusForm.reset();
        loadCensus(); // Recargar lista
    } catch (e) { alert("Error al guardar"); }
});

// 3. CARGAR Y ORGANIZAR POR ZONAS
async function loadCensus() {
    const floorFilter = document.getElementById('filterFloor').value;
    censusContainer.innerHTML = "<p>Sincronizando con Arrakis...</p>";

    try {
        let query = censusRef.orderBy("zona");
        if (floorFilter !== "all") {
            query = query.where("planta", "==", floorFilter);
        }

        const snap = await query.get();
        censusContainer.innerHTML = "";

        if (snap.empty) {
            censusContainer.innerHTML = "<div class='card' style='text-align:center; color:#666;'>No hay registros en esta ubicación.</div>";
            return;
        }

        // Agrupamos datos por zona en memoria
        const groups = {};
        snap.forEach(doc => {
            const item = doc.data();
            if (!groups[item.zona]) groups[item.zona] = [];
            groups[item.zona].push({ id: doc.id, ...item });
        });

        // Crear una sección visual por cada zona
        for (const zona in groups) {
            const section = document.createElement('div');
            section.className = "census-zone-card";
            
            let html = `<h3><i class="fas fa-layer-group"></i> ${zona}</h3>`;
            
            groups[zona].forEach(obj => {
                html += `
                    <div class="census-item">
                        <div class="info">
                            <span class="qty">${obj.cantidad}x</span>
                            <span class="name">${obj.nombre}</span>
                            <span class="badge-planta">${obj.planta}</span>
                        </div>
                        <button class="btn-del" onclick="deleteEntry('${obj.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            });
            section.innerHTML = html;
            censusContainer.appendChild(section);
        }
    } catch (e) { console.error(e); }
}

async function deleteEntry(id) {
    if (confirm("¿Eliminar este registro del censo?")) {
        await censusRef.doc(id).delete();
        loadCensus();
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadItemSelect();
    loadCensus();
});
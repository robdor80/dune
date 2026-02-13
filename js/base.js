const censusForm = document.getElementById('censusForm');
const censusContainer = document.getElementById('censusContainer');
const censusRef = db.collection("dune_census");
let itemImages = {}; 

// 1. CARGAR CATÁLOGO E IMÁGENES
async function loadItemSelect() {
    try {
        const snap = await itemsRef.orderBy('nombre').get();
        const select = document.getElementById('censusItem');
        select.innerHTML = '<option value="">-- Selecciona Máquina --</option>';
        
        snap.forEach(doc => {
            const item = doc.data();
            if (item.imagen) itemImages[item.nombre] = item.imagen;
            if (item.categoria !== "Basicos") {
                const opt = document.createElement('option');
                opt.value = item.nombre;
                const mk = item.version && item.version !== 'Base' ? ` [${item.version}]` : '';
                opt.textContent = item.nombre + mk;
                select.appendChild(opt);
            }
        });
        loadCensus(); 
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
        loadCensus();
    } catch (e) { alert("Error al guardar"); }
});

// 3. CARGAR Y FILTRAR (Lógica local para evitar errores de Firebase)
async function loadCensus() {
    const floorFilter = document.getElementById('filterFloor').value;
    censusContainer.innerHTML = "<p style='color: #888; padding: 20px;'>Sincronizando con Arrakis...</p>";

    try {
        // Obtenemos todos los registros ordenados por zona
        const snap = await censusRef.orderBy("zona").get();
        censusContainer.innerHTML = ""; 

        if (snap.empty) {
            censusContainer.innerHTML = "<div style='color:#666; padding:20px;'>El censo está vacío. Registra algo para empezar.</div>";
            return;
        }

        const groups = {};
        let itemsFound = false;

        snap.forEach(doc => {
            const d = doc.data();
            
            // FILTRADO LOCAL: Si el filtro es "all" o coincide con la planta
            if (floorFilter === "all" || d.planta === floorFilter) {
                itemsFound = true;
                if (!groups[d.zona]) groups[d.zona] = [];
                groups[d.zona].push({ id: doc.id, ...d });
            }
        });

        if (!itemsFound) {
            censusContainer.innerHTML = `<div style='color:#666; padding:20px;'>No hay maquinaria registrada en ${floorFilter}.</div>`;
            return;
        }

        // Renderizamos las zonas filtradas
        for (const zona in groups) {
            const section = document.createElement('div');
            section.className = "census-zone-card";
            let html = `<h3><i class="fas fa-th-large"></i> ZONA: ${zona}</h3>`;
            
            groups[zona].forEach(item => {
                const imgUrl = itemImages[item.nombre] || 'https://via.placeholder.com/45?text=?';
                html += `
                    <div class="census-item">
                        <div class="info">
                            <img src="${imgUrl}" class="census-img" alt="${item.nombre}" onerror="this.src='https://via.placeholder.com/45?text=?'">
                            <span class="qty">${item.cantidad}x</span>
                            <span class="name">${item.nombre}</span>
                            <span class="planta-tag">${item.planta}</span>
                        </div>
                        <button class="btn-del" onclick="deleteCensus('${item.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>`;
            });
            section.innerHTML = html;
            censusContainer.appendChild(section);
        }
    } catch (e) { 
        console.error("Error al cargar censo:", e);
        censusContainer.innerHTML = "<p style='color:red;'>Error al conectar con la base de datos.</p>";
    }
}

async function deleteCensus(id) {
    if (confirm("¿Eliminar registro?")) {
        await censusRef.doc(id).delete();
        loadCensus();
    }
}

document.addEventListener('DOMContentLoaded', loadItemSelect);